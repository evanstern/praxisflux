import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseLinkedTask, findLinkedTasks, verdict, checkBridge, planLinkedTask, planBridge, bridgeGate } from "../spec-bridge/gates/bridge.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

// evaluate() prefers CLAUDE_PROJECT_DIR over input.cwd; pin the fixture root explicitly.
function evalAt(root) {
  const saved = process.env.CLAUDE_PROJECT_DIR;
  process.env.CLAUDE_PROJECT_DIR = root;
  try { return evaluate({ stop_hook_active: false, cwd: root }, [bridgeGate]); }
  finally {
    if (saved === undefined) delete process.env.CLAUDE_PROJECT_DIR;
    else process.env.CLAUDE_PROJECT_DIR = saved;
  }
}

// A fixture project: backlog/tasks/*.md in Backlog.md's on-disk shape + a specs/ dir.
function project() {
  const root = mkdtempSync(join(tmpdir(), "spec-bridge-"));
  mkdirSync(join(root, "backlog", "tasks"), { recursive: true });
  return {
    root,
    task: (id, status, body) =>
      writeFileSync(
        join(root, "backlog", "tasks", `${id.toLowerCase()} - fixture.md`),
        `---\nid: ${id}\ntitle: 'Fixture ${id}'\nstatus: ${status}\nassignee: []\n---\n\n## Description\n\n${body}\n`
      ),
    spec: (dir, files) => {
      mkdirSync(join(root, dir), { recursive: true });
      for (const [name, content] of Object.entries(files)) writeFileSync(join(root, dir, name), content);
    },
    done: () => rmSync(root, { recursive: true, force: true }),
  };
}

const ALL_CHECKED = "## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [x] T002 b\n";
const HALF_CHECKED = "## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [ ] T002 b\n";

test("parseLinkedTask extracts id, status, and the Spec marker; others parse to null", () => {
  const linked = parseLinkedTask("---\nid: TASK-3\nstatus: In Progress\n---\n\nOutcome text.\n\nSpec: specs/001-pay/\n");
  assert.deepEqual(linked, { id: "TASK-3", status: "In Progress", specDir: "specs/001-pay", acs: [] });

  const withAcs = parseLinkedTask(
    "---\nid: TASK-5\nstatus: To Do\n---\n\nSpec: specs/003-c/\n\n## Acceptance Criteria\n" +
    "<!-- AC:BEGIN -->\n- [ ] #1 Human criterion\n- [x] #2 Spec phase: Setup\n<!-- AC:END -->\n"
  );
  assert.deepEqual(withAcs.acs, [
    { index: 1, checked: false, text: "Human criterion" },
    { index: 2, checked: true, text: "Spec phase: Setup" },
  ]);

  assert.equal(parseLinkedTask("---\nid: TASK-4\nstatus: Done\n---\n\nNo marker here."), null);
  assert.equal(parseLinkedTask("not a task file at all"), null);
  assert.equal(parseLinkedTask("The word Spec: specs/x mid-line does not count"), null);
});

test("findLinkedTasks scans backlog/tasks and returns only marked tasks", () => {
  const p = project();
  try {
    p.task("TASK-1", "To Do", "Spec: specs/001-a/");
    p.task("TASK-2", "Done", "just a normal task");
    p.task("TASK-3", "In Progress", "Text first.\n\nSpec: specs/002-b");
    const found = findLinkedTasks(p.root);
    assert.deepEqual(found.map((t) => [t.id, t.specDir]), [["TASK-1", "specs/001-a"], ["TASK-3", "specs/002-b"]]);
    assert.deepEqual(findLinkedTasks(join(p.root, "nowhere")), []);
  } finally { p.done(); }
});

test("verdict ranks task status against derived status", () => {
  assert.equal(verdict("Done", "Done-eligible"), "ok");
  assert.equal(verdict("Done", "In Progress"), "exceeds");
  assert.equal(verdict("In Progress", "To Do"), "exceeds");
  assert.equal(verdict("To Do", "In Progress"), "lags");
  assert.equal(verdict("In Progress", "Done-eligible"), "lags");
  assert.equal(verdict("in progress", "In Progress"), "ok"); // case-insensitive
  assert.equal(verdict("Blocked", "In Progress"), "unknown"); // custom workflow: don't guess
});

test("checkBridge blocks status that exceeds artifacts, naming task, spec, and shortfall", () => {
  const p = project();
  try {
    p.task("TASK-5", "Done", "Spec: specs/001-pay/");
    p.spec("specs/001-pay", { "spec.md": "# S", "plan.md": "# P", "tasks.md": HALF_CHECKED });
    const { problems, warnings } = checkBridge(p.root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /TASK-5/);
    assert.match(problems[0], /specs\/001-pay/);
    assert.match(problems[0], /1 of 2 tasks unchecked/);
    assert.equal(warnings.length, 0);
  } finally { p.done(); }
});

