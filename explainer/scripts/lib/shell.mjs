// Single/multi shell assembly (build steps 4-5). Reads the static templates/stylesheet/script shipped at
// core/shell/ and fills them in with a plain placeholder replace (Node
// built-ins only — no templating engine): numbering, the grouped
// menu and the pager are all computed here, purely from contents.pages[]
// order and contents.groups[] order (never from page-middle text), so
// reordering pages[] renumbers every one of them.
//
// Also owns pattern collection/inlining: scans each expanded page's
// HTML for `ex-<name>` classes, resolves `patterns/<name>/` through the
// lookup, and inlines only the patterns actually used. The diagram base
// classes (shared with lib/includes.mjs's x-diagram handler) and
// every class the build itself emits (x-term/x-cite/x-file/x-page/x-include
// output) are excluded from pattern-candidate collection — they are shell
// dialect, not a page-writer invoking a pattern folder.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHELL_DIR = path.join(__dirname, "..", "..", "core", "shell");

// Shared with lib/includes.mjs's x-diagram handler: the one set of
// class names every diagram generator and every hand-written SVG draws
// with, never `var()` or a literal colour in an SVG attribute.
export const DIAGRAM_BASE_CLASSES = {
  box: "ex-box",
  boxChanged: "ex-box-changed",
  boxNew: "ex-box-new",
  line: "ex-ln",
  text: "ex-t",
  textMuted: "ex-t-muted",
  legendSame: "ex-legend-same",
  legendChanged: "ex-legend-changed",
  legendNew: "ex-legend-new",
};

// Every `ex-*` class the *build itself* emits (lib/includes.mjs, lib/terms.mjs,
// lib/cites.mjs, lib/info.mjs, or the diagram base classes above) — never a
// pattern-folder candidate via the generic "strip the ex- prefix" mapping
// below, even though some of them match the `ex-<name>` shape (:
// "unknown ex-* classes that are shell/diagram classes are not patterns").
const BUILD_OWNED_EX_CLASSES = new Set([
  "ex-diagram",
  "ex-node",
  ...Object.values(DIAGRAM_BASE_CLASSES),
  "ex-term-see",
  "ex-page",
  "ex-cite",
  "ex-path",
  "ex-code-head",
  "ex-code-tag",
  "ex-code-file",
  "ex-code-pre",
  "ex-glossary",
  "ex-terms-empty",
  "ex-sources",
  "ex-sources-empty",
  "ex-vendor",
  // : the info component's own build-emitted markup
  // (lib/includes.mjs's handleInfoTrigger/handleInfoBody, lib/info.mjs's
  // renderInfoEntry/renderFallback) — never a pattern-candidate by the
  // generic rule; see BUILD_OWNED_IMPLIES + the data-info-target check
  // below for how it still pulls in the `info` pattern.
  "ex-info-trigger",
  "ex-info-entry",
  "ex-info-entry-title",
  "ex-info-entry-body",
  "ex-info-fallback",
  "ex-info-files",
  "ex-info-see",
]);

// Build-owned markup still *implies* its pattern — it's emitted by the
// build itself (lib/includes.mjs's renderCodeBlock/handleTerm), never a
// page-writer's own literal class, so the generic mapping above can't find
// it, but a page using it still needs that pattern's CSS/JS (
// `code` highlights `.ex-code`; `term`/`panel` are
// thin aliases over content *inside* a body, and both now imply `info`
// too — the shared component owning the trigger/popover/panel/sheet engine
// itself). Two kinds of implication:
//   - BUILD_OWNED_IMPLIES: a literal class token maps to one *or more*
//     pattern names (checked instead of being silently dropped when it's in
//     BUILD_OWNED_EX_CLASSES-shaped territory).
//   - the three attribute checks below `collectPatternNames`'s main loop:
//     `data-term`/`data-panel`/`data-info-target` can appear without the
//     exact class token being present (e.g. a hand-authored trigger, or a
//     non-`<a>` element carrying `data-panel`), so they're checked directly
//     against each page's raw HTML rather than through the per-class loop.
// Extend this map (never the exclusion set above) when another build-owned
// emitter clearly maps to a pattern folder.
export const BUILD_OWNED_IMPLIES = new Map([
  ["ex-code", ["code"]],
  ["ex-term", ["term", "info"]],
  ["ex-info-trigger", ["info"]],
]);

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

