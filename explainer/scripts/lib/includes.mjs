// x-* expansion for one page's markup. Walks
// the node tree from lib/markup.mjs, replacing every x-term, x-cite,
// x-file, x-page, x-example, x-diagram and x-include element with its
// expanded markup, and validating every `data-info`/`data-panel` reference
// — hand-authored or generator-emitted (x-diagram's own `nodeGroup(panel,
// ...)` nodes #3) — against the page's merged info registry:
// this page's own `<x-info-body>` entries, then global scope, then
// contents.json's legacy `panels[]` (lib/info.mjs's collectInfoBodies folds
// all of these into one key space; see checkDataInfo below). x-include
// reads
// fresh generator output from `ctx.generatorOutputs` (populated by
// lib/build.mjs's generator-run step, lib/generators.mjs) at a dotted/
// indexed JSON path. `as="json"`/`as="text"` render it with the `code`
// pattern markup, tagged **Real** — the only difference from x-example's
// **Illustrative** tag. `as="data"` (follow-up phase
// 2b: killing the "paste generator output into markup by hand" drift
// exists to stop) instead emits the fresh value verbatim as a
// `<script type="application/json" class="ex-data">` block, `at`
// optional (whole output when omitted) — for a pattern that renders the
// data itself client-side (e.g. `file-map`) rather than displaying it as
// code.
//
// Expansion is a single bottom-up walk, not "parse → look for leftovers
// afterward": every element is visited exactly once, so an x-* tag that
// isn't one of the handlers below (a typo, or one not yet implemented)
// throws immediately at the point it's found — that *is* "leftover x-*
// fails the build", just enforced by construction rather than by a
// second pass.
//
// x-diagram's handler (handleDiagram) also owns 's schema validation:
//once the lookup resolves `diagrams/<kind>/`, it
// loads that same folder's `schema.json` and validates the page's `data`
// against it with lib/schema.mjs before calling `render()` — a missing
// schema.json is a build error naming the kind, and a validation failure is
// path-qualified and carries the page's file:line (via MarkupError). This
// lives here, not in each kind's own render.mjs, because the lookup lets a pack or
// an artifact folder ship its own diagrams/<kind>/ outside this plugin,
// with no relative path back to this plugin's scripts/lib/ — the build
// (this file) is the one thing every kind, wherever it lives, goes through.
//
// The walk is sequential (`for...of` + `await`, never `Promise.all`) even
// though x-diagram's handler needs an async dynamic import(): x-cite's
// first-use numbering depends on visiting citations in true document order,
// and parallel resolution would make that nondeterministic.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import * as markup from "./markup.mjs";
import { githubBlobUrl } from "./cites.mjs";
import { DIAGRAM_BASE_CLASSES, jsonScriptSafe } from "./shell.mjs";
import { validate } from "./schema.mjs";
import { domIdFor, registryKey, renderInfoEntry, renderInfoFooter, resolveInfoKey } from "./info.mjs";

// DIAGRAM_BASE_CLASSES now lives in lib/shell.mjs, since puts
// the full token contract and the diagram base classes themselves with the
// shell — core/shell/shell.css defines these same class names, and
// lib/shell.mjs's pattern collector excludes them from pattern-candidate
// classes. x-diagram only needs the class *names* here, same as before.

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseFragment(html, ctx) {
  return markup.parse(html, { file: ctx.file });
}

/**
 * Renders one code block, shared by x-example (Phase 2, "Illustrative") and
 * x-include (Phase 3, "Real") — : "x-include renders with the
 * code pattern markup and a Real tag; x-example with an Illustrative tag."
 * `code` must already be HTML-entity-escaped (it comes from already-parsed
 * page-middle text, or from a caller that escaped generator output) — it is
 * embedded verbatim, never re-escaped.
 *
 * `gen`/`at` (x-include only) are stamped onto the wrapping div as
 * `data-gen`/`data-at` — the provenance metadata `check`
 * (fact.real-fresh) needs to map a rendered "Real" block in the *built dist
 * file* back to the generator id and JSON path that produced it, without
 * re-parsing page middles. Omitted (undefined) for x-example's Illustrative
 * blocks, which have no generator to point at.
 */
