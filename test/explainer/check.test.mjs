// Tests for lib/check.mjs. Covers the check
// framework itself (usage errors, report files, exit-code precedence), a
// pass/fail pair for every check id this phase implements, and the three
// fixtures the dispatch names explicitly:
//   - Reference markup fails self.contained (Google Fonts <link>s)
//   - a deliberately stale x-include fails fact.real-fresh
//   - browser.* always reports skipped (no driver wired yet — Phase 3)
//
// Most fixtures here hand-write `contents.json` + `dist/<name>.html`
// directly rather than running a full `build()` first: `check()` only needs
// a *valid* contents.json and an existing dist/ — it never re-derives
// anything from the artifact's pages/ source (that's the whole point of
// checking the built output independently). The one exception is
// fact.real-fresh's stale-include test, which genuinely needs a real
// generator run through lib/build.mjs/lib/generators.mjs to produce an
// authentic data-gen/data-at-stamped "Real" block to go stale.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { build } from "../../explainer/scripts/lib/build.mjs";
import { check, CHECK_IDS, renderCheckReport } from "../../explainer/scripts/lib/check.mjs";
import { detectBrowser, findHeadlessShellExecutable, runBrowserChecks, BROWSER_CHECK_IDS } from "../../explainer/scripts/lib/browser.mjs";
import { PLACEHOLDER_MARKER_TEXT } from "../../explainer/scripts/lib/scaffold.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const BUILD_PLUGIN_ROOT = path.join(FIXTURES, "build", "plugin-root");
const HOUSE_STYLE_PLUGIN_ROOT = path.join(FIXTURES, "check", "plugin-root-house-style");
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");

// Every test in this file except the browser-driver section below is about
// something other than browser detection; forcing EXPLAINER_NO_BROWSER keeps
// them deterministic and fast regardless of what's installed on the machine
// running them (a real headless-shell on this dev box would otherwise make
// `check()` actually launch a browser for every single fixture here).
const NO_BROWSER = { env: { EXPLAINER_NO_BROWSER: "1" } };

/** process.env with EXPLAINER_NO_BROWSER removed — for tests that need real detection regardless of the ambient env. */
function envWithoutNoBrowser() {
  const { EXPLAINER_NO_BROWSER, ...rest } = process.env;
  return rest;
}

// ------------------------------------------------------------- fixture helpers

function minimalContents(overrides = {}) {
  return {
    schema: 1,
    title: "Check Fixture",
    kind: "pr-explainer",
    brand: "fixture",
    groups: [],
    pages: [],
    terms: [],
    sources: [],
    ...overrides,
  };
}

const BASE_HEAD_EXTRA = "";

function baseHtml({ title = "Check Fixture", headExtra = BASE_HEAD_EXTRA, bodyExtra = "<p>Hello world.</p>", style = ".ex-shell { color: #000; }", script = "var x = 1;" } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${headExtra}<style>
${style}
</style>
</head>
<body>
<div class="ex-shell">
<header class="ex-topbar"><div class="ex-title">${title}</div></header>
<div class="ex-shell-body">
<nav class="ex-menu" id="ex-menu"></nav>
<main class="ex-main">
<section class="ex-page" id="overview">
<div class="ex-page-body">${bodyExtra}</div>
</section>
</main>
</div>
</div>
<script>
${script}
</script>
</body>
</html>
`;
}

/** Writes `<tmp>/<name>/contents.json` + `<tmp>/<name>/dist/<name>.html` (single shape) and returns the artifact dir. */
function makeArtifact({ name = "fixture-artifact", contents = minimalContents(), distHtml = baseHtml() } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-"));
  const artifactDir = path.join(tmp, name);
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, "contents.json"), JSON.stringify(contents, null, 2));
  fs.mkdirSync(path.join(artifactDir, "dist"), { recursive: true });
  fs.writeFileSync(path.join(artifactDir, "dist", `${name}.html`), distHtml);
  return artifactDir;
}

/** Writes `<tmp>/<name>/contents.json` + a --multi-shape `<tmp>/<name>/dist/<name>/{page.html,site.css,site.js}` and returns the artifact dir. */
function makeMultiArtifact({ name = "fixture-artifact-multi", contents = minimalContents(), pageHtml, siteCss = ".ex-shell { color: #000; }", siteJs = "var x = 1;" } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-"));
  const artifactDir = path.join(tmp, name);
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, "contents.json"), JSON.stringify(contents, null, 2));
  const pageDir = path.join(artifactDir, "dist", name);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(
    path.join(pageDir, "overview.html"),
    pageHtml ??
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Check Fixture</title>
<link rel="stylesheet" href="site.css" />
</head>
<body>
<div class="ex-shell">
<header class="ex-topbar"><div class="ex-title">Check Fixture</div></header>
<div class="ex-shell-body">
<nav class="ex-menu" id="ex-menu"></nav>
<main class="ex-main">
<section class="ex-page" id="overview">
<div class="ex-page-body"><p>Hello world.</p></div>
</section>
</main>
</div>
</div>
<script src="site.js" defer></script>
</body>
</html>
`
  );
  fs.writeFileSync(path.join(pageDir, "site.css"), siteCss);
  fs.writeFileSync(path.join(pageDir, "site.js"), siteJs);
  return artifactDir;
}

function cleanup(artifactDir) {
  fs.rmSync(path.dirname(artifactDir), { recursive: true, force: true });
}

function findResult(results, id) {
  const r = results.find((x) => x.id === id);
  assert.ok(r, `no result for check id "${id}"`);
  return r;
}

async function runCheckOn(artifactDir, opts = {}) {
  return check({ dir: artifactDir, repoRoot: artifactDir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER, ...opts });
}

// ---------------------------------------------------------------- framework

test("CHECK_IDS covers every check id (plus brand.tokens) named in the spec", () => {
  const expected = [
    "html.balance",
    "js.syntax",
    "self.contained",
    "title.name",
    "x.leftover",
    "ref.anchor",
    "ref.term",
    "ref.cite",
    "ref.github",
    "ref.info",
    "ui.affordance",
    "fact.real-fresh",
    "fact.illustrative-tag",
    "fact.no-internal-codes",
    "rule.paragraph-length",
    "rule.min-font-size",
    "rule.define-before-use",
    "rule.chart-without-data-table",
    "brand.tokens",
    "wiki.fresh",
    "browser.phone-scroll",
    "browser.svg-overflow",
    "browser.themes",
    "fact.checker",
  ];
  for (const id of expected) assert.ok(CHECK_IDS.includes(id), `missing check id "${id}"`);
});