function hrefFor(pageId, multi) {
  return multi ? `${pageId}.html` : `#${pageId}`;
}

// The two templates open with an explanatory HTML comment for whoever
// reads core/shell/*.html in the repo (not for the person reading built
// output) — stripped here so it never ships in dist/.
function loadTemplate(name) {
  const raw = fs.readFileSync(path.join(SHELL_DIR, name), "utf8");
  return raw.replace(/^<!--[\s\S]*?-->\s*/, "");
}

function fillTemplate(tpl, data) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (full, key) => (key in data ? data[key] : full));
}

// JSON embedded inside a <script type="application/json"> block: escape
// every "<" as < so a literal "</script" in the data (e.g. inside a
// term definition) can never prematurely close the tag. JSON.parse
// unescapes < back to "<" with no further handling needed.
export function jsonScriptSafe(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function dataScriptBlock(id, value) {
  return `<script type="application/json" id="${id}">${jsonScriptSafe(value)}</script>`;
}

// ----------------------------------------------------- numbering/menu/pager
// All three are derived *only* from contents.pages[]/groups[] order (build
// spec : "reordering pages[] renumbers everything") — never from a
// page's own title text or markup.

function eyebrowText(contents, pageId) {
  const idx = contents.pages.findIndex((p) => p.id === pageId);
  return `${idx + 1} · ${contents.pages[idx].title}`;
}

function buildMenuHtml({ contents, multi, currentPageId }) {
  const groups = contents.groups || [];
  const pageGroups = groups
    .map((g) => {
      const items = contents.pages
        .filter((p) => p.group === g.id)
        .map((p) => {
          const current = multi && p.id === currentPageId ? ' aria-current="page"' : "";
          return `<li><a href="${escapeAttr(hrefFor(p.id, multi))}" data-page="${escapeAttr(p.id)}"${current}>${escapeText(p.title)}</a></li>`;
        })
        .join("");
      if (!items) return "";
      return `<div class="ex-menu-group"><h4>${escapeText(g.title)}</h4><ul>${items}</ul></div>`;
    })
    .filter(Boolean);
  return pageGroups.join("\n");
}

function buildPagerHtml({ contents, pageId, multi }) {
  const pages = contents.pages;
  const idx = pages.findIndex((p) => p.id === pageId);
  const prev = idx > 0 ? pages[idx - 1] : null;
  const next = idx < pages.length - 1 ? pages[idx + 1] : null;
  let html = "<span></span>";
  if (prev) {
    html =
      `<a class="ex-pager-prev" data-page="${escapeAttr(prev.id)}" href="${escapeAttr(hrefFor(prev.id, multi))}">` +
      `<span class="ex-pager-lbl">Previous</span>← ${escapeText(prev.title)}</a>`;
  }
  if (next) {
    html +=
      `<a class="ex-pager-next" data-page="${escapeAttr(next.id)}" href="${escapeAttr(hrefFor(next.id, multi))}">` +
      `<span class="ex-pager-lbl">Next</span>${escapeText(next.title)} →</a>`;
  }
  return html;
}

function renderPageSection({ contents, page, multi, hidden }) {
  const hiddenAttr = hidden ? " hidden" : "";
  return (
    `<section class="ex-page" id="${escapeAttr(page.id)}"${hiddenAttr}>` +
    `<div class="ex-eyebrow">${escapeText(eyebrowText(contents, page.id))}</div>` +
    `<div class="ex-page-body">${page.html}</div>` +
    `<nav class="ex-pager" aria-label="Page navigation">${buildPagerHtml({ contents, pageId: page.id, multi })}</nav>` +
    `</section>`
  );
}

// ----------------------------------------------------------------------- terms
// Embedded as JSON (not a hand-maintained array, unlike the reference site's site.js
// TERMS) so they can never drift from contents.json. Legacy
// `pages[].panels[]` no longer gets a parallel JSON block here:
// it's folded into the info component's registry at lib/info.mjs/
// lib/build.mjs and rendered as real `.ex-info-entry` markup inside each
// page's own "More detail" fallback instead — one data source (the DOM
// itself) for both the no-JS fallback and the runtime, not two.

/** The generated-terms page's own id, or `null` if the artifact has none (a term with `see` then has no page to deep-link to — buildTermsData leaves seeHref null in that case). */
function termsPageId(contents) {
  const page = contents.pages.find((p) => p.type === "generated-terms");
  return page ? page.id : null;
}

/**
 * `seeHref` is precomputed at build time, not guessed by the runtime
 * (survey defect #1: the reference built it as `see.href +
 * "#t-key"`, which pointed at the *current* page, not the Terms page, in a
 * multi-file site) — the build already knows exactly which page is the
 * generated Terms page and whether this is a single- or --multi-shape
 * build, so it builds the one correct href here once.
 */
function buildTermsData(contents, multi) {
  const termsId = termsPageId(contents);
  return (contents.terms || []).map((t) => {
    const see = t.see || null;
    const seeHref = see ? (multi && termsId ? `${termsId}.html#terms--${see}` : `#terms--${see}`) : null;
    return { key: t.key, term: t.term, def: t.def, see, seeHref };
  });
}

// --------------------------------------------------------- pattern inlining
// : collect `ex-<pattern>` classes used in the expanded page HTML,
// resolve `patterns/<name>/` via the lookup, inline only those patterns'
// CSS (required) and JS (optional). Classes the build itself emits
// (BUILD_OWNED_EX_CLASSES, including the diagram base classes) are never
// pattern-candidates via the generic mapping, even though they match the
// `ex-<name>` shape — but build-owned markup still *implies* its pattern
// (BUILD_OWNED_IMPLIES, plus the data-term/[data-panel] attribute checks
// below), so `code`/`term`/`panel` are collected exactly when a page
// actually uses them.
const DATA_TERM_RE = /\bdata-term="/;
const DATA_PANEL_RE = /\bdata-panel="/;
const DATA_INFO_TARGET_RE = /\bdata-info-target="/;

export function collectPatternNames(pages) {
  const seen = new Set();
  const order = [];

  function add(name) {
    if (!name || seen.has(name)) return;
    seen.add(name);
    order.push(name);
  }

  function addAll(names) {
    for (const name of names) add(name);
  }

  const classAttrRe = /class="([^"]*)"/g;
  for (const page of pages) {
    classAttrRe.lastIndex = 0;
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = classAttrRe.exec(page.html))) {
      for (const token of match[1].split(/\s+/)) {
        if (!token.startsWith("ex-")) continue;
        if (BUILD_OWNED_IMPLIES.has(token)) {
          addAll(BUILD_OWNED_IMPLIES.get(token));
          continue;
        }
        if (BUILD_OWNED_EX_CLASSES.has(token)) continue;
        if (/^ex-code-lang-/.test(token)) continue;
        add(token.slice(3));
      }
    }
    // `data-term`/`data-panel`/`data-info-target` can appear without their
    // usual class token (e.g. a hand-authored trigger, or `[data-panel]` on
    // an element that isn't an `.ex-node`) — checked directly against the
    // page's raw HTML. Every info/term/panel trigger shape carries
    // `data-info-target` (lib/includes.mjs normalizes all of them to it),
    // so that one check alone already implies `info`; the term/panel
    // checks additionally pull in their own content-refinement CSS.
    if (DATA_TERM_RE.test(page.html)) addAll(["term", "info"]);
    if (DATA_PANEL_RE.test(page.html)) addAll(["panel", "info"]);
    if (DATA_INFO_TARGET_RE.test(page.html)) add("info");
  }
  return order;
}

