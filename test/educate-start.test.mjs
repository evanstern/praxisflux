// educate:start plants AGENTS.md (with a CLAUDE.md pointer) — pin the template's new path and
// the skill's own prose so a future rename can't silently regress to CLAUDE.md-only (spec 074).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

test("educate's planted template lives at templates/AGENTS.md, not templates/CLAUDE.md", () => {
  assert.ok(existsSync(join(repo, "educate", "templates", "AGENTS.md")));
  assert.ok(!existsSync(join(repo, "educate", "templates", "CLAUDE.md")));
});

test("educate:start SKILL.md names AGENTS.md as the planted always-on file", () => {
  const skill = readFileSync(join(repo, "educate", "skills", "start", "SKILL.md"), "utf8");
  assert.match(skill, /templates\/AGENTS\.md/);
  assert.match(skill, /<root>\/AGENTS\.md/);
  assert.match(skill, /@AGENTS\.md/, "must plant the CLAUDE.md pointer");
  assert.doesNotMatch(skill, /templates\/CLAUDE\.md/);
});
