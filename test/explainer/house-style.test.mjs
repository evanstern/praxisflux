// Tests for `core/rules/house-style.json` and its writer-facing rendering
// at `skills/explainer/references/house-style.md`.
//
// These don't re-test the *check* behavior that consumes this file (that's
// scripts/test/check.test.mjs's job) — they test the file itself: its own
// shape, that no rule text leaks the operator-private phrasing or internal
// codes the dispatch note explicitly forbids, and that the writer-facing
// .md stays in sync with it by rule id.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { CHECK_IDS } from "../../explainer/scripts/lib/check.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const RULES_PATH = path.join(PLUGIN_ROOT, "core", "rules", "house-style.json");
const HOUSE_STYLE_MD_PATH = path.join(PLUGIN_ROOT, "skills", "explainer", "references", "house-style.md");

const KEBAB_ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function loadRules() {
  const doc = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  return doc;
}

/** Every `- \`<id>\` —` list item in house-style.md, in file order. */
function extractMarkdownIds(md) {
  const re = /^- `([a-z0-9-]+)`\s+—/gm;
  const ids = [];
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(md))) ids.push(m[1]);
  return ids;
}

test("core/rules/house-style.json: schema 1, every rule has a stable kebab-case id, text, and a valid applies_to", () => {
  const doc = loadRules();
  assert.equal(doc.schema, 1);
  assert.ok(Array.isArray(doc.rules) && doc.rules.length > 0);

  const seen = new Set();
  for (const rule of doc.rules) {
    assert.match(rule.id, KEBAB_ID_RE, `rule id "${rule.id}" is not kebab-case`);
    assert.ok(!seen.has(rule.id), `duplicate rule id "${rule.id}"`);
    seen.add(rule.id);
    assert.equal(typeof rule.text, "string");
    assert.ok(rule.text.length > 0);
    assert.ok(["writer", "check", "both"].includes(rule.applies_to), `rule "${rule.id}" has an invalid applies_to`);
    if (rule.check !== undefined) {
      assert.equal(typeof rule.check, "string");
    }
  }
});

test("core/rules/house-style.json: every rule carrying a check id names a real check", () => {
  const doc = loadRules();
  for (const rule of doc.rules) {
    if (rule.check === undefined) continue;
    assert.ok(CHECK_IDS.includes(rule.check), `rule "${rule.id}" declares check "${rule.check}", which lib/check.mjs doesn't define`);
  }
});

test("core/rules/house-style.json: no rule's own text leaks an internal ticket/task/decision-record code or operator-private phrasing", () => {
  const doc = loadRules();
  const forbidden = [/\bTASK-\d+/i, /\bVD\d+\b/, /\bE\d{1,2}[a-z]?\b/, /\bFR-\d+\b/, /\bthe operator\b/i];
  for (const rule of doc.rules) {
    for (const re of forbidden) {
      assert.ok(!re.test(rule.text), `rule "${rule.id}" text matches forbidden pattern ${re}: "${rule.text}"`);
    }
  }
});

test('house-style.json "no-internal-codes" rule carries a patterns[] list that actually matches a planted internal code', () => {
  const doc = loadRules();
  const rule = doc.rules.find((r) => r.id === "no-internal-codes");
  assert.ok(rule, 'no "no-internal-codes" rule found');
  assert.equal(rule.check, "fact.no-internal-codes");
  assert.ok(Array.isArray(rule.patterns) && rule.patterns.length > 0);

  const compiled = rule.patterns.map((source) => new RegExp(source));
  const plantedSamples = ["VD12", "TASK-12.6", "TASK-9"];
  for (const sample of plantedSamples) {
    assert.ok(
      compiled.some((re) => re.test(sample)),
      `no pattern in rule "no-internal-codes" matches planted sample "${sample}"`
    );
  }
});

test("skills/explainer/references/house-style.md: renders exactly the same rule ids as core/rules/house-style.json, no more and no fewer", () => {
  const doc = loadRules();
  const jsonIds = new Set(doc.rules.map((r) => r.id));
  const md = fs.readFileSync(HOUSE_STYLE_MD_PATH, "utf8");
  const mdIds = extractMarkdownIds(md);

  assert.ok(mdIds.length > 0, "found no `id` list items in house-style.md — check the extraction pattern or the file");
  const mdIdSet = new Set(mdIds);
  assert.equal(mdIds.length, mdIdSet.size, "house-style.md lists the same rule id more than once");

  const missingFromMd = [...jsonIds].filter((id) => !mdIdSet.has(id));
  const extraInMd = [...mdIdSet].filter((id) => !jsonIds.has(id));
  assert.deepEqual(missingFromMd, [], "rule ids in house-style.json but missing from house-style.md");
  assert.deepEqual(extraInMd, [], "rule ids in house-style.md but not in house-style.json");
});