export function renderCodeBlock({ tag, lang, file, code, gen, at }) {
  const fileLabel = file ? `<span class="ex-code-file">${escapeText(file)}</span>` : "";
  const genAttr = gen !== undefined ? ` data-gen="${escapeAttr(gen)}"` : "";
  const atAttr = at !== undefined ? ` data-at="${escapeAttr(at)}"` : "";
  return (
    `<div class="ex-code" data-tag="${escapeAttr(tag)}"${genAttr}${atAttr}>` +
    `<div class="ex-code-head"><span class="ex-code-tag">${escapeText(tag)}</span>${fileLabel}</div>` +
    `<pre class="ex-code-pre" tabindex="0"><code class="ex-code-lang-${escapeAttr(lang || "text")}">${code}</code></pre>` +
    `</div>`
  );
}

function handleTerm(node, ctx) {
  const key = node.attrs.k;
  if (!key) throw new markup.MarkupError('<x-term> requires a "k" attribute', { file: ctx.file, line: node.line });
  if (!ctx.termKeys.has(key)) {
    throw new markup.MarkupError(`x-term k="${key}": unknown term "${key}"`, { file: ctx.file, line: node.line });
  }
  const label = markup.serialize(node.children);
  // `data-info-mode="popover"` (Amendment 2026-10-08, ): a
  // term is always popover-mode — stamped here, not computed at
  // runtime, so core/patterns/info/info.css's cue rules (dotted underline +
  // icon) can key off this one attribute the same way they do for every
  // other trigger shape, with no special-casing for terms.
  return parseFragment(
    `<a class="ex-term" data-term="${escapeAttr(key)}" data-info-mode="popover" href="#terms--${escapeAttr(key)}">${label}</a>`,
    ctx
  );
}

function handleCite(node, ctx) {
  const sourceId = node.attrs.s;
  if (!sourceId) throw new markup.MarkupError('<x-cite> requires an "s" attribute', { file: ctx.file, line: node.line });
  const source = ctx.sourcesById.get(sourceId);
  if (!source) {
    throw new markup.MarkupError(`x-cite s="${sourceId}": unknown source "${sourceId}"`, {
      file: ctx.file,
      line: node.line,
    });
  }
  if (source.kind === "file" && !ctx.repo) {
    throw new markup.MarkupError(
      `x-cite s="${sourceId}": source is kind="file" but contents.json has no "repo" to build a link`,
      { file: ctx.file, line: node.line }
    );
  }
  // A `diff` source's range never needs `repo` (it never becomes a blob
  // link — lib/cites.mjs's hrefFor), but its optional `files[]` are
  // rendered as real file-path links on the Sources page (lib/cites.mjs's
  // renderDiffItem), same as `kind="file"` above — same guard, checked here
  // (at cite time, with file:line context) rather than inside the Sources
  // page renderer, which has neither.
  if (source.kind === "diff" && Array.isArray(source.files) && source.files.length > 0 && !ctx.repo) {
    throw new markup.MarkupError(
      `x-cite s="${sourceId}": source is kind="diff" with "files" but contents.json has no "repo" to build file links`,
      { file: ctx.file, line: node.line }
    );
  }
  const { number, href } = ctx.citeRegistry.cite(sourceId, source, ctx.repo, {
    multi: ctx.multi,
    sourcesPageId: ctx.sourcesPageId,
  });
  // `.ex-vh` visually-hidden "(opens in new tab)": CSS generated
  // content (`::after { content: "↗" }`, core/shell/shell.css) is not
  // reliably exposed to a screen reader, so the accessible text is a real,
  // hidden DOM span — the same span shape every target="_blank" link this
  // plugin emits carries (x-file below, lib/info.mjs's files= footer,
  // lib/cites.mjs's Sources page, core/patterns/file-map/file-map.js's
  // runtime-rendered rows).
  return parseFragment(
    `<a class="ex-cite" target="_blank" rel="noopener" href="${escapeAttr(href)}">[${number}]<span class="ex-vh"> (opens in new tab)</span></a>`,
    ctx
  );
}

function handleFile(node, ctx) {
  const p = node.attrs.p;
  if (!p) throw new markup.MarkupError('<x-file> requires a "p" attribute', { file: ctx.file, line: node.line });
  if (!ctx.repo) {
    throw new markup.MarkupError(`x-file p="${p}": contents.json has no "repo" (github + ref) to build a link`, {
      file: ctx.file,
      line: node.line,
    });
  }
  const href = githubBlobUrl(ctx.repo, p, node.attrs.l);
  return parseFragment(
    `<a class="ex-path" target="_blank" rel="noopener" href="${escapeAttr(href)}">${escapeText(p)}<span class="ex-vh"> (opens in new tab)</span></a>`,
    ctx
  );
}