test("checkBridge blocks Done over a missing plan.md even with all boxes checked", () => {
  const p = project();
  try {
    p.task("TASK-6", "Done", "Spec: specs/002-x/");
    p.spec("specs/002-x", { "spec.md": "# S", "tasks.md": ALL_CHECKED });
    const { problems } = checkBridge(p.root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /plan\.md missing/);
  } finally { p.done(); }
});

test("lagging status warns but never blocks; agreeing status is silent", () => {
  const p = project();
  try {
    p.task("TASK-7", "To Do", "Spec: specs/003-l/"); // spec started -> lags
    p.spec("specs/003-l", { "spec.md": "# S" });
    p.task("TASK-8", "Done", "Spec: specs/004-ok/"); // fully proven -> ok
    p.spec("specs/004-ok", { "spec.md": "# S", "plan.md": "# P", "tasks.md": ALL_CHECKED });
    const { problems, warnings } = checkBridge(p.root);
    assert.equal(problems.length, 0);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /TASK-7/);
    assert.match(warnings[0], /sync/);
  } finally { p.done(); }
});

test("Stop hook via gate-runner: blocks on exceed, allows and warns on lag, no-op without backlog/", () => {
  const p = project();
  try {
    // no-op: a dir with no backlog/ anywhere resolves no roots
    const bare = mkdtempSync(join(tmpdir(), "spec-bridge-bare-"));
    try {
      const r = evalAt(bare);
      assert.equal(r.block, false);
      assert.equal(r.warnings, "");
    } finally { rmSync(bare, { recursive: true, force: true }); }

    // exceed blocks, message names task and shortfall
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "# S", "plan.md": "# P", "tasks.md": HALF_CHECKED });
    let r = evalAt(p.root);
    assert.equal(r.block, true);
    assert.match(r.message, /TASK-1/);
    assert.match(r.message, /unchecked/);

    // fix the status: lag scenario elsewhere warns but allows the stop
    p.task("TASK-1", "In Progress", "Spec: specs/001-a/");
    p.task("TASK-2", "To Do", "Spec: specs/002-b/");
    p.spec("specs/002-b", { "spec.md": "# S" });
    r = evalAt(p.root);
    assert.equal(r.block, false);
    assert.match(r.warnings, /TASK-2/);

    // stop_hook_active short-circuits (no infinite block loops)
    process.env.CLAUDE_PROJECT_DIR = p.root;
    try {
      p.task("TASK-1", "Done", "Spec: specs/001-a/");
      assert.equal(evaluate({ stop_hook_active: true }, [bridgeGate]).block, false);
    } finally { delete process.env.CLAUDE_PROJECT_DIR; }
  } finally { p.done(); }
});

test("strictDone config: gate blocks Done over a missing or CRITICAL-bearing analysis.md", () => {
  const p = project();
  try {
    p.task("TASK-10", "Done", "Spec: specs/006-s/");
    p.spec("specs/006-s", { "spec.md": "# S", "plan.md": "# P", "tasks.md": ALL_CHECKED });

    // without config: checkbox-only mode, Done is proven
    assert.equal(checkBridge(p.root).problems.length, 0);

    // strict: no analysis.md -> block, message says how to fix
    writeFileSync(join(p.root, ".spec-bridge.json"), '{ "strictDone": true }');
    let { problems } = checkBridge(p.root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /analysis\.md missing/);
    assert.match(problems[0], /speckit\.analyze/);

    // strict: unresolved CRITICAL -> block, finding named
    p.spec("specs/006-s", { "analysis.md": "| C1 | CRITICAL | payment race condition |" });
    ({ problems } = checkBridge(p.root));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /payment race condition/);

    // clean report -> proven
    p.spec("specs/006-s", { "analysis.md": "no blocking findings" });
    assert.equal(checkBridge(p.root).problems.length, 0);
  } finally { p.done(); }
});

test("a linked task whose spec dir was deleted derives To Do and blocks anything above it", () => {
  const p = project();
  try {
    p.task("TASK-9", "In Progress", "Spec: specs/005-gone/");
    const { problems } = checkBridge(p.root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /spec\.md missing/);
  } finally { p.done(); }
});

/* ── plan: the deterministic sync backbone (TASK-9.7) ─────────── */

