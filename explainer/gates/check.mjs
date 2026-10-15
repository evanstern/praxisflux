// gates/check.mjs — explainer's read-only checks over a built `dist/`.
//
// gates/ only verifies and NEVER writes (docs/skill-patterns.md §5). Every check here reads
// the built files, contents.json and the lookup; scripts/lib/check.mjs owns everything that
// touches disk or spawns a browser (screenshots, dist/check.json, dist/check-report.md).
// fact.real-fresh is the one exception that lives in scripts/: it re-runs generators, which
// cache their output under dist/gen/.
//
// Each check receives the shared `ctx` and returns `{ messages, special? }` — see
// scripts/lib/check.mjs for the status rules.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { parseFrontmatter } from "../lib/markdown.mjs";
import { externalLoads } from "../lib/selfcontained.mjs";
import { loadTokenNames, validateBrand } from "../scripts/lib/brand.mjs";
import * as markup from "../scripts/lib/markup.mjs";
import { PLACEHOLDER_MARKER_TEXT } from "../scripts/lib/scaffold.mjs";

// --------------------------------------------------------------- utilities

export function escapeTextLocal(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function unescapeAttr(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** 1-based line number of `index` within `text` (scans once per call — fixture-scale only). */
export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

/** Every `<tag ...>...</tag>` block in `html`, non-nested-aware (good enough: script/style never nest themselves). */
export function extractBlocks(html, tag) {
  const re = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html))) {
    out.push({ attrs: m[1] || "", code: m[2], index: m.index });
  }
  return out;
}

/**
 * Reads every file under `<artifactDir>/dist/` (recursively), excluding the
 * build's own provenance files (`build-report.md`, `dist/gen/*.json`,
 * `dist/screenshots/*`) that aren't part of the published artifact. Returns
 * `null` when `dist/` doesn't exist at all (check's "no dist" usage error).
 * Works unchanged for both shapes: single (`<name>.html` + nothing else) and
 * --multi (`<name>/*.html` + `<name>/site.css` + `<name>/site.js`).
 */
export function loadDistFiles(artifactDir) {
  const distDir = path.join(artifactDir, "dist");
  if (!fs.existsSync(distDir)) return null;

  const files = [];
  function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (rel === "" && (entry.name === "build-report.md" || entry.name === "gen" || entry.name === "screenshots")) {
        continue;
      }
      const full = path.join(dir, entry.name);
      const relPath = rel ? path.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) {
        walk(full, relPath);
        continue;
      }
      files.push({ relPath, content: fs.readFileSync(full, "utf8") });
    }
  }
  walk(distDir, "");
  // Every HTML file also gets a `scanText`: the same text with <script>/
  // <style> bodies blanked (blankScriptsAndStyles, same length and
  // newlines — lineOf() on either string agrees). Checks that scan
  // *rendered markup* (x.leftover, ref.anchor, ref.term, ref.cite,
  // ref.github, fact.illustrative-tag, fact.real-fresh, rule.paragraph-length,
  // rule.chart-without-data-table) read `scanText`, never `content`
  // directly, so a JS string literal or a CSS rule that merely looks like
  // markup (e.g. shell.js's own `'href="#terms--' + key`) can never be
  // mistaken for a real element. Checks that want the actual script/style
  // text (js.syntax, self.contained, rule.min-font-size) still read `content`.
  for (const file of files) {
    if (file.relPath.endsWith(".html")) file.scanText = blankScriptsAndStyles(file.content);
  }
  return files;
}

export function htmlFiles(files) {
  return files.filter((f) => f.relPath.endsWith(".html"));
}

/**
 * Blanks `<script>`/`<style>` *contents* (keeping the tags and every other
 * character's offset identical, so `lineOf()` on the original text still
 * lines up) — for checks that scan rendered markup text/attributes (leftover
 * x-*, hrefs, data-term, citations, paragraphs…) and must never match a
 * string literal or a CSS rule that merely *looks* like markup inside
 * shell.js/shell.css/a pattern's own JS. Checks that genuinely want script
 * or style content (js.syntax, self.contained's CSS url() scan, min-font-size)
 * extract those blocks directly instead of calling this.
 */
function blankKeepingNewlines(text) {
  return text.replace(/[^\n]/g, " ");
}

function blankScriptsAndStyles(html) {
  return html
    .replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (_full, open, body, close) => open + blankKeepingNewlines(body) + close)
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_full, open, body, close) => open + blankKeepingNewlines(body) + close);
}

// ----------------------------------------------------------------- checks
// Structure: `html.balance`, `js.syntax`, `self.contained`,
// `title.name`, `x.leftover` — all error-level, all redundant safety nets
// over the already-built artifact (the build pipeline already enforces most
// of these on its own inputs; these checks instead validate the real dist/
// files the coordinator is about to publish, independent of trusting that
// nothing bypassed the build).
//
// `title.placeholder` sits next to `title.name` but checks something
// different: not the shape of the title (word count), but whether the
// coordinator's plan step ever actually changed it away from the profile's
// own scaffold default — a title can be a perfectly valid 2-4 words and
// still just be the placeholder nobody replaced.

/**
 * Strips a dist HTML file down to what lib/markup.mjs's restricted dialect
 * can parse: the `<!doctype>` line removed, and `<style>`/`<script>` bodies
 * blanked (their own tags still need to balance; their contents are someone
 * else's syntax — js.syntax, html.balance's own "tags balance" concern
 * either way). Shared by html.balance and rule.chart-without-data-table —
 * both need a real node tree over the built markup, not a second
 * hand-rolled regex scanner.
 */
function prepareHtmlForMarkupParse(html) {
  html = html.replace(/^<!doctype[^>]*>\s*/i, "");
  html = html.replace(/(<style[^>]*>)[\s\S]*?(<\/style>)/gi, "$1$2");
  html = html.replace(/(<script[^>]*>)[\s\S]*?(<\/script>)/gi, "$1$2");
  return html;
}

/**
 * Tag balance (void elements known; svg subtree checked) — reuses
 * lib/markup.mjs's scanner rather than writing a second HTML parser. markup.parse() only understands the
 * restricted page-middle dialect (no `<!doctype>`, and it would choke on
 * `<` inside inline CSS/JS), so each dist HTML file is prepared first (see
 * prepareHtmlForMarkupParse). Nothing inside an `svg` subtree is
 * special-cased — the scanner requires every opened tag to close (or
 * self-close) exactly like anywhere else, which is the "svg subtree
 * checked" behaviour the table calls for.
 */
export function runHtmlBalance({ files }) {
  const messages = [];
  for (const file of htmlFiles(files)) {
    const html = prepareHtmlForMarkupParse(file.content);
    try {
      markup.parse(html, { file: file.relPath });
    } catch (err) {
      messages.push({ severity: "error", text: err.message, file: file.relPath });
    }
  }
  return { messages };
}