function handlePage(node, ctx) {
  const p = node.attrs.p;
  if (!p) throw new markup.MarkupError('<x-page> requires a "p" attribute', { file: ctx.file, line: node.line });
  if (!ctx.pageIds.has(p)) {
    throw new markup.MarkupError(`x-page p="${p}": unknown page "${p}"`, { file: ctx.file, line: node.line });
  }
  const href = ctx.multi ? `${p}.html` : `#${p}`;
  // A self-closing (or otherwise empty/whitespace-only) <x-page p="id"/>
  // falls back to the target page's own contents.json title (generated
  // pages — Terms/Sources — included, since ctx.pageIds carries every
  // contents.pages[] entry's title, not just hand-authored ones) — a
  // page-writer's self-close must never render an invisible, empty link.
  let label = markup.serialize(node.children);
  if (label.trim() === "") label = escapeText(ctx.pageIds.get(p));
  return parseFragment(`<a class="ex-page" href="${escapeAttr(href)}">${label}</a>`, ctx);
}

/** Plain text left once every tag is stripped — good enough to tell "no accessible text" apart from real label content (same spirit as lib/check.mjs's innerLinkText). */
function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, "").trim();
}

/**
 * `<x-info k="key">label</x-info>` — a real inline trigger
 * anchor, `href="#info--..."` so the no-JS fallback still works
 * without JS: a click is caught by the runtime (core/patterns/info/info.js)
 * and opens the popover/panel instead of merely jumping, exactly like
 * `a.ex-term` already does for terms. `ctx.infoLocal`/`ctx.infoGlobal` (this
 * page's merged registry view, lib/info.mjs's collectInfoBodies output) are
 * threaded in by lib/build.mjs — validated once against the complete
 * registry regardless of whether the trigger or its `<x-info-body>` comes
 * first in document order.
 */
function handleInfoTrigger(node, ctx) {
  const key = node.attrs.k;
  if (!key) throw new markup.MarkupError('<x-info> requires a "k" attribute', { file: ctx.file, line: node.line });
  const meta = resolveInfoKey({ key, infoLocal: ctx.infoLocal, infoGlobal: ctx.infoGlobal });
  if (!meta) {
    throw new markup.MarkupError(`x-info k="${key}": unknown info key "${key}"`, { file: ctx.file, line: node.line });
  }
  const label = markup.serialize(node.children);
  if (stripTags(label) === "") {
    throw new markup.MarkupError(`x-info k="${key}": trigger has no accessible text`, { file: ctx.file, line: node.line });
  }
  if (ctx.infoUsed) ctx.infoUsed.add(registryKey(meta));
  const domId = domIdFor(meta);
  // `data-info-mode` (Amendment 2026-10-08, ): the build
  // already knows this trigger's body's mode (meta.mode) — stamping it here
  // means core/patterns/info/info.css's cue rules (dotted-underline+icon for
  // popover, solid-underline+icon for panel) never need runtime JS to pick
  // the right cue.
  return parseFragment(
    `<a class="ex-info-trigger" data-info="${escapeAttr(key)}" data-info-target="${escapeAttr(domId)}" data-info-mode="${escapeAttr(meta.mode)}" href="#${escapeAttr(domId)}">${label}</a>`,
    ctx
  );
}

/**
 * `<x-info-body k="key" title="…" [mode] [scope="global"] [seq] [order]
 * [files] [see]>…rich HTML…</x-info-body>` — authored in
 * the page middle, removed from flow (returns `[]`): its children are
 * already fully expanded by expandNode's own recursion (nested x-term/
 * x-cite/x-file/x-info resolve before this handler ever runs), so this only
 * serializes them, appends the files/see footer, and wraps the result into
 * the `.ex-info-entry` div lib/build.mjs renders into both the no-JS "More
 * detail" fallback and the runtime's own data source — there is no
 * second, separate template; the entry div *is* both (see lib/info.mjs's
 * module header). The meta (title/mode/seq/order/files/see) was already
 * computed once by the registry pre-scan (lib/info.mjs's collectInfoBodies)
 * — this looks it up by key rather than recomputing it, so a validation
 * problem (bad mode=, missing title) is reported exactly once, at the
 * pre-scan, with the same file:line either way.
 */
