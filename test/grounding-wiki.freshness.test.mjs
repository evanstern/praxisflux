// grounding-wiki.freshness.test.mjs — the freshness gate against a throwaway git repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { validateFreshness, parseSourcesBlock, noteSources, classifyNote, planFreshness } from "../grounding-wiki/gates/freshness.mjs";
import { repin } from "../grounding-wiki/scripts/repin.mjs";

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
  writeFileSync(join(repo, "src", "b.txt"), "stable\n");
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
    note({ name: "beta", pin, sources: ["src/b.txt"] }));

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

/* ── gate holes: missing sources + inline-array sources (TASK-59) ─────── */

test("a source path missing from the working tree is a blocking finding naming note + path", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["src/a.txt", "no-such-file.txt"] }));

  const r = validateFreshness(repo, "docs/wiki");
  assert.equal(r.fails.length, 1, JSON.stringify(r.fails));
  assert.ok(r.fails[0].includes("alpha.md") && r.fails[0].includes("no-such-file.txt"),
    "the finding names the note and the missing path");

  // plan refuses to plan over it — the same hole surfaced as a problem, not a re-pin
  const { entries, problems } = planFreshness(repo, "docs/wiki");
  assert.deepEqual(entries, []);
  assert.ok(problems.some((p) => p.includes("alpha.md") && p.includes("no-such-file.txt")),
    JSON.stringify(problems));
});

test("a source renamed/deleted after the pin blocks until the note's sources are fixed", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["src/a.txt"] }));
  git(repo, "mv", "src/a.txt", "src/renamed.txt");
  git(repo, "commit", "-qm", "rename a.txt");

  const r = validateFreshness(repo, "docs/wiki");
  assert.ok(r.fails.some((f) => f.includes("alpha.md") && f.includes("src/a.txt") && f.includes("missing")),
    JSON.stringify(r.fails));

  // correcting the note's sources (and re-verifying) is the named fix
  const head = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin: head, sources: ["src/renamed.txt"] }));
  assert.deepEqual(validateFreshness(repo, "docs/wiki").fails, []);
});

test("inline-array sources: [a, b] staleness-check exactly like block lists", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  const inlineNote = (p) =>
    `---\nname: alpha\ndescription: test note\nkind: component\nsources: [src/a.txt, src/b.txt]\nverified_against: ${p}\n---\n\n# alpha\n\nBody.\n`;
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"), inlineNote(pin));

  const fresh = validateFreshness(repo, "docs/wiki");
  assert.deepEqual(fresh.fails, [], JSON.stringify(fresh.fails));
  assert.ok(!fresh.warns.some((w) => w.includes("no sources listed")),
    "inline sources are seen — no 'no sources' warn");

  writeFileSync(join(repo, "src", "a.txt"), "two\n");
  git(repo, "add", "."); git(repo, "commit", "-qm", "c2");
  const stale = validateFreshness(repo, "docs/wiki");
  assert.equal(stale.fails.length, 1, JSON.stringify(stale.fails));
  assert.ok(stale.fails[0].includes("alpha.md") && stale.fails[0].includes("STALE"));

  // plan sees inline sources too
  const { entries } = planFreshness(repo, "docs/wiki");
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].files.map((f) => f.path), ["src/a.txt"]);
});

test("noteSources: inline arrays via parseFrontmatter, block lists via parseSourcesBlock", () => {
  assert.deepEqual(noteSources("---\nname: x\nsources: [a/b.go, c d.go]\n---\nbody"), ["a/b.go", "c d.go"]);
  assert.deepEqual(noteSources("---\nname: x\nsources:\n  - a/b.go\n---\nbody"), ["a/b.go"]);
  assert.deepEqual(noteSources("---\nname: x\nsources: []\n---\nbody"), []);
});

test("parseSourcesBlock reads YAML block lists and stops at the next key", () => {
  const text = "---\nname: x\nsources:\n  - a/b.go\n  - c d.go\nverified_against: abc\n---\nbody";
  assert.deepEqual(parseSourcesBlock(text), ["a/b.go", "c d.go"]);
  assert.deepEqual(parseSourcesBlock("---\nname: x\n---\nbody"), []);
});