// Maps a pattern's folder name to the `contents.live` flag that gates
// shipping its `<name>.live.js` () — not 1:1 by
// name, since the `ask` pattern's flag is named after the capability it
// wires (`comments`), not the pattern folder.
const LIVE_FLAG_BY_PATTERN = { ask: "comments", presenter: "presenter" };

/**
 * Resolves every candidate pattern name through the lookup. A name the
 * lookup can't find is silently skipped (doesn't call this an error —
 * no pattern folders exist in core yet job); a name the
 * lookup *does* find but whose folder is missing the required
 * `<name>.css` is a build error (a malformed pattern, not an absent one).
 *
 * `liveFlags` is `contents.live` (or `{}`): a pattern's inert `<name>.js`
 * hook ships whenever the pattern is used, exactly as before ;
 * its `<name>.live.js` runtime wiring (an Artifact-capability module, not
 * merely "uses this pattern") ships ADDITIONALLY, and only, when this
 * build's own live flag for it is on — never a stray
 * `.live.js` on a page that never declares the capability it depends on.
 */
export function resolvePatterns(names, lookup, liveFlags = {}) {
  const used = [];
  const errors = [];
  const cssParts = [];
  const jsParts = [];
  for (const name of names) {
    const resolved = lookup.resolve("patterns", name);
    if (!resolved.found) continue;
    const cssPath = path.join(resolved.path, `${name}.css`);
    if (!fs.existsSync(cssPath)) {
      errors.push(`pattern "${name}" (${resolved.layer}): ${cssPath} does not exist`);
      continue;
    }
    cssParts.push(fs.readFileSync(cssPath, "utf8"));
    const jsPath = path.join(resolved.path, `${name}.js`);
    const hasJs = fs.existsSync(jsPath);
    if (hasJs) jsParts.push(fs.readFileSync(jsPath, "utf8"));

    const liveFlagKey = LIVE_FLAG_BY_PATTERN[name];
    const liveOn = Boolean(liveFlagKey && liveFlags[liveFlagKey]);
    let hasLiveJs = false;
    if (liveOn) {
      const livePath = path.join(resolved.path, `${name}.live.js`);
      if (fs.existsSync(livePath)) {
        jsParts.push(fs.readFileSync(livePath, "utf8"));
        hasLiveJs = true;
      }
    }

    used.push({ name, layer: resolved.layer, overridden: Boolean(resolved.overridden), hasJs, live: hasLiveJs });
  }
  return { used, errors, css: cssParts.join("\n\n"), js: jsParts.join("\n\n") };
}