function handleInfoBody(node, ctx) {
  const key = node.attrs.k;
  if (!key) throw new markup.MarkupError('<x-info-body> requires a "k" attribute', { file: ctx.file, line: node.line });
  const meta = resolveInfoKey({ key, infoLocal: ctx.infoLocal, infoGlobal: ctx.infoGlobal });
  if (!meta || meta.source !== "body") {
    throw new markup.MarkupError(`x-info-body k="${key}": not found in the pre-scanned registry (internal error)`, {
      file: ctx.file,
      line: node.line,
    });
  }
  const innerHtml = markup.serialize(node.children);
  const footerHtml = renderInfoFooter({ meta, repo: ctx.repo, pageIds: ctx.pageIds, multi: ctx.multi });
  const entryHtml = renderInfoEntry({ meta, innerHtml, footerHtml });
  const bucket = meta.scope === "global" ? "global" : meta.pageId;
  if (ctx.infoEntriesOut) {
    if (!ctx.infoEntriesOut.has(bucket)) ctx.infoEntriesOut.set(bucket, []);
    ctx.infoEntriesOut.get(bucket).push(entryHtml);
  }
  return [];
}

/**
 * Walks an `<x-example>` block's own children looking only for info
 * triggers (the "a `<span>` inside `<pre>`" shape — research.md's
 * most-used reference pattern, a clickable marker on a field/value inside a
 * JSON block) — everything else is left exactly as authored, literal code
 * text, never x-* expanded (an `<x-term>`/`<x-cite>`/etc. typed inside a
 * code block is not a markup mistake this function tries to fix; it's just
 * not one of the two shapes code blocks are allowed to carry):
 *   - `<x-info k="key">label</x-info>` is expanded the same way it would be
 *     anywhere else (handleInfoTrigger) — the writer gets the real
 *     `<a class="ex-info-trigger">` anchor, deep-link href included.
 *   - any element carrying `data-info`/`data-panel` (a hand-authored
 *     `<span>`, exactly the reference site's own shape) is validated
 *     against the page's registry and stamped with `data-info-target`,
 *     same as `checkDataInfo` does for every other trigger shape — it is
 *     only reached here explicitly because `handleExample` never calls the
 *     normal recursive `expandNode` walk that would otherwise invoke it.
 * Recurses into every element's children (not only top-level ones) so a
 * marker nested a level or two inside the code's own structure still
 * resolves.
 */
function expandExampleChildren(nodes, ctx) {
  const out = [];
  for (const node of nodes) {
    if (node.type !== "element") {
      out.push(node);
      continue;
    }
    if (node.tag.toLowerCase() === "x-info") {
      out.push(...handleInfoTrigger(node, ctx));
      continue;
    }
    const children = expandExampleChildren(node.children, ctx);
    const withChildren = { ...node, children };
    checkDataInfo(withChildren, ctx);
    out.push(withChildren);
  }
  return out;
}

function handleExample(node, ctx) {
  const { kind, lang, file: fileAttr } = node.attrs;
  if (kind !== "illustrative") {
    throw new markup.MarkupError(
      `<x-example kind="${kind ?? ""}"> must be kind="illustrative" (a "Real" example is x-include, run through an approved generator)`,
      { file: ctx.file, line: node.line }
    );
  }
  if (!lang) throw new markup.MarkupError('<x-example> requires a "lang" attribute', { file: ctx.file, line: node.line });
  const code = markup.serialize(expandExampleChildren(node.children, ctx));
  const html = renderCodeBlock({ tag: "Illustrative", lang, file: fileAttr, code });
  return parseFragment(html, ctx);
}

/**
 * Resolves a dotted/indexed JSON path ("e.envelope", "rows[0].id") against a
 * generator's parsed output. Returns `undefined` when any step of the path
 * doesn't exist, which `handleInclude` turns into a build error.
 */
export function resolveAtPath(root, pathStr) {
  const tokens = pathStr.match(/[^.[\]]+/g) || [];
  let cur = root;
  for (const token of tokens) {
    if (cur === undefined || cur === null) return undefined;
    cur = /^\d+$/.test(token) ? cur[Number(token)] : cur[token];
  }
  return cur;
}

