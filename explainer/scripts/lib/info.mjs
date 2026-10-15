// The unified "info" component's build-side registry + rendering.
//
// Two sources feed one key space of "bodies": `<x-info-body>` elements
// authored in page middles (lib/markup.mjs's parse tree, pre-scanned here —
// `collectInfoBodies` — before the main x-* expansion walk, so a trigger can
// validate its key against a *complete* registry regardless of where in the
// document the trigger sits relative to its body), and contents.json
// `pages[].panels[]` (legacy — read as info bodies, folded into the
// same registry/no-JS-fallback mechanism, but never re-expanded: a panel's
// `body` is already-final HTML, same as it was before).
// contents.json `terms[]` remain a separate, pre-existing namespace
// (lib/terms.mjs/lib/shell.mjs) — this module does not touch them; the
// runtime (core/patterns/info/info.js) shares its open/close/position/
// transition engine with term popovers without merging their data model.
//
// Scoping: a body is either page-scoped (default — its key must be
// unique within its own page) or `scope="global"` (its key must be unique
// build-wide, usable from any page's trigger). A key must never collide
// within a scope, or across scopes (a page-scoped key can't also be a
// global key anywhere). `domIdFor` is scope-shaped for exactly this reason:
// a page-scoped id is prefixed with its own page id
// (`info--<page>--<key>`) so two different pages may reuse the same bare
// key with no collision even once the single-shape build combines every
// page into one HTML document; a global id has no page prefix
// (`info--<key>`) because its uniqueness is already guaranteed build-wide,
// and it is embedded identically on every page (lib/build.mjs) so a
// trigger on any page always finds its target in the same document.

import { MarkupError } from "./markup.mjs";
import { githubBlobUrl } from "./cites.mjs";

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

const VALID_MODES = new Set(["popover", "panel"]);

/** Every `<x-info-body>` element anywhere in `nodes`, flat, document order — never descending into its own children (a body's content is read later, once it's been expanded), or into x-example's literal code text. */
function scanBodies(nodes, out) {
  for (const node of nodes) {
    if (node.type !== "element") continue;
    const tag = node.tag.toLowerCase();
    if (tag === "x-example") continue;
    if (tag === "x-info-body") {
      out.push(node);
      continue;
    }
    scanBodies(node.children, out);
  }
}

function metaFromBodyNode(node, { file, page }, orderRef) {
  const key = node.attrs.k;
  if (!key) throw new MarkupError('<x-info-body> requires a "k" attribute', { file, line: node.line });
  const scope = node.attrs.scope === "global" ? "global" : "page";
  const mode = node.attrs.mode;
  if (mode !== undefined && !VALID_MODES.has(mode)) {
    throw new MarkupError(`<x-info-body k="${key}"> mode="${mode}" must be "popover" or "panel"`, { file, line: node.line });
  }
  const effectiveMode = mode || "panel";
  if (effectiveMode !== "popover" && !node.attrs.title) {
    throw new MarkupError(`<x-info-body k="${key}"> needs a "title" attribute (required when mode="panel")`, {
      file,
      line: node.line,
    });
  }
  const order = node.attrs.order !== undefined ? Number(node.attrs.order) : orderRef.n;
  orderRef.n += 1;
  return {
    key,
    scope,
    pageId: page.id,
    title: node.attrs.title || "",
    mode: effectiveMode,
    seq: node.attrs.seq || null,
    order,
    files: node.attrs.files || null,
    see: node.attrs.see || null,
    source: "body",
    file,
    line: node.line,
  };
}

function metaFromPanel(panel, page, orderRef) {
  const order = orderRef.n;
  orderRef.n += 1;
  return {
    key: panel.key,
    scope: "page",
    pageId: page.id,
    title: panel.title,
    mode: "panel",
    seq: null,
    order,
    files: null,
    see: null,
    source: "panel",
    file: `pages/${page.id}.html (contents.json pages[].panels[])`,
    line: null,
    html: panel.body,
  };
}

/**
 * Pre-scans every non-generated page's already-parsed node tree for
 * `<x-info-body>` elements, folds in contents.json's legacy
 * `pages[].panels[]`, and validates the combined key space: no
 * duplicate key within one scope, no key shared between a page scope and
 * the global scope. Returns `{ ok, errors, global, byPage }` —
 * `global` is a `Map<key, meta>`, `byPage` a `Map<pageId, Map<key, meta>>`.
 * Never throws; every problem becomes one entry in `errors` so a build can
 * report every collision from one call, same spirit as lib/includes.mjs's
 * own per-page error collection.
 *
 * @param {object} opts
 * @param {{page: object, file: string, nodes: object[]}[]} opts.pageDrafts -
 *   one entry per non-generated page: its contents.pages[] entry, its
 *   display file path, and its already-parsed node tree (lib/markup.mjs's
 *   `parse`, not yet expanded).
 */