const AC = (lines) => `## Acceptance Criteria\n<!-- AC:BEGIN -->\n${lines.join("\n")}\n<!-- AC:END -->`;

test("plan: a lagging task gets a status move, mirrored phase ACs at post-edit indexes, one note", () => {
  const p = project();
  try {
    p.task("TASK-1", "To Do", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": HALF_CHECKED });
    const { commands, skipped } = planBridge(p.root);
    assert.deepEqual(skipped, []);
    assert.deepEqual(commands, [
      "backlog task edit TASK-1 -s 'In Progress'",
      "backlog task edit TASK-1 --ac 'Spec phase: Setup'",
      "backlog task edit TASK-1 --ac 'Spec phase: Core'",
      "backlog task edit TASK-1 --check-ac 1", // Setup is 1/1; Core (index 2) stays unchecked
      "backlog task edit TASK-1 --append-notes 'spec-bridge sync: Setup: 1/1 · Core: 0/1 — status To Do → In Progress'",
    ]);
  } finally { p.done(); }
});

test("plan: Done-eligible plans '-s Done' with the derived final summary — the only path to Done", () => {
  const p = project();
  try {
    p.task("TASK-2", "In Progress", `Spec: specs/002-b/\n\n${AC(["- [x] #1 Spec phase: Setup", "- [x] #2 Spec phase: Core"])}`);
    p.spec("specs/002-b", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_CHECKED });
    const { commands } = planBridge(p.root);
    assert.equal(commands.length, 2);
    assert.match(commands[0], /^backlog task edit TASK-2 -s 'Done' --final-summary 'All spec tasks complete \(Setup: 1\/1 · Core: 1\/1\)\. Derived Done by spec-bridge sync\.'$/);
    assert.match(commands[1], /--append-notes .*status In Progress → Done/);
  } finally { p.done(); }
});

test("plan: post-regeneration re-mirror — stale phase ACs removed highest-first, human ACs untouched", () => {
  const p = project();
  try {
    // tasks.md was regenerated: "Old" phase is gone, "Core" is new, Setup went back to unchecked.
    p.task("TASK-3", "In Progress", `Spec: specs/003-c/\n\n${AC([
      "- [ ] #1 Human criterion",
      "- [x] #2 Spec phase: Old",
      "- [x] #3 Spec phase: Setup",
      "- [x] #4 Spec phase: Old",
    ])}`);
    p.spec("specs/003-c", { "spec.md": "s", "plan.md": "p", "tasks.md": "## Setup\n- [ ] T1 a\n\n## Core\n- [ ] T2 b\n" });
    const { commands } = planBridge(p.root);
    assert.deepEqual(commands, [
      "backlog task edit TASK-3 --remove-ac 4", // highest index first, so 2 stays valid
      "backlog task edit TASK-3 --remove-ac 2",
      "backlog task edit TASK-3 --ac 'Spec phase: Core'",
      "backlog task edit TASK-3 --uncheck-ac 2", // Setup renumbered to 2 after removals; human AC stays 1, untouched
      "backlog task edit TASK-3 --append-notes 'spec-bridge sync: Setup: 0/1 · Core: 0/1'",
    ]);
    assert.ok(!commands.some((c) => c.includes("Human criterion") || / 1$/.test(c)), "human AC must never be touched");
  } finally { p.done(); }
});

test("plan: reconciled board is a no-op; unknown statuses are skipped, never guessed", () => {
  const p = project();
  try {
    p.task("TASK-4", "In Progress", `Spec: specs/004-d/\n\n${AC(["- [x] #1 Spec phase: Setup", "- [ ] #2 Spec phase: Core"])}`);
    p.spec("specs/004-d", { "spec.md": "s", "plan.md": "p", "tasks.md": HALF_CHECKED });
    p.task("TASK-5", "Blocked", "Spec: specs/004-d/");
    const { commands, skipped } = planBridge(p.root);
    assert.deepEqual(commands, [], `reconciled board must plan nothing, got: ${commands}`);
    assert.deepEqual(skipped, [{ id: "TASK-5", status: "Blocked" }]);
  } finally { p.done(); }
});

test("plan: shell quoting survives apostrophes in phase names and notes", () => {
  const p = project();
  try {
    p.task("TASK-6", "To Do", "Spec: specs/005-e/");
    p.spec("specs/005-e", { "spec.md": "s", "plan.md": "p", "tasks.md": "## Author's pass\n- [ ] T1 a\n" });
    const { commands } = planBridge(p.root);
    assert.ok(commands.some((c) => c.includes(`--ac 'Spec phase: Author'\\''s pass'`)), commands.join("\n"));
  } finally { p.done(); }
});