/**
 * x-include's "Real" blocks never carry info markers (
 * deviation, documented rather than built): `code` here always comes from
 * `JSON.stringify`'d/raw generator *output* (`escapeText(...)` below), never
 * from parsed page markup — there is no node tree for a marker to live in,
 * only a string. A real payload wanting clickable fields has to go through
 * `<x-info-body>`'s own `<x-example>`-held copy (research.md's "evidence"
 * category — see core/patterns/info/example.html #5), tagged Illustrative,
 * not through x-include's generator-only Real path.
 */
function handleInclude(node, ctx) {
  const { g: genId, at, as } = node.attrs;
  if (!genId) throw new markup.MarkupError('<x-include> requires a "g" attribute', { file: ctx.file, line: node.line });
  if (as !== "json" && as !== "text" && as !== "data") {
    throw new markup.MarkupError('<x-include> requires as="json", as="text", or as="data"', {
      file: ctx.file,
      line: node.line,
    });
  }
  // `at` is required for as="json"/"text" (always a single code block, so
  // it needs a single value to render); as="data" takes the whole
  // generator output when `at` is omitted ("a page-writer never
  // pastes generator output by hand" — a pattern wanting the full shape,
  // e.g. file-map's `{files, counts}`, shouldn't have to name every path).
  if (as !== "data" && !at) {
    throw new markup.MarkupError('<x-include> requires an "at" attribute (unless as="data")', {
      file: ctx.file,
      line: node.line,
    });
  }
  if (!ctx.generatorOutputs || !ctx.generatorOutputs.has(genId)) {
    throw new markup.MarkupError(
      `x-include g="${genId}": unknown generator "${genId}" (not declared in contents.json generators, or it didn't run)`,
      { file: ctx.file, line: node.line }
    );
  }

  const output = ctx.generatorOutputs.get(genId);

  if (as === "data") {
    const value = at ? resolveAtPath(output, at) : output;
    if (value === undefined) {
      throw new markup.MarkupError(`x-include at="${at}": no value at that path in generator "${genId}"'s output`, {
        file: ctx.file,
        line: node.line,
      });
    }
    // Same escaping convention as lib/shell.mjs's embedded terms/panels
    // data (jsonScriptSafe): every "<" becomes < so a value
    // containing a literal "</script" can never prematurely close the
    // tag; JSON.parse unescapes it with no further handling needed.
    const html =
      `<script type="application/json" class="ex-data" data-gen="${escapeAttr(genId)}" data-at="${escapeAttr(at || "")}">` +
      `${jsonScriptSafe(value)}</script>`;
    return parseFragment(html, ctx);
  }

  const value = resolveAtPath(output, at);
  if (value === undefined) {
    throw new markup.MarkupError(`x-include at="${at}": no value at that path in generator "${genId}"'s output`, {
      file: ctx.file,
      line: node.line,
    });
  }

  let code;
  let lang;
  if (as === "json") {
    code = escapeText(JSON.stringify(value, null, 2));
    lang = "json";
  } else {
    // as="text" renders any JSON *scalar* (string, number, boolean, or
    // null) at `at` — a number/boolean/null is rendered in
    // its JSON text form (`20`, `true`, `null`; identical to `String(value)`
    // for these three types), a string renders literally/unquoted (the
    // original, pre-existing behaviour). An object or array has no
    // single-line scalar form, so it's still a build error here — just one
    // that now names "an object"/"an array" rather than lumping every
    // non-string value together, since number/boolean/null are no longer
    // in that bucket.
    const isObjectOrArray = value !== null && typeof value === "object";
    if (isObjectOrArray) {
      const actual = Array.isArray(value) ? "an array" : "an object";
      throw new markup.MarkupError(
        `x-include at="${at}" as="text": value at that path is ${actual}, not a scalar — use as="json" for ${actual}`,
        { file: ctx.file, line: node.line }
      );
    }
    code = escapeText(typeof value === "string" ? value : JSON.stringify(value));
    lang = "text";
  }

  const html = renderCodeBlock({ tag: "Real", lang, code, gen: genId, at });
  return parseFragment(html, ctx);
}

