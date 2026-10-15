// Core ships inlined, verbatim, into every published page (shell.css/
// shell.js, every pattern's own .css/.js/.html — scripts/lib/shell.mjs's
// resolvePatterns()). A comment left with an internal ticket/task/decision
// code in any of those files reaches every artifact built from this plugin,
// not just the shipped examples (no-internal-codes-examples.test.mjs covers
// those). This test runs the same `no-internal-codes` patterns from
// `core/rules/house-style.json` directly against every `.js`/`.css`/`.html`
// file under `core/`, plus one extra core-only pattern for a bare decision
// id (`D3`, `D12`, ...) — never added to the page-level house-style rule,
// where "D3" and similar are plausible ordinary prose a reader might write.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const RULES_PATH = path.join(PLUGIN_ROOT, "core", "rules", "house-style.json");
const CORE_DIR = path.join(PLUGIN_ROOT, "core");

const CORE_ONLY_EXTRA_PATTERNS = ["\\bD\\d{1,2}\\b"];

/** 1-based line number of `index` within `text`. */
function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

/** Every `.js`/`.css`/`.html` file under `dir`, recursively. */
function findCoreFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findCoreFiles(full));
    } else if (entry.isFile() && /\.(js|css|html)$/.test(entry.name)) {
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

const corePatterns = [...loadNoInternalCodesPatterns(), ...CORE_ONLY_EXTRA_PATTERNS];
const coreFiles = findCoreFiles(CORE_DIR);

test("fixture sanity: core/ actually has .js/.css/.html files to check", () => {
  assert.ok(coreFiles.length > 0, "no core/**/*.{js,css,html} files found");
});

for (const file of coreFiles) {
  const rel = path.relative(PLUGIN_ROOT, file);

  test(`${rel}: carries no internal ticket/task/decision code (no-internal-codes)`, () => {
    const text = fs.readFileSync(file, "utf8");
    const hits = [];
    for (const source of corePatterns) {
      const re = new RegExp(source, "g");
      let m;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(text))) {
        hits.push(`${rel}:${lineOf(text, m.index)}: "${m[0]}"`);
        if (m[0] === "") re.lastIndex += 1; // guard a pattern that can match empty
      }
    }
    assert.deepEqual(hits, [], `internal code(s) leaked into core/:\n${hits.join("\n")}`);
  });
}