// --------------------------------------------------------- live: ask buttons
// : when `contents.live.comments` is on, the build
// emits the `ask` pattern's `.ex-ask[hidden]` buttons itself (its
// README.md's markup contract) so page-writers never have to — one button
// right after every heading the page itself gives an id (the addressable
// "section" a reader is asking about), or, when a page has no such
// sub-section at all, one button for the whole page, anchored to the
// page's own id. A page that already hand-authors its own `.ex-ask`
// button(s) — the pattern's documented escape hatch for placing one
// somewhere the build can't infer — is left exactly as written; the build
// never adds a second one.
const HEADING_WITH_ID_RE = /<h([2-4])\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<\/h\1>/g;
const HAS_ASK_BUTTON_RE = /class="[^"]*\bex-ask\b[^"]*"/;

function askButtonHtml(sectionId) {
  return `<button type="button" class="ex-ask" data-ask-section="${escapeAttr(sectionId)}" hidden>Ask about this</button>`;
}

export function injectAskButtons(html, pageId) {
  if (HAS_ASK_BUTTON_RE.test(html)) return html;
  let count = 0;
  HEADING_WITH_ID_RE.lastIndex = 0;
  const withHeadingButtons = html.replace(HEADING_WITH_ID_RE, (match, _level, id) => {
    count += 1;
    return match + askButtonHtml(id);
  });
  if (count > 0) return withHeadingButtons;
  return html + askButtonHtml(pageId);
}

// ---------------------------------------------------- live: presenter controls
// : unlike `ask` (anchored to a page's own section), the
// `presenter` pattern attaches to the whole artifact — any kind, via the
// `live.presenter` flag alone, with no page-level "where" to infer from a
// page's own markup. So when `contents.live.presenter` is on, the build
// emits the pattern's own markup contract (core/patterns/presenter/
// README.md "Markup contract", copied verbatim — presenter.js only ever
// un-hides these elements, never creates them) once, in the shell's own
// top bar — the one piece of chrome every page shares in both the single
// and --multi shapes — rather than asking every page-writer to hand-author
// it themselves. A project that still wants a page-level presenter widget
// (e.g. a dedicated "Start here" page) may still hand-author its own
// `.ex-presenter` block there too; `presenter.js`'s `enable()` wires every
// not-yet-wired one, wherever it came from.
// The badge's text sits in its own inner span (follow-up #2) so
// presenter.css can visually compress the badge to just its status dot
// under a narrow viewport without losing its accessible name — the badge
// itself carries no aria-label, so that text is its only accessible
// content. presenter.js never reads/writes the badge's children (only its
// own `.hidden`), so this nests safely.
export const PRESENTER_TOPBAR_HTML =
  '<div class="ex-presenter">\n' +
  '<button type="button" class="ex-presenter-toggle" aria-pressed="false" hidden>Start presenting</button>\n' +
  '<span class="ex-presenter-badge" hidden><span class="ex-presenter-badge-label">Presenting</span></span>\n' +
  '<button type="button" class="ex-presenter-follow" aria-pressed="true" hidden>Following presenter</button>\n' +
  "</div>";

export function presenterTopbarHtml(contents) {
  return contents.live?.presenter ? PRESENTER_TOPBAR_HTML : "";
}

// --------------------------------------------------------------- assembly

function assembleSingle({ contents, pages, brandCss, patternsCss, patternsJs, globalInfoFallbackHtml }) {
  const tpl = loadTemplate("shell.single.html");
  const shellCss = fs.readFileSync(path.join(SHELL_DIR, "shell.css"), "utf8");
  const shellJs = fs.readFileSync(path.join(SHELL_DIR, "shell.js"), "utf8");
  const style = [brandCss, shellCss, patternsCss].filter(Boolean).join("\n\n");
  const script = [shellJs, patternsJs].filter(Boolean).join("\n\n");
  const menu = buildMenuHtml({ contents, multi: false });
  // Single shape combines every page into one document — a global-scope
  // info body's fallback renders exactly once here, as a sibling after the
  // last page section, never once per page (its DOM id has no page prefix,
  // lib/info.mjs's domIdFor — a second copy would be a
  // duplicate id in the same document).
  const sections =
    pages.map((page, i) => renderPageSection({ contents, page, multi: false, hidden: i !== 0 })).join("\n") +
    (globalInfoFallbackHtml || "");
  const data = [dataScriptBlock("ex-terms-data", buildTermsData(contents, false))].join("\n");
  return fillTemplate(tpl, {
    TITLE: escapeText(contents.title),
    STYLE: style,
    SCRIPT: script,
    MENU: menu,
    PAGES: sections,
    DATA: data,
    PRESENTER: presenterTopbarHtml(contents),
  });
}

function assembleMulti({ contents, pages, brandCss, patternsCss, patternsJs, globalInfoFallbackHtml }) {
  const tpl = loadTemplate("shell.multi.html");
  const shellCss = fs.readFileSync(path.join(SHELL_DIR, "shell.css"), "utf8");
  const shellJs = fs.readFileSync(path.join(SHELL_DIR, "shell.js"), "utf8");
  const siteCss = [brandCss, shellCss, patternsCss].filter(Boolean).join("\n\n");
  const siteJs = [shellJs, patternsJs].filter(Boolean).join("\n\n");
  const termsData = buildTermsData(contents, true);
  const presenterHtml = presenterTopbarHtml(contents);

  // --multi: each file is its own document, so every file gets its own copy
  // of the global-scope fallback (never a cross-file jump just to read a
  // body's content — a trigger on any page always finds its target in the
  // same file it's on).
  const pageFiles = pages.map((page) => {
    const menu = buildMenuHtml({ contents, multi: true, currentPageId: page.id });
    const section = renderPageSection({ contents, page, multi: true, hidden: false }) + (globalInfoFallbackHtml || "");
    const data = [dataScriptBlock("ex-terms-data", termsData)].join("\n");
    const html = fillTemplate(tpl, {
      TITLE: escapeText(contents.title),
      MENU: menu,
      PAGES: section,
      DATA: data,
      PRESENTER: presenterHtml,
    });
    return { id: page.id, html };
  });

  return { pageFiles, siteCss, siteJs };
}

/**
 * Assembles the full build output (build steps 4-5): pattern collection +
 * inlining, then the single or --multi shell, from the same `pages`
 * (already expanded by lib/includes.mjs) and `contents`. Returns
 * `{ ok: true, files: [{ relPath, content }], patternsUsed }` — relPath is
 * relative to the artifact's `dist/` directory (lib/build.mjs writes each
 * one) — or `{ ok: false, errors }` on a malformed pattern.
 *
 * @param {object} opts
 * @param {object} opts.contents - validated, merged contents.json
 * @param {Array} opts.pages - expanded pages (lib/build.mjs's expandAllPages)
 * @param {boolean} opts.multi
 * @param {string} opts.brandCss - the resolved brand file's content, inlined verbatim
 * @param {object} opts.lookup - this build's lookup (lib/lookup.mjs), for patterns
 * @param {string} opts.name - output basename (build.mjs: path.basename(artifactDir))
 * @param {string} [opts.globalInfoFallbackHtml] - lib/build.mjs's rendered
 *   "More detail" fallback (lib/info.mjs's renderFallback) for every
 *   scope="global" info body — embedded once (single) or once per file
 *   (--multi); see assembleSingle/assembleMulti
 */
export function assembleShell({ contents, pages, multi, brandCss, lookup, name, globalInfoFallbackHtml = "" }) {
  // : build-emitted `.ex-ask` buttons only when the artifact
  // declares `live.comments` — never on a generated Terms/Sources page,
  // which has no author-meaningful "section" to anchor a question to.
  const livePages = contents.live?.comments
    ? pages.map((page) =>
        page.type === "generated-terms" || page.type === "generated-sources"
          ? page
          : { ...page, html: injectAskButtons(page.html, page.id) }
      )
    : pages;

  // : the build-emitted presenter topbar (above) isn't any page's own
  // html, so it isn't visited by collectPatternNames unless it's handed in
  // alongside the real pages — fed in as one extra scan target, same
  // generic `ex-<name>` collection every other pattern goes through
  // (never a special case: `.ex-presenter`'s own class token already
  // names its pattern). The global info fallback is handed in the same way
  // — it's never any one page's own `.html`, so a nested trigger inside a
  // global-scope body (terms/pages linked from within a body)
  // would otherwise never be scanned for its own pattern implications.
  const presenterHtml = presenterTopbarHtml(contents);
  const scanTargets = [
    ...livePages,
    ...(presenterHtml ? [{ html: presenterHtml }] : []),
    ...(globalInfoFallbackHtml ? [{ html: globalInfoFallbackHtml }] : []),
  ];

  const patternNames = collectPatternNames(scanTargets);
  const {
    used: patternsUsed,
    errors,
    css: patternsCss,
    js: patternsJs,
  } = resolvePatterns(patternNames, lookup, contents.live || {});
  if (errors.length > 0) return { ok: false, errors };

  if (multi) {
    const { pageFiles, siteCss, siteJs } = assembleMulti({
      contents,
      pages: livePages,
      brandCss,
      patternsCss,
      patternsJs,
      globalInfoFallbackHtml,
    });
    const files = [
      ...pageFiles.map((pf) => ({ relPath: path.join(name, `${pf.id}.html`), content: pf.html })),
      { relPath: path.join(name, "site.css"), content: siteCss },
      { relPath: path.join(name, "site.js"), content: siteJs },
    ];
    return { ok: true, files, patternsUsed };
  }

  const html = assembleSingle({ contents, pages: livePages, brandCss, patternsCss, patternsJs, globalInfoFallbackHtml });
  return { ok: true, files: [{ relPath: `${name}.html`, content: html }], patternsUsed };
}
