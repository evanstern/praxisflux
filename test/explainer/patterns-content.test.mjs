// Tests for the content patterns (/ 
// scope narrowed to this phase's 8 folders): callout, table, matrix, details,
// legend, cards, stats, verdict-list. adds the remaining 9 pattern
// folders and its own cross-pattern contract tests
// (core/patterns/README.md documents the split).
//
// Three things are checked here, all against the REAL plugin root (never a
// fixture plugin-root) so this exercises the actual committed patterns and
// the actual committed core/brand/neutral.css:
//   1. the 4-file contract (<name>.css, example.html, README.md required;
//      <name>.js optional) for every folder;
//   2. each pattern's example.html builds cleanly through the real build
//      (lib/build.mjs) with brand "neutral", and every pattern's CSS contains
//      only --ex-* custom properties — no literal hex/rgb/hsl/named colours;
//   3. the build inlines only the patterns a page actually uses (a page
//      using callout alone never pulls in table's CSS).

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { build } from "../../explainer/scripts/lib/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const PATTERNS_ROOT = path.join(REAL_PLUGIN_ROOT, "core", "patterns");

// The 8 folders this phase ships. own test file covers the
// remaining 9 (core/patterns/README.md's table).
const PHASE_2A_PATTERNS = [
  "callout",
  "table",
  "matrix",
  "details",
  "legend",
  "cards",
  "stats",
  "verdict-list",
];

function readExample(name) {
  return fs.readFileSync(path.join(PATTERNS_ROOT, name, "example.html"), "utf8");
}

/**
 * A throwaway artifact directory with contents.json (brand: "neutral", so the
 * real committed core/brand/neutral.css is what resolves — no fixture brand
 * override) and a single page whose body is `pageHtml`. `kind` resolves to a
 * profile folder created locally inside the artifact (the lookup's first
 * layer), so the real build never needs a real core/profiles/* entry (none
 * exist yet — profiles are a later task).
 */
function makeArtifact(pageHtml) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-patterns-content-"));
  fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
  fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  fs.writeFileSync(path.join(dir, "pages", "demo.html"), pageHtml);
  const contents = {
    schema: 1,
    title: "Patterns Content",
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
  };
  fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
  return dir;
}

// ----------------------------------------------------------- 1. the 4-file contract

test("every Phase 2a pattern folder has the 4-file contract", () => {
  for (const name of PHASE_2A_PATTERNS) {
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

// ------------------------------------------------- 2. token-only CSS, no literal colours

// Deliberately excludes "transparent"/"currentcolor" — both are precedented
// in the already-shipped core/shell/shell.css (e.g. .ex-info-backdrop's
// `background: transparent`) and carry no brand hue of their own, unlike a
// hardcoded hex/rgb/hsl/named colour.
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

for (const name of PHASE_2A_PATTERNS) {
  test(`core/patterns/${name}/${name}.css has no literal colour values`, () => {
    const css = fs.readFileSync(path.join(PATTERNS_ROOT, name, `${name}.css`), "utf8");
    assert.deepEqual(findLiteralColors(css), []);
  });
}

// --------------------------------------------- 3. builds through the real build

for (const name of PHASE_2A_PATTERNS) {
  test(`core/patterns/${name}/example.html builds through the real build (brand neutral)`, async () => {
    const dir = makeArtifact(readExample(name));
    try {
      const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
      assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
      assert.ok(result.patternsUsed.some((p) => p.name === name), `expected "${name}" in patternsUsed`);
      const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
      assert.ok(html.includes(`.ex-${name} `), `expected ".ex-${name} " in the built CSS`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

// ------------------------------------------- 4. only used patterns are inlined

test("build() inlines only the pattern a page actually uses: callout-only page has no table CSS", async () => {
  const dir = makeArtifact(readExample("callout"));
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.deepEqual(
      result.patternsUsed.map((p) => p.name),
      ["callout"],
    );
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /\.ex-callout /);
    assert.doesNotMatch(html, /\.ex-table /);
    assert.doesNotMatch(html, /\.ex-matrix /);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build() inlines only the pattern a page actually uses: table-only page has no callout/matrix CSS", async () => {
  const dir = makeArtifact(readExample("table"));
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.deepEqual(
      result.patternsUsed.map((p) => p.name),
      ["table"],
    );
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /\.ex-table /);
    assert.doesNotMatch(html, /\.ex-callout /);
    assert.doesNotMatch(html, /\.ex-matrix /);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build() inlines every pattern used when a page combines several", async () => {
  const combined = [readExample("callout"), readExample("cards"), readExample("stats")].join("\n");
  const dir = makeArtifact(combined);
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.deepEqual(
      [...result.patternsUsed.map((p) => p.name)].sort(),
      ["callout", "cards", "stats"].sort(),
    );
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /\.ex-callout /);
    assert.match(html, /\.ex-cards /);
    assert.match(html, /\.ex-stats /);
    assert.doesNotMatch(html, /\.ex-table /);
    assert.doesNotMatch(html, /\.ex-matrix /);
    assert.doesNotMatch(html, /\.ex-details /);
    assert.doesNotMatch(html, /\.ex-legend /);
    assert.doesNotMatch(html, /\.ex-verdict-list /);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