/** `node --check` on every inline script (piped on stdin — nothing written), plus any standalone `site.js` (--multi). */
export function runJsSyntax({ files }) {
  const units = [];
  for (const file of files) {
    if (file.relPath.endsWith(".html")) {
      for (const block of extractBlocks(file.content, "script")) {
        if (/\bsrc\s*=/.test(block.attrs)) continue; // external src: not inline
        if (/type\s*=\s*"application\/json"/i.test(block.attrs)) continue; // data block, not JS
        units.push({ file: file.relPath, line: lineOf(file.content, block.index), code: block.code });
      }
    } else if (file.relPath.endsWith(".js")) {
      units.push({ file: file.relPath, line: 1, code: file.content });
    }
  }

  const messages = [];
  for (const unit of units) {
    const result = spawnSync(process.execPath, ["--check", "-"], { input: unit.code, encoding: "utf8" });
    if (result.status !== 0) {
      const detail = (result.stderr || "").split("\n").find((l) => /Error/.test(l)) || `node --check exited ${result.status}`;
      messages.push({ severity: "error", text: `inline script failed node --check: ${detail.trim()}`, file: unit.file, line: unit.line });
    }
  }
  return { messages };
}

/** No external script, style, font or image — links to sources in a new tab are allowed (lib/selfcontained.mjs decides). */
export function runSelfContained({ files }) {
  const messages = [];
  for (const file of files) {
    if (!/\.(html|css)$/.test(file.relPath)) continue;
    for (const { label, url, index } of externalLoads(file.content)) {
      messages.push({ severity: "error", text: `${label}: ${url}`, file: file.relPath, line: lineOf(file.content, index) });
    }
  }
  return { messages };
}

/** `<title>` is 2-4 words (also enforced by contents.schema.json at build time — this re-verifies the real output). */
export function runTitleName({ files }) {
  const file = htmlFiles(files)[0];
  if (!file) return { messages: [{ severity: "error", text: "no built HTML file found to read <title> from" }] };
  const m = /<title>([^<]*)<\/title>/.exec(file.content);
  if (!m) return { messages: [{ severity: "error", text: "no <title> element found", file: file.relPath }] };
  const words = m[1].trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) {
    return {
      messages: [
        {
          severity: "error",
          text: `<title>${m[1]}</title> is ${words.length} word(s); house style requires 2-4`,
          file: file.relPath,
        },
      ],
    };
  }
  return { messages: [] };
}

/**
 * Catches a scaffolded artifact that was never actually retitled: the
 * `new` CLI verb copies a profile's `skeleton.contents.json` verbatim, whose
 * `title` is a placeholder (e.g. "New PR Explainer") that happens to pass
 * `title.name`'s 2-4-word rule on its own. This check instead compares
 * `contents.json`'s `title` against the resolved profile's own skeleton
 * title (same lookup the build uses, by `contents.kind`) and fails only on
 * an exact match. No matching profile, or a profile with no
 * `skeleton.contents.json` to compare against, is not an error here — it
 * just means this check has nothing to compare, so it passes rather than
 * guessing.
 */
export function runTitlePlaceholder({ contents, lookup }) {
  const profile = lookup.resolve("profiles", contents.kind);
  if (!profile.found) return { messages: [] };
  let skeleton;
  try {
    skeleton = JSON.parse(fs.readFileSync(path.join(profile.path, "skeleton.contents.json"), "utf8"));
  } catch {
    return { messages: [] };
  }
  if (typeof skeleton?.title === "string" && skeleton.title === contents.title) {
    return {
      messages: [
        {
          severity: "error",
          text: `title "${contents.title}" is still the "${contents.kind}" profile's scaffold placeholder — set a real 2-4-word title in contents.json`,
        },
      ],
    };
  }
  return { messages: [] };
}

/**
 *No unexpanded x-* element survives into the built artifact, and no
 * page still carries the `new` verb's placeholder TODO marker
 * (scripts/lib/scaffold.mjs's PLACEHOLDER_MARKER_TEXT) — both are "leftover
 * scaffolding that must never publish" in the same sense, so they share one
 * check id (a page dropped from the outline is check's
 * `fact.real-fresh`-adjacent sibling concern over at lib/build.mjs's orphan-
 * page report; this is the opposite case — a page still *in* pages[] whose
 * placeholder nobody replaced).
 */
export function runXLeftover({ files }) {
  const messages = [];
  for (const file of htmlFiles(files)) {
    const re = /<\/?x-[a-z][a-z0-9-]*/gi;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) {
      messages.push({ severity: "error", text: `leftover unexpanded element: ${m[0]}>`, file: file.relPath, line: lineOf(file.scanText, m.index) });
    }

    const markerIndex = file.scanText.indexOf(PLACEHOLDER_MARKER_TEXT);
    if (markerIndex !== -1) {
      messages.push({
        severity: "error",
        text: "unreplaced placeholder page: this page still contains the `new` placeholder TODO marker",
        file: file.relPath,
        line: lineOf(file.scanText, markerIndex),
      });
    }
  }
  return { messages };
}

/**
 * Visible text left in an `<a>...</a>` body once every nested tag and HTML
 * comment is stripped — "" means no real text survives (an empty element
 * like `<span></span>` contributes nothing, same as plain whitespace), which
 * is exactly the shape a self-closing `<x-page p="id"/>` used to produce
 * before it gained a title fallback. Good enough for this
 * regex-based scanner's purposes (same spirit as its other helpers); it
 * doesn't need to distinguish "an empty child element" from "no children at
 * all" — both read as empty here.
 */
