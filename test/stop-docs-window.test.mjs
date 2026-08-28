// Tests for the window-aware half of scripts/stop-docs.mjs (spec 057 R4) and the warn/block
// split it rests on.
//
// The Stop gate must distinguish two states that look identical to freshness arithmetic:
//   mid-task  — the commits that staled the note are unmerged; the re-pin is owed later
//   neglect   — nothing on this branch explains the staleness
// The first NOTICES (turn ends), the second BLOCKS. Everything unknown blocks.
//
// These drive the decision through the real repin-window module against real git fixtures;
// stop-docs.mjs's own wiring (underRepo, the runStopHook plumbing) is covered in pdlc/gate
// suites and is not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { corpusWindow, staleNotesFrom } from "../grounding-wiki/gates/repin-window.mjs";
import { validateFreshness } from "../grounding-wiki/gates/freshness.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** A corpus with one note pinned to the base tip, plus the source that stales it. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "stop-window-"));
  git(dir, "init", "-q", "-b", "base");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  mkdirSync(join(dir, "docs", "wiki"), { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "thing.mjs"), "// v1\n");
  writeFileSync(join(dir, "docs", "wiki", "INDEX.md"), "# index\n\n- [[thing]] — t\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: source + index");
  const pin = git(dir, "rev-parse", "HEAD");
  writeFileSync(
    join(dir, "docs", "wiki", "thing.md"),
    `---\nname: thing\ndescription: d\nkind: module\nsources:\n  - src/thing.mjs\nverified_against: ${pin}\n---\n\n# Thing\n`,
  );
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: note");
  return dir;
}

const staleIt = (dir, msg) => {
  writeFileSync(join(dir, "src", "thing.mjs"), `// ${msg}\n`);
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", msg);
};

/** The decision stop-docs makes, reproduced from the same two inputs it uses. */
function decide(dir, base) {
  const { fails } = validateFreshness(dir, "docs/wiki");
  if (fails.length === 0) return "clean";
  const stale = staleNotesFrom(fails);
  if (stale.size === 0) return "block"; // failed for a non-staleness reason
  return corpusWindow(dir, "docs/wiki", { base, only: stale }).allInside ? "notice" : "block";
}

test("stop-docs window: stale from unmerged branch work ⇒ NOTICE (the turn may end)", () => {
  const dir = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  staleIt(dir, "task-1 edits the source");

  assert.equal(decide(dir, "base"), "notice");
  rmSync(dir, { recursive: true, force: true });
});

test("stop-docs window: stale with nothing unmerged to explain it ⇒ BLOCKS (neglect)", () => {
  const dir = fixture();
  staleIt(dir, "base edits the source and never re-pins");

  // Identical freshness arithmetic to the case above; only the provenance of the staling
  // commit differs. This is the case the window must never forgive.
  assert.equal(decide(dir, "base"), "block");
  rmSync(dir, { recursive: true, force: true });
});

test("stop-docs window: a non-staleness gate failure ⇒ BLOCKS (the window has no opinion)", () => {
  const dir = fixture();
  // A note with no pin fails the gate, but not with a STALE line. The window must not be
  // consulted, and must not launder the failure into a notice.
  writeFileSync(
    join(dir, "docs", "wiki", "unpinned.md"),
    "---\nname: unpinned\ndescription: d\nkind: module\nsources:\n  - src/thing.mjs\n---\n\n# Unpinned\n",
  );
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: note with no pin");

  const { fails } = validateFreshness(dir, "docs/wiki");
  assert.ok(fails.some((f) => /no verified_against/.test(f)));
  assert.equal(staleNotesFrom(fails).size, 0, "no STALE lines ⇒ window not consulted");
  assert.equal(decide(dir, "base"), "block");
  rmSync(dir, { recursive: true, force: true });
});

test("stop-docs window: one excused note does not forgive an unexcused sibling", () => {
  const dir = fixture();
  // A second note staled ON BASE (neglect), then a branch that stales the first (excused).
  writeFileSync(join(dir, "src", "other.mjs"), "// v1\n");
  const pin = git(dir, "rev-parse", "HEAD");
  writeFileSync(
    join(dir, "docs", "wiki", "other.md"),
    `---\nname: other\ndescription: d\nkind: module\nsources:\n  - src/other.mjs\nverified_against: ${pin}\n---\n\n# Other\n`,
  );
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: second note");
  writeFileSync(join(dir, "src", "other.mjs"), "// v2, never re-pinned\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base: stale other.md");

  git(dir, "checkout", "-q", "-b", "task-1");
  staleIt(dir, "task-1 edits thing");

  assert.equal(decide(dir, "base"), "block", "the unexcused sibling must still block");
  rmSync(dir, { recursive: true, force: true });
});

test("stop-docs window: unresolvable base ref ⇒ BLOCKS (fail closed, never open on unknowns)", () => {
  const dir = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  staleIt(dir, "task-1 edits the source");

  // Same tree that yields "notice" against a real base — only the base is unknowable.
  assert.equal(decide(dir, "origin/does-not-exist"), "block");
  rmSync(dir, { recursive: true, force: true });
});

test("stop-docs window: a fresh corpus is clean — no notice, no block", () => {
  const dir = fixture();
  git(dir, "checkout", "-q", "-b", "task-1");
  writeFileSync(join(dir, "unrelated.md"), "x\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "task-1: unrelated");

  assert.equal(decide(dir, "base"), "clean");
  rmSync(dir, { recursive: true, force: true });
});
