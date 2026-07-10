// Tests for the ported research gates against a synthetic fixture vault.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validateVault, validateBranch } from "../research/gates/branch.mjs";
import { validateAnalysis } from "../research/gates/analysis.mjs";

function note(fm, body = "") {
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(", ")}]` : v}`);
  return `---\n${lines.join("\n")}\n---\n${body}\n`;
}

function fixtureVault() {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-vault-"));
  const b = join(root, "MyTopic");
  mkdirSync(b, { recursive: true });
  writeFileSync(join(b, "MyTopic.md"), note({ title: "My Topic", type: "moc" }, "Notes: [[Note A]]"));
  writeFileSync(join(b, "_grounding.md"), note({ title: "Grounding", type: "source" }, "facts"));
  writeFileSync(join(b, "Note A.md"), note({ title: "Note A", type: "note" }, "see [[MyTopic]]"));
  return { root, b };
}

test("branch gate: a well-formed branch passes", () => {
  const { root } = fixtureVault();
  const r = validateVault(root, "MyTopic");
  assert.deepEqual(r.fails, []);
});

test("branch gate: cross-branch/broken link fails isolation", () => {
  const { root, b } = fixtureVault();
  writeFileSync(join(b, "Note A.md"), note({ title: "Note A", type: "note" }, "see [[SomeOtherBranch]]"));
  const { fails } = validateBranch(root, "MyTopic");
  assert.ok(fails.some((f) => f.includes("does not resolve inside this branch")));
});

test("branch gate: missing grounding + bad type fail", () => {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-vault-"));
  const b = join(root, "Bare");
  mkdirSync(b, { recursive: true });
  writeFileSync(join(b, "Bare.md"), note({ title: "Bare", type: "moc" }));
  writeFileSync(join(b, "Loose.md"), note({ title: "Loose", type: "weird" }));
  const { fails } = validateBranch(root, "Bare");
  assert.ok(fails.some((f) => f.includes("no grounding file")));
  assert.ok(fails.some((f) => f.includes("not one of")));
});

test("analysis gate: present + grounded passes; ungrounded/absent fail", () => {
  const { root, b } = fixtureVault();
  assert.ok(validateAnalysis(root, "MyTopic").fails.length); // no analysis yet

  writeFileSync(join(b, "Analysis-X.md"), note({ title: "Analysis X", type: "analysis" }, "verdict, per [[_grounding]]"));
  assert.deepEqual(validateAnalysis(root, "MyTopic").fails, []); // cites corpus

  writeFileSync(join(b, "Analysis-Y.md"), note({ title: "Analysis Y", type: "analysis" }, "floats free, no citation"));
  assert.ok(validateAnalysis(root, "MyTopic").fails.some((f) => f.includes("does not cite the branch")));
});
