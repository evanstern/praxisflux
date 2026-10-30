// research:research-vault plants AGENTS.md (with a CLAUDE.md pointer) — pin the template's new
// path and the skill's own prose so a future rename can't silently regress to CLAUDE.md-only
// (spec 074). analyze-vault and vault-artifact must accept either file name when reading a
// branch's conventions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

test("research's planted template lives at templates/AGENTS.md, not templates/CLAUDE.md", () => {
  assert.ok(existsSync(join(repo, "research", "templates", "AGENTS.md")));
  assert.ok(!existsSync(join(repo, "research", "templates", "CLAUDE.md")));
});

test("research-vault SKILL.md names AGENTS.md as the planted always-on file", () => {
  const skill = readFileSync(join(repo, "research", "skills", "research-vault", "SKILL.md"), "utf8");
  assert.match(skill, /templates\/AGENTS\.md/);
  assert.match(skill, /<vault>\/AGENTS\.md/);
  assert.match(skill, /@AGENTS\.md/, "must plant the CLAUDE.md pointer");
  assert.doesNotMatch(skill, /templates\/CLAUDE\.md/);
});

for (const [skillName, label] of [["analyze-vault", "analyze-vault"], ["vault-artifact", "vault-artifact"]]) {
  test(`${label} SKILL.md accepts AGENTS.md (or legacy CLAUDE.md) for branch conventions`, () => {
    const skill = readFileSync(join(repo, "research", "skills", skillName, "SKILL.md"), "utf8");
    assert.match(skill, /AGENTS\.md/);
  });
}