function innerLinkText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Every `#id` href resolves to a real id somewhere in the built artifact,
 * and (--multi only) every bare `<id>.html` href names a page actually
 * written. x-term's `href="#terms--<key>"` is intentionally checked the
 * same way in both shapes (not exempted for --multi): shell.js always
 * intercepts a click on `a.ex-term` itself and opens a popover instead of
 * navigating, in both shapes — the href is a no-JS fallback, and the id it
 * names (the Terms page's own `id="terms--<key>"`) is present in the
 * combined id set below regardless of which file it lives in, so checking
 * it this way is both correct and uniform across shapes.
 *
 * Also catches any `<a>` with an href and no visible text at all (empty or
 * whitespace-only, ignoring children that are themselves empty) — an empty
 * link is invisible to a reader and must never publish, regardless of
 * whether its href happens to resolve (the real defect was a
 * self-closing `<x-page>` rendering `<a class="ex-page" href="#x"></a>`).
 */
/**
 * `#info=<key>` or `#<page>/info=<key>`: a hash shape
 * info.js's own `handleInfoHash` resolves at runtime by looking up `key`
 * against the term/body registry — never a real element `id`, so
 * `ref.anchor`'s own "every #href resolves to a real id" rule must not
 * flag it as broken. `ref.info`'s own deep-link scan (below) validates the
 * key side of this same shape instead; this is ref.anchor's exemption, not
 * a second validator for it.
 */
const INFO_DEEP_LINK_HREF_RE = /^#(?:[^/]*\/)?info=.+$/;

export function runRefAnchor({ files, shape }) {
  const messages = [];
  const htmls = htmlFiles(files);
  const idSet = new Set();
  for (const file of htmls) {
    const re = /\bid="([^"]+)"/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) idSet.add(m[1]);
  }
  const pageFileSet = new Set(htmls.map((f) => path.basename(f.relPath)));

  for (const file of htmls) {
    const re = /href="([^"]+)"/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) {
      const href = m[1];
      if (href.startsWith("#")) {
        if (INFO_DEEP_LINK_HREF_RE.test(href)) continue;
        const id = href.slice(1);
        if (id && !idSet.has(id)) {
          messages.push({ severity: "error", text: `href="${href}" does not resolve to any id in the built artifact`, file: file.relPath, line: lineOf(file.scanText, m.index) });
        }
      } else if (shape === "multi" && /^[\w-]+\.html$/.test(href) && !pageFileSet.has(href)) {
        messages.push({ severity: "error", text: `href="${href}" has no matching built page file`, file: file.relPath, line: lineOf(file.scanText, m.index) });
      }
    }

    const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let am;
    // eslint-disable-next-line no-cond-assign
    while ((am = aRe.exec(file.scanText))) {
      const attrs = am[1];
      if (!/\bhref\s*=\s*"[^"]*"/.test(attrs)) continue;
      if (innerLinkText(am[2]) === "") {
        messages.push({ severity: "error", text: "empty link: <a href> has no visible text", file: file.relPath, line: lineOf(file.scanText, am.index) });
      }
    }
  }
  return { messages };
}

/** Every data-term is defined (error); every defined term is used somewhere (warning). */
export function runRefTerm({ files, contents }) {
  const messages = [];
  const declared = new Set((contents.terms || []).map((t) => t.key));
  const used = new Set();
  for (const file of htmlFiles(files)) {
    const re = /data-term="([^"]+)"/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) {
      used.add(m[1]);
      if (!declared.has(m[1])) {
        messages.push({ severity: "error", text: `data-term="${m[1]}" is not declared in contents.json terms[] (stale dist?)`, file: file.relPath, line: lineOf(file.scanText, m.index) });
      }
    }
  }
  for (const key of declared) {
    if (!used.has(key)) {
      messages.push({ severity: "warning", text: `term "${key}" is defined but never used (no x-term references it)` });
    }
  }
  return { messages };
}

/** Every citation `[n]` resolves to a listed entry on the generated Sources page. */
export function runRefCite({ files }) {
  const messages = [];
  const cited = new Set();
  const listed = new Set();
  for (const file of htmlFiles(files)) {
    const citeRe = /class="ex-cite"[^>]*>\[(\d+)\]/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = citeRe.exec(file.scanText))) cited.add(Number(m[1]));
    const liRe = /id="sources--(\d+)"/g;
    // eslint-disable-next-line no-cond-assign
    while ((m = liRe.exec(file.scanText))) listed.add(Number(m[1]));
  }
  for (const n of cited) {
    if (!listed.has(n)) {
      messages.push({ severity: "error", text: `citation [${n}] has no matching entry on the generated Sources page` });
    }
  }
  return { messages };
}

/**
 * Finds every `x-file`-rendered link (`class="ex-path"`) in the built
 * artifact and recovers its `path` (and optional `#Lnn`) relative to
 * `contents.repo`'s own github blob URL prefix. This deliberately does
 * *not* try to regex-parse `ref` back out of the URL generically — a real
 * git ref routinely contains its own `/` (e.g. `poc/vcs-port`), which makes
 * "the segment between /blob/ and the next /" ambiguous. `contents.repo.ref`
 * is already known exactly (it's what lib/cites.mjs's githubBlobUrl used to
 * build the link in the first place), so the prefix is built from it and
 * matched as a literal instead.
 */
function collectGithubTargets(files, repo) {
  if (!repo || !repo.github || !repo.ref) return [];
  const prefix = `https://github.com/${repo.github}/blob/${repo.ref}/`;
  const re = /class="ex-path"[^>]*href="([^"]+)"/g;
  const targets = [];
  const seen = new Set();
  for (const file of htmlFiles(files)) {
    re.lastIndex = 0;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) {
      const href = m[1];
      if (!href.startsWith(prefix)) continue;
      const filePath = href.slice(prefix.length).replace(/#L\d+$/, "");
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      targets.push({ ref: repo.ref, filePath, file: file.relPath, index: m.index, text: file.scanText });
    }
  }
  return targets;
}

/**
 * `x-file` targets exist at `repo.ref` (via `git cat-file -e <ref>:<path>`
 * locally). A missing target is a warning by default — the
 * branch may simply not be pushed yet — and escalates to an error once
 * `ref` is confirmed to already exist on `origin` (a shared/stable ref
 * going stale is a real problem, not a work-in-progress branch).
 *
 * the existence check itself resolves against
 * `refs/remotes/origin/<ref>`, not the bare local `<ref>`, whenever that
 * remote-tracking ref exists — exactly the same "is it on origin?" probe
 * this function already ran to decide warning-vs-error severity, reused
 * here rather than added as a second lookup. The `x-file`-generated GitHub
 * link this check verifies (`lib/cites.mjs`'s `githubBlobUrl`) always
 * points at `origin`'s copy of `ref`, never whatever the local branch of
 * the same name happens to be — a local branch behind `origin` (this
 * checkout fetched but never pulled, say) otherwise resolves `<ref>:<path>`
 * against its own stale tip and reports a file that's really there on
 * `origin` as missing (confirmed false-positive on the real vcs-port
 * artifact: `plugins/.../vcs_git.py` et al. exist on `origin/poc/vcs-port`,
 * not on the local branch of the same name in this checkout). Only when no
 * `refs/remotes/origin/<ref>` exists at all does this fall back to the
 * bare local `<ref>` — same as before.
 */
export function runRefGithub({ files, contents, repoRoot }) {
  const targets = collectGithubTargets(files, contents.repo);
  if (targets.length === 0) return { messages: [] };
  if (!repoRoot) {
    return { special: "skipped", messages: [{ severity: "info", text: "not inside a git repository — cannot run git cat-file" }] };
  }

  const refIsOnOrigin = new Map();
  const messages = [];
  for (const t of targets) {
    if (!refIsOnOrigin.has(t.ref)) {
      const result = spawnSync("git", ["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${t.ref}`], {
        cwd: repoRoot,
        encoding: "utf8",
      });
      refIsOnOrigin.set(t.ref, result.status === 0);
    }
    const onOrigin = refIsOnOrigin.get(t.ref);
    const checkRef = onOrigin ? `refs/remotes/origin/${t.ref}` : t.ref;
    const result = spawnSync("git", ["cat-file", "-e", `${checkRef}:${t.filePath}`], { cwd: repoRoot, encoding: "utf8" });
    if (result.status !== 0) {
      const severity = onOrigin ? "error" : "warning";
      messages.push({
        severity,
        text: `x-file target "${t.filePath}" does not exist at ${t.ref} (git cat-file -e)`,
        file: t.file,
        line: lineOf(t.text, t.index),
      });
    }
  }
  return { messages };
}

