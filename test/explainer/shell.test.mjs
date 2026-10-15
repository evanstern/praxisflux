// tests: shell assembly, pattern inlining, build report.
// Covers build steps 4-6.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { build } from "../../explainer/scripts/lib/build.mjs";
import { collectPatternNames, resolvePatterns } from "../../explainer/scripts/lib/shell.mjs";
import { createLookup } from "../../explainer/scripts/lib/lookup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const MINI_ARTIFACT = path.join(FIXTURES, "mini-artifact");
const PATTERNS_DEMO = path.join(FIXTURES, "patterns-demo");
const BUILD_PLUGIN_ROOT = path.join(FIXTURES, "build", "plugin-root");
const SHELL_JS = path.join(__dirname, "..", "..", "explainer", "core", "shell", "shell.js");

function extractInlineScript(html) {
  const m = /<script>\n([\s\S]*?)\n<\/script>/.exec(html);
  assert.ok(m, "expected one bare <script> (not type=application/json) block in the single-shape output");
  return m[1];
}

function nodeCheck(source) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-shell-check-"));
  try {
    const file = path.join(tmp, "check.js");
    fs.writeFileSync(file, source);
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    return result;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test("node --check passes on the committed core/shell/shell.js", () => {
  const result = spawnSync(process.execPath, ["--check", SHELL_JS], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("node --check passes on the inline <script> the single-shape build emits", async () => {
  // A plain copy of mini-artifact with its git-manifest generator stripped
  // (this test only cares about the shell's inline script, not generators —
  // avoids needing a real git repo as repoRoot).
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-shell-nodecheck-"));
  try {
    fs.cpSync(MINI_ARTIFACT, tmp, { recursive: true });
    const contentsPath = path.join(tmp, "contents.json");
    const contents = JSON.parse(fs.readFileSync(contentsPath, "utf8"));
    delete contents.generators;
    fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2));

    const result = await build({ dir: tmp, repoRoot: tmp, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    const html = fs.readFileSync(path.join(tmp, "dist", path.basename(tmp) + ".html"), "utf8");
    const script = extractInlineScript(html);
    const checked = nodeCheck(script);
    assert.equal(checked.status, 0, checked.stderr);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectPatternNames: build-owned classes are never pattern names themselves, but ex-code/a.ex-term imply code/term; generic ex-<name> classes are still collected normally", () => {
  const pages = [
    {
      id: "overview",
      html:
        '<a class="ex-term" data-term="port">port</a> <a class="ex-page" href="#x">x</a> ' +
        '<div class="ex-code" data-tag="Real"><span class="ex-code-tag">Real</span>' +
        '<code class="ex-code-lang-json">{}</code></div> ' +
        '<div class="ex-diagram"><svg><rect class="ex-box"></rect><text class="ex-t-muted"></text></svg></div> ' +
        '<span class="ex-widget ex-callout">hi</span>',
    },
  ];
  // "term"+"info" (from a.ex-term) and "code" (from ex-code) are collected
  // via the implication map, in the order their class token is encountered;
  // neither "ex-term"/"ex-code" nor any other BUILD_OWNED_EX_CLASSES token
  // (ex-page, ex-code-tag, ex-code-lang-json, ex-diagram, ex-box, ex-t-muted)
  // ever becomes a pattern name by the plain "strip the ex- prefix" rule.
  assert.deepEqual(collectPatternNames(pages), ["term", "info", "code", "widget", "callout"]);
});

test("collectPatternNames: [data-panel] implies panel+info even without an ex-node/diagram class", () => {
  const pages = [{ id: "p", html: '<span data-panel="demo" tabindex="0">detail</span>' }];
  assert.deepEqual(collectPatternNames(pages), ["panel", "info"]);
});

test("collectPatternNames: data-term alone (no ex-term class) still implies term+info", () => {
  const pages = [{ id: "p", html: '<span data-term="port">port</span>' }];
  assert.deepEqual(collectPatternNames(pages), ["term", "info"]);
});

test("collectPatternNames: data-info-target alone implies info", () => {
  const pages = [{ id: "p", html: '<div data-info="x" data-info-target="info--p--x">detail</div>' }];
  assert.deepEqual(collectPatternNames(pages), ["info"]);
});

test("collectPatternNames: a page with none of ex-code/a.ex-term/[data-panel] implies none of code/term/panel", () => {
  const pages = [{ id: "p", html: '<p class="ex-callout">hi</p>' }];
  assert.deepEqual(collectPatternNames(pages), ["callout"]);
});

test("resolvePatterns: a found pattern is inlined (css required, js optional); an unresolvable name is skipped, not an error", () => {
  const lookup = createLookup({ artifactDir: PATTERNS_DEMO, pluginRoot: BUILD_PLUGIN_ROOT });
  const { used, errors, css, js } = resolvePatterns(["widget", "no-such-pattern"], lookup);
  assert.deepEqual(errors, []);
  assert.equal(used.length, 1);
  assert.equal(used[0].name, "widget");
  assert.equal(used[0].hasJs, true);
  assert.match(css, /\.ex-widget/);
  assert.match(js, /data-widget-ready/);
});

test("build() single-shape: only the used pattern (widget) is inlined, not the declared-but-unused one", async () => {
  // Build in a private temp copy of the fixture, not the shared committed
  // directory — node --test runs files in parallel and another test building
  // the same fixture in place would race this one.
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-shell-patterns-single-"));
  const tmp = path.join(tmpParent, "patterns-demo");
  fs.cpSync(PATTERNS_DEMO, tmp, { recursive: true });
  try {
    const result = await build({ dir: tmp, repoRoot: tmp, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.patternsUsed.length, 1);
    assert.equal(result.patternsUsed[0].name, "widget");

    const html = fs.readFileSync(path.join(tmp, "dist", "patterns-demo.html"), "utf8");
    assert.match(html, /\.ex-widget \{/);
    assert.match(html, /data-widget-ready/);
    assert.doesNotMatch(html, /\.ex-unused/);
    assert.doesNotMatch(html, /color: red/);
  } finally {
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});

test("resolvePatterns: a folder the lookup finds but that has no <name>.css is a malformed-pattern error", () => {
  const lookup = createLookup({ artifactDir: PATTERNS_DEMO, pluginRoot: BUILD_PLUGIN_ROOT });
  const { used, errors } = resolvePatterns(["broken"], lookup);
  assert.deepEqual(used, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /pattern "broken"/);
  assert.match(errors[0], /broken\.css does not exist/);
});

test("build() surfaces a malformed pattern as step: \"shell\"", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-shell-broken-"));
  try {
    fs.cpSync(PATTERNS_DEMO, tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, "pages", "overview.html"), '<p class="ex-broken">oops</p>');
    const result = await build({ dir: tmp, repoRoot: tmp, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.step, "shell");
    assert.ok(result.errors.some((e) => e.includes('pattern "broken"')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("build() --multi: same pattern-inlining result as single-shape, from the same source", async () => {
  // Build in a private temp copy of the fixture, not the shared committed
  // directory — same reasoning as the single-shape test above.
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-shell-patterns-multi-"));
  const tmp = path.join(tmpParent, "patterns-demo");
  fs.cpSync(PATTERNS_DEMO, tmp, { recursive: true });
  try {
    const result = await build({ dir: tmp, multi: true, repoRoot: tmp, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    const siteCss = fs.readFileSync(path.join(tmp, "dist", "patterns-demo", "site.css"), "utf8");
    const siteJs = fs.readFileSync(path.join(tmp, "dist", "patterns-demo", "site.js"), "utf8");
    assert.match(siteCss, /\.ex-widget \{/);
    assert.doesNotMatch(siteCss, /\.ex-unused/);
    assert.match(siteJs, /data-widget-ready/);

    // No external script/style URLs in either generated file — a
    // github/content link in page prose is expected and fine; only
    // script/link src/href pointing off-origin would be a problem, and
    // this build never emits one.
    const overviewHtml = fs.readFileSync(path.join(tmp, "dist", "patterns-demo", "overview.html"), "utf8");
    assert.doesNotMatch(overviewHtml, /<script[^>]+src="https?:/);
    assert.doesNotMatch(overviewHtml, /<link[^>]+href="https?:/);
  } finally {
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});

test("reordering contents.pages[] renumbers the eyebrow and re-derives the pager — nothing else changes", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-shell-reorder-"));
  try {
    fs.cpSync(MINI_ARTIFACT, tmp, { recursive: true });
    const contentsPath = path.join(tmp, "contents.json");
    const contents = JSON.parse(fs.readFileSync(contentsPath, "utf8"));
    delete contents.generators; // avoid needing a real git repo for this test
    // Move "scenario-a" to the front (was 3rd of 5).
    const byId = Object.fromEntries(contents.pages.map((p) => [p.id, p]));
    contents.pages = [
      byId["scenario-a"],
      byId.overview,
      byId["merge-control"],
      byId.terms,
      byId.sources,
    ];
    fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2));

    const result = await build({ dir: tmp, repoRoot: tmp, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors));

    const html = fs.readFileSync(path.join(tmp, "dist", path.basename(tmp) + ".html"), "utf8");
    // scenario-a is now #1, overview #2, merge-control #3.
    assert.match(html, /<div class="ex-eyebrow">1 · Scenario A<\/div>/);
    assert.match(html, /<div class="ex-eyebrow">2 · Overview<\/div>/);
    assert.match(html, /<div class="ex-eyebrow">3 · Merge control<\/div>/);
    // The pager now links scenario-a -> overview (previously overview had no
    // "previous" at all, being first).
    assert.match(html, /ex-pager-next" data-page="overview"/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// --------------------------------- [hidden] cascade
//
// Found on the real vcs-port artifact: the presenter badge ("• Presenting")
// showed on every page, live or not. Cause: `.ex-presenter-badge { display:
// inline-flex }` has the same specificity as the `[hidden]` UA-stylesheet
// rule, and an author stylesheet loaded after the UA sheet wins ties —
// `[hidden]` lost. A CSS-level static assertion (this test — no real
// cascade resolution without a browser) plus a real-browser regression
// test (check.test.mjs's "browser (real driver)" test, run via the same
// headless-shell/Playwright driver check() uses) cover both halves.
const REAL_PLUGIN_ROOT = path.join(__dirname, "..", "..", "explainer");

test("core/shell/shell.css: a shell-level [hidden] rule wins the cascade over any component's own display rule", () => {
  const shellCss = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "shell", "shell.css"), "utf8");
  assert.match(
    shellCss,
    /\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/,
    "shell.css must force [hidden] to win the cascade over any later display: rule"
  );

  // The fix is the shell-level override, not deleting the conflicting
  // component rules — both must still be there, each still setting its own
  // `display` unconditionally (that's the whole point: [hidden] has to win
  // *despite* them, not because they were softened).
  const presenterCss = fs.readFileSync(
    path.join(REAL_PLUGIN_ROOT, "core", "patterns", "presenter", "presenter.css"),
    "utf8"
  );
  assert.match(
    presenterCss,
    /\.ex-presenter-badge\s*\{\s*display:\s*inline-flex;/,
    "presenter.css's own (unconditional) display rule on .ex-presenter-badge should still be present"
  );
  const askCss = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "patterns", "ask", "ask.css"), "utf8");
  assert.match(
    askCss,
    /\.ex-ask\s*\{\s*display:\s*inline-flex;/,
    "ask.css's own (unconditional) display rule on .ex-ask should still be present"
  );
});

// --------------------------- the top bar at 400px
//
// Found on the real vcs-port artifact: browser.phone-scroll failed on
// 13/18 pages. Two real causes, both fixed here: (1) the top bar itself
// (Pages + title + presenter controls + "Theme: auto") had nothing that
// let the title shrink, nor anything protecting the toggle buttons' own
// tap-sized width once it didn't; (2) `.ex-path` (a file/cite link's path
// or URL text, build-owned markup from lib/includes.mjs/lib/info.mjs/the
// generated Sources page) had no wrap rule at all — confirmed as the
// actual cause on 11 of the 13 failing pages by measuring the real built
// artifact with a real browser driver (reverting this fix locally brought
// those 11 pages' failures straight back).
test("core/shell/shell.css: the top bar can shrink/collapse instead of overflowing at a narrow viewport", () => {
  const shellCss = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "shell", "shell.css"), "utf8");

  // The title actually gets to shrink (a flex item's default min-width is
  // its own content width, which is exactly why a long title didn't used
  // to budge) and overflows into an ellipsis instead of pushing the
  // toggles off-screen.
  const titleRule = /\.ex-title\s*\{[^}]*\}/.exec(shellCss);
  assert.ok(titleRule, ".ex-title rule not found");
  assert.match(titleRule[0], /min-width:\s*0/, ".ex-title must set min-width: 0 to actually be allowed to shrink");
  assert.match(titleRule[0], /text-overflow:\s*ellipsis/, ".ex-title must truncate with an ellipsis once it can't fit");
  assert.match(titleRule[0], /white-space:\s*nowrap/, ".ex-title must not wrap onto a second line in the top bar");

  // The toggle buttons never shrink below their own tap-sized width, no
  // matter how little room the title leaves them.
  const toggleRule = /\.ex-pages-toggle,\s*\.ex-theme-toggle\s*\{[^}]*\}/.exec(shellCss);
  assert.ok(toggleRule, ".ex-pages-toggle, .ex-theme-toggle rule not found");
  assert.match(toggleRule[0], /flex-shrink:\s*0/, "the top bar's toggle buttons must never shrink below their own size");

  // The theme toggle collapses to an icon-sized button under 640px, with
  // no markup/JS change — shell.js's own aria-label updates keep working
  // unmodified, and an aria-label already overrides visible text content
  // for the accessible name regardless of how small that text renders.
  const narrowBlock = /@media \(max-width:\s*640px\)\s*\{([\s\S]*?)\n\}/.exec(shellCss);
  assert.ok(narrowBlock, "shell.css must have a @media (max-width: 640px) block for the top bar");
  assert.match(narrowBlock[1], /\.ex-theme-toggle\s*\{[^}]*font-size:\s*0/, "the theme toggle must collapse its text run under 640px");
  assert.match(narrowBlock[1], /\.ex-theme-toggle::before\s*\{[^}]*content:/, "the theme toggle needs an icon glyph to replace the collapsed text");

  // code and .ex-path share the same overflow-wrap rule — a long path/URL
  // wraps the same way a long code token already does.
  const codePathRule = /code,\s*\.ex-path\s*\{[^}]*\}/.exec(shellCss);
  assert.ok(codePathRule, "code, .ex-path shared rule not found");
  assert.match(codePathRule[0], /overflow-wrap:\s*anywhere/, ".ex-path must share code's overflow-wrap: anywhere");
});

test("core/patterns/presenter/presenter.css: the presenter controls wrap, and the badge compresses to its dot, under 640px", () => {
  const presenterCss = fs.readFileSync(
    path.join(REAL_PLUGIN_ROOT, "core", "patterns", "presenter", "presenter.css"),
    "utf8"
  );
  const narrowBlocks = presenterCss.match(/@media \(max-width:\s*640px\)\s*\{[\s\S]*?\n\}/g) || [];
  assert.ok(narrowBlocks.length > 0, "presenter.css must have at least one @media (max-width: 640px) block");
  const narrow = narrowBlocks.join("\n");
  assert.match(narrow, /\.ex-presenter\s*\{[^}]*flex-wrap:\s*wrap/, "presenter controls must wrap under 640px, not force the bar wider");
  assert.match(
    narrow,
    /\.ex-presenter-badge-label\s*\{[^}]*clip-path:\s*inset\(50%\)/,
    "the badge's text label must visually hide under 640px using the standard clip-to-1px technique (compress to its dot, not disappear from the accessibility tree)"
  );

  // The badge's status dot (::before) is unaffected — fixed px, not tied
  // to the label text's own font-size.
  assert.match(presenterCss, /\.ex-presenter-badge::before\s*\{[^}]*width:\s*7px/, "the badge's status dot must stay a fixed size");
});

test("scripts/lib/shell.mjs: PRESENTER_TOPBAR_HTML wraps the badge's text in its own label span", async () => {
  const { PRESENTER_TOPBAR_HTML } = await import("../../explainer/scripts/lib/shell.mjs");
  assert.match(
    PRESENTER_TOPBAR_HTML,
    /<span class="ex-presenter-badge" hidden><span class="ex-presenter-badge-label">Presenting<\/span><\/span>/,
    "the badge's text must be wrapped in its own .ex-presenter-badge-label span for the narrow-viewport compress rule to target"
  );
});

// ------------------- .ex-table/.ex-matrix containment
//
// browser.phone-scroll's new self-diagnosis (lib/browser.mjs) found
// nothing wrong on 8 of the real vcs-port artifact's failing pages — every
// .ex-table/.ex-matrix wrapper, and the table inside it, measured properly
// bounded in isolation, yet document.documentElement.scrollWidth still
// exceeded the viewport. Confirmed directly against the real built
// artifact (not guessed): toggling `contain: layout` on exactly these
// wrappers, with nothing else changed, took all 8 pages' scrollWidth from
// over-budget to exactly 400px — a known category of Chromium quirk where
// an overflow-x:auto wrapper's own internal (deliberately scrollable)
// overflow can still count toward an ancestor's scrollWidth unless the
// wrapper also establishes layout containment. `contain: layout` changes
// no rendering, only containment — visually identical before/after.
//
// This is a CSS-level assertion only: several isolated/reduced fixtures
// (a single instance of the real offending table's exact markup; the same
// table repeated several times on one page; the real page's full content
// stripped of x-* markup; an ~18-page single-shape document sized to
// roughly match the real build) all failed to reproduce the underlying
// browser quirk at a scale smaller than the real artifact (the real built
// document is ~710KB; the largest attempted fixture here was ~66KB) — so
// there is no dynamic browser-driven regression test for this one; the
// empirical confirmation is in this comment and the commit message, not a
// test a CI run can re-verify against a live browser.
test("core/patterns/table/table.css and core/patterns/matrix/matrix.css: the scroll wrapper establishes layout containment", () => {
  const tableCss = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "patterns", "table", "table.css"), "utf8");
  const tableRule = /\.ex-table\s*\{[^}]*\}/.exec(tableCss);
  assert.ok(tableRule, ".ex-table rule not found");
  assert.match(tableRule[0], /overflow-x:\s*auto/, ".ex-table must still be the overflow-x:auto scroll wrapper");
  assert.match(tableRule[0], /contain:\s*layout/, ".ex-table must establish layout containment");

  const matrixCss = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "patterns", "matrix", "matrix.css"), "utf8");
  const matrixRule = /\.ex-matrix\s*\{[^}]*\}/.exec(matrixCss);
  assert.ok(matrixRule, ".ex-matrix rule not found");
  assert.match(matrixRule[0], /overflow-x:\s*auto/, ".ex-matrix must still be the overflow-x:auto scroll wrapper");
  assert.match(matrixRule[0], /contain:\s*layout/, ".ex-matrix must establish layout containment");
});
