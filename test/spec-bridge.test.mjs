import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseLinkedTask, findLinkedTasks, verdict, checkBridge, bridgeGate } from "../spec-bridge/gates/bridge.mjs";
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
  assert.deepEqual(linked, { id: "TASK-3", status: "In Progress", specDir: "specs/001-pay" });

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

test("a linked task whose spec dir was deleted derives To Do and blocks anything above it", () => {
  const p = project();
  try {
    p.task("TASK-9", "In Progress", "Spec: specs/005-gone/");
    const { problems } = checkBridge(p.root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /spec\.md missing/);
  } finally { p.done(); }
});