// --------------------------------------------------------------- ref.info
// The info component's own redundant safety net over the built artifact
// () — same stance as ref.anchor/
// ref.term: the build (lib/includes.mjs's handleInfoTrigger/handleInfoBody/
// checkDataInfo) already refuses to build a page with an unknown key, a
// titleless panel-mode body, or an untitled `<x-info>` trigger, so most of
// what this re-checks against the real dist/ can only ever fire on a
// *stale* dist (built before a later edit invalidated it) — same spirit as
// ref.term's "stale dist?" phrasing. Two things genuinely are NOT enforced
// at build time and are this check's own real find:
//   - "no accessible name" on a hand-authored `data-info`/`data-panel`
//     element (an SVG `<g>`, an `<li>`, …) or an `a.ex-term` — the build
//     never inspects an arbitrary element's own text/aria-label, only
//     `<x-info>`'s own generated anchor (which always has label text by
//     construction; research.md's survey defect #3 was exactly this gap on
//     hand-authored triggers).
//   - the caption-vs-triggers mismatch (`info-caption-matches-triggers`'
//     measurable half) — a judgment call no build-time validator attempts.
//
// Ids and keys are aggregated across every dist HTML file, not per-file —
// the same simplification ref.anchor's own `idSet` and ref.term's own
// declared/used sets already make for a --multi build: resolving which
// *document* a trigger or entry actually landed in would need machinery
// none of this file's other ref.* checks have either.
//
// `a.ex-term[data-term]` triggers are included here only for the
// accessible-name check (the shared open/close/position engine's defect
// #3 applies equally to both paths) — their *key*
// resolving against `contents.terms[]` stays ref.term's job alone
// (lib/info.mjs's deviation keeps terms in a separate namespace
// from the info-body registry; re-checking the same key under a second
// check id would just be noise).

const INFO_CAPTION_TRIGGER_WORD_RE = /\b(click|tap|select)\b/i;

function classListOf(node) {
  return (node.attrs?.class || "").split(/\s+/).filter(Boolean);
}

/** Concatenated visible text of `node` and every descendant (comments contribute nothing, same spirit as innerLinkText). */
function nodeText(node) {
  if (node.type === "text") return node.value;
  if (node.type !== "element") return "";
  return node.children.map(nodeText).join("");
}

function isInfoRegistryTrigger(node) {
  return node.type === "element" && "data-info-target" in (node.attrs || {});
}

function isTermTrigger(node) {
  return node.type === "element" && node.tag.toLowerCase() === "a" && classListOf(node).includes("ex-term") && "data-term" in (node.attrs || {});
}

function isInfoEntry(node) {
  return node.type === "element" && classListOf(node).includes("ex-info-entry");
}

function isDiagramWrapper(node) {
  return node.type === "element" && classListOf(node).includes("ex-diagram");
}

/** True when `node` or any descendant carries `data-info-target` — "this diagram has a clickable region somewhere inside it". */
function hasInfoTriggerDescendant(node) {
  if (node.type !== "element") return false;
  if ("data-info-target" in (node.attrs || {})) return true;
  return node.children.some(hasInfoTriggerDescendant);
}

/** A trigger's own display name for a message: whichever key-bearing attribute it actually carries. */
function triggerKeyLabel(node) {
  const attrs = node.attrs || {};
  return attrs["data-info"] || attrs["data-panel"] || attrs["data-term"] || "(no key attribute)";
}

/**
 * Depth-first walk collecting every info trigger (registry or term shape),
 * every `.ex-info-entry`, and every `.ex-diagram` wrapper (with enough
 * sibling/parent context to find its caption — same shape as
 * collectBarDiagramWrappers above) in one pass over one file's node tree.
 */
function collectInfoNodes(nodes, out, parent = null) {
  nodes.forEach((node, index) => {
    if (node.type !== "element") return;
    if (isInfoRegistryTrigger(node) || isTermTrigger(node)) out.triggers.push(node);
    if (isInfoEntry(node)) out.entries.push(node);
    if (isDiagramWrapper(node)) out.diagrams.push({ node, siblings: nodes, index, parent });
    collectInfoNodes(node.children, out, node);
  });
  return out;
}

/** The caption text that governs a diagram wrapper: its next element sibling's text, plus (when its parent is a <figure>) any <figcaption> child's text. */
function diagramCaptionText({ node, siblings, index, parent }) {
  const parts = [];
  const sib = nextElementSibling(siblings, index);
  if (sib) parts.push(nodeText(sib));
  if (parent && parent.tag.toLowerCase() === "figure") {
    for (const child of parent.children) {
      if (child.type === "element" && child.tag.toLowerCase() === "figcaption") parts.push(nodeText(child));
    }
  }
  void node; // node itself carries no caption text of its own
  return parts.join(" ");
}

/**
 * `ref.info`: every info/term trigger resolves and has an
 * accessible name; every `.ex-info-entry` has a real id and (panel mode) a
 * title; an entry no trigger opens is a warning; a `#info=<key>` deep link
 * that resolves nowhere is an error; a diagram caption that says
 * "click"/"tap"/"select" over a diagram with zero triggers is a warning
 * (`info-caption-matches-triggers`' measurable half).
 */
