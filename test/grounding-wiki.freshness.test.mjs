// grounding-wiki.freshness.test.mjs — the freshness gate against a throwaway git repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { validateFreshness, parseSourcesBlock } from "../grounding-wiki/gates/freshness.mjs";

const GIT_ID = ["-c", "user.email=test@test", "-c", "user.name=test"];
function git(cwd, ...args) {
  return execFileSync("git", [...GIT_ID, ...args], { cwd, encoding: "utf8" }).trim();
}

function note({ name, pin, sources, extra = "" }) {
  const src = sources.map((s) => `  - ${s}`).join("\n");
  return `---\nname: ${name}\ndescription: test note\nkind: component\nsources:\n${src}\nverified_against: ${pin}\n---\n\n# ${name}\n\nBody.\n${extra}\n`;
}

function makeRepo() {
  const repo = mkdtempSync(join(tmpdir(), "gw-test-"));
  git(repo, "init", "-q");
  mkdirSync(join(repo, "src"), { recursive: true });
  writeFileSync(join(repo, "src", "a.txt"), "one\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "c1");
  mkdirSync(join(repo, "docs", "wiki"), { recursive: true });
  writeFileSync(join(repo, "docs", "wiki", "INDEX.md"), "# index\n- [alpha](alpha.md)\n");
  return repo;
}

test("fresh corpus passes; broken wikilinks only warn", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["src/a.txt"], extra: "See [[missing]].\n" }));

  const r = validateFreshness(repo, "docs/wiki");
  assert.equal(r.fails.length, 0, JSON.stringify(r.fails));
  assert.equal(r.checked, 1);
  assert.ok(r.warns.some((w) => w.includes("[[missing]]")), "broken link should warn");
});

test("a note goes stale when its sources change after the pin", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["src/a.txt"] }));
  writeFileSync(join(repo, "docs", "wiki", "beta.md"),
    note({ name: "beta", pin, sources: ["src/other.txt"] }));

  writeFileSync(join(repo, "src", "a.txt"), "two\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "c2");

  const r = validateFreshness(repo, "docs/wiki");
  assert.equal(r.fails.length, 1, JSON.stringify(r.fails));
  assert.ok(r.fails[0].includes("alpha.md") && r.fails[0].includes("STALE"));
});

test("missing pin, unknown pin, and missing INDEX are failures", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    "---\nname: alpha\ndescription: d\nkind: component\n---\n\n# alpha\n");
  writeFileSync(join(repo, "docs", "wiki", "beta.md"),
    note({ name: "beta", pin: "0000000000000000000000000000000000000000", sources: ["src/a.txt"] }));

  const r = validateFreshness(repo, "docs/wiki");
  assert.ok(r.fails.some((f) => f.includes("alpha.md") && f.includes("no verified_against")));
  assert.ok(r.fails.some((f) => f.includes("beta.md") && f.includes("not a known commit")));

  const r2 = validateFreshness(repo, "docs/nowhere");
  assert.ok(r2.fails.some((f) => f.includes("not a corpus")));
});

test("parseSourcesBlock reads YAML block lists and stops at the next key", () => {
  const text = "---\nname: x\nsources:\n  - a/b.go\n  - c d.go\nverified_against: abc\n---\nbody";
  assert.deepEqual(parseSourcesBlock(text), ["a/b.go", "c d.go"]);
  assert.deepEqual(parseSourcesBlock("---\nname: x\n---\nbody"), []);
});
