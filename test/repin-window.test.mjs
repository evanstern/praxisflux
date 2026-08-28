// Tests for grounding-wiki/gates/repin-window.mjs — the "is this staleness red-by-construction
// or neglect?" test (spec 057 Phase 1).
//
// Every case builds a REAL git repo in a tmpdir, because the whole module is git semantics —
// a mock of `git log --not <base>` would test the mock. Each fixture makes a base branch, a
// note pinned to a base commit, and then varies only WHERE the staling commit lives.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { noteWindow, corpusWindow, staleNotesFrom, baseExists } from "../grounding-wiki/gates/repin-window.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** A repo with a `base` branch, one source file, and a note pinned to the base tip. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "repin-window-"));
  git(dir, "init", "-q", "-b", "base");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  mkdirSync(join(dir, "docs", "wiki"), { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "thing.mjs"), "// v1\n");
  writeFileSync(join(dir, "docs", "wiki", "INDEX.md"), "# index\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: source + index");
  const pin = git(dir, "rev-parse", "HEAD");
  // The note pins the commit above and lists the source whose change stales it.
  writeFileSync(
    join(dir, "docs", "wiki", "thing.md"),
    `---\nname: thing\ndescription: d\nkind: module\nsources:\n  - src/thing.mjs\nverified_against: ${pin}\n---\n\n# Thing\n`,
  );
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: note");
  return { dir, pin, note: { pin, sources: ["src/thing.mjs"] } };
}

const touchSource = (dir, msg, body) => {
  writeFileSync(join(dir, "src", "thing.mjs"), body);
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", msg);
};

test("repin-window: unmerged staling commit ⇒ INSIDE the window", () => {
  const { dir, note } = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  touchSource(dir, "task-1: edit the source", "// v2\n");

  const w = noteWindow(dir, { ...note, base: "base" });
  assert.equal(w.inside, true, w.reason);
  assert.equal(w.commits.length, 1);
  assert.match(w.reason, /1 unmerged commit\(s\)/);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: staleness already on the base branch ⇒ OUTSIDE (neglect, not mid-task)", () => {
  const { dir, note } = fixture();
  touchSource(dir, "base: edit the source without re-pinning", "// v2\n");

  // Stale by freshness arithmetic, but nothing unmerged explains it: this is the case the
  // window must NOT forgive.
  const w = noteWindow(dir, { ...note, base: "base" });
  assert.equal(w.inside, false);
  assert.match(w.reason, /already on base/);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: fresh note (nothing touched its sources) ⇒ OUTSIDE", () => {
  const { dir, note } = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  writeFileSync(join(dir, "unrelated.md"), "x\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "task-1: unrelated change");

  const w = noteWindow(dir, { ...note, base: "base" });
  assert.equal(w.inside, false);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: missing base ref ⇒ OUTSIDE, fail closed, reason names the ref", () => {
  const { dir, note } = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  touchSource(dir, "task-1: edit the source", "// v2\n");

  // Same tree as the INSIDE case; only the base ref is unresolvable. An unknown must never
  // open the window.
  const w = noteWindow(dir, { ...note, base: "origin/nope" });
  assert.equal(w.inside, false);
  assert.match(w.reason, /origin\/nope does not resolve/);
  assert.equal(baseExists(dir, "origin/nope"), false);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: a missing pin or empty sources ⇒ OUTSIDE, never a crash", () => {
  const { dir } = fixture();
  assert.equal(noteWindow(dir, { pin: null, sources: ["src/thing.mjs"], base: "base" }).inside, false);
  assert.equal(noteWindow(dir, { pin: "HEAD", sources: [], base: "base" }).inside, false);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: not a git repo ⇒ OUTSIDE, fail closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "repin-window-nogit-"));
  const w = noteWindow(dir, { pin: "abc123", sources: ["src/thing.mjs"], base: "base" });
  assert.equal(w.inside, false);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: per-note grain — one excused note does not forgive an unexcused sibling", () => {
  const { dir, pin } = fixture();
  // Second note, pinned to the same base commit, sourced on a DIFFERENT file that a base
  // commit stales. Its staleness is neglect and must survive the branch's excuse for note 1.
  writeFileSync(join(dir, "src", "other.mjs"), "// v1\n");
  writeFileSync(
    join(dir, "docs", "wiki", "other.md"),
    `---\nname: other\ndescription: d\nkind: module\nsources:\n  - src/other.mjs\nverified_against: ${pin}\n---\n\n# Other\n`,
  );
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: second note + its source");
  writeFileSync(join(dir, "src", "other.mjs"), "// v2 on base, never re-pinned\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: stale other.md without re-pinning");

  git(dir, "checkout", "-q", "-b", "task-1");
  touchSource(dir, "task-1: edit thing", "// v2\n");

  const { notes, allInside } = corpusWindow(dir, "docs/wiki", { base: "base" });
  const by = Object.fromEntries(notes.map((n) => [n.file, n.inside]));
  assert.equal(by["thing.md"], true, "branch work explains thing.md");
  assert.equal(by["other.md"], false, "other.md's staleness predates the branch");
  assert.equal(allInside, false, "one unexcused note must keep the corpus verdict shut");
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: corpusWindow honors `only` so it is asked about stale notes, not all notes", () => {
  const { dir } = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  touchSource(dir, "task-1: edit thing", "// v2\n");

  const only = new Set(["docs/wiki/thing.md"]);
  const { notes } = corpusWindow(dir, "docs/wiki", { base: "base", only });
  assert.deepEqual(notes.map((n) => n.file), ["thing.md"]);
  rmSync(dir, { recursive: true, force: true });
});

test("repin-window: staleNotesFrom parses freshness STALE lines and ignores other findings", () => {
  const stale = staleNotesFrom([
    "docs/wiki/a.md: STALE — sources changed since 38f7d25a (1 commit(s), e.g. abc1234 x)",
    "docs/wiki/b.md: no verified_against pin",
    "docs/wiki/c.md: STALE — sources changed since 99f1a2b3 (2 commit(s), e.g. def5678 y)",
  ]);
  assert.deepEqual([...stale].sort(), ["docs/wiki/a.md", "docs/wiki/c.md"]);
});