export function runRefInfo({ files, contents }) {
  const messages = [];
  const htmls = htmlFiles(files);

  const idSet = new Set();
  for (const file of htmls) {
    const re = /\bid="([^"]+)"/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) idSet.add(m[1]);
  }

  const termKeys = new Set((contents.terms || []).map((t) => t.key));
  const declaredKeys = new Set();
  const usedKeys = new Set();

  const parsed = [];
  for (const file of htmls) {
    const html = prepareHtmlForMarkupParse(file.content);
    let nodes;
    try {
      nodes = markup.parse(html, { file: file.relPath });
    } catch {
      continue; // malformed markup is html.balance's problem to report, not this check's
    }
    const out = collectInfoNodes(nodes, { triggers: [], entries: [], diagrams: [] });
    parsed.push({ file, nodes, ...out });
  }

  for (const { file, triggers, entries, diagrams } of parsed) {
    for (const node of triggers) {
      const attrs = node.attrs || {};
      const key = triggerKeyLabel(node);

      if ("data-info-target" in attrs) {
        usedKeys.add(attrs["data-info"] || attrs["data-panel"] || "");
        if (!idSet.has(attrs["data-info-target"])) {
          messages.push({
            severity: "error",
            text: `info trigger (key "${key}") targets "${attrs["data-info-target"]}", which does not resolve to any element in the built artifact (stale dist?)`,
            file: file.relPath,
            line: node.line,
          });
        }
      }

      const accessibleName = (attrs["aria-label"] || attrs.title || nodeText(node)).trim();
      if (!accessibleName) {
        messages.push({
          severity: "error",
          text: `info trigger <${node.tag.toLowerCase()}> (key "${key}") has no accessible name — no visible text, "aria-label", or "title"`,
          file: file.relPath,
          line: node.line,
        });
      }
    }

    for (const node of entries) {
      const attrs = node.attrs || {};
      const key = attrs["data-info-key"] || "(no data-info-key)";
      declaredKeys.add(attrs["data-info-key"] || "");

      if (!attrs.id) {
        messages.push({
          severity: "error",
          text: `info entry (key "${key}") has no "id" — the no-JS fallback and every trigger's deep link into it are both broken`,
          file: file.relPath,
          line: node.line,
        });
      }

      if (attrs["data-info-mode"] === "panel") {
        const hasTitle = node.children.some((c) => c.type === "element" && classListOf(c).includes("ex-info-entry-title"));
        if (!hasTitle) {
          messages.push({
            severity: "error",
            text: `info entry (key "${key}", mode="panel") has no title`,
            file: file.relPath,
            line: node.line,
          });
        }
      }
    }

    for (const ctx of diagrams) {
      const caption = diagramCaptionText(ctx);
      if (!INFO_CAPTION_TRIGGER_WORD_RE.test(caption)) continue;
      if (hasInfoTriggerDescendant(ctx.node)) continue;
      messages.push({
        severity: "warning",
        text: 'a diagram\'s caption says "click"/"tap"/"select" but the diagram has no triggers (info-caption-matches-triggers)',
        file: file.relPath,
        line: ctx.node.line,
      });
    }
  }

  for (const key of declaredKeys) {
    if (key && !usedKeys.has(key)) {
      messages.push({ severity: "warning", text: `info entry "${key}" is defined but never opened by any trigger (unused)` });
    }
  }

  const deepLinkRe = /href="(#(?:[^"&]*\/)?info=[^"&]+)"/g;
  for (const file of htmls) {
    deepLinkRe.lastIndex = 0;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = deepLinkRe.exec(file.scanText))) {
      const href = m[1];
      const rawKey = href.slice(href.indexOf("info=") + "info=".length);
      let key = rawKey;
      try {
        key = decodeURIComponent(rawKey);
      } catch {
        // leave undecoded on a malformed escape — still checked against the raw value
      }
      if (!termKeys.has(key) && !declaredKeys.has(key)) {
        messages.push({
          severity: "error",
          text: `deep link href="${href}" does not resolve to any term or info entry (stale dist?)`,
          file: file.relPath,
          line: lineOf(file.scanText, m.index),
        });
      }
    }
  }

  return { messages };
}

// ----------------------------------------------------------- ui.affordance
// `clickable-has-cue` (Amendment 2026-10-08 — operator
// review of the demo: "Clickable JSON fields should be underlined... it
// should be clear that it opens a popup, slideout, or new window"). Same
// "redundant safety net over the real dist/" stance as ref.info: the build
// already stamps every marker it emits (lib/includes.mjs's handleTerm/
// handleInfoTrigger/checkDataInfo for `data-info-mode`; lib/includes.mjs's
// handleCite/handleFile, lib/info.mjs's files= footer, and lib/cites.mjs's
// Sources page for the `.ex-vh` new-tab span) — this only catches a *stale*
// dist, or a hand-authored trigger/new-tab link this check's own future
// author didn't know to stamp. A separate check id from ref.info (rather
// than folding in) because the two ask different questions: ref.info asks
// "does this trigger *work*" (resolves, has a name); this asks "does this
// *look* clickable, and does it say what it does."

const VALID_INFO_MODES = new Set(["popover", "panel"]);
const NEW_TAB_CUE_RE = /opens in new tab/i;

function isAffordanceTermTrigger(node) {
  return node.type === "element" && node.tag.toLowerCase() === "a" && classListOf(node).includes("ex-term");
}

function hasNewTabCueSpan(node) {
  return (node.children || []).some(
    (c) => c.type === "element" && classListOf(c).includes("ex-vh") && NEW_TAB_CUE_RE.test(nodeText(c))
  );
}

/** Depth-first: every info/term trigger (any element carrying `data-info-target`, plus bare `a.ex-term`) and every `target="_blank"` link, in one pass. */
function collectAffordanceNodes(nodes, out) {
  nodes.forEach((node) => {
    if (node.type !== "element") return;
    const attrs = node.attrs || {};
    if ("data-info-target" in attrs || isAffordanceTermTrigger(node)) out.triggers.push(node);
    if (attrs.target === "_blank") out.blankLinks.push(node);
    collectAffordanceNodes(node.children, out);
  });
  return out;
}

/**
 * `ui.affordance`: every info/term trigger carries a `data-info-mode`
 * cue marker ("popover" or "panel"), and every `target="_blank"` link
 * carries a real, visually-hidden "(opens in new tab)" span — the two
 * markers core/patterns/info/info.css's and core/shell/shell.css's cue
 * rules key off.
 */
export function runUiAffordance({ files }) {
  const messages = [];
  for (const file of htmlFiles(files)) {
    const html = prepareHtmlForMarkupParse(file.content);
    let nodes;
    try {
      nodes = markup.parse(html, { file: file.relPath });
    } catch {
      continue; // html.balance's problem to report, not this check's
    }
    const { triggers, blankLinks } = collectAffordanceNodes(nodes, { triggers: [], blankLinks: [] });

    for (const node of triggers) {
      const mode = (node.attrs || {})["data-info-mode"];
      if (!VALID_INFO_MODES.has(mode)) {
        messages.push({
          severity: "error",
          text: `clickable trigger <${node.tag.toLowerCase()}> (key "${triggerKeyLabel(node)}") has no "data-info-mode" cue marker — house style "clickable-has-cue" (stale dist, or a hand-authored trigger the build never stamped)`,
          file: file.relPath,
          line: node.line,
        });
      }
    }

    for (const node of blankLinks) {
      if (!hasNewTabCueSpan(node)) {
        messages.push({
          severity: "error",
          text: `link target="_blank" has no visually-hidden "(opens in new tab)" cue — house style "clickable-has-cue" (stale dist, or a hand-authored new-tab link the build never stamped)`,
          file: file.relPath,
          line: node.line,
        });
      }
    }
  }
  return { messages };
}