export function collectInfoBodies({ pageDrafts }) {
  const errors = [];
  const global = new Map();
  const byPage = new Map();
  const orderRef = { n: 0 };

  function place(meta) {
    const target = meta.scope === "global" ? global : byPage.get(meta.pageId) || byPage.set(meta.pageId, new Map()).get(meta.pageId);
    if (target.has(meta.key)) {
      const loc = meta.line ? `${meta.file}:${meta.line}` : meta.file;
      const scopeLabel = meta.scope === "global" ? "global scope" : `page "${meta.pageId}"`;
      errors.push(`${loc}: duplicate info key "${meta.key}" in ${scopeLabel}`);
      return;
    }
    target.set(meta.key, meta);
  }

  for (const { page, file, nodes } of pageDrafts) {
    const bodyNodes = [];
    scanBodies(nodes, bodyNodes);
    for (const node of bodyNodes) {
      let meta;
      try {
        meta = metaFromBodyNode(node, { file, page }, orderRef);
      } catch (err) {
        errors.push(err.message);
        continue;
      }
      place(meta);
    }
    for (const panel of page.panels || []) {
      place(metaFromPanel(panel, page, orderRef));
    }
  }

  if (errors.length === 0) {
    for (const [pageId, map] of byPage) {
      for (const key of map.keys()) {
        if (global.has(key)) {
          errors.push(`page "${pageId}": info key "${key}" collides with a global-scope key of the same name`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, global, byPage };
}

/** The real DOM id a body renders at — see module header ("Scoping"). */
export function domIdFor(meta) {
  return meta.scope === "global" ? `info--${meta.key}` : `info--${meta.pageId}--${meta.key}`;
}

/** A stable identity for "was this body ever used by a trigger" bookkeeping (lib/build.mjs's unused-body warning, ). */
export function registryKey(meta) {
  return meta.scope === "global" ? `global:${meta.key}` : `page:${meta.pageId}:${meta.key}`;
}

/** Resolves a trigger's key against one page's own registry view: that page's own page-scoped bodies first, then every global-scope body. `null` when nothing matches. */
export function resolveInfoKey({ key, infoLocal, infoGlobal }) {
  if (infoLocal && infoLocal.has(key)) return infoLocal.get(key);
  if (infoGlobal && infoGlobal.has(key)) return infoGlobal.get(key);
  return null;
}

/** The structured `files=`/`see=` footer — a consistent alternative to hand-rolled dl rows. */
export function renderInfoFooter({ meta, repo, pageIds, multi }) {
  const parts = [];
  if (meta.files) {
    if (!repo) {
      throw new MarkupError(`x-info-body k="${meta.key}" files="${meta.files}": contents.json has no "repo" to build a link`, {
        file: meta.file,
        line: meta.line,
      });
    }
    const items = meta.files
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const [filePath, lineNo] = entry.split(":");
        const href = githubBlobUrl(repo, filePath, lineNo);
        const label = lineNo ? `${filePath}:${lineNo}` : filePath;
        // `.ex-vh`: same new-tab cue span as every other target="_blank"
        // link this plugin emits (lib/includes.mjs's handleCite/handleFile).
        return `<li><a class="ex-path" target="_blank" rel="noopener" href="${escapeAttr(href)}">${escapeText(label)}<span class="ex-vh"> (opens in new tab)</span></a></li>`;
      })
      .join("");
    parts.push(`<div class="ex-info-files"><h4>Files</h4><ul>${items}</ul></div>`);
  }
  if (meta.see) {
    const items = meta.see
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pid) => {
        if (!pageIds.has(pid)) {
          throw new MarkupError(`x-info-body k="${meta.key}" see="${meta.see}": unknown page "${pid}"`, {
            file: meta.file,
            line: meta.line,
          });
        }
        const href = multi ? `${pid}.html` : `#${pid}`;
        return `<li><a class="ex-page" href="${escapeAttr(href)}">${escapeText(pageIds.get(pid))}</a></li>`;
      })
      .join("");
    parts.push(`<div class="ex-info-see"><h4>See</h4><ul>${items}</ul></div>`);
  }
  return parts.join("");
}

/** Wraps one body's already-expanded inner HTML into the `.ex-info-entry` the no-JS fallback shows and the runtime reads. */
export function renderInfoEntry({ meta, innerHtml, footerHtml = "" }) {
  const domId = domIdFor(meta);
  const titleHtml = meta.title ? `<div class="ex-info-entry-title">${escapeText(meta.title)}</div>` : "";
  const seqAttrs = meta.seq
    ? ` data-info-seq="${escapeAttr(meta.seq)}" data-info-order="${escapeAttr(String(meta.order))}"`
    : "";
  return (
    `<div class="ex-info-entry" id="${escapeAttr(domId)}" data-info-key="${escapeAttr(meta.key)}" ` +
    `data-info-mode="${escapeAttr(meta.mode)}" data-info-scope="${escapeAttr(meta.scope)}"${seqAttrs}>` +
    `${titleHtml}<div class="ex-info-entry-body">${innerHtml}</div>${footerHtml}</div>`
  );
}

/** The collapsed "More detail" fallback section wrapping a set of already-rendered `.ex-info-entry` divs; `""` when there's nothing to show. */
export function renderFallback(entriesHtml) {
  if (!entriesHtml) return "";
  return `<details class="ex-info-fallback"><summary>More detail</summary>${entriesHtml}</details>`;
}