async function handleDiagram(node, ctx) {
  const kind = node.attrs.kind;
  const dataRel = node.attrs.data;
  if (!kind) throw new markup.MarkupError('<x-diagram> requires a "kind" attribute', { file: ctx.file, line: node.line });
  if (!dataRel) throw new markup.MarkupError('<x-diagram> requires a "data" attribute', { file: ctx.file, line: node.line });

  const resolved = ctx.lookup.resolve("diagrams", kind);
  if (!resolved.found) {
    throw new markup.MarkupError(`x-diagram kind="${kind}": no diagrams/${kind}/render.mjs found through the lookup`, {
      file: ctx.file,
      line: node.line,
    });
  }
  const renderPath = path.join(resolved.path, "render.mjs");
  if (!fs.existsSync(renderPath)) {
    throw new markup.MarkupError(`x-diagram kind="${kind}": ${renderPath} does not exist`, {
      file: ctx.file,
      line: node.line,
    });
  }

  // : every diagrams/<kind>/ folder (core, or one shipped by a repo's
  // .claude/explainer/, a pack, or the artifact itself) carries its own
  // schema.json; this is where it's loaded and enforced, not in render.mjs.
  // A generator can live outside this plugin's own scripts/ (a pack or an
  // artifact-local generator cannot reach ../../../scripts/lib/schema.mjs by
  // relative path), so validation has to happen here, where the *build*
  // already knows how to reach lib/schema.mjs.
  const schemaPath = path.join(resolved.path, "schema.json");
  if (!fs.existsSync(schemaPath)) {
    throw new markup.MarkupError(
      `x-diagram kind="${kind}": ${schemaPath} does not exist (every diagrams/<kind>/ folder needs a schema.json)`,
      { file: ctx.file, line: node.line }
    );
  }
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (err) {
    throw new markup.MarkupError(`x-diagram kind="${kind}": ${schemaPath}: ${err.message}`, {
      file: ctx.file,
      line: node.line,
    });
  }

  // `data` is resolved relative to the artifact folder, not the page file
  // (dispatch note: "data path relative to the artifact folder").
  const dataPath = path.join(ctx.artifactDir, dataRel);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (err) {
    throw new markup.MarkupError(`x-diagram data="${dataRel}": ${dataPath}: ${err.message}`, {
      file: ctx.file,
      line: node.line,
    });
  }

  const schemaErrors = validate(data, schema);
  if (schemaErrors.length > 0) {
    throw new markup.MarkupError(
      `x-diagram kind="${kind}" data="${dataRel}": data invalid:\n${schemaErrors.map((e) => `  - ${e}`).join("\n")}`,
      { file: ctx.file, line: node.line }
    );
  }

  let mod = ctx.diagramModuleCache.get(renderPath);
  if (!mod) {
    mod = await import(pathToFileURL(renderPath).href);
    ctx.diagramModuleCache.set(renderPath, mod);
  }
  if (typeof mod.render !== "function") {
    throw new markup.MarkupError(`x-diagram kind="${kind}": ${renderPath} does not export render(data, ctx)`, {
      file: ctx.file,
      line: node.line,
    });
  }

  let result;
  try {
    result = await mod.render(data, { classes: DIAGRAM_BASE_CLASSES });
  } catch (err) {
    throw new markup.MarkupError(`x-diagram kind="${kind}": render() threw: ${err.message}`, {
      file: ctx.file,
      line: node.line,
    });
  }
  if (!result || typeof result.svg !== "string") {
    throw new markup.MarkupError(`x-diagram kind="${kind}": render() must return { svg, minWidth }`, {
      file: ctx.file,
      line: node.line,
    });
  }
  if (result.html !== undefined && typeof result.html !== "string") {
    throw new markup.MarkupError(`x-diagram kind="${kind}": render()'s optional "html" field must be a string`, {
      file: ctx.file,
      line: node.line,
    });
  }

  // `data-kind` is provenance metadata (same spirit as x-include's
  // data-gen/data-at): check (rule.chart-without-data-table) tells
  // which diagrams are the "bar" kind from the built dist file alone.
  // `html` ("bar always emits a data table next to the chart") is a
  // minimal, optional contract extension over `{ svg, minWidth }` — already-
  // built markup (e.g. a real `<table>`), rendered immediately after the svg
  // inside the same `.ex-diagram` wrapper.
  //
  // `minWidth` goes on the inner `<svg>`, never on the `.ex-diagram` wrapper
  // (found + fixed 2026-10-07 follow-up): `.ex-diagram`
  // has `overflow-x:auto` precisely so a too-wide diagram scrolls *within
  // its own box* instead of widening the page, but that only works if the
  // wrapper itself is free to stay narrower than its content — a min-width
  // on the wrapper forces the wrapper itself wider than the viewport, which
  // widens the *page* (browser.phone-scroll at 400px) instead of scrolling
  // internally. The svg has no explicit width of its own (_shared/svg.mjs's
  // `svg()` sets only `viewBox`), so it otherwise just stretches/shrinks to
  // fill `.ex-diagram` — forcing its min-width here is what makes it (and
  // only it) overflow the now-unconstrained wrapper.
  const svgMarkup = result.minWidth ? injectSvgMinWidth(result.svg, Math.round(Number(result.minWidth))) : result.svg;
  const extra = typeof result.html === "string" ? result.html : "";
  const fragment = parseFragment(`<div class="ex-diagram" data-kind="${escapeAttr(kind)}">${svgMarkup}${extra}</div>`, ctx);
  // a generator's `nodeGroup(panel, ...)` (core/diagrams/
  // _shared/svg.mjs) stamps `data-panel="key"` on its own, generator-side
  // output — but that output is a fresh markup.parse tree returned
  // straight from this handler, never run back through expandNode's normal
  // recursive walk (that's what calls checkDataInfo on every other
  // element). Left alone, a diagram node's `panel` key was never actually
  // checked against anything, nor ever stamped with `data-info-target`/
  // `data-info-mode` — it rendered as an inert `<g data-panel="...">` with
  // no click behaviour and no build-time complaint about an unknown key
  // either. Walking the fragment here, through the exact same
  // checkDataInfo used for every hand-authored `data-info`/`data-panel`
  // element, fixes both: it resolves against the same registry (this
  // page's own `<x-info-body>` entries first, then global scope, then
  // falls through to contents.json legacy `panels[]` since
  // lib/info.mjs's collectInfoBodies already folds both sources into one
  // registry) and throws the same "unknown info key" error a hand-authored
  // trigger would get for a key found in neither.
  stampDataInfoThroughout(fragment, ctx);
  return fragment;
}