/** Hand-written code blocks are x-example kind=illustrative (or x-include) — never a bare, untagged <pre>. */
export function runFactIllustrativeTag({ files }) {
  const messages = [];
  for (const file of htmlFiles(files)) {
    const re = /<pre\b([^>]*)>/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) {
      if (!/class="ex-code-pre"/.test(m[1])) {
        messages.push({
          severity: "error",
          text: "hand-written <pre> block not produced by x-example/x-include (missing the Illustrative/Real tag)",
          file: file.relPath,
          line: lineOf(file.scanText, m.index),
        });
      }
    }
  }
  return { messages };
}

/**
 * Pattern list from house-style rule `no-internal-codes` in
 * `rules/house-style.json`, resolved through the lookup. Until that file
 * lands (or if a project's copy has no such rule entry), this check
 * reports `skipped` with the reason — never a false pass or a crash.
 * Assumed shape: `{ "no-internal-codes": { "patterns": ["<regex source>",
 * ...] } }` (or the parallel
 * `{"rules":[{"id":"no-internal-codes","patterns":[...]}]}` shape — both
 * are accepted).
 *
 * Scans every published surface, not just rendered page text: `scanText`
 * (page markup, same as every other check) *and* the raw `<script>`/
 * `<style>` bodies inlined into each HTML file (which `scanText` blanks,
 * for the other checks' sake — see `blankScriptsAndStyles`), *and*, for a
 * --multi build, the sibling `site.css`/`site.js` files those bodies would
 * otherwise have been inlined into. An internal code can leak through any
 * one of those just as easily as through visible prose.
 */
export function runFactNoInternalCodes({ files, lookup }) {
  const resolved = lookup.resolve("rules", "house-style");
  if (!resolved.found) {
    return { special: "skipped", messages: [{ severity: "info", text: "rules/house-style.json not found (not shipped by this plugin root)" }] };
  }
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(resolved.path, "utf8"));
  } catch (err) {
    return { messages: [{ severity: "error", text: `rules/house-style.json: invalid JSON — ${err.message}` }] };
  }
  const rule = Array.isArray(doc?.rules) ? doc.rules.find((r) => r.id === "no-internal-codes") : doc?.["no-internal-codes"];
  const patterns = rule?.patterns;
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return { special: "skipped", messages: [{ severity: "info", text: 'rules/house-style.json has no "no-internal-codes" rule with a patterns[] list' }] };
  }

  const messages = [];
  function scanForInternalCodes(text, baseText, baseIndex, relPath) {
    for (const source of patterns) {
      const re = new RegExp(source, "g");
      let m;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(text))) {
        messages.push({
          severity: "error",
          text: `internal decision code "${m[0]}" leaked into published output`,
          file: relPath,
          line: lineOf(baseText, baseIndex + m.index),
        });
        if (m[0] === "") re.lastIndex += 1; // guard a pattern that can match empty
      }
    }
  }

  for (const file of htmlFiles(files)) {
    scanForInternalCodes(file.scanText, file.scanText, 0, file.relPath);
    // scanText has every <script>/<style> body blanked to spaces (for the
    // other checks' sake) — this check wants the real text those bodies
    // carry, since that's exactly what a reader's browser downloads.
    for (const tag of ["script", "style"]) {
      for (const block of extractBlocks(file.content, tag)) {
        const openTagLength = 1 + tag.length + block.attrs.length + 1; // "<" + tag + attrs + ">"
        scanForInternalCodes(block.code, file.content, block.index + openTagLength, file.relPath);
      }
    }
  }
  // --multi ships its CSS/JS as sibling site.css/site.js files instead of
  // inlining them — not HTML, so htmlFiles() above never sees them, but
  // just as published as anything inline.
  for (const file of files) {
    const base = path.basename(file.relPath);
    if (base === "site.css" || base === "site.js") {
      scanForInternalCodes(file.content, file.content, 0, file.relPath);
    }
  }
  return { messages };
}

// rule.* — warning-level, measurable house-style checks.
// rule.paragraph-length and rule.min-font-size read their own threshold off
// `rules/house-style.json` (via houseStyleThreshold, above) — the entry
// whose `check` field names this check id, read through the same lookup
// every other core asset resolves through (artifact → repo → packs →
// core). The constants below are only the fallback used when no such file,
// or no matching entry, is found (a project is free to omit either).
// `contents.json` `rules.off` can disable any of the four by id regardless
// of where the threshold came from (the same list build.mjs already
// resolves rule ids against). `rule.define-before-use` here is narrowed to
// what's actually mechanically measurable without an NLP pass over prose: a
// term's `see` cross-reference must name a term declared *earlier* in
// contents.terms[]  — the full
// house-style sense of the rule is about prose order, which this doesn't
// attempt to judge).

const PARAGRAPH_WORD_LIMIT = 150;
const MIN_FONT_SIZE_PX = 12;

// core/shell/shell.css sets `html { font-size: 125% }` unconditionally
// — every `rem` (and this check's `em` approximation, see below) in every
// core/shell/patterns stylesheet is relative to that, not a browser's plain
// 16px default. 20px (16 * 1.25) is what actually reaches the page; using a
// bare 16px here (an earlier version of this check did) overstates how
// small a `rem` value renders and false-positives on perfectly fine type
// (e.g. `.72rem` is 14.4px at the real root, not 11.52px) — found via a real
// end-to-end build+check run (follow-up), not a hand-written
// fixture.
const ASSUMED_ROOT_FONT_SIZE_PX = 20;

// SVG text classes (core/shell/shell.css's `.ex-t`/`.ex-t-muted` — every
// core/diagrams/* generator's shared text helper, _shared/text.mjs, emits
// only these two): their `font-size` is in SVG user units, not CSS
// viewport pixels. A diagram's `<svg>` has no fixed width of its own (only
// a `viewBox`, per _shared/svg.mjs's `svg()`) and stretches/shrinks to fill
// `.ex-diagram`, so one user unit's rendered size depends on that element's
// actual layout width — something only a real browser determines (the
// browser.* checks, lib/browser.mjs), never this static regex scan. Rather
// than guess a scale factor (which would be wrong for most pages, most of
// the time), this check exempts them outright: a real too-small rendered
// diagram label is `browser.svg-overflow`'s problem (it already measures
// real rendered boxes), not this one's.
const SVG_TEXT_SELECTOR_RE = /^\.ex-t(-muted)?$/;

/**
 * The selector list text for the CSS rule enclosing `index` in `code`: the
 * text between the `}` (or start of string) before the nearest `{` at or
 * before `index`, and that `{` itself. A flat, non-nested-rule assumption
 * (good enough for this codebase's hand-written shell/pattern CSS — built-ins only, no
 * real CSS parser), same spirit as this file's other regex-based scanners.
 */
function enclosingSelector(code, index) {
  const openBrace = code.lastIndexOf("{", index);
  if (openBrace === -1) return "";
  const prevClose = code.lastIndexOf("}", openBrace - 1);
  return code.slice(prevClose + 1, openBrace).trim();
}

