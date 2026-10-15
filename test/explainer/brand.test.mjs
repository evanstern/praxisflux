// Tests for lib/brand.mjs: validateBrand and loadTokenNames
// against a tiny fixture plugin-root, plus the invariants (literal-only,
// every token present, both mode blocks) of the real committed brand files.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { loadTokenNames, validateBrand } from "../../explainer/scripts/lib/brand.mjs";
import { build } from "../../explainer/scripts/lib/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const BRAND_FIXTURE_PLUGIN_ROOT = path.join(FIXTURES, "brand", "plugin-root");
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");

test("validateBrand reports every missing --ex-* token, in tokens.json order", () => {
  const tokenNames = ["--ex-bg", "--ex-ink", "--ex-shadow"];
  const incomplete = ":root {\n  --ex-bg: #fff;\n}\n";
  const result = validateBrand(incomplete, tokenNames);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["--ex-ink", "--ex-shadow"]);
});

test("validateBrand passes a complete brand file, and a token name is never a false match of a longer one", () => {
  const tokenNames = ["--ex-bg", "--ex-bg-elevated"];
  const complete = ":root {\n  --ex-bg-elevated: #fff;\n}\n"; // defines -elevated only
  const result = validateBrand(complete, tokenNames);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["--ex-bg"]); // --ex-bg itself is still missing

  const reallyComplete = ":root {\n  --ex-bg: #fff;\n  --ex-bg-elevated: #eee;\n}\n";
  assert.deepEqual(validateBrand(reallyComplete, tokenNames), { ok: true, missing: [] });
});

test("loadTokenNames reads core/brand/tokens.json in file order", () => {
  const names = loadTokenNames(BRAND_FIXTURE_PLUGIN_ROOT);
  assert.deepEqual(names, ["--ex-bg", "--ex-ink", "--ex-shadow"]);
});

test("build() fails at the resolve step, listing every token a brand file is missing", async () => {
  const dir = path.join(FIXTURES, "brand", "incomplete-brand-artifact");
  const result = await build({
    dir,
    repoRoot: dir,
    pluginRoot: path.join(FIXTURES, "brand", "incomplete-brand-plugin-root"),
  });
  assert.equal(result.ok, false);
  assert.equal(result.step, "resolve");
  assert.ok(result.missing.some((m) => m.includes("brand/fixture.css: missing token --ex-ink")));
  assert.ok(!result.missing.some((m) => m.includes("--ex-bg")));
});

// --- the real, committed brand files -------------------------

for (const brand of ["neutral"]) {
  test(`core/brand/${brand}.css defines every --ex-* token, literal values only`, () => {
    const cssPath = path.join(REAL_PLUGIN_ROOT, "core", "brand", `${brand}.css`);
    const css = fs.readFileSync(cssPath, "utf8");
    const tokenNames = loadTokenNames(REAL_PLUGIN_ROOT);

    const result = validateBrand(css, tokenNames);
    assert.deepEqual(result.missing, []);
    assert.equal(result.ok, true);

    // Contract: "the brand file holds literal values... never var(--color-...)".
    // Strip comments first — the generated header's prose legitimately
    // *mentions* var(--color-...) while explaining why the file has none.
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(withoutComments, /var\(/);

    assert.match(css, /@media \(prefers-color-scheme: dark\)/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\)/);
    assert.match(css, /:root\[data-theme="dark"\]/);
  });
}