/** Recursively applies checkDataInfo to every element in `nodes` (and their descendants) — see handleDiagram's call site for why a diagram's generator-emitted `data-panel`/`data-info` needs this walk explicitly, instead of getting it "for free" the way every other element does from expandNode's own recursion. */
function stampDataInfoThroughout(nodes, ctx) {
  for (const node of nodes) {
    if (node.type !== "element") continue;
    checkDataInfo(node, ctx);
    stampDataInfoThroughout(node.children, ctx);
  }
}

/** Inserts (or merges into an existing) `style` attribute on the first `<svg ...>` tag only. */
function injectSvgMinWidth(svgMarkup, minWidthPx) {
  const decl = `min-width:${minWidthPx}px`;
  return svgMarkup.replace(/^<svg\b([^>]*)>/, (full, attrs) => {
    const styleMatch = /\sstyle="([^"]*)"/.exec(attrs);
    if (styleMatch) {
      return `<svg${attrs.replace(/\sstyle="[^"]*"/, ` style="${styleMatch[1]};${decl}"`)}>`;
    }
    return `<svg${attrs} style="${decl}">`;
  });
}

const HANDLERS = {
  "x-term": handleTerm,
  "x-cite": handleCite,
  "x-file": handleFile,
  "x-page": handlePage,
  "x-example": handleExample,
  "x-include": handleInclude,
  "x-diagram": handleDiagram,
  "x-info": handleInfoTrigger,
  "x-info-body": handleInfoBody,
};

/**
 * `data-info="key"` on any element (an SVG `<g>`, an `<li>`, a `<span>`
 * inside `<pre>`, a `<div>`, a `<td>`, a `<tr>`) and its
 * `data-panel="key"` alias (`panel` is a thin alias, not a second
 * mechanism) — both validated against the same merged registry `x-info`
 * resolves against, and both normalized here to carry a `data-info-target`
 * attribute naming the real DOM id (lib/info.mjs's domIdFor) the runtime
 * opens, so core/patterns/info/info.js never has to re-derive scoping at
 * read time — one attribute, one lookup, for every trigger shape.
 */