/** True when every comma-separated part of `selectorText` is a known SVG-text selector (`.ex-t`/`.ex-t-muted`). */
function isSvgTextSelector(selectorText) {
  const parts = selectorText.split(",").map((p) => p.trim());
  return parts.length > 0 && parts.every((p) => SVG_TEXT_SELECTOR_RE.test(p));
}

function ruleDisabled(contents, id) {
  return (contents.rules?.off || []).includes(id);
}

/**
 * A single numeric field (e.g. `threshold`, `threshold_px`) off the
 * `rules/house-style.json` entry that declares a given check id, resolved
 * through the lookup the same way `fact.no-internal-codes` resolves its own
 * `patterns` list. Tolerates everything that function already tolerates
 * (file absent, invalid JSON, no matching entry, both the array shape and
 * the flat `{"<id>": {...}}` fixture shape) by falling back to `fallback` —
 * a project is free to omit the file entirely, or to ship one that doesn't
 * mention this check, and either default stays in effect ("make
 * them read from the rules file … otherwise extend the check minimally").
 */
function houseStyleThreshold({ lookup, check, field, fallback }) {
  if (!lookup) return fallback;
  const resolved = lookup.resolve("rules", "house-style");
  if (!resolved.found) return fallback;
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(resolved.path, "utf8"));
  } catch {
    return fallback;
  }
  const rule = Array.isArray(doc?.rules) ? doc.rules.find((r) => r.check === check) : null;
  const value = rule?.[field];
  return typeof value === "number" ? value : fallback;
}

export function runRuleParagraphLength({ files, contents, lookup }) {
  if (ruleDisabled(contents, "paragraph-length")) {
    return { special: "skipped", messages: [{ severity: "info", text: "disabled via contents.json rules.off" }] };
  }
  const limit = houseStyleThreshold({ lookup, check: "rule.paragraph-length", field: "threshold", fallback: PARAGRAPH_WORD_LIMIT });
  const messages = [];
  for (const file of htmlFiles(files)) {
    const re = /<p\b[^>]*>([\s\S]*?)<\/p>/g;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(file.scanText))) {
      const words = m[1]
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length > limit) {
        messages.push({
          severity: "warning",
          text: `paragraph is ${words.length} words (house style limit: ${limit})`,
          file: file.relPath,
          line: lineOf(file.scanText, m.index),
        });
      }
    }
  }
  return { messages };
}

export function runRuleMinFontSize({ files, contents, lookup }) {
  if (ruleDisabled(contents, "min-font-size")) {
    return { special: "skipped", messages: [{ severity: "info", text: "disabled via contents.json rules.off" }] };
  }
  const minPx = houseStyleThreshold({ lookup, check: "rule.min-font-size", field: "threshold_px", fallback: MIN_FONT_SIZE_PX });
  const messages = [];
  for (const file of files) {
    let sources;
    if (file.relPath.endsWith(".css")) {
      sources = [{ code: file.content, index: 0 }];
    } else if (file.relPath.endsWith(".html")) {
      sources = extractBlocks(file.content, "style");
    } else {
      continue;
    }
    for (const { code, index } of sources) {
      const re = /font-size\s*:\s*([\d.]+)(px|rem|em)/gi;
      let m;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(code))) {
        if (isSvgTextSelector(enclosingSelector(code, m.index))) continue; // SVG user units, not CSS px — see SVG_TEXT_SELECTOR_RE
        const value = Number(m[1]);
        const unit = m[2].toLowerCase();
        const px = unit === "px" ? value : value * ASSUMED_ROOT_FONT_SIZE_PX; // against the real 20px root (html{font-size:125%}); approximate for em (brand spacing scale varies, and em compounds against its parent, not the root)
        if (px < minPx) {
          messages.push({
            severity: "warning",
            text: `font-size: ${m[1]}${unit} is below the ${minPx}px house-style minimum`,
            file: file.relPath,
            line: lineOf(file.content, index + m.index),
          });
        }
      }
    }
  }
  return { messages };
}

export function runRuleDefineBeforeUse({ contents }) {
  if (ruleDisabled(contents, "define-before-use")) {
    return { special: "skipped", messages: [{ severity: "info", text: "disabled via contents.json rules.off" }] };
  }
  const terms = contents.terms || [];
  const indexByKey = new Map(terms.map((t, i) => [t.key, i]));
  const messages = [];
  terms.forEach((t, i) => {
    if (!t.see) return;
    const seeIndex = indexByKey.get(t.see);
    if (seeIndex !== undefined && seeIndex > i) {
      messages.push({ severity: "warning", text: `term "${t.key}" sees "${t.see}", which is declared later in contents.json terms[] (define before use)` });
    }
  });
  return { messages };
}

/** True when `node` is a `<div class="ex-diagram" data-kind="bar">` (or carries that class alongside others). */
function isBarDiagramWrapper(node) {
  if (node.type !== "element" || node.tag.toLowerCase() !== "div") return false;
  const classes = (node.attrs?.class || "").split(/\s+/).filter(Boolean);
  return classes.includes("ex-diagram") && node.attrs?.["data-kind"] === "bar";
}

/** True when a `<table>` appears anywhere in `node`'s subtree (core/diagrams/bar's own `html` field nests it directly inside the wrapper). */
function hasTableDescendant(node) {
  for (const child of node.children || []) {
    if (child.type !== "element") continue;
    if (child.tag.toLowerCase() === "table") return true;
    if (hasTableDescendant(child)) return true;
  }
  return false;
}

/** The next element sibling in `siblings` after `index`, skipping whitespace-only text/comment nodes; `null` if a real (non-whitespace) node intervenes or none follows. */
function nextElementSibling(siblings, index) {
  for (let i = index + 1; i < siblings.length; i += 1) {
    const sib = siblings[i];
    if (sib.type === "element") return sib;
    if (sib.type === "text" && sib.value.trim() === "") continue;
    if (sib.type === "comment") continue;
    return null;
  }
  return null;
}

/** Depth-first walk collecting every bar-diagram wrapper node, alongside the sibling array + index it sits in (for the "next sibling" case). */
function collectBarDiagramWrappers(nodes, out = []) {
  nodes.forEach((node, index) => {
    if (node.type !== "element") return;
    if (isBarDiagramWrapper(node)) out.push({ node, siblings: nodes, index });
    collectBarDiagramWrappers(node.children, out);
  });
  return out;
}

