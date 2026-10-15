// Cross-pattern contract tests for the whole pattern library (/
// plus the orchestrator follow-up that closed this file's
// original two "documented gap" sections). own tests
// (scripts/test/patterns-content.test.mjs) cover its 8 folders' build-
// through behaviour in detail; this file covers every folder (all 17 —
// core/patterns/README.md's table) against the shared contract, plus
// own additions:
//   1. the 4-file contract (<name>.css, example.html, README.md required;
//      <name>.js optional) for every folder;
//   2. every pattern's CSS contains only --ex-* custom properties — no
//      literal hex/rgb/hsl/named colours;
//   3. no `var(` and no literal colour attribute inside any <svg> block in
//      any example.html (none of the 17 currently ship an SVG — this is a
//      regression guard for the day one does);
//   4. the build inlines only the patterns a page actually uses, including
//      JS (lib/shell.mjs's resolvePatterns only reads <name>.js when the
//      name was collected) — for the 5 patterns whose root class
//      is a normal, build-collected `ex-<name>` class (annotated-json,
//      scenario, steps, presenter, ask), PLUS `code`/`term`/`panel` via
//      the implication map (scripts/lib/shell.mjs's `BUILD_OWNED_IMPLIES`:
//      any `.ex-code` implies `code`, any `a.ex-term`/`data-term` implies
//      `term`, any `[data-panel]` implies `panel` — see "implication-based
//      inlining" below), PLUS `file-map`, proven from a real
//      `git-manifest` generator run feeding it through `<x-include
//      as="data"/>` (see "file-map: real git-manifest run" below) rather
//      than a hand-embedded fixture;
//   5. `node --check` passes on every pattern's <name>.js;
//   6. unit tests for code.js's tokenizer across a few languages, run via
//      node:vm (no DOM needed — see code/code.js's module header).

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { build } from "../../explainer/scripts/lib/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const PATTERNS_ROOT = path.join(REAL_PLUGIN_ROOT, "core", "patterns");

// Every folder core/patterns/README.md's table lists (17 total: 2a's 8 +
// 2b's 9). own folders are included here only for the
// contract/colour/SVG checks (1-3) — their build-through behaviour is
// patterns-content.test.mjs's job, not re-tested here.
const ALL_PATTERNS = [
  "callout",
  "table",
  "matrix",
  "details",
  "legend",
  "cards",
  "stats",
  "verdict-list",
  "code",
  "annotated-json",
  "file-map",
  "scenario",
  "steps",
  "term",
  "panel",
  "presenter",
  "ask",
  "info",
];

// patterns whose root class is a normal, build-collected
// `ex-<name>` class (i.e. NOT in BUILD_OWNED_EX_CLASSES) — these get the
// real "build inlines this pattern" check. `code`/`term`/`panel` are
// covered separately, below, by the "implication-based inlining" tests;
// `file-map` is covered by its own real-git-manifest-run test (it now
// needs a declared generator + x-include, not just a fixture page).
const PHASE_2B_AUTO_INLINED = ["annotated-json", "scenario", "steps", "presenter", "ask"];

// contents.json pages[].panels[] entries an example.html fragment needs
// (anything using `[data-panel]`; lib/includes.mjs's checkDataPanel fails
// the build on an undeclared key).
const PANELS_BY_PATTERN = {
  scenario: ["sc-call", "sc-result", "sc-next"],
  steps: ["st-1", "st-2", "st-3", "st-4"],
  panel: ["demo"],
  info: ["exit-code"],
};

function readFile(...parts) {
  return fs.readFileSync(path.join(PATTERNS_ROOT, ...parts), "utf8");
}

function readExample(name) {
  return readFile(name, "example.html");
}

/**
 * A throwaway artifact directory with contents.json (brand: "neutral", so the
 * real committed core/brand/neutral.css is what resolves) and a single page
 * whose body is `pageHtml` — same shape as patterns-content.test.mjs's
 * `makeArtifact`, extended with an optional `panels` list for patterns
 * (scenario, steps) whose example.html uses `[data-panel]`.
 */