function checkDataInfo(node, ctx) {
  if (!node.attrs) return;
  const key = "data-info" in node.attrs ? node.attrs["data-info"] : node.attrs["data-panel"];
  if (key === undefined) return;
  const meta = resolveInfoKey({ key, infoLocal: ctx.infoLocal, infoGlobal: ctx.infoGlobal });
  if (!meta) {
    throw new markup.MarkupError(
      `data-info="${key}": unknown info key "${key}" on page "${ctx.page.id}" (declare it with <x-info-body k="${key}">, or contents.json pages[].panels[])`,
      { file: ctx.file, line: node.line }
    );
  }
  if (ctx.infoUsed) ctx.infoUsed.add(registryKey(meta));
  node.attrs["data-info-target"] = domIdFor(meta);
  // `data-info-mode` (Amendment 2026-10-08, ) — same cue
  // marker handleInfoTrigger stamps on `<x-info>`'s own anchor, here for
  // every hand-authored trigger shape (SVG `<g>`, `<li>`, `<span>` inside
  // `<pre>`, `<div>`, `<td>`, `<tr>`): core/patterns/info/info.css's cue
  // rules key off this attribute alone, never off which element carries it.
  node.attrs["data-info-mode"] = meta.mode;
}

async function expandNodes(nodes, ctx) {
  const out = [];
  for (const node of nodes) {
    const expanded = await expandNode(node, ctx);
    out.push(...expanded);
  }
  return out;
}

async function expandNode(node, ctx) {
  if (node.type !== "element") return [node];
  const tag = node.tag.toLowerCase();

  // x-example's content is literal code text (already HTML-escaped by the
  // page-writer): never recurse into it looking for further x-* elements —
  // handleExample does its own narrower walk (expandExampleChildren) that
  // only expands <x-info>/data-info info triggers, nothing else.
  if (tag === "x-example") {
    return handleExample(node, ctx);
  }

  const children = await expandNodes(node.children, ctx);
  const withChildren = { ...node, children };

  if (tag.startsWith("x-")) {
    const handler = HANDLERS[tag];
    if (!handler) {
      throw new markup.MarkupError(`unknown x-* element <${node.tag}>`, { file: ctx.file, line: node.line });
    }
    return handler(withChildren, ctx);
  }

  checkDataInfo(withChildren, ctx);
  return [withChildren];
}

/**
 * Expands every x-* element and validates every data-panel reference in one
 * page's parsed node tree (from lib/markup.mjs's `parse`). Returns a new
 * node array — pass it to `markup.serialize` to get the page's final HTML.
 *
 * `ctx` fields:
 *   file            - display path for error messages (e.g. "pages/x.html")
 *   page            - this page's contents.json entry (for its panels[])
 *   multi           - true for --multi builds (changes x-page's href shape)
 *   termKeys        - Set of valid contents.terms[].key
 *   sourcesById     - Map<id, source> from contents.sources[]
 *   pageIds         - Map<id, title> of valid contents.pages[] entries
 *     (title is x-page's fallback link text when its element is
 *     self-closing or otherwise empty)
 *   repo            - contents.repo, or undefined
 *   citeRegistry    - shared across every page in the build (lib/cites.mjs)
 *   lookup          - this build's lookup (lib/lookup.mjs), for x-diagram
 *   artifactDir     - artifact folder, for x-diagram's `data` path
 *   diagramModuleCache - shared Map<renderPath, module>, across all pages
 *   generatorOutputs - Map<generatorId, parsed JSON output>, for x-include
 *     (lib/build.mjs's generator-run step; lib/generators.mjs)
 *   infoLocal       - Map<key, meta>: this page's own page-scoped info
 *     bodies (lib/info.mjs's collectInfoBodies, byPage.get(page.id))
 *   infoGlobal      - Map<key, meta>: every scope="global" info body,
 *     build-wide (lib/info.mjs's collectInfoBodies, .global)
 *   infoUsed        - shared Set<string> (lib/info.mjs's registryKey),
 *     mutated as triggers resolve — lib/build.mjs's unused-body warning
 *   infoEntriesOut  - shared Map<"global"|pageId, string[]>, mutated as
 *     `<x-info-body>` elements expand — lib/build.mjs reads it to render
 *     each page's "More detail" fallback
 */
export async function expandPage(nodes, ctx) {
  return expandNodes(nodes, ctx);
}