/**
 * Structural, not regex-adjacency (found + fixed 2026-10-07, post-
 * merge): the previous version matched `<div class="ex-diagram"
 * data-kind="bar"...>` non-greedily up to the *first* `</div>`, then looked
 * for a `<table` only in the text *after* that match. core/diagrams/bar's
 * own `render()` nests its table *inside* the same wrapper (its optional
 * `html` field, per core/diagrams/bar/README.md's "the contract extension"),
 * with no other `<div>` in between — so that first `</div>` the old regex
 * found was the wrapper's *own* closing tag, with the table already
 * consumed inside the match. The check always looked past the one place the
 * real generator actually puts the table, and never caught a genuinely
 * missing one.
 *
 * This walks the real node tree (lib/markup.mjs's scanner, same one
 * html.balance already uses — see prepareHtmlForMarkupParse) and accepts
 * either shape named in the dispatch: a `<table>` nested anywhere inside
 * the `.ex-diagram[data-kind="bar"]` wrapper (the built-in generator's own
 * shape), or a `<table>` as the wrapper's next element sibling (a
 * hand-authored page that places one after instead) — whitespace-only text
 * between them doesn't break adjacency.
 */
export function runRuleChartWithoutDataTable({ files, contents }) {
  if (ruleDisabled(contents, "chart-without-data-table")) {
    return { special: "skipped", messages: [{ severity: "info", text: "disabled via contents.json rules.off" }] };
  }
  const messages = [];
  for (const file of htmlFiles(files)) {
    const html = prepareHtmlForMarkupParse(file.content);
    let nodes;
    try {
      nodes = markup.parse(html, { file: file.relPath });
    } catch {
      continue; // malformed markup is html.balance's problem to report, not this check's
    }
    for (const { node, siblings, index } of collectBarDiagramWrappers(nodes)) {
      const inner = hasTableDescendant(node);
      const sibling = !inner && nextElementSibling(siblings, index)?.tag?.toLowerCase() === "table";
      if (!inner && !sibling) {
        messages.push({
          severity: "warning",
          text: 'a "bar" chart has no data table (neither nested inside its .ex-diagram wrapper nor as its next element sibling)',
          file: file.relPath,
          line: node.line,
        });
      }
    }
  }
  return { messages };
}

/** Every --ex-* token from core/brand/tokens.json is defined by the resolved brand CSS. */
export function runBrandTokens({ pluginRoot, brandCss }) {
  let tokenNames;
  try {
    tokenNames = loadTokenNames(pluginRoot);
  } catch (err) {
    return { messages: [{ severity: "error", text: `loadTokenNames threw: ${err.message}` }] };
  }
  let result;
  try {
    result = validateBrand(brandCss, tokenNames);
  } catch (err) {
    return { messages: [{ severity: "error", text: `validateBrand threw: ${err.message}` }] };
  }
  if (result?.ok) return { messages: [] };
  const missing = Array.isArray(result?.missing) ? result.missing : [];
  if (missing.length === 0) {
    return { messages: [{ severity: "error", text: "brand validation failed" }] };
  }
  return { messages: missing.map((m) => ({ severity: "error", text: `brand CSS is missing required token: ${m}` })) };
}

/**
 * Fact-checker agent result. No `dist/fact-check.json` yet means the
 * agent hasn't run — reported as `pending` (distinct from `failed`: it
 * blocks publish, per the dispatch note, via its own exit code, but doesn't
 * mean something is actually *wrong*).
 */
export function runFactChecker({ artifactDir }) {
  const factCheckPath = path.join(artifactDir, "dist", "fact-check.json");
  if (!fs.existsSync(factCheckPath)) {
    return { special: "pending", messages: [{ severity: "info", text: "dist/fact-check.json not present yet — the fact-checker agent has not run" }] };
  }
  let claims;
  try {
    claims = JSON.parse(fs.readFileSync(factCheckPath, "utf8"));
  } catch (err) {
    return { messages: [{ severity: "error", text: `dist/fact-check.json: invalid JSON — ${err.message}` }] };
  }
  if (!Array.isArray(claims)) {
    return { messages: [{ severity: "error", text: "dist/fact-check.json must be a JSON array of claims" }] };
  }
  const messages = [];
  for (const c of claims) {
    if (c.status !== "supported") {
      messages.push({ severity: "error", text: `${c.status}: "${c.claim}"${c.note ? ` — ${c.note}` : ""}`, page: c.page });
    }
  }
  return { messages };
}

/**
 * Every grounding-wiki note cited as a `file` source (a path under `docs/wiki/`) is fresh:
 * no path in its `sources:` frontmatter changed after its `verified_against:` pin. A stale
 * note is a warning, never an error — the note may still be right, but the fact built on it
 * is no longer proven against current code. Re-verify the cited fact, or run
 * /grounding-wiki:wiki-update. Mirrors grounding-wiki's freshness rule without importing it
 * (plugins compose through files, never through each other's code).
 */
export function runWikiFresh({ contents, repoRoot }) {
  const notes = [...new Set((contents.sources || []).filter((s) => s.kind === "file" && /^docs\/wiki\/.+\.md$/.test(s.path)).map((s) => s.path))];
  if (notes.length === 0) return { messages: [] };
  if (!repoRoot) return { special: "skipped", messages: [{ severity: "info", text: "not inside a git repository — cannot check wiki pins" }] };

  const git = (args) => spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  const messages = [];
  for (const note of notes) {
    const full = path.join(repoRoot, note);
    if (!fs.existsSync(full)) {
      messages.push({ severity: "warning", text: `cited wiki note ${note} no longer exists` });
      continue;
    }
    const text = fs.readFileSync(full, "utf8");
    const pin = parseFrontmatter(text)?.verified_against;
    const sources = noteSources(text);
    if (!pin || sources.length === 0) {
      messages.push({ severity: "warning", text: `cited wiki note ${note} has no verified_against pin or sources — freshness unverifiable` });
      continue;
    }
    const log = git(["log", "--oneline", `${pin}..HEAD`, "--", ...sources]);
    if (log.status !== 0) {
      messages.push({ severity: "warning", text: `cited wiki note ${note}: cannot read history since pin ${pin.slice(0, 12)}` });
    } else if (log.stdout.trim()) {
      const n = log.stdout.trim().split("\n").length;
      messages.push({ severity: "warning", text: `cited wiki note ${note} is STALE — ${n} commit(s) touched its sources since ${pin.slice(0, 12)}; re-verify the facts citing it or run /grounding-wiki:wiki-update` });
    }
  }
  return { messages };
}

/** A note's `sources:` — inline `[a, b]` or a YAML block list (both corpus spellings). */
function noteSources(text) {
  const inline = parseFrontmatter(text)?.sources;
  if (Array.isArray(inline)) return inline;
  const fm = /^---\s*\n([\s\S]*?)\n---/.exec(text.replace(/^\s+/, ""));
  const out = [];
  let inBlock = false;
  for (const line of fm ? fm[1].split("\n") : []) {
    if (/^sources:\s*$/.test(line)) { inBlock = true; continue; }
    if (!inBlock) continue;
    const item = /^\s+-\s+(.+)$/.exec(line);
    if (item) out.push(item[1].trim());
    else if (!/^\s/.test(line)) inBlock = false;
  }
  return out;
}