/* ── plan: computed re-pins vs review work (TASK-21) ──────────── */

test("classifyNote: only pure version-stamp diffs against version-free notes are RE-PIN", () => {
  const stamps = ['  "version": "0.6.4",', "version: 0.1.2", "        npx --yes @praxisflux/gates@0.6.4 \\"];
  assert.equal(classifyNote(stamps, "# note\n\nProse without numbers.\n").cls, "REPIN");
  // note quotes a version (even in backticks — raw body scan, deliberately)
  assert.equal(classifyNote(stamps, "Marketplace version at this commit: `0.6.3`.").cls, "REVIEW");
  // any non-stamp changed line
  assert.equal(classifyNote(["const x = 1;", 'version: 1.2.3'], "prose").cls, "REVIEW");
  // unreadable diff defaults to REVIEW — the planner never claims what it can't prove
  assert.equal(classifyNote([], "prose").cls, "REVIEW");
});

test("plan: stamp-only staleness plans a re-pin; running it leaves the gate green", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeFileSync(join(repo, "plugin.json"), '{ "name": "x", "version": "0.1.0" }\n');
  git(repo, "add", "."); git(repo, "commit", "-qm", "add plugin.json");
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["plugin.json"] }));
  writeFileSync(join(repo, "plugin.json"), '{ "name": "x", "version": "0.2.0" }\n');
  git(repo, "add", "."); git(repo, "commit", "-qm", "bump");

  const { head, entries, problems } = planFreshness(repo, "docs/wiki");
  assert.deepEqual(problems, []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].cls, "REPIN", entries[0].reason);
  assert.equal(entries[0].commits, 1);
  assert.deepEqual(entries[0].files.map((f) => f.path), ["plugin.json"]);

  const old = repin(entries[0].absPath, head); // the emitted edit, run verbatim
  assert.equal(old, pin);
  assert.equal(validateFreshness(repo, "docs/wiki").fails.length, 0, "gate must be green after the planned re-pin");
  assert.deepEqual(planFreshness(repo, "docs/wiki").entries, [], "re-plan must be empty (idempotent)");
});

test("plan: code diffs and version-quoting notes are NEEDS-REVIEW with a work order", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["src/a.txt"] }));
  writeFileSync(join(repo, "src", "a.txt"), "two\n"); // a real content change
  git(repo, "add", "."); git(repo, "commit", "-qm", "content change");

  const { entries } = planFreshness(repo, "docs/wiki");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].cls, "REVIEW");
  assert.match(entries[0].reason, /beyond version stamps/);
  assert.deepEqual(entries[0].files, [{ path: "src/a.txt", plus: 1, minus: 1 }]);
});

test("plan: a fresh corpus plans nothing; structural problems surface instead of being planned over", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"),
    note({ name: "alpha", pin, sources: ["src/a.txt"] }));
  assert.deepEqual(planFreshness(repo, "docs/wiki").entries, []);

  writeFileSync(join(repo, "docs", "wiki", "beta.md"),
    note({ name: "beta", pin: "0000000000000000000000000000000000000000", sources: ["src/a.txt"] }));
  const { problems } = planFreshness(repo, "docs/wiki");
  assert.ok(problems.some((p) => p.includes("beta.md") && p.includes("not a known commit")));
});

test("repin: refuses short hashes, missing notes, and pinless files", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const pin = git(repo, "rev-parse", "HEAD");
  const notePath = join(repo, "docs", "wiki", "alpha.md");
  writeFileSync(notePath, note({ name: "alpha", pin, sources: ["src/a.txt"] }));
  assert.throws(() => repin(notePath, "abc123"), /full 40-char/);
  assert.throws(() => repin(join(repo, "nope.md"), pin), /no such note/);
  writeFileSync(join(repo, "docs", "wiki", "raw.md"), "no frontmatter");
  assert.throws(() => repin(join(repo, "docs", "wiki", "raw.md"), pin), /no verified_against/);
});