function makeArtifact(pageHtml, { panels } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-patterns-"));
  fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
  fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  fs.writeFileSync(path.join(dir, "pages", "demo.html"), pageHtml);
  const page = { id: "demo", title: "Demo", group: "start", type: "short-answer" };
  if (panels) page.panels = panels.map((key) => ({ key, title: key, body: `<p>${key}</p>` }));
  const contents = {
    schema: 1,
    title: "Patterns Demo",
    kind: "test-profile",
    brand: "neutral",
    voice: "none",
    groups: [{ id: "start", title: "Start here" }],
    pages: [page],
    terms: [],
    sources: [],
    repo: { github: "example-org/example-repo", ref: "master" },
    rules: { off: [], on: [] },
    live: { comments: false, presenter: false },
    publish: { url: null, shape: "single" },
  };
  fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
  return dir;
}

async function buildFixture(pageHtml, opts) {
  const dir = makeArtifact(pageHtml, opts);
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    const html = result.ok
      ? fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8")
      : null;
    return { result, html };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// --------------------------------------------------------- 1. the 4-file contract

test("every pattern folder has the 4-file contract", () => {
  for (const name of ALL_PATTERNS) {
    const dir = path.join(PATTERNS_ROOT, name);
    assert.ok(fs.statSync(dir).isDirectory(), `${name}: folder missing`);

    const css = path.join(dir, `${name}.css`);
    assert.ok(fs.existsSync(css), `${name}: ${name}.css missing`);

    const example = path.join(dir, "example.html");
    assert.ok(fs.existsSync(example), `${name}: example.html missing`);
    assert.ok(fs.readFileSync(example, "utf8").trim().length > 0, `${name}: example.html is empty`);

    const readme = path.join(dir, "README.md");
    assert.ok(fs.existsSync(readme), `${name}: README.md missing`);
    const readmeText = fs.readFileSync(readme, "utf8");
    assert.match(readmeText, /## When to use/, `${name}: README.md missing "When to use"`);
    assert.match(readmeText, /## When not/, `${name}: README.md missing "When not"`);
    assert.match(readmeText, /## Markup contract/, `${name}: README.md missing "Markup contract"`);
    assert.match(readmeText, /## Tokens used/, `${name}: README.md missing "Tokens used"`);
  }
});

// -------------------------------------------------- 2. token-only CSS, no literal colours

const NAMED_COLORS = [
  "red", "blue", "green", "black", "white", "gray", "grey", "yellow", "orange",
  "purple", "pink", "brown", "cyan", "magenta", "lime", "navy", "teal", "maroon",
  "olive", "silver", "gold", "salmon", "crimson", "indigo", "violet", "coral",
  "khaki", "beige", "ivory", "lavender", "plum", "orchid", "turquoise",
  "chocolate", "tan", "fuchsia", "aqua",
];
const NAMED_COLOR_RE = new RegExp(`(?<![\\w-])(${NAMED_COLORS.join("|")})(?![\\w-])`, "gi");
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g;
const COLOR_FN_RE = /\b(rgb|rgba|hsl|hsla)\s*\(/gi;

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function findLiteralColors(css) {
  const stripped = stripCssComments(css);
  const violations = [];
  for (const re of [HEX_COLOR_RE, COLOR_FN_RE, NAMED_COLOR_RE]) {
    re.lastIndex = 0;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(stripped))) violations.push(m[0]);
  }
  return violations;
}

for (const name of ALL_PATTERNS) {
  test(`core/patterns/${name}/${name}.css has no literal colour values`, () => {
    const css = readFile(name, `${name}.css`);
    assert.deepEqual(findLiteralColors(css), []);
  });
}

// ---------------------------------- 3. no var()/literal colours inside <svg> blocks

const SVG_BLOCK_RE = /<svg[\s\S]*?<\/svg>/gi;
const VAR_RE = /var\(/g;

function findSvgViolations(html) {
  const violations = [];
  let svgMatch;
  SVG_BLOCK_RE.lastIndex = 0;
  // eslint-disable-next-line no-cond-assign
  while ((svgMatch = SVG_BLOCK_RE.exec(html))) {
    const block = svgMatch[0];
    for (const v of findLiteralColors(block)) violations.push(v);
    VAR_RE.lastIndex = 0;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = VAR_RE.exec(block))) violations.push(m[0]);
  }
  return violations;
}

for (const name of ALL_PATTERNS) {
  test(`core/patterns/${name}/example.html has no var()/literal colours inside any <svg>`, () => {
    const html = readExample(name);
    assert.deepEqual(findSvgViolations(html), []);
  });
}

// ----------------------------------- 4. build inlines only the patterns used

for (const name of PHASE_2B_AUTO_INLINED) {
  test(`core/patterns/${name}/example.html builds through the real build (brand neutral)`, async () => {
    const { result, html } = await buildFixture(readExample(name), { panels: PANELS_BY_PATTERN[name] });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.ok(
      result.patternsUsed.some((p) => p.name === name),
      `expected "${name}" in patternsUsed (got ${JSON.stringify(result.patternsUsed.map((p) => p.name))})`
    );
    assert.ok(html.includes(`.ex-${name} `), `expected ".ex-${name} " in the built CSS`);
  });
}

test("build() inlines every Phase 2b pattern used when a page combines several", async () => {
  const combined = [readExample("annotated-json"), readExample("presenter"), readExample("ask")].join("\n");
  const { result, html } = await buildFixture(combined);
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  const names = result.patternsUsed.map((p) => p.name).sort();
  // annotated-json's example.html also uses the `table` pattern's ex-table
  // class for its notes table (documented in annotated-json/README.md).
  assert.deepEqual(names, ["annotated-json", "ask", "presenter", "table"].sort());
  assert.match(html, /\.ex-annotated-json /);
  assert.match(html, /\.ex-ask /);
  assert.match(html, /\.ex-presenter /);
  assert.match(html, /\.ex-table /);
  assert.doesNotMatch(html, /\.ex-file-map /);
  assert.doesNotMatch(html, /\.ex-scenario /);
  assert.doesNotMatch(html, /\.ex-steps /);
});

// JS only ships when its pattern was actually used: a page with `ask` but
// not `file-map` carries ask.js's unique marker but not file-map.js's.
test("build() inlines a used pattern's JS but not an unused pattern's JS", async () => {
  const { result, html } = await buildFixture(readExample("ask"));
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.deepEqual(result.patternsUsed.map((p) => p.name), ["ask"]);
  assert.match(html, /ExplainerAsk/);
  assert.doesNotMatch(html, /ExplainerFileMap/);
  assert.doesNotMatch(html, /ExplainerPresenter/);
});

// --------------------------------------- implication-based inlining: code/term/panel
//
// `.ex-code*`/`a.ex-term`/`[data-panel]` are still BUILD_OWNED_EX_CLASSES
// (scripts/lib/shell.mjs) — never a pattern-candidate via the generic
// "strip the ex- prefix" mapping, since that markup is emitted by the
// build itself, not a page-writer's own literal class. But
// `collectPatternNames` carries an explicit implication map
// (`BUILD_OWNED_IMPLIES` plus two attribute checks) so build-owned markup
// still pulls in its pattern: any `.ex-code` implies `code`, any
// `a.ex-term`/`data-term="…"` implies `term`, any `[data-panel]` implies
// `panel`. The pair of tests per pattern below proves both directions —
// present → inlined, absent → not.

test('code: a page with an x-example code block ships code.css + code.js', async () => {
  const page = '<x-example kind="illustrative" lang="ts" file="runner.ts">const x = 1;</x-example>';
  const { result, html } = await buildFixture(page);
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.ok(result.patternsUsed.some((p) => p.name === "code"), JSON.stringify(result.patternsUsed));
  assert.match(html, /\.ex-code \{/);
  assert.match(html, /ExplainerCode/);
  // The real build-expanded markup, not a hand-authored stand-in.
  assert.match(html, /class="ex-code" data-tag="Illustrative"/);
});

test("code: a page with no .ex-code ships neither code.css nor code.js", async () => {
  const { result, html } = await buildFixture("<p>nothing here</p>");
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.deepEqual(result.patternsUsed, []);
  assert.doesNotMatch(html, /ExplainerCode/);
  assert.doesNotMatch(html, /\.ex-code \{/);
});

test("code: core/patterns/code/example.html itself builds through the real build and implies code (plus details, for its collapsible second example)", async () => {
  const { result, html } = await buildFixture(readExample("code"));
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  const names = result.patternsUsed.map((p) => p.name);
  assert.ok(names.includes("code"), `expected "code" in patternsUsed (got ${JSON.stringify(names)})`);
  assert.ok(names.includes("details"), `expected "details" in patternsUsed (got ${JSON.stringify(names)})`);
  assert.match(html, /\.ex-code \{/);
  assert.match(html, /ExplainerCode/);
});

test('term: a page with <x-term> (-> a.ex-term/data-term) ships term.css', async () => {
  const page = '<p><x-term k="port">ports</x-term></p>';
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-patterns-"));
  try {
    fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
    fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "demo.html"), page);
    const contents = {
      schema: 1,
      title: "Patterns Demo",
      kind: "test-profile",
      brand: "neutral",
      voice: "none",
      groups: [{ id: "start", title: "Start here" }],
      pages: [{ id: "demo", title: "Demo", group: "start", type: "short-answer" }],
      terms: [{ key: "port", term: "port", def: "A runtime-neutral interface." }],
      sources: [],
      rules: { off: [], on: [] },
      live: { comments: false, presenter: false },
      publish: { url: null, shape: "single" },
    };
    fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.ok(result.patternsUsed.some((p) => p.name === "term"), JSON.stringify(result.patternsUsed));
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /\.ex-term-eg \{/);
    assert.match(html, /class="ex-term" data-term="port"/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("term: a page with no a.ex-term/data-term ships no term.css", async () => {
  const { result, html } = await buildFixture("<p>nothing here</p>");
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.deepEqual(result.patternsUsed, []);
  assert.doesNotMatch(html, /\.ex-term-eg \{/);
});

test("term: core/patterns/term/example.html itself builds through the real build and implies term", async () => {
  const { result, html } = await buildFixture(readExample("term"));
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.ok(result.patternsUsed.some((p) => p.name === "term"), JSON.stringify(result.patternsUsed));
  assert.match(html, /\.ex-term-eg \{/);
});

test("panel: a page with a bare [data-panel] element ships panel.css", async () => {
  const page = '<span data-panel="demo" tabindex="0">detail</span>';
  const { result, html } = await buildFixture(page, { panels: ["demo"] });
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.ok(result.patternsUsed.some((p) => p.name === "panel"), JSON.stringify(result.patternsUsed));
  assert.match(html, /\.ex-panel-section/);
});

test("panel: a page with no [data-panel] ships no panel.css", async () => {
  const { result, html } = await buildFixture("<p>nothing here</p>");
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.deepEqual(result.patternsUsed, []);
  assert.doesNotMatch(html, /\.ex-panel-section/);
});

test("panel: core/patterns/panel/example.html itself builds through the real build and implies panel", async () => {
  const { result, html } = await buildFixture(readExample("panel"), { panels: PANELS_BY_PATTERN.panel });
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.ok(result.patternsUsed.some((p) => p.name === "panel"), JSON.stringify(result.patternsUsed));
  assert.match(html, /\.ex-panel-section/);
});

// -------------------------------------------------------- info
//
// `info` is never a generic `ex-<name>` class pattern (same category as
// code/term/panel): it's implied by `data-info-target`, the one attribute
// every trigger shape (`<x-info>`, `data-info`, the `data-panel` alias, and
// `a.ex-term[data-term]`) carries once the build normalizes it
// (lib/includes.mjs's checkDataInfo/handleInfoTrigger). `<x-info>` needs a
// matching `<x-info-body>` on the same page to resolve against — buildFixture's single-page artifact carries both in the one
// page body below.

test('info: a page with <x-info>/<x-info-body> ships info.css + info.js', async () => {
  const page =
    '<p><x-info k="note">more</x-info></p>' +
    '<x-info-body k="note" title="More"><p>detail</p></x-info-body>';
  const { result, html } = await buildFixture(page);
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.ok(result.patternsUsed.some((p) => p.name === "info"), JSON.stringify(result.patternsUsed));
  assert.match(html, /\.ex-info \{/);
  assert.match(html, /ExplainerInfo/);
  assert.match(html, /class="ex-info-trigger" data-info="note" data-info-target="info--demo--note"/);
  assert.match(html, /class="ex-info-entry" id="info--demo--note"/);
  // The body is removed from its authored spot and rendered once,
  // into the "More detail" fallback — never twice.
  assert.equal((html.match(/id="info--demo--note"/g) || []).length, 1);
});

test("info: a bare [data-info]/[data-panel] trigger (no <x-info>) still ships info.css + info.js", async () => {
  const page = '<span data-panel="exit-code" tabindex="0">0</span>';
  const { result, html } = await buildFixture(page, { panels: PANELS_BY_PATTERN.info });
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.ok(result.patternsUsed.some((p) => p.name === "info"), JSON.stringify(result.patternsUsed));
  assert.match(html, /data-info-target="info--demo--exit-code"/);
});

test("info: a page with no trigger of any kind ships no info.css", async () => {
  const { result, html } = await buildFixture("<p>nothing here</p>");
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  assert.deepEqual(result.patternsUsed, []);
  assert.doesNotMatch(html, /\.ex-info \{/);
  assert.doesNotMatch(html, /ExplainerInfo/);
});

test("info: core/patterns/info/example.html itself builds through the real build and implies info", async () => {
  const { result, html } = await buildFixture(readExample("info"), { panels: PANELS_BY_PATTERN.info });
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  const names = result.patternsUsed.map((p) => p.name);
  assert.ok(names.includes("info"), `expected "info" in patternsUsed (got ${JSON.stringify(names)})`);
  assert.match(html, /\.ex-info \{/);
});

// -------------------------------------------- file-map: real git-manifest run
//
// file-map no longer takes a hand-embedded JSON fixture (follow-
// up: that was exactly the drift) — it reads its data from
// `<x-include g="..." as="data"/>`'s real output. This test runs the
// actual `git-manifest` built-in generator against a real temp git repo
// (same technique as scripts/test/build.test.mjs's
// `createGitManifestFixtureRepo`/generators.test.mjs's `initGitRepo`),
// proving the whole chain: generator -> x-include as="data" -> .ex-data ->
// file-map.js, with core/patterns/file-map/example.html as the real page
// body.

function createFileMapGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-filemap-git-"));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", env });
  git("init", "-q");
  fs.writeFileSync(path.join(dir, "README.md"), "init\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  fs.mkdirSync(path.join(dir, "src", "core"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src", "adapters"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "core", "foo.py"), "x = 1\n");
  fs.writeFileSync(path.join(dir, "src", "adapters", "bar.py"), "y = 2\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add files");
  return dir;
}

test('file-map: builds from a real git-manifest run via <x-include as="data"/>', async () => {
  const gitRepo = createFileMapGitRepo();
  const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-filemap-artifact-"));
  try {
    fs.mkdirSync(path.join(artifactDir, "profiles", "test-profile"), { recursive: true });
    fs.writeFileSync(path.join(artifactDir, "profiles", "test-profile", "README.md"), "fixture profile\n");
    fs.mkdirSync(path.join(artifactDir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(artifactDir, "pages", "demo.html"), readExample("file-map"));
    const contents = {
      schema: 1,
      title: "File Map Demo",
      kind: "test-profile",
      brand: "neutral",
      voice: "none",
      groups: [{ id: "start", title: "Start here" }],
      pages: [{ id: "demo", title: "Demo", group: "start", type: "short-answer" }],
      terms: [],
      sources: [],
      rules: { off: [], on: [] },
      live: { comments: false, presenter: false },
      publish: { url: null, shape: "single" },
      generators: {
        manifest: {
          builtin: "git-manifest",
          range: "HEAD~1...HEAD",
          buckets: [
            { id: "core", label: "Core", match: ["src/core/**"] },
            { id: "adapters", label: "Adapters", match: ["src/adapters/**"] },
          ],
        },
      },
    };
    fs.writeFileSync(path.join(artifactDir, "contents.json"), JSON.stringify(contents, null, 2));

    const result = await build({ dir: artifactDir, repoRoot: gitRepo, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.ok(result.patternsUsed.some((p) => p.name === "file-map"), JSON.stringify(result.patternsUsed));

    const html = fs.readFileSync(path.join(artifactDir, "dist", path.basename(artifactDir) + ".html"), "utf8");
    assert.match(html, /\.ex-file-map /);
    assert.match(html, /ExplainerFileMap/);
    assert.match(html, /<script type="application\/json" class="ex-data" data-gen="manifest"/);
    assert.match(html, /"path":"src\/core\/foo\.py"/);
    assert.match(html, /"path":"src\/adapters\/bar\.py"/);
    assert.match(html, /"bucket":"core"/);
    assert.match(html, /"bucket":"adapters"/);
  } finally {
    fs.rmSync(gitRepo, { recursive: true, force: true });
    fs.rmSync(artifactDir, { recursive: true, force: true });
  }
});

// --------------------------------------------------------- 5. node --check on every pattern JS

for (const name of ALL_PATTERNS) {
  const jsPath = path.join(PATTERNS_ROOT, name, `${name}.js`);
  if (!fs.existsSync(jsPath)) continue;
  test(`node --check passes on core/patterns/${name}/${name}.js`, () => {
    const checked = spawnSync(process.execPath, ["--check", jsPath], { encoding: "utf8" });
    assert.equal(checked.status, 0, checked.stderr);
  });
}

// ------------------------------------------------- 6. code.js tokenizer unit tests
//
// code.js is a plain inlined script (no module.exports reachable via a
// normal ESM import) — loaded here with node:vm into a sandbox with no
// `document`, so its auto-run `highlightAll()` call is a no-op (by
// design: `if (typeof document !== "undefined") highlightAll();`) and
// only the pure `tokenize` function is exercised.

function loadExplainerCode() {
  const src = readFile("code", "code.js");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  assert.ok(sandbox.ExplainerCode, "code.js did not expose ExplainerCode in a DOM-less sandbox");
  return sandbox.ExplainerCode;
}

function clsAt(parts, text) {
  const hit = parts.find((p) => p.text === text);
  return hit ? hit.cls : undefined;
}

test("code.js tokenize(): ts — comment, keyword, number", () => {
  const { tokenize } = loadExplainerCode();
  const parts = tokenize("// a comment\nconst x = 1;", "ts");
  assert.equal(clsAt(parts, "// a comment"), "ex-tok-com");
  assert.equal(clsAt(parts, "const"), "ex-tok-kw");
  assert.equal(clsAt(parts, "1"), "ex-tok-num");
});

test("code.js tokenize(): json — keyword literal, string, number", () => {
  const { tokenize } = loadExplainerCode();
  const parts = tokenize('{"ok": true, "n": 42}', "json");
  assert.equal(clsAt(parts, "true"), "ex-tok-kw");
  assert.equal(clsAt(parts, '"ok"'), "ex-tok-str");
  assert.equal(clsAt(parts, "42"), "ex-tok-num");
});

test("code.js tokenize(): py — keyword, function-call name, hash comment", () => {
  const { tokenize } = loadExplainerCode();
  const parts = tokenize("def foo():\n    return 1  # done", "py");
  assert.equal(clsAt(parts, "def"), "ex-tok-kw");
  assert.equal(clsAt(parts, "foo"), "ex-tok-fn");
  assert.equal(clsAt(parts, "return"), "ex-tok-kw");
  assert.ok(parts.some((p) => p.cls === "ex-tok-com" && p.text.indexOf("# done") !== -1));
});

test("code.js tokenize(): dockerfile — instruction keyword, hash comment", () => {
  const { tokenize } = loadExplainerCode();
  const parts = tokenize("FROM python:3.12\n# comment", "dockerfile");
  assert.equal(clsAt(parts, "FROM"), "ex-tok-kw");
  assert.ok(parts.some((p) => p.cls === "ex-tok-com" && p.text.indexOf("# comment") !== -1));
});

test("code.js tokenize(): tree — path vs. trailing note split, no keyword handling", () => {
  const { tokenize } = loadExplainerCode();
  const parts = tokenize("a/b.py  the python module", "tree");
  // Compared via JSON (not assert.deepEqual/deepStrictEqual directly):
  // `parts` was built inside a node:vm sandbox, a different realm with its
  // own Object.prototype, which deepStrictEqual treats as unequal to a
  // same-shaped literal from this file's realm even though every field
  // matches.
  assert.equal(
    JSON.stringify(parts),
    JSON.stringify([
      { cls: "", text: "a/b.py" },
      { cls: "ex-tok-desc", text: "  the python module" },
    ])
  );
});

test("code.js tokenize(): unrecognized language still escapes, applies no keyword/key classes", () => {
  const { tokenize } = loadExplainerCode();
  const parts = tokenize("<div>&amp;</div>", "text");
  const joined = parts.map((p) => p.text).join("");
  assert.equal(joined, "<div>&amp;</div>");
  assert.ok(!parts.some((p) => p.cls === "ex-tok-kw"));
});

test("code.js highlightAll(): no-op with no document (Node sandbox)", () => {
  const { highlightAll } = loadExplainerCode();
  assert.doesNotThrow(() => highlightAll());
});

// ----------------------------------------------- 7. highlightAll(): data-info markers survive
//
// highlightAll() used to
// read `codeEl.textContent` and rebuild the whole subtree from a string,
// which silently destroyed any hand-authored `<span data-info="key">`
// marker nested inside the code (the reference site's own most-used
// annotation shape — research.md's "field/value annotation" category).
// This is a minimal, hand-rolled DOM stub (no jsdom-equivalent dependency
// exists in this plugin) implementing only the real-DOM surface
// highlightAll()'s fixed `tokenizeChildNodes` needs: `nodeType` (1/3),
// `childNodes`, `insertBefore`/`removeChild`/`appendChild`,
// `createElement`/`createTextNode`, attribute methods, and a
// `querySelectorAll` narrow enough to recognize only the one selector
// shape code.js actually calls (`.ex-code-pre code:not([data-ex-code-done])`).

class StubText {
  constructor(data) {
    this.nodeType = 3;
    this.data = data;
  }
}

class StubElement {
  constructor(tag) {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.attrs = {};
    this.childNodes = [];
  }
  get className() {
    return this.attrs.class || "";
  }
  set className(v) {
    this.attrs.class = v;
  }
  appendChild(node) {
    this.childNodes.push(node);
    return node;
  }
  insertBefore(node, ref) {
    const idx = this.childNodes.indexOf(ref);
    if (idx === -1) this.childNodes.push(node);
    else this.childNodes.splice(idx, 0, node);
    return node;
  }
  removeChild(node) {
    const idx = this.childNodes.indexOf(node);
    if (idx !== -1) this.childNodes.splice(idx, 1);
    return node;
  }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }
  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }
  // Narrow stub: only ever asked for ".ex-code-pre code:not([data-ex-code-done])" —
  // matches any descendant <code> lacking that attribute, ignoring the
  // ancestor-class half of the selector (the fixtures below always nest
  // the <code> inside an .ex-code-pre wrapper, same as a real build).
  querySelectorAll(sel) {
    const m = /^\.[\w-]+\s+([a-z]+):not\(\[([\w-]+)\]\)$/.exec(sel);
    assert.ok(m, `stub querySelectorAll: unsupported selector ${sel}`);
    const tag = m[1].toUpperCase();
    const forbidAttr = m[2];
    const out = [];
    (function walk(node) {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (child.tagName === tag && !child.hasAttribute(forbidAttr)) out.push(child);
          walk(child);
        }
      }
    })(this);
    return out;
  }
}

function flattenText(node) {
  if (node.nodeType === 3) return node.data;
  return node.childNodes.map(flattenText).join("");
}

function runHighlightAllWithStub(markup) {
  const src = readFile("code", "code.js");
  const doc = {
    createElement: (tag) => new StubElement(tag),
    createTextNode: (text) => new StubText(text),
  };
  const sandbox = { document: doc };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox); // auto-run at load is a safe no-op: doc has no childNodes/wrapper yet
  const wrapper = new StubElement("div");
  wrapper.className = "ex-code-pre";
  const codeEl = new StubElement("code");
  codeEl.className = "ex-code-lang-json";
  wrapper.appendChild(codeEl);
  markup(codeEl, doc);
  sandbox.ExplainerCode.highlightAll(wrapper);
  return codeEl;
}

test("code.js highlightAll(): a hand-authored [data-info] marker inside a JSON code block survives — same element, same attributes, own text tokenized", () => {
  const original = { span: null };
  const codeEl = runHighlightAllWithStub((codeEl, doc) => {
    const marker = doc.createElement("span");
    marker.setAttribute("data-info", "field-status");
    marker.setAttribute("tabindex", "0");
    // Simulates the build already having stamped this attribute (the
    // "click wiring" info.js's event delegation keys off of) — must still
    // be there, on the same node, once the highlighter has run.
    marker.setAttribute("data-info-target", "info--demo--field-status");
    marker.appendChild(doc.createTextNode('"ok"'));
    original.span = marker;

    codeEl.appendChild(doc.createTextNode('{\n  "status": '));
    codeEl.appendChild(marker);
    codeEl.appendChild(doc.createTextNode("\n}"));
  });

  assert.equal(codeEl.getAttribute("data-ex-code-done"), "");
  assert.ok(codeEl.childNodes.includes(original.span), "the marker element must survive as the same object, not be rebuilt");
  assert.equal(original.span.getAttribute("data-info"), "field-status");
  assert.equal(original.span.getAttribute("data-info-target"), "info--demo--field-status");
  assert.equal(original.span.getAttribute("tabindex"), "0");

  // The marker's own inner text was still tokenized (it's a JSON string):
  // not left as a bare text node, but wrapped by the highlighter same as
  // any other JSON string literal.
  assert.equal(original.span.childNodes.length, 1);
  assert.equal(original.span.childNodes[0].nodeType, 1);
  assert.equal(original.span.childNodes[0].className, "ex-tok-str");
  assert.equal(flattenText(original.span), '"ok"');

  // Nothing was lost or reordered around the marker either.
  assert.equal(flattenText(codeEl), '{\n  "status": "ok"\n}');
});
