// Shipped examples must pass our own `no-internal-codes` house-style rule
// (clean-up): a writer imitates `core/**/example.html`
// and `core/**/example.json` verbatim (patterns.test.mjs, diagrams.test.mjs
// and patterns-content.test.mjs all build these real files through the
// real build/diagram pipeline), so a ticket/task/decision code left in one
// of them is a code a page-writer is likely to copy straight into a real
// page. This runs the same `no-internal-codes` patterns from
// `core/rules/house-style.json` (the ones `lib/check.mjs`'s
// `fact.no-internal-codes` runs against *built* output) directly against
// every shipped example file, so the source never regresses in the first
// place.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const RULES_PATH = path.join(PLUGIN_ROOT, "core", "rules", "house-style.json");
const CORE_DIR = path.join(PLUGIN_ROOT, "core");

/** Every `example.html`/`example.json` under `core/`, recursively. */
function findExampleFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findExampleFiles(full));
    } else if (entry.isFile() && (entry.name === "example.html" || entry.name === "example.json")) {
      out.push(full);
    }
  }
  return out;
}

function loadNoInternalCodesPatterns() {
  const doc = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  const rule = doc.rules.find((r) => r.id === "no-internal-codes");
  assert.ok(rule, 'no "no-internal-codes" rule found in core/rules/house-style.json');
  assert.ok(Array.isArray(rule.patterns) && rule.patterns.length > 0, "no-internal-codes rule has no patterns[]");
  return rule.patterns;
}

const examplePatterns = loadNoInternalCodesPatterns();
const exampleFiles = findExampleFiles(CORE_DIR);

test("fixture sanity: core/ actually has example.html/example.json files to check", () => {
  assert.ok(exampleFiles.length > 0, "no core/**/example.html or example.json files found");
});

for (const file of exampleFiles) {
  const rel = path.relative(PLUGIN_ROOT, file);

  test(`${rel}: carries no internal ticket/task/decision code (no-internal-codes)`, () => {
    const text = fs.readFileSync(file, "utf8");
    const hits = [];
    for (const source of examplePatterns) {
      const re = new RegExp(source, "g");
      let m;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(text))) {
        hits.push(m[0]);
        if (m[0] === "") re.lastIndex += 1; // guard a pattern that can match empty
      }
    }
    assert.deepEqual(hits, [], `${rel}: internal code(s) leaked into a shipped example: ${hits.join(", ")}`);
  });
}