test("check() reports a usage error (step: dist) when dist/ does not exist", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-"));
  const artifactDir = path.join(tmp, "no-dist");
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, "contents.json"), JSON.stringify(minimalContents()));
  try {
    const result = await check({ dir: artifactDir, repoRoot: artifactDir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.step, "dist");
    assert.match(result.errors[0], /run `explainer\.mjs build` first/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("check() reports a usage error (step: load) on an invalid contents.json", async () => {
  const result = await check({
    dir: path.join(FIXTURES, "invalid-contents"),
    repoRoot: path.join(FIXTURES, "invalid-contents"),
    pluginRoot: REAL_PLUGIN_ROOT,
  });
  assert.equal(result.ok, false);
  assert.equal(result.step, "load");
  assert.ok(result.errors.length > 0);
});

test("check() on a clean minimal artifact: every id reports, report files are written, exit code reflects pending fact.checker", async () => {
  const artifactDir = makeArtifact();
  try {
    const result = await runCheckOn(artifactDir);
    assert.equal(result.ok, true);
    assert.equal(result.shape, "single");
    assert.equal(result.results.length, CHECK_IDS.length);

    for (const id of ["html.balance", "js.syntax", "self.contained", "title.name", "x.leftover", "ref.anchor", "ref.cite", "fact.illustrative-tag"]) {
      assert.equal(findResult(result.results, id).status, "passed", id);
    }
    assert.equal(findResult(result.results, "fact.no-internal-codes").status, "skipped");
    // brand.tokens now runs for real (lib/brand.mjs is a real
    // sibling module): BUILD_PLUGIN_ROOT's fixture.css defines every token in
    // its own fixture tokens.json, so a clean minimal artifact passes.
    assert.equal(findResult(result.results, "brand.tokens").status, "passed");
    for (const id of ["browser.phone-scroll", "browser.svg-overflow", "browser.themes"]) {
      assert.equal(findResult(result.results, id).status, "skipped");
    }
    assert.equal(findResult(result.results, "fact.checker").status, "pending");

    // Nothing failed, but fact.checker is pending — exit 3 (documented precedence).
    assert.equal(result.exitCode, 3);

    const reportPath = path.join(artifactDir, "dist", "check-report.md");
    const jsonPath = path.join(artifactDir, "dist", "check.json");
    assert.ok(fs.existsSync(reportPath));
    assert.ok(fs.existsSync(jsonPath));
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.equal(parsed.results.length, CHECK_IDS.length);
    const reportMd = fs.readFileSync(reportPath, "utf8");
    assert.match(reportMd, /# Check report/);
    assert.match(reportMd, /fact\.checker/);
  } finally {
    cleanup(artifactDir);
  }
});

test("exit-code precedence: a failed check wins over a pending fact.checker", async () => {
  const artifactDir = makeArtifact({ distHtml: baseHtml({ title: "Only One" }) }); // 2 words — actually passes; force a real failure below
  try {
    // Overwrite with a genuinely unbalanced file (html.balance fails) while
    // fact.checker is still pending (no dist/fact-check.json) — failed must win.
    fs.writeFileSync(path.join(artifactDir, "dist", "fixture-artifact.html"), baseHtml().replace("</header>", ""));
    const result = await runCheckOn(artifactDir);
    assert.equal(findResult(result.results, "html.balance").status, "failed");
    assert.equal(findResult(result.results, "fact.checker").status, "pending");
    assert.equal(result.exitCode, 1);
  } finally {
    cleanup(artifactDir);
  }
});

test("exit code is 0 when nothing fails and fact-check.json is already present and clean", async () => {
  const artifactDir = makeArtifact();
  try {
    fs.writeFileSync(path.join(artifactDir, "dist", "fact-check.json"), JSON.stringify([{ page: "overview", claim: "x", status: "supported" }]));
    const result = await runCheckOn(artifactDir);
    assert.equal(findResult(result.results, "fact.checker").status, "passed");
    assert.equal(result.exitCode, 0);
  } finally {
    cleanup(artifactDir);
  }
});

// ------------------------------------------------------------- html.balance

test("html.balance: passes on a well-formed dist file, fails with file context on an unclosed tag", async () => {
  const good = makeArtifact();
  const bad = makeArtifact({ distHtml: baseHtml().replace("</header>", "") });
  try {
    assert.equal(findResult((await runCheckOn(good)).results, "html.balance").status, "passed");
    const badResult = findResult((await runCheckOn(bad)).results, "html.balance");
    assert.equal(badResult.status, "failed");
    assert.match(badResult.messages[0].text, /header.*opened here.*but found/s);
  } finally {
    cleanup(good);
    cleanup(bad);
  }
});

// ------------------------------------------------------------------ js.syntax

test("js.syntax: passes on valid inline JS, fails on a syntax error, checked via a real node --check", async () => {
  const good = makeArtifact();
  const bad = makeArtifact({ distHtml: baseHtml({ script: "var x = ;" }) });
  try {
    assert.equal(findResult((await runCheckOn(good)).results, "js.syntax").status, "passed");
    const badResult = findResult((await runCheckOn(bad)).results, "js.syntax");
    assert.equal(badResult.status, "failed");
    assert.match(badResult.messages[0].text, /node --check/);
  } finally {
    cleanup(good);
    cleanup(bad);
  }
});

// --------------------------------------------------------------- self.contained

test("self.contained: the reference page's Google Fonts <link>s fail the check", async () => {
  // Lifted verbatim from an earlier reference artifact's
  // <head> (per the dispatch:
  // — this is the "reference fixture fails self.contained" case).
  const googleFontsHead =
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,700;8..60,800&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">\n';
  const artifactDir = makeArtifact({ distHtml: baseHtml({ headExtra: googleFontsHead }) });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "self.contained");
    assert.equal(result.status, "failed");
    assert.equal(result.messages.length, 3);
    assert.ok(result.messages.every((m) => m.severity === "error"));
    assert.ok(result.messages.some((m) => m.text.includes("fonts.googleapis.com")));
    assert.ok(result.messages.some((m) => m.text.includes("fonts.gstatic.com")));
  } finally {
    cleanup(artifactDir);
  }
});

test("self.contained: passes on a self-contained dist file, and flags an external script src / img src / CSS url() too", async () => {
  const good = makeArtifact();
  const bad = makeArtifact({
    distHtml: baseHtml({
      bodyExtra: '<img src="https://example.com/x.png" alt="x" />',
      script: "var x = 1;",
    }).replace("<script>", '<script src="https://example.com/evil.js"></script>\n<script>'),
  });
  try {
    assert.equal(findResult((await runCheckOn(good)).results, "self.contained").status, "passed");
    const badResult = findResult((await runCheckOn(bad)).results, "self.contained");
    assert.equal(badResult.status, "failed");
    assert.ok(badResult.messages.some((m) => m.text.includes("example.com/x.png")));
    assert.ok(badResult.messages.some((m) => m.text.includes("example.com/evil.js")));
  } finally {
    cleanup(good);
    cleanup(bad);
  }
});

// ------------------------------------------------------------------- title.name

test("title.name: 2-4 words passes; 1 word or 5+ words fails", async () => {
  const ok = makeArtifact({ distHtml: baseHtml({ title: "Check Fixture" }) });
  const tooShort = makeArtifact({ distHtml: baseHtml({ title: "Fixture" }) });
  const tooLong = makeArtifact({ distHtml: baseHtml({ title: "Way Too Many Words Here" }) });
  try {
    assert.equal(findResult((await runCheckOn(ok)).results, "title.name").status, "passed");
    assert.equal(findResult((await runCheckOn(tooShort)).results, "title.name").status, "failed");
    assert.equal(findResult((await runCheckOn(tooLong)).results, "title.name").status, "failed");
  } finally {
    cleanup(ok);
    cleanup(tooShort);
    cleanup(tooLong);
  }
});

// ------------------------------------------------------------ title.placeholder

test("title.placeholder: a contents.json title left equal to the profile's skeleton title fails", async () => {
  // REAL_PLUGIN_ROOT so there is a genuine core/profiles/pr-explainer/skeleton.contents.json
  // to compare against — "New PR Explainer" is that skeleton's own placeholder title.
  const artifactDir = makeArtifact({
    contents: minimalContents({ title: "New PR Explainer" }),
    distHtml: baseHtml({ title: "New PR Explainer" }),
  });
  try {
    const result = findResult((await check({ dir: artifactDir, repoRoot: artifactDir, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results, "title.placeholder");
    assert.equal(result.status, "failed");
    assert.match(result.messages[0].text, /placeholder/);
  } finally {
    cleanup(artifactDir);
  }
});

test("title.placeholder: a real, custom title passes", async () => {
  const artifactDir = makeArtifact({
    contents: minimalContents({ title: "Check Fixture" }),
    distHtml: baseHtml({ title: "Check Fixture" }),
  });
  try {
    const result = findResult((await check({ dir: artifactDir, repoRoot: artifactDir, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results, "title.placeholder");
    assert.equal(result.status, "passed");
  } finally {
    cleanup(artifactDir);
  }
});

test("title.placeholder: a kind with no matching profile skeleton doesn't crash, just passes", async () => {
  const artifactDir = makeArtifact({
    contents: minimalContents({ kind: "no-such-profile" }),
  });
  try {
    const result = findResult((await check({ dir: artifactDir, repoRoot: artifactDir, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results, "title.placeholder");
    assert.equal(result.status, "passed");
  } finally {
    cleanup(artifactDir);
  }
});

// -------------------------------------------------------------------- x.leftover

test("x.leftover: a leftover unexpanded x-* element fails the build's own artifact", async () => {
  const artifactDir = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<x-term k="port">port</x-term>' }) });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "x.leftover");
    assert.equal(result.status, "failed");
    assert.match(result.messages[0].text, /x-term/);
  } finally {
    cleanup(artifactDir);
  }
});

test("x.leftover: a JS string that merely looks like an x-* tag (shell.js-style) is not a false positive", async () => {
  const artifactDir = makeArtifact({ distHtml: baseHtml({ script: 'var s = "<x-term k=\\"port\\">";' }) });
  try {
    assert.equal(findResult((await runCheckOn(artifactDir)).results, "x.leftover").status, "passed");
  } finally {
    cleanup(artifactDir);
  }
});

// a page still in contents.pages[] whose `new`-scaffolded
// placeholder was never replaced must never publish — flagged under
// x.leftover (sharing the "leftover scaffolding" check id), never silently
// passed.
test("x.leftover: a built page still containing the `new` placeholder TODO marker fails as an unreplaced placeholder", async () => {
  const artifactDir = makeArtifact({
    distHtml: baseHtml({ bodyExtra: `<p><strong>${PLACEHOLDER_MARKER_TEXT}</strong> Replace this with real content.</p>` }),
  });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "x.leftover");
    assert.equal(result.status, "failed");
    assert.ok(result.messages.some((m) => m.text.includes("unreplaced placeholder page")));
  } finally {
    cleanup(artifactDir);
  }
});

test("x.leftover: a page with no placeholder marker and no leftover x-* passes clean", async () => {
  const artifactDir = makeArtifact({ distHtml: baseHtml({ bodyExtra: "<p>Real, reviewed content.</p>" }) });
  try {
    assert.equal(findResult((await runCheckOn(artifactDir)).results, "x.leftover").status, "passed");
  } finally {
    cleanup(artifactDir);
  }
});

// -------------------------------------------------------------------- ref.anchor

test("ref.anchor: a #id that resolves passes; one that doesn't fails", async () => {
  const ok = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a href="#overview">self</a>' }) });
  const broken = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a href="#does-not-exist">broken</a>' }) });
  try {
    assert.equal(findResult((await runCheckOn(ok)).results, "ref.anchor").status, "passed");
    const result = findResult((await runCheckOn(broken)).results, "ref.anchor");
    assert.equal(result.status, "failed");
    assert.match(result.messages[0].text, /#does-not-exist/);
  } finally {
    cleanup(ok);
    cleanup(broken);
  }
});

test('ref.anchor: an "#info=<key>" (or "#page/info=<key>") deep link is never flagged — that shape is never a DOM id (ref.info validates its key instead)', async () => {
  const bare = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a href="#info=order-service-def">open it</a>' }) });
  const pageQualified = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a href="#architecture/info=order-service-def">open it</a>' }) });
  try {
    assert.equal(findResult((await runCheckOn(bare)).results, "ref.anchor").status, "passed");
    assert.equal(findResult((await runCheckOn(pageQualified)).results, "ref.anchor").status, "passed");
  } finally {
    cleanup(bare);
    cleanup(pageQualified);
  }
});

test("ref.anchor: a JS string href (shell.js's own term-popover markup) is not a false positive", async () => {
  const artifactDir = makeArtifact({ distHtml: baseHtml({ script: 'var html = \'<a href="#terms--\' + key + \'">more</a>\';' }) });
  try {
    assert.equal(findResult((await runCheckOn(artifactDir)).results, "ref.anchor").status, "passed");
  } finally {
    cleanup(artifactDir);
  }
});

test("ref.anchor: a hand-written <a href> with no visible text fails (the x-page self-close defect)", async () => {
  const empty = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a class="ex-page" href="#overview"></a>' }) });
  const whitespaceOnly = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a class="ex-page" href="#overview">   </a>' }) });
  const emptyChild = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a class="ex-page" href="#overview"><span></span></a>' }) });
  const ok = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a class="ex-page" href="#overview">Overview</a>' }) });
  try {
    const emptyResult = findResult((await runCheckOn(empty)).results, "ref.anchor");
    assert.equal(emptyResult.status, "failed");
    assert.match(emptyResult.messages.map((m) => m.text).join("\n"), /empty link: <a href> has no visible text/);

    assert.equal(findResult((await runCheckOn(whitespaceOnly)).results, "ref.anchor").status, "failed");
    assert.equal(findResult((await runCheckOn(emptyChild)).results, "ref.anchor").status, "failed");
    assert.equal(findResult((await runCheckOn(ok)).results, "ref.anchor").status, "passed");
  } finally {
    cleanup(empty);
    cleanup(whitespaceOnly);
    cleanup(emptyChild);
    cleanup(ok);
  }
});

// ---------------------------------------------------------------------- ref.term

test("ref.term: an undefined data-term is an error; a declared-but-unused term is a warning", async () => {
  const contents = minimalContents({
    terms: [
      { key: "port", term: "Port", def: "<b>Port</b>: one sentence." },
      { key: "adapter", term: "Adapter", def: "<b>Adapter</b>: one sentence." },
    ],
  });
  const distHtml = baseHtml({ bodyExtra: '<a class="ex-term" data-term="port">port</a> <a class="ex-term" data-term="ghost">ghost</a>' });
  const artifactDir = makeArtifact({ contents, distHtml });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "ref.term");
    assert.equal(result.status, "failed"); // the undefined "ghost" term is an error
    assert.ok(result.messages.some((m) => m.severity === "error" && m.text.includes('"ghost"')));
    assert.ok(result.messages.some((m) => m.severity === "warning" && m.text.includes('"adapter"')));
  } finally {
    cleanup(artifactDir);
  }
});

// ---------------------------------------------------------------------- ref.cite

test("ref.cite: a citation with a matching Sources entry passes; one without fails", async () => {
  const ok = makeArtifact({
    distHtml: baseHtml({ bodyExtra: '<a class="ex-cite" href="https://example.com">[1]</a> <ol class="ex-sources"><li id="sources--1" value="1">x</li></ol>' }),
  });
  const broken = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a class="ex-cite" href="https://example.com">[1]</a>' }) });
  try {
    assert.equal(findResult((await runCheckOn(ok)).results, "ref.cite").status, "passed");
    const result = findResult((await runCheckOn(broken)).results, "ref.cite");
    assert.equal(result.status, "failed");
    assert.match(result.messages[0].text, /\[1\]/);
  } finally {
    cleanup(ok);
    cleanup(broken);
  }
});

// -------------------------------------------------------------------- ref.github

function createRefGithubRepo({ withOriginRemote } = {}) {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-git-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t.com" };
  const git = (...args) => execFileSync("git", args, { cwd: repoDir, encoding: "utf8", env });
  git("init", "-q", "-b", "poc/vcs-port");
  fs.writeFileSync(path.join(repoDir, "README.md"), "x\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  let bareDir;
  if (withOriginRemote) {
    bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-bare-"));
    execFileSync("git", ["init", "-q", "--bare"], { cwd: bareDir });
    git("remote", "add", "origin", bareDir);
    git("push", "-q", "origin", "poc/vcs-port");
  }
  return { dir: repoDir, bareDir };
}

test("ref.github: a missing x-file target is a warning when its ref isn't pushed, an error once it is", async () => {
  const contents = minimalContents({ repo: { github: "example-org/example-repo", ref: "poc/vcs-port" } });
  const distHtml = baseHtml({
    bodyExtra: '<a class="ex-path" target="_blank" rel="noopener" href="https://github.com/example-org/example-repo/blob/poc/vcs-port/does/not/exist.py#L1">does/not/exist.py</a>',
  });
  const artifactDir = makeArtifact({ contents, distHtml });
  const repoNoOrigin = createRefGithubRepo();
  const repoWithOrigin = createRefGithubRepo({ withOriginRemote: true });
  try {
    const warnResult = findResult((await runCheckOn(artifactDir, { repoRoot: repoNoOrigin.dir })).results, "ref.github");
    assert.equal(warnResult.status, "passed"); // a warning never fails the check
    assert.equal(warnResult.messages[0].severity, "warning");

    const errResult = findResult((await runCheckOn(artifactDir, { repoRoot: repoWithOrigin.dir })).results, "ref.github");
    assert.equal(errResult.status, "failed");
    assert.equal(errResult.messages[0].severity, "error");
  } finally {
    cleanup(artifactDir);
    fs.rmSync(repoNoOrigin.dir, { recursive: true, force: true });
    fs.rmSync(repoWithOrigin.dir, { recursive: true, force: true });
    if (repoWithOrigin.bareDir) fs.rmSync(repoWithOrigin.bareDir, { recursive: true, force: true });
  }
});

// a local branch behind origin must not report a
// file that genuinely exists on origin as missing — the GitHub link this
// check verifies (lib/cites.mjs's githubBlobUrl) always points at origin's
// copy of `ref`, never whatever the local branch of the same name happens
// to be. Builds a repo where the local `poc/vcs-port` branch is one commit
// *behind* `refs/remotes/origin/poc/vcs-port` (pushed, then the local
// branch reset back) — the target file exists only on the commit origin
// has, not the stale local tip.
function createRefGithubRepoWithStaleLocal() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-git-stale-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t.com" };
  const git = (...args) => execFileSync("git", args, { cwd: repoDir, encoding: "utf8", env });
  git("init", "-q", "-b", "poc/vcs-port");
  fs.writeFileSync(path.join(repoDir, "README.md"), "x\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");

  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-bare-stale-"));
  execFileSync("git", ["init", "-q", "--bare"], { cwd: bareDir });
  git("remote", "add", "origin", bareDir);
  git("push", "-q", "origin", "poc/vcs-port");

  const filePath = "docs/real-file.py";
  fs.mkdirSync(path.join(repoDir, "docs"), { recursive: true });
  fs.writeFileSync(path.join(repoDir, filePath), "# real\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add the real file");
  git("push", "-q", "origin", "poc/vcs-port");
  // Local branch now goes back one commit — origin (and this repo's own
  // refs/remotes/origin/poc/vcs-port, updated by the push above) still has
  // the file; the local poc/vcs-port tip no longer does.
  git("reset", "-q", "--hard", "HEAD~1");

  return { dir: repoDir, bareDir, filePath };
}

test("ref.github: a file that exists on origin but not on a stale local branch of the same name passes (checks origin/<ref>, not the local ref)", async () => {
  const repo = createRefGithubRepoWithStaleLocal();
  const contents = minimalContents({ repo: { github: "example-org/example-repo", ref: "poc/vcs-port" } });
  const distHtml = baseHtml({
    bodyExtra: `<a class="ex-path" target="_blank" rel="noopener" href="https://github.com/example-org/example-repo/blob/poc/vcs-port/${repo.filePath}">${repo.filePath}</a>`,
  });
  const artifactDir = makeArtifact({ contents, distHtml });
  try {
    const result = findResult((await runCheckOn(artifactDir, { repoRoot: repo.dir })).results, "ref.github");
    assert.equal(result.status, "passed", JSON.stringify(result.messages));
    assert.equal(result.messages.length, 0);
  } finally {
    cleanup(artifactDir);
    fs.rmSync(repo.dir, { recursive: true, force: true });
    fs.rmSync(repo.bareDir, { recursive: true, force: true });
  }
});

test("ref.github: a diff source's Sources-page entry (range, no href) never trips the check", async () => {
  const contents = minimalContents({ repo: { github: "example-org/example-repo", ref: "poc/vcs-port" } });
  const distHtml = baseHtml({
    bodyExtra:
      '<ol class="ex-sources"><li id="sources--1" value="1">Diff <code>origin/master...HEAD</code>' +
      '<ul><li><a class="ex-path" target="_blank" rel="noopener" href="https://github.com/example-org/example-repo/blob/poc/vcs-port/README.md">README.md</a></li></ul>' +
      "</li></ol>",
  });
  const artifactDir = makeArtifact({ contents, distHtml });
  const repo = createRefGithubRepo({ withOriginRemote: true });
  try {
    const result = findResult((await runCheckOn(artifactDir, { repoRoot: repo.dir })).results, "ref.github");
    // README.md exists in the fixture repo (createRefGithubRepo writes it), so
    // the one real ex-path target resolves; the diff range itself produced no
    // ex-path href at all, so there is nothing else for this check to see.
    assert.equal(result.status, "passed", JSON.stringify(result.messages));
    assert.equal(result.messages.length, 0);
  } finally {
    cleanup(artifactDir);
    fs.rmSync(repo.dir, { recursive: true, force: true });
    if (repo.bareDir) fs.rmSync(repo.bareDir, { recursive: true, force: true });
  }
});

test("ref.github: no git repo available reports skipped, not a crash", async () => {
  const contents = minimalContents({ repo: { github: "example-org/example-repo", ref: "poc/vcs-port" } });
  const distHtml = baseHtml({
    bodyExtra: '<a class="ex-path" href="https://github.com/example-org/example-repo/blob/poc/vcs-port/does/not/exist.py">does/not/exist.py</a>',
  });
  const artifactDir = makeArtifact({ contents, distHtml });
  try {
    const result = await check({ dir: artifactDir, repoRoot: undefined, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    assert.equal(findResult(result.results, "ref.github").status, "skipped");
  } finally {
    cleanup(artifactDir);
  }
});

// --------------------------------------------------------------------- ref.info
// Fixtures hand-write the exact markup lib/info.mjs's renderInfoEntry and
// lib/includes.mjs's handleInfoTrigger/checkDataInfo produce (
// phase 1) rather than running a full build — same "check() only needs a
// valid contents.json and an existing dist/" stance the rest of this file
// already takes.

function infoEntry({ key, domId, mode = "panel", title, body = "<p>Detail.</p>" }) {
  const titleHtml = title ? `<div class="ex-info-entry-title">${title}</div>` : "";
  return `<div class="ex-info-entry" id="${domId}" data-info-key="${key}" data-info-mode="${mode}" data-info-scope="page">${titleHtml}<div class="ex-info-entry-body">${body}</div></div>`;
}

test("ref.info: a trigger whose data-info-target resolves passes; one that doesn't is an error (stale dist)", async () => {
  const entry = infoEntry({ key: "adapter", domId: "info--overview--adapter", title: "Adapter" });
  const ok = makeArtifact({
    distHtml: baseHtml({ bodyExtra: `<a class="ex-info-trigger" data-info="adapter" data-info-target="info--overview--adapter" href="#info--overview--adapter">adapter</a>${entry}` }),
  });
  const broken = makeArtifact({
    distHtml: baseHtml({ bodyExtra: `<a class="ex-info-trigger" data-info="adapter" data-info-target="info--overview--ghost" href="#info--overview--ghost">adapter</a>${entry}` }),
  });
  try {
    assert.equal(findResult((await runCheckOn(ok)).results, "ref.info").status, "passed");
    const result = findResult((await runCheckOn(broken)).results, "ref.info");
    assert.equal(result.status, "failed");
    assert.ok(result.messages.some((m) => m.severity === "error" && /does not resolve to any element/.test(m.text)));
  } finally {
    cleanup(ok);
    cleanup(broken);
  }
});

test("ref.info: an info entry no trigger opens is a warning (unused)", async () => {
  const entry = infoEntry({ key: "orphan", domId: "info--overview--orphan", title: "Orphan" });
  const artifactDir = makeArtifact({ distHtml: baseHtml({ bodyExtra: entry }) });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "ref.info");
    assert.equal(result.status, "passed"); // a warning never fails the check
    assert.ok(result.messages.some((m) => m.severity === "warning" && /"orphan"/.test(m.text) && /unused/.test(m.text)));
  } finally {
    cleanup(artifactDir);
  }
});

test("ref.info: a panel-mode entry with no title is an error; one with a title passes", async () => {
  const untitled = infoEntry({ key: "adapter", domId: "info--overview--adapter", mode: "panel" });
  const titled = infoEntry({ key: "adapter", domId: "info--overview--adapter", mode: "panel", title: "Adapter" });
  const trigger = `<a class="ex-info-trigger" data-info="adapter" data-info-target="info--overview--adapter" href="#info--overview--adapter">adapter</a>`;
  const bad = makeArtifact({ distHtml: baseHtml({ bodyExtra: trigger + untitled }) });
  const good = makeArtifact({ distHtml: baseHtml({ bodyExtra: trigger + titled }) });
  try {
    const result = findResult((await runCheckOn(bad)).results, "ref.info");
    assert.equal(result.status, "failed");
    assert.ok(result.messages.some((m) => m.severity === "error" && /mode="panel"\) has no title/.test(m.text)));
    assert.equal(findResult((await runCheckOn(good)).results, "ref.info").status, "passed");
  } finally {
    cleanup(bad);
    cleanup(good);
  }
});

test("ref.info: a trigger with no accessible name is an error — an SVG node with no text/aria-label/title, and a bare a.ex-term", async () => {
  const entry = infoEntry({ key: "dispatcher", domId: "info--overview--dispatcher", title: "Dispatcher" });
  const noName = makeArtifact({
    distHtml: baseHtml({
      bodyExtra: `<svg><g class="ex-node" data-info="dispatcher" data-info-target="info--overview--dispatcher"><rect></rect></g></svg>${entry}`,
    }),
  });
  const named = makeArtifact({
    distHtml: baseHtml({
      bodyExtra: `<svg><g class="ex-node" data-info="dispatcher" data-info-target="info--overview--dispatcher" aria-label="core.py dispatcher"><rect></rect></g></svg>${entry}`,
    }),
  });
  const bareTerm = makeArtifact({
    contents: minimalContents({ terms: [{ key: "port", term: "Port", def: "<b>Port</b>." }] }),
    distHtml: baseHtml({ bodyExtra: '<a class="ex-term" data-term="port"></a>' }),
  });
  try {
    const noNameResult = findResult((await runCheckOn(noName)).results, "ref.info");
    assert.equal(noNameResult.status, "failed");
    assert.ok(noNameResult.messages.some((m) => m.severity === "error" && /no accessible name/.test(m.text)));
    assert.equal(findResult((await runCheckOn(named)).results, "ref.info").status, "passed");

    const bareTermResult = findResult((await runCheckOn(bareTerm)).results, "ref.info");
    assert.equal(bareTermResult.status, "failed");
    assert.ok(bareTermResult.messages.some((m) => m.severity === "error" && /no accessible name/.test(m.text)));
  } finally {
    cleanup(noName);
    cleanup(named);
    cleanup(bareTerm);
  }
});

test("ref.info: a #info=<key> deep link resolves against a declared term key or an info entry key; one that resolves nowhere is an error", async () => {
  const entry = infoEntry({ key: "adapter", domId: "info--overview--adapter", title: "Adapter" });
  const trigger = `<a class="ex-info-trigger" data-info="adapter" data-info-target="info--overview--adapter" href="#info--overview--adapter">adapter</a>`;
  const toEntry = makeArtifact({ distHtml: baseHtml({ bodyExtra: `<a href="#info=adapter">link</a>${trigger}${entry}` }) });
  const toTerm = makeArtifact({
    contents: minimalContents({ terms: [{ key: "port", term: "Port", def: "<b>Port</b>." }] }),
    distHtml: baseHtml({ bodyExtra: '<a href="#info=port">link</a>' }),
  });
  const broken = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<a href="#info=ghost">link</a>' }) });
  try {
    assert.equal(findResult((await runCheckOn(toEntry)).results, "ref.info").status, "passed");
    assert.equal(findResult((await runCheckOn(toTerm)).results, "ref.info").status, "passed");
    const result = findResult((await runCheckOn(broken)).results, "ref.info");
    assert.equal(result.status, "failed");
    assert.ok(result.messages.some((m) => m.severity === "error" && /deep link/.test(m.text) && /#info=ghost/.test(m.text)));
  } finally {
    cleanup(toEntry);
    cleanup(toTerm);
    cleanup(broken);
  }
});

test("ref.info: info-caption-matches-triggers — a diagram caption saying \"click\" with zero triggers warns; a trigger present passes clean", async () => {
  const noTrigger = makeArtifact({
    distHtml: baseHtml({ bodyExtra: '<div class="ex-diagram"><svg><g class="ex-node"><rect></rect></g></svg></div><p>Click the dispatcher box above for detail.</p>' }),
  });
  const withTrigger = makeArtifact({
    distHtml: baseHtml({
      bodyExtra:
        '<div class="ex-diagram"><svg><g class="ex-node" data-info="dispatcher" data-info-target="info--overview--dispatcher" aria-label="dispatcher"><rect></rect></g></svg></div><p>Click the dispatcher box above for detail.</p>' +
        infoEntry({ key: "dispatcher", domId: "info--overview--dispatcher", title: "Dispatcher" }),
    }),
  });
  const noMention = makeArtifact({
    distHtml: baseHtml({ bodyExtra: '<div class="ex-diagram"><svg><g class="ex-node"><rect></rect></g></svg></div><p>The dispatcher routes every call.</p>' }),
  });
  try {
    const result = findResult((await runCheckOn(noTrigger)).results, "ref.info");
    assert.equal(result.status, "passed"); // a warning never fails the check
    assert.ok(result.messages.some((m) => m.severity === "warning" && /info-caption-matches-triggers/.test(m.text)));
    assert.equal(findResult((await runCheckOn(withTrigger)).results, "ref.info").messages.length, 0);
    assert.equal(findResult((await runCheckOn(noMention)).results, "ref.info").messages.length, 0);
  } finally {
    cleanup(noTrigger);
    cleanup(withTrigger);
    cleanup(noMention);
  }
});

// --------------------------------------------------------------- fact.real-fresh

test("fact.real-fresh: a deliberately stale x-include fails — the real build + generators.mjs path, not a hand-written fixture", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-stale-"));
  try {
    const dataPath = path.join(dir, "data.json");
    fs.writeFileSync(dataPath, JSON.stringify({ whoami: "open_pr" }));
    const scriptPath = path.join(dir, "gen.mjs");
    fs.writeFileSync(
      scriptPath,
      `import fs from "node:fs";\nconsole.log(fs.readFileSync(${JSON.stringify(dataPath)}, "utf8"));\n`
    );
    const cmd = `node ${scriptPath}`;

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Stale Include",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        generators: { scenario: { cmd, cwd: "." } },
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), '<x-include g="scenario" at="whoami" as="json"/>');

    // Approve, then build once — dist now has a correctly-fresh "Real" block for whoami="open_pr".
    const { computeFingerprint, recordApproval, resolveGeneratorCwd } = await import("../../explainer/scripts/lib/approvals.mjs");
    const cwd = resolveGeneratorCwd({ cwd: ".", repoRoot: dir, artifactDir: dir });
    const fingerprint = computeFingerprint({ cmd, cwd });
    recordApproval({ artifactDir: dir, id: "scenario", cmd, cwd, fingerprint });

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const freshResult = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    assert.equal(findResult(freshResult.results, "fact.real-fresh").status, "passed");

    // Now the underlying data drifts (the reference site's "scenario-e" story: the
    // generator's real source now disagrees with what's committed) without
    // rebuilding — the stale dist still says "open_pr".
    fs.writeFileSync(dataPath, JSON.stringify({ whoami: "whoami" }));

    const staleResult = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    const r = findResult(staleResult.results, "fact.real-fresh");
    assert.equal(r.status, "failed");
    assert.match(r.messages[0].text, /stale/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("fact.real-fresh: covers x-include as=\"data\" (script.ex-data[data-gen]) too, not only Real code blocks", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-stale-data-"));
  try {
    const dataPath = path.join(dir, "data.json");
    fs.writeFileSync(dataPath, JSON.stringify({ files: ["a.txt", "b.txt"], counts: { total: 2 } }));
    const scriptPath = path.join(dir, "gen.mjs");
    fs.writeFileSync(
      scriptPath,
      `import fs from "node:fs";\nconsole.log(fs.readFileSync(${JSON.stringify(dataPath)}, "utf8"));\n`
    );
    const cmd = `node ${scriptPath}`;

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Stale Data Include",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        generators: { manifest: { cmd, cwd: "." } },
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    // Two pages: `at` omitted (the common "whole output" case, e.g. a
    // file-map manifest) and `at` given explicitly — covers both the bare
    // boolean `data-at` and quoted `data-at="..."` shapes.
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), '<x-include g="manifest" as="data"/>');
    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Stale Data Include",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [
          { id: "overview", title: "Overview", group: "start", type: "short-answer" },
          { id: "detail", title: "Detail Page", group: "start", type: "short-answer" },
        ],
        terms: [],
        sources: [],
        generators: { manifest: { cmd, cwd: "." } },
      })
    );
    fs.writeFileSync(path.join(dir, "pages", "detail.html"), '<x-include g="manifest" at="counts.total" as="data"/>');

    const { computeFingerprint, recordApproval, resolveGeneratorCwd } = await import("../../explainer/scripts/lib/approvals.mjs");
    const cwd = resolveGeneratorCwd({ cwd: ".", repoRoot: dir, artifactDir: dir });
    const fingerprint = computeFingerprint({ cmd, cwd });
    recordApproval({ artifactDir: dir, id: "manifest", cmd, cwd, fingerprint });

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    // Sanity: the built dist really does carry both script.ex-data[data-gen]
    // shapes, not a Real <code> block (as="json"/"text" would instead). The
    // "overview" page's `at` was omitted, so markup.mjs's serializeAttrs
    // round-trip collapses `data-at=""` to its bare boolean form, `data-at`
    // — exactly the shape lib/check.mjs's dataBlockRe has to match too,
    // alongside "detail"'s quoted `data-at="counts.total"`.
    const distHtml = fs.readFileSync(path.join(dir, "dist", `${path.basename(dir)}.html`), "utf8");
    assert.match(distHtml, /<script type="application\/json" class="ex-data" data-gen="manifest" data-at>/);
    assert.match(distHtml, /<script type="application\/json" class="ex-data" data-gen="manifest" data-at="counts\.total">/);

    const freshResult = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    assert.equal(findResult(freshResult.results, "fact.real-fresh").status, "passed");

    // The data drifts without rebuilding — the committed dist still has the old manifest.
    fs.writeFileSync(dataPath, JSON.stringify({ files: ["a.txt", "b.txt", "c.txt"], counts: { total: 3 } }));

    const staleResult = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    const r = findResult(staleResult.results, "fact.real-fresh");
    assert.equal(r.status, "failed");
    // Both the whole-output block (overview) and the at="counts.total" block
    // (detail) went stale — both must be reported, not just the first found.
    assert.equal(r.messages.length, 2, JSON.stringify(r.messages));
    assert.ok(r.messages.every((msg) => /as="data".*stale/.test(msg.text)));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// as="text" now renders any JSON scalar, not only strings —
// fact.real-fresh's drift comparison (lib/check.mjs's runFactRealFresh) has
// to keep catching staleness for a scalar that isn't a string too, e.g. a
// number like an exit code.
test('fact.real-fresh: a stale x-include as="text" with a number value still fails', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-stale-text-number-"));
  try {
    const dataPath = path.join(dir, "data.json");
    fs.writeFileSync(dataPath, JSON.stringify({ exit_code: 20 }));
    const scriptPath = path.join(dir, "gen.mjs");
    fs.writeFileSync(
      scriptPath,
      `import fs from "node:fs";\nconsole.log(fs.readFileSync(${JSON.stringify(dataPath)}, "utf8"));\n`
    );
    const cmd = `node ${scriptPath}`;

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Stale Numeric Text Include",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        generators: { scenario: { cmd, cwd: "." } },
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), '<x-include g="scenario" at="exit_code" as="text"/>');

    const { computeFingerprint, recordApproval, resolveGeneratorCwd } = await import("../../explainer/scripts/lib/approvals.mjs");
    const cwd = resolveGeneratorCwd({ cwd: ".", repoRoot: dir, artifactDir: dir });
    const fingerprint = computeFingerprint({ cmd, cwd });
    recordApproval({ artifactDir: dir, id: "scenario", cmd, cwd, fingerprint });

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const distHtml = fs.readFileSync(path.join(dir, "dist", `${path.basename(dir)}.html`), "utf8");
    assert.match(distHtml, /<code class="ex-code-lang-text">20<\/code>/);

    const freshResult = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    assert.equal(findResult(freshResult.results, "fact.real-fresh").status, "passed");

    // The underlying number drifts without rebuilding — the stale dist still says 20.
    fs.writeFileSync(dataPath, JSON.stringify({ exit_code: 1 }));

    const staleResult = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    const r = findResult(staleResult.results, "fact.real-fresh");
    assert.equal(r.status, "failed");
    assert.match(r.messages[0].text, /stale/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// html.balance / x.leftover / ref.* must never trip on the raw JSON embedded
// inside a script.ex-data block — loadDistFiles's scanText blanks every
// <script> body (blankScriptsAndStyles), including this one, same as any
// other inline script (own blanking, confirmed here against
// as="data" shape specifically).
test("script.ex-data's embedded JSON never trips html.balance / x.leftover / ref.* scanners", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-data-scan-"));
  try {
    const scriptPath = path.join(dir, "gen.mjs");
    // Deliberately adversarial payload: looks like leftover markup, an
    // unbalanced tag, and a dangling href if it were ever scanned as markup.
    fs.writeFileSync(
      scriptPath,
      `console.log(JSON.stringify({ files: ["<x-term k=\\"port\\">", "<div>", "href=\\"#nope\\""] }));\n`
    );
    const cmd = `node ${scriptPath}`;

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Data Scan Fixture",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        generators: { manifest: { cmd, cwd: "." } },
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), '<x-include g="manifest" as="data"/>');

    const { computeFingerprint, recordApproval, resolveGeneratorCwd } = await import("../../explainer/scripts/lib/approvals.mjs");
    const cwd = resolveGeneratorCwd({ cwd: ".", repoRoot: dir, artifactDir: dir });
    const fingerprint = computeFingerprint({ cmd, cwd });
    recordApproval({ artifactDir: dir, id: "manifest", cmd, cwd, fingerprint });

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const result = await check({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, browser: NO_BROWSER });
    assert.equal(findResult(result.results, "html.balance").status, "passed");
    assert.equal(findResult(result.results, "x.leftover").status, "passed");
    assert.equal(findResult(result.results, "ref.anchor").status, "passed");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("fact.real-fresh: no generators declared passes trivially (nothing to compare)", async () => {
  const artifactDir = makeArtifact();
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "fact.real-fresh");
    assert.equal(result.status, "passed");
    assert.match(result.messages[0].text, /no generators declared/);
  } finally {
    cleanup(artifactDir);
  }
});

// --------------------------------------------------------- fact.illustrative-tag

test("fact.illustrative-tag: an x-example/x-include code block passes; a bare hand-written <pre> fails", async () => {
  const ok = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<pre class="ex-code-pre"><code class="ex-code-lang-ts">x</code></pre>' }) });
  const bad = makeArtifact({ distHtml: baseHtml({ bodyExtra: "<pre><code>hand-written</code></pre>" }) });
  try {
    assert.equal(findResult((await runCheckOn(ok)).results, "fact.illustrative-tag").status, "passed");
    const result = findResult((await runCheckOn(bad)).results, "fact.illustrative-tag");
    assert.equal(result.status, "failed");
    assert.match(result.messages[0].text, /hand-written/);
  } finally {
    cleanup(ok);
    cleanup(bad);
  }
});

// ------------------------------------------------------------ fact.no-internal-codes

test("fact.no-internal-codes: skipped with a reason when rules/house-style.json is absent; fails when a pattern matches", async () => {
  const noHouseStyle = makeArtifact({ distHtml: baseHtml({ bodyExtra: "<p>Mentions TASK-12.5 by accident.</p>" }) });
  const withHouseStyle = makeArtifact({ distHtml: baseHtml({ bodyExtra: "<p>Mentions TASK-12.5 by accident.</p>" }) });
  const clean = makeArtifact({ distHtml: baseHtml({ bodyExtra: "<p>No internal references here.</p>" }) });
  try {
    const skipResult = findResult((await runCheckOn(noHouseStyle)).results, "fact.no-internal-codes");
    assert.equal(skipResult.status, "skipped");
    assert.match(skipResult.messages[0].text, /not shipped by this plugin root/);

    const failResult = findResult(
      (await check({ dir: withHouseStyle, repoRoot: withHouseStyle, pluginRoot: HOUSE_STYLE_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(failResult.status, "failed");
    assert.match(failResult.messages[0].text, /TASK-12\.5/);

    const passResult = findResult((await check({ dir: clean, repoRoot: clean, pluginRoot: HOUSE_STYLE_PLUGIN_ROOT, browser: NO_BROWSER })).results, "fact.no-internal-codes");
    assert.equal(passResult.status, "passed");
  } finally {
    cleanup(noHouseStyle);
    cleanup(withHouseStyle);
    cleanup(clean);
  }
});

// the real, committed core/rules/house-style.json must itself
// carry a "no-internal-codes" rule with a patterns[] list (the dispatch
// note's own acceptance: "fact.no-internal-codes now runs (not skipped)
// against the real core file and flags a planted 'VD12'-style code") —
// exercised here against REAL_PLUGIN_ROOT rather than a fixture, so a future
// edit to the real file that drops or breaks that rule fails this test, not
// just the fixture-backed one above.
test("fact.no-internal-codes: runs for real against the committed core/rules/house-style.json and flags a planted internal code", async () => {
  const leaky = makeArtifact({ distHtml: baseHtml({ bodyExtra: "<p>See decision VD12 for background.</p>" }) });
  const clean = makeArtifact({ name: "fixture-artifact-2", distHtml: baseHtml({ bodyExtra: "<p>No internal references here.</p>" }) });
  try {
    const leakyResult = findResult(
      (await check({ dir: leaky, repoRoot: leaky, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(leakyResult.status, "failed");
    assert.match(leakyResult.messages[0].text, /VD12/);

    const cleanResult = findResult(
      (await check({ dir: clean, repoRoot: clean, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(cleanResult.status, "passed");
  } finally {
    cleanup(leaky);
    cleanup(clean);
  }
});

// `fact.no-internal-codes` must scan the raw
// `<script>`/`<style>` bodies inlined into a single-shape page (scanText
// blanks those for every other check — see blankScriptsAndStyles) and, in
// --multi, the sibling site.css/site.js files those bodies would otherwise
// have been inlined into. Exercised against the real, committed
// core/rules/house-style.json, same as the test above.
test("fact.no-internal-codes: scans inline <script> bodies (single shape), site.js (--multi), and still passes a clean page", async () => {
  const inlineScriptCode = makeArtifact({ name: "fixture-inline-script", distHtml: baseHtml({ script: "/* TASK-1 */\nvar x = 1;" }) });
  const multiSiteJsCode = makeMultiArtifact({ name: "fixture-multi-sitejs", siteJs: "/* TASK-1 */\nvar x = 1;" });
  const cleanSingle = makeArtifact({ name: "fixture-clean-single", distHtml: baseHtml() });
  const cleanMulti = makeMultiArtifact({ name: "fixture-clean-multi" });
  try {
    const inlineResult = findResult(
      (await check({ dir: inlineScriptCode, repoRoot: inlineScriptCode, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(inlineResult.status, "failed");
    assert.match(inlineResult.messages[0].text, /TASK-1\b/);

    const multiResult = findResult(
      (await check({ dir: multiSiteJsCode, repoRoot: multiSiteJsCode, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(multiResult.status, "failed");
    assert.match(multiResult.messages[0].text, /TASK-1\b/);
    assert.match(multiResult.messages[0].file, /site\.js$/);

    const cleanSingleResult = findResult(
      (await check({ dir: cleanSingle, repoRoot: cleanSingle, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(cleanSingleResult.status, "passed");

    const cleanMultiResult = findResult(
      (await check({ dir: cleanMulti, repoRoot: cleanMulti, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "fact.no-internal-codes"
    );
    assert.equal(cleanMultiResult.status, "passed");
  } finally {
    cleanup(inlineScriptCode);
    cleanup(multiSiteJsCode);
    cleanup(cleanSingle);
    cleanup(cleanMulti);
  }
});

// -------------------------------------------------------------------- rule.*

test("rule.paragraph-length: warns past the word limit, and contents.json rules.off can disable it", async () => {
  const longParagraph = `<p>${"word ".repeat(200).trim()}</p>`;
  const warns = makeArtifact({ distHtml: baseHtml({ bodyExtra: longParagraph }) });
  const disabled = makeArtifact({ contents: minimalContents({ rules: { off: ["paragraph-length"], on: [] } }), distHtml: baseHtml({ bodyExtra: longParagraph }) });
  try {
    const result = findResult((await runCheckOn(warns)).results, "rule.paragraph-length");
    assert.equal(result.status, "passed"); // warnings never fail a check
    assert.equal(result.messages[0].severity, "warning");

    const offResult = findResult((await runCheckOn(disabled)).results, "rule.paragraph-length");
    assert.equal(offResult.status, "skipped");
  } finally {
    cleanup(warns);
    cleanup(disabled);
  }
});

// rule.paragraph-length's word limit is a threshold read off
// `rules/house-style.json` (the entry whose `check` is "rule.paragraph-length"),
// falling back to the built-in 150 only when no such entry is found.
// HOUSE_STYLE_PLUGIN_ROOT's fixture lowers it to 5 — short enough that a
// 10-word paragraph (well under the built-in default) now warns, and
// contents.json rules.off still disables the check outright regardless of
// where the threshold came from.
test("rule.paragraph-length: a threshold in rules/house-style.json overrides the built-in default, and rules.off still wins", async () => {
  const shortButOverLimit = `<p>${"word ".repeat(10).trim()}</p>`;
  const warns = makeArtifact({ distHtml: baseHtml({ bodyExtra: shortButOverLimit }) });
  const disabled = makeArtifact({
    name: "fixture-artifact-2",
    contents: minimalContents({ rules: { off: ["paragraph-length"], on: [] } }),
    distHtml: baseHtml({ bodyExtra: shortButOverLimit }),
  });
  try {
    const result = findResult(
      (await check({ dir: warns, repoRoot: warns, pluginRoot: HOUSE_STYLE_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "rule.paragraph-length"
    );
    assert.equal(result.status, "passed"); // warnings never fail a check
    assert.match(result.messages[0].text, /house style limit: 5/);

    const offResult = findResult(
      (await check({ dir: disabled, repoRoot: disabled, pluginRoot: HOUSE_STYLE_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "rule.paragraph-length"
    );
    assert.equal(offResult.status, "skipped");
  } finally {
    cleanup(warns);
    cleanup(disabled);
  }
});

test("rule.min-font-size: warns on a font-size below the house-style minimum", async () => {
  const artifactDir = makeArtifact({ distHtml: baseHtml({ style: ".tiny { font-size: 9px; }" }) });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "rule.min-font-size");
    assert.equal(result.status, "passed");
    assert.match(result.messages[0].text, /9px/);
  } finally {
    cleanup(artifactDir);
  }
});

// same threshold-override contract as paragraph-length, for
// rule.min-font-size's `threshold_px`. HOUSE_STYLE_PLUGIN_ROOT's fixture
// raises it to 20px, so a 15px font — fine against the built-in 12px
// default — now warns, and rules.off still disables the check outright.
test("rule.min-font-size: a threshold_px in rules/house-style.json overrides the built-in default, and rules.off still wins", async () => {
  const warns = makeArtifact({ distHtml: baseHtml({ style: ".callout-tag { font-size: 15px; }" }) });
  const disabled = makeArtifact({
    name: "fixture-artifact-2",
    contents: minimalContents({ rules: { off: ["min-font-size"], on: [] } }),
    distHtml: baseHtml({ style: ".callout-tag { font-size: 15px; }" }),
  });
  try {
    const result = findResult(
      (await check({ dir: warns, repoRoot: warns, pluginRoot: HOUSE_STYLE_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "rule.min-font-size"
    );
    assert.equal(result.status, "passed"); // warnings never fail a check
    assert.match(result.messages[0].text, /15px is below the 20px house-style minimum/);

    const offResult = findResult(
      (await check({ dir: disabled, repoRoot: disabled, pluginRoot: HOUSE_STYLE_PLUGIN_ROOT, browser: NO_BROWSER })).results,
      "rule.min-font-size"
    );
    assert.equal(offResult.status, "skipped");
  } finally {
    cleanup(warns);
    cleanup(disabled);
  }
});

// core/shell/shell.css sets `html { font-size: 125% }` — a `rem`
// value renders against a real 20px root, not a browser's bare 16px
// default. Found via a real end-to-end build: the previous `value * 16`
// math false-positived on perfectly fine type (`.72rem` is 14.4px at the
// real root, not 11.52px).
test("rule.min-font-size: a rem value computes against the real 20px root (html{font-size:125%}), not a bare 16px default", async () => {
  const fine = makeArtifact({ distHtml: baseHtml({ style: ".eyebrow { font-size: .72rem; }" }) }); // 14.4px at 20px root — fine
  const stillTooSmall = makeArtifact({ name: "fixture-artifact-2", distHtml: baseHtml({ style: ".tinier { font-size: .5rem; }" }) }); // 10px at 20px root — still below 12px
  try {
    assert.equal(findResult((await runCheckOn(fine)).results, "rule.min-font-size").messages.length, 0);
    const result = findResult((await runCheckOn(stillTooSmall)).results, "rule.min-font-size");
    assert.equal(result.messages.length, 1);
    assert.match(result.messages[0].text, /\.5rem/);
  } finally {
    cleanup(fine);
    cleanup(stillTooSmall);
  }
});

// core/shell/shell.css's `.ex-t`/`.ex-t-muted` (every core/diagrams/*
// generator's SVG text) declare font-size in SVG user units, not CSS
// viewport pixels — see runRuleMinFontSize's own comment for why this check
// exempts them rather than guessing a render scale. A non-SVG selector at
// the same literal px value must still warn — the exemption is by
// selector, not by value.
test("rule.min-font-size: exempts .ex-t/.ex-t-muted (SVG user units), but a non-SVG selector at the same px still warns", async () => {
  const svgText = makeArtifact({ distHtml: baseHtml({ style: ".ex-t-muted { fill: #000; font-size: 11px; }" }) });
  const domText = makeArtifact({ name: "fixture-artifact-2", distHtml: baseHtml({ style: ".ex-not-svg-text { font-size: 11px; }" }) });
  try {
    assert.equal(findResult((await runCheckOn(svgText)).results, "rule.min-font-size").messages.length, 0);
    const result = findResult((await runCheckOn(domText)).results, "rule.min-font-size");
    assert.equal(result.messages.length, 1);
    assert.match(result.messages[0].text, /11px/);
  } finally {
    cleanup(svgText);
    cleanup(domText);
  }
});

// Integration: the real, committed core/shell/shell.css plus every
// core/patterns/*.css must satisfy their own rule, not just synthetic
// fixtures — this is exactly the check that caught the html{font-size:125%}
// math bug in the first place (follow-up, against a real
// build+check e2e run).
test("rule.min-font-size: the real shell + every pattern's own CSS passes against the real plugin core", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-fontsize-real-"));
  try {
    fs.mkdirSync(path.join(dir, "profiles", "pr-explainer"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Font Size Demo",
        kind: "pr-explainer",
        brand: "neutral",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    // One page touching every pattern that declares a font-size (shell.css
    // itself always ships; callout/table/code/file-map/matrix/etc. only
    // inline when used — exercise them all so their CSS is really in dist/).
    fs.writeFileSync(
      path.join(dir, "pages", "overview.html"),
      [
        '<div class="ex-callout ex-callout--note"><p class="ex-callout-tag">Note</p><p>Body.</p></div>',
        '<div class="ex-table"><table><tr><td>1</td></tr></table></div>',
        '<x-example kind="illustrative" lang="js">const x = 1;</x-example>',
        '<div class="ex-matrix"><table><tr><td>1</td></tr></table></div>',
        '<div class="ex-legend"></div>',
        '<div class="ex-stats"></div>',
        '<div class="ex-steps"></div>',
        '<div class="ex-cards"></div>',
        '<div class="ex-details"></div>',
        '<div class="ex-annotated-json"></div>',
        '<div class="ex-scenario"></div>',
        '<div class="ex-presenter"></div>',
        '<div class="ex-verdict-list"></div>',
        '<div class="ex-ask"></div>',
        '<div class="ex-panel"></div>',
      ].join("\n")
    );
    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const result = await check({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER });
    const fontResult = findResult(result.results, "rule.min-font-size");
    assert.equal(fontResult.messages.length, 0, JSON.stringify(fontResult.messages));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("rule.define-before-use: a term's `see` pointing to a later-declared term warns", async () => {
  const contents = minimalContents({
    terms: [
      { key: "adapter", term: "Adapter", def: "d", see: "port" },
      { key: "port", term: "Port", def: "d" },
    ],
  });
  const artifactDir = makeArtifact({ contents });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "rule.define-before-use");
    assert.equal(result.status, "passed");
    assert.match(result.messages[0].text, /"adapter" sees "port"/);
  } finally {
    cleanup(artifactDir);
  }
});

// Structural (lib/markup.mjs's real node tree), not regex-adjacency — see
// runRuleChartWithoutDataTable's own header comment for the bug this
// replaced (the table core/diagrams/bar's render() nests *inside* the
// wrapper was never where the old regex looked).
test("rule.chart-without-data-table: a <table> nested inside the .ex-diagram wrapper passes (core/diagrams/bar's own shape)", async () => {
  const artifactDir = makeArtifact({
    distHtml: baseHtml({ bodyExtra: '<div class="ex-diagram" data-kind="bar"><svg></svg><table><tr><td>1</td></tr></table></div>' }),
  });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "rule.chart-without-data-table");
    assert.equal(result.messages.length, 0);
  } finally {
    cleanup(artifactDir);
  }
});

test("rule.chart-without-data-table: a <table> as the wrapper's next element sibling passes (whitespace between them doesn't break adjacency)", async () => {
  const artifactDir = makeArtifact({
    distHtml: baseHtml({ bodyExtra: '<div class="ex-diagram" data-kind="bar"><svg></svg></div>\n  <table><tr><td>1</td></tr></table>' }),
  });
  try {
    const result = findResult((await runCheckOn(artifactDir)).results, "rule.chart-without-data-table");
    assert.equal(result.messages.length, 0);
  } finally {
    cleanup(artifactDir);
  }
});

test("rule.chart-without-data-table: a bar wrapper with the table stripped (neither inside nor following) warns", async () => {
  const missing = makeArtifact({ distHtml: baseHtml({ bodyExtra: '<div class="ex-diagram" data-kind="bar"><svg></svg></div>' }) });
  try {
    const missingResult = findResult((await runCheckOn(missing)).results, "rule.chart-without-data-table");
    assert.equal(missingResult.messages.length, 1);
    assert.match(missingResult.messages[0].text, /no data table/);
  } finally {
    cleanup(missing);
  }
});

// ----------------------------------------------------------------- fact.checker

test("fact.checker: pending with no dist/fact-check.json; failed on an unsupported claim; passed when every claim is supported", async () => {
  const pending = makeArtifact();
  const unsupported = makeArtifact();
  const supported = makeArtifact();
  try {
    assert.equal(findResult((await runCheckOn(pending)).results, "fact.checker").status, "pending");

    fs.writeFileSync(path.join(unsupported, "dist", "fact-check.json"), JSON.stringify([{ page: "overview", claim: "x", status: "unsupported", note: "no source" }]));
    const unsupportedResult = findResult((await runCheckOn(unsupported)).results, "fact.checker");
    assert.equal(unsupportedResult.status, "failed");
    assert.match(unsupportedResult.messages[0].text, /unsupported/);

    fs.writeFileSync(path.join(supported, "dist", "fact-check.json"), JSON.stringify([{ page: "overview", claim: "x", status: "supported" }]));
    assert.equal(findResult((await runCheckOn(supported)).results, "fact.checker").status, "passed");
  } finally {
    cleanup(pending);
    cleanup(unsupported);
    cleanup(supported);
  }
});

// --------------------------------------------------------------- brand.tokens
// real `scripts/lib/brand.mjs` now lives in this worktree for
// real (merged, not mocked): `loadTokenNames(pluginRoot) -> string[]` and
// `validateBrand(cssText, tokenNames) -> { ok, missing: string[] }`. These
// tests run runBrandTokens against the REAL plugin core (REAL_PLUGIN_ROOT),
// so contents.brand resolves through the lookup's real brand/<id>.css files.

test("brand.tokens: passes for the real neutral brand", async () => {
  const neutral = makeArtifact({ name: "fixture-artifact-neutral", contents: minimalContents({ brand: "neutral" }) });
  try {
    assert.equal(
      findResult((await check({ dir: neutral, repoRoot: neutral, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results, "brand.tokens").status,
      "passed"
    );
  } finally {
    cleanup(neutral);
  }
});

test("brand.tokens: fails listing every missing token for an incomplete brand", async () => {
  const incomplete = makeArtifact({ name: "fixture-artifact-incomplete", contents: minimalContents({ brand: "incomplete" }) });
  try {
    fs.mkdirSync(path.join(incomplete, "brand"), { recursive: true });
    fs.writeFileSync(path.join(incomplete, "brand", "incomplete.css"), ":root { --ex-bg: #fff; --ex-ink: #111; }");

    const result = findResult((await check({ dir: incomplete, repoRoot: incomplete, pluginRoot: REAL_PLUGIN_ROOT, browser: NO_BROWSER })).results, "brand.tokens");
    assert.equal(result.status, "failed");
    assert.ok(result.messages.length > 2, "an incomplete brand should list more than 2 missing tokens");
    assert.ok(result.messages.every((m) => m.severity === "error"));
    assert.ok(result.messages.some((m) => m.text.includes("--ex-callout-note")));
    assert.ok(!result.messages.some((m) => /missing required token: --ex-bg$/.test(m.text)), "a defined token (--ex-bg) must not be reported missing");
  } finally {
    cleanup(incomplete);
  }
});

// -------------------------------------------------------------------- browser.*
// Phase 3: real detection + real browser.* checks.
// Browser-dependent assertions are skipped (t.skip, with a reason) when no
// driver is available on the machine running the suite — never faked.

test("browser.*: EXPLAINER_NO_BROWSER=1 forces all three skipped, never passed, via the full check() pipeline", async () => {
  const artifactDir = makeArtifact();
  try {
    const results = (await runCheckOn(artifactDir)).results; // runCheckOn already forces NO_BROWSER
    for (const id of BROWSER_CHECK_IDS) {
      const r = findResult(results, id);
      assert.equal(r.status, "skipped");
      assert.notEqual(r.status, "passed");
      assert.match(r.messages[0].text, /EXPLAINER_NO_BROWSER/);
    }
  } finally {
    cleanup(artifactDir);
  }
});

test("detectBrowser: EXPLAINER_NO_BROWSER=1 forces unavailable; BROWSER_CHECK_IDS names the three ids", async () => {
  const forced = await detectBrowser({ env: { EXPLAINER_NO_BROWSER: "1" } });
  assert.equal(forced.available, false);
  assert.match(forced.reason, /EXPLAINER_NO_BROWSER/);
  assert.deepEqual(BROWSER_CHECK_IDS, ["browser.phone-scroll", "browser.svg-overflow", "browser.themes"]);
});

test("detectBrowser: a fake binary that only sleeps times out and is reported unavailable with a reason (never hangs the test)", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-fakebrowser-"));
  try {
    const fakeBinary = path.join(tmpDir, "fake-browser.sh");
    fs.writeFileSync(fakeBinary, "#!/bin/sh\nsleep 5\n");
    fs.chmodSync(fakeBinary, 0o755);

    const env = { ...envWithoutNoBrowser(), EXPLAINER_BROWSER: fakeBinary, EXPLAINER_BROWSER_TIMEOUT_MS: "300" };
    const start = Date.now();
    const result = await detectBrowser({ env, importPlaywright: async () => { throw Object.assign(new Error("not found"), { code: "ERR_MODULE_NOT_FOUND" }); } });
    const elapsedMs = Date.now() - start;

    assert.equal(result.available, false);
    assert.match(result.reason, /did not respond|timed out|timeout|probe failed/i);
    // A real full Chromium-family browser fallback (if one exists on this
    // machine) also gets the same 300ms timeout, so this stays fast either way.
    assert.ok(elapsedMs < 10000, `detectBrowser took ${elapsedMs}ms — a timeout did not actually bound it`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectBrowser + runBrowserChecks: Playwright path via an injected fake module — never a real dependency", async () => {
  const fakePage = {
    viewport: null,
    colorScheme: "light",
    async setViewportSize(size) {
      this.viewport = size;
    },
    async emulateMedia({ colorScheme }) {
      this.colorScheme = colorScheme;
    },
    async goto() {},
    async evaluate(pageFunction) {
      // detectBrowser's own sanity probe calls `page.evaluate(() => 1 + 1)` —
      // a real function reference, not the measuring script's source string.
      if (typeof pageFunction === "function") return pageFunction();
      // One SVG text overflows; horizontal scroll only at 400px — same shape a real run would report.
      return {
        innerWidth: this.viewport?.width ?? 1280,
        scrollWidth: this.viewport?.width === 400 ? 600 : (this.viewport?.width ?? 1280),
        horizontalScroll: this.viewport?.width === 400,
        prefersDark: this.colorScheme === "dark",
        svgOverflows: [{ text: "overflowing text", overflows: true }],
      };
    },
    async screenshot({ path: outPath }) {
      fs.writeFileSync(outPath, Buffer.from([0x89, 0x50, 0x4e, 0x47])); // fake PNG bytes — just needs to exist, non-empty
    },
    async close() {},
  };
  const fakeBrowser = {
    async newPage() {
      return fakePage;
    },
    async close() {},
    version() {
      return "fake/1.0";
    },
  };
  const fakePlaywrightModule = {
    chromium: {
      async launch() {
        return fakeBrowser;
      },
    },
  };

  const driver = await detectBrowser({ env: { EXPLAINER_NO_BROWSER: undefined }, importPlaywright: async () => fakePlaywrightModule });
  assert.equal(driver.available, true);
  assert.equal(driver.kind, "playwright");
  assert.equal(driver.version, "fake/1.0");

  const artifactDir = makeArtifact({
    contents: minimalContents({ pages: [{ id: "overview", title: "Overview", group: "start" }] }),
  });
  try {
    const files = [{ relPath: "fixture-artifact.html", content: baseHtml(), scanText: baseHtml() }];
    const results = await runBrowserChecks({ driver, files, shape: "single", contents: minimalContents({ pages: [{ id: "overview" }] }), artifactDir, timeoutMs: driver.timeoutMs });

    assert.equal(results["browser.phone-scroll"].messages.length, 1);
    assert.match(results["browser.phone-scroll"].messages[0].text, /horizontal scroll/);
    assert.equal(results["browser.svg-overflow"].messages.length, 1);
    assert.match(results["browser.svg-overflow"].messages[0].text, /overflowing text/);
    assert.equal(results["browser.themes"].screenshots.length, 4); // 2 widths x 2 themes
    for (const rel of results["browser.themes"].screenshots) {
      assert.ok(fs.existsSync(path.join(artifactDir, "dist", rel)), `screenshot ${rel} was not written`);
    }
  } finally {
    cleanup(artifactDir);
  }
});

test("check(): a real chrome-headless-shell run catches a planted SVG overflow and a planted 600px-wide element, and writes screenshots (skipped when no browser is present on this machine)", async (t) => {
  const driver = await detectBrowser({ env: envWithoutNoBrowser() });
  if (!driver.available) {
    t.skip(`no browser available on this machine: ${driver.reason}`);
    return;
  }

  const contents = minimalContents({
    groups: [{ id: "start", title: "Start here" }],
    pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
  });
  const distHtml = baseHtml({
    bodyExtra:
      '<div style="width:600px;height:20px;background:#eee;">600px wide — forces horizontal scroll at 400px</div>' +
      '<svg width="300" height="140" viewBox="0 0 300 140">' +
      // Planted overflow: a text anchored INSIDE its box, bbox spills out of it.
      '<g><rect x="5" y="5" width="60" height="24" fill="none" stroke="red" />' +
      '<text x="10" y="22" font-size="16">this text deliberately overflows its box</text></g>' +
      // Planted "beside, not inside" case (the false-positive this fix targets): a
      // small marker shape with its caption anchored well outside the shape's own
      // bbox, like a timeline marker + date or a bar chart's category/value label.
      // It must fit the viewBox (it does) and must NOT be flagged just for sitting
      // near the marker.
      '<g><rect x="5" y="90" width="20" height="20" fill="none" stroke="blue" />' +
      '<text x="40" y="104" font-size="12">caption beside marker</text></g>' +
      "</svg>",
  });
  const artifactDir = makeArtifact({ contents, distHtml });
  try {
    const result = await check({ dir: artifactDir, repoRoot: artifactDir, pluginRoot: BUILD_PLUGIN_ROOT, browser: { env: envWithoutNoBrowser() } });
    assert.equal(result.driver.available, true);
    assert.ok(["headless-shell", "cli", "playwright"].includes(result.driver.kind), result.driver.kind);

    const scrollResult = findResult(result.results, "browser.phone-scroll");
    assert.equal(scrollResult.status, "failed");
    assert.match(scrollResult.messages[0].text, /horizontal scroll/);

    const svgResult = findResult(result.results, "browser.svg-overflow");
    assert.equal(svgResult.status, "failed");
    assert.equal(svgResult.messages.length, 1); // only the planted overflow — the beside-marker caption is not a false positive
    assert.match(svgResult.messages[0].text, /overflows/);
    assert.match(svgResult.messages[0].text, /deliberately overflows its box/);
    assert.ok(!svgResult.messages.some((m) => m.text.includes("caption beside marker")), "a label beside (not inside) a shape must not be flagged");

    const themesResult = findResult(result.results, "browser.themes");
    assert.ok(themesResult.screenshots.length >= 4, `expected at least 4 screenshots, got ${themesResult.screenshots.length}`);
    for (const rel of themesResult.screenshots) {
      const abs = path.join(artifactDir, "dist", rel);
      assert.ok(fs.existsSync(abs) && fs.statSync(abs).size > 0, `screenshot ${rel} missing or empty`);
    }

    const reportMd = fs.readFileSync(path.join(artifactDir, "dist", "check-report.md"), "utf8");
    assert.match(reportMd, /Browser driver: \*\*/);
    const checkJson = JSON.parse(fs.readFileSync(path.join(artifactDir, "dist", "check.json"), "utf8"));
    assert.equal(checkJson.driver.available, true);
  } finally {
    cleanup(artifactDir);
  }
});

// Phone-scroll self-diagnosis: "page has horizontal
// scroll at 400px width" alone never named an element — a real build with
// a planted offender must now also report it (tag/classes/id, the nearest
// heading, the right edge, a 60-char snippet), name only the *outermost*
// of two nested offenders (not both — that would be the same one root
// cause reported twice), and never flag a wide element that's properly
// contained inside a real overflow-x:auto scroll wrapper (the table
// pattern's own `.ex-table`) — that's legitimate internal scrolling, not a
// page-level bug.
test("browser (real driver): browser.phone-scroll names the outermost offending element, skips a contained (properly-scrollable) one", async (t) => {
  const driver = await detectBrowser({ env: envWithoutNoBrowser() });
  if (!driver.available) {
    t.skip(`no browser available on this machine: ${driver.reason}`);
    return;
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-phone-scroll-diag-"));
  try {
    fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
    fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "pages", "overview.html"),
      '<h2 id="offender-section">Offender section</h2>\n' +
        '<div class="outer-wide" id="outer-culprit" style="width:900px;">\n' +
        '  <div class="inner-wide" id="inner-culprit" style="width:900px;">deeply nested wide text content for testing nested outermost grouping behavior</div>\n' +
        "</div>\n" +
        '<div class="ex-table">\n' +
        "  <table><tbody><tr><td>" +
        '    <span style="white-space:nowrap;">a genuinely long unbreakable single line meant only to stay inside its own scroll container during this diagnostic test</span>' +
        "</td></tr></tbody></table>\n" +
        "</div>\n"
    );

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Phone Scroll Diagnosis",
        kind: "test-profile",
        brand: "neutral",
        voice: "none",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        rules: { off: [], on: [] },
        publish: { url: null, shape: "single" },
      })
    );

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const checkResult = await check({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT, browser: { env: envWithoutNoBrowser() } });
    const scrollResult = findResult(checkResult.results, "browser.phone-scroll");
    assert.equal(scrollResult.status, "failed");
    const texts = scrollResult.messages.map((m) => m.text);
    assert.ok(texts.some((t) => /horizontal scroll/.test(t)), JSON.stringify(texts));

    // Names the outer offender, with its heading and a snippet of its text...
    const outerMsg = texts.find((t) => t.includes("#outer-culprit"));
    assert.ok(outerMsg, `expected a message naming #outer-culprit; got: ${JSON.stringify(texts)}`);
    assert.match(outerMsg, /^div\.outer-wide#outer-culprit extends to \d+px/);
    assert.match(outerMsg, /near "Offender section" \(#offender-section\)/);
    assert.match(outerMsg, /"deeply nested wide text content/);

    // ...but never separately names its own (also-offending) nested child —
    // one root cause, one message, not two.
    assert.ok(!texts.some((t) => t.includes("#inner-culprit")), `#inner-culprit should be folded into its outer ancestor; got: ${JSON.stringify(texts)}`);

    // Never flags content properly contained inside a real .ex-table
    // overflow-x:auto wrapper — that's legitimate internal scrolling.
    assert.ok(
      !texts.some((t) => t.includes("stay inside its own scroll container")),
      `the .ex-table-wrapped span must not be flagged; got: ${JSON.stringify(texts)}`
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// a real build (live.comments + live.presenter on,
// so ask.js/presenter.js's controls — the ones that start [hidden] and
// stay that way with no window.claude — actually ship), run through the
// real browser driver, must report no [hidden] control that still renders
// (lib/browser.mjs's runBrowserChecks "browser.hidden-controls" diagnostic
// — not one of the three official check ids, so check() itself never sees
// it; this reads it straight off runBrowserChecks's own return value, the
// same way the shared measuring script's other fields are consumed).
test("browser (real driver): with no window.claude, the presenter badge/toggle/follow and ask button stay actually hidden, not merely hidden=true", async (t) => {
  const driver = await detectBrowser({ env: envWithoutNoBrowser() });
  if (!driver.available) {
    t.skip(`no browser available on this machine: ${driver.reason}`);
    return;
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-hidden-controls-"));
  try {
    fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
    fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    // An addressable heading so live.comments on gets a real .ex-ask button
    // emitted (lib/shell.mjs's injectAskButtons), same as the real build's
    // own pages carry one per section.
    fs.writeFileSync(path.join(dir, "pages", "intro.html"), '<h2 id="faq">FAQ</h2>\n<p>Some content.</p>\n');

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Hidden Controls Fixture",
        kind: "test-profile",
        brand: "neutral",
        voice: "none",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "intro", title: "Intro", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        rules: { off: [], on: [] },
        live: { comments: true, presenter: true },
        publish: { url: null, shape: "single" },
      })
    );

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const relName = `${path.basename(dir)}.html`;
    const content = fs.readFileSync(path.join(dir, "dist", relName), "utf8");
    // Sanity: the controls this test is actually about are really in the
    // built page, each still carrying [hidden] (no live window.claude ran
    // to flip it) — otherwise this test would trivially pass for not
    // exercising anything.
    assert.match(content, /class="ex-presenter-badge"[^>]*\bhidden\b/);
    assert.match(content, /class="ex-ask"[^>]*\bhidden\b/);

    const files = [{ relPath: relName, content, scanText: content }];
    const contents = JSON.parse(fs.readFileSync(path.join(dir, "contents.json"), "utf8"));
    const results = await runBrowserChecks({ driver, files, shape: "single", contents, artifactDir: dir, timeoutMs: driver.timeoutMs });

    const diag = results["browser.hidden-controls"];
    assert.ok(diag, "runBrowserChecks did not return a browser.hidden-controls diagnostic");
    assert.deepEqual(diag.messages, [], JSON.stringify(diag.messages));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// the real vcs-port artifact failed
// browser.phone-scroll on 13/18 pages — a long title overflowed the top
// bar's "Theme: auto"/"Pages" controls, and an unwrapped .ex-path (a long
// file/cite path or URL) overflowed the page. A real build with both
// stressors (a title long enough to need the ellipsis, and an x-file link
// to a long path) must pass browser.phone-scroll at 400px.
test("browser (real driver): a long title and a long file path both fit at 400px (top bar ellipsis + .ex-path wrap)", async (t) => {
  const driver = await detectBrowser({ env: envWithoutNoBrowser() });
  if (!driver.available) {
    t.skip(`no browser available on this machine: ${driver.reason}`);
    return;
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-topbar-"));
  try {
    fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
    fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "pages", "overview.html"),
      '<p>See <x-file p="plugins/sdlc-pipeline-plugin/scripts/vcs_lib/credentials_resolution_order.py"/> for the real resolution order.</p>\n'
    );

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Extraordinarily Comprehensive Documentation Overview",
        kind: "test-profile",
        brand: "neutral",
        voice: "none",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        rules: { off: [], on: [] },
        repo: { github: "example-org/example-repo", ref: "poc/vcs-port" },
        publish: { url: null, shape: "single" },
      })
    );

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors));

    const checkResult = await check({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT, browser: { env: envWithoutNoBrowser() } });
    const scrollResult = findResult(checkResult.results, "browser.phone-scroll");
    assert.equal(scrollResult.status, "passed", JSON.stringify(scrollResult.messages));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("findHeadlessShellExecutable: resolves EXPLAINER_BROWSER as an override when it points at an executable file", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-hs-"));
  try {
    const fake = path.join(tmpDir, "fake-hs.sh");
    fs.writeFileSync(fake, "#!/bin/sh\necho ok\n");
    fs.chmodSync(fake, 0o755);
    const found = findHeadlessShellExecutable({ EXPLAINER_BROWSER: fake, PATH: "" });
    assert.equal(found, fake);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------------ renderCheckReport

test("renderCheckReport: a summary table row per check, plus a detail section only for checks with messages", () => {
  const md = renderCheckReport([
    { id: "a.b", level: "error", status: "passed", messages: [] },
    { id: "c.d", level: "warning", status: "passed", messages: [{ severity: "warning", text: "heads up", file: "x.html", line: 3 }] },
  ]);
  assert.match(md, /\| a\.b \| error \| passed \| 0 \|/);
  assert.match(md, /\| c\.d \| warning \| passed \| 1 \|/);
  assert.match(md, /## c\.d \(passed\)/);
  assert.doesNotMatch(md, /## a\.b/);
  assert.match(md, /x\.html:3: heads up/);
});
