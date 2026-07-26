// phase-status.test.mjs — TASK-34 additive coverage: the derivation stage ladder, the
// opt-in phase-level status vocabulary (.spec-bridge.json statusVocabulary), the bridge
// gate at phase granularity, and — load-bearing — config-absent parity with the 3-status
// contract. Everything here is NEW surface; the pre-existing spec-derive / spec-bridge
// tests stay untouched and must keep passing as-is.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { deriveSpecState, coarseStatus, STATUS, STAGE, STAGES } from "../lib/spec-derive.mjs";
import {
  vocabularyProfile, stageVerdict, verdict, checkBridge, planBridge, bridgeGate,
  DEFAULT_STAGE_NAMES,
} from "../spec-bridge/gates/bridge.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

/* ── fixtures (same shapes as the pre-existing spec-bridge tests) ────────── */

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "phase-status-"));
  return { dir, put: (name, body) => writeFileSync(join(dir, name), body), done: () => rmSync(dir, { recursive: true, force: true }) };
}

function project() {
  const root = mkdtempSync(join(tmpdir(), "phase-status-proj-"));
  mkdirSync(join(root, "backlog", "tasks"), { recursive: true });
  return {
    root,
    config: (obj) => writeFileSync(join(root, ".spec-bridge.json"), JSON.stringify(obj)),
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

function evalAt(root) {
  const saved = process.env.CLAUDE_PROJECT_DIR;
  process.env.CLAUDE_PROJECT_DIR = root;
  try { return evaluate({ stop_hook_active: false, cwd: root }, [bridgeGate]); }
  finally {
    if (saved === undefined) delete process.env.CLAUDE_PROJECT_DIR;
    else process.env.CLAUDE_PROJECT_DIR = saved;
  }
}

const EARLY_WORK = "## Spec\n- [x] T1 a\n\n## Implement\n- [ ] T2 b\n\n## Prove\n- [ ] T3 c\n"; // implementing
const FINAL_ONLY = "## Spec\n- [x] T1 a\n\n## Implement\n- [x] T2 b\n\n## Prove\n- [ ] T3 c\n"; // validating
const ALL_DONE = "## Spec\n- [x] T1 a\n\n## Implement\n- [x] T2 b\n\n## Prove\n- [x] T3 c\n"; // reviewing

const VOCAB = {
  statusVocabulary: {
    specifying: "To Do",
    planning: "Planning",
    implementing: "In Progress",
    validating: "Validating",
    reviewing: "In Review",
  },
};

/* ── the stage ladder (derivation) ───────────────────────────────────────── */

test("stage ladder: specifying → planning → implementing → validating → reviewing", () => {
  const s = scratch();
  try {
    const at = () => deriveSpecState(s.dir);
    assert.equal(at().stage, STAGE.SPECIFYING); // nothing authored

    s.put("spec.md", "# Spec");
    assert.equal(at().stage, STAGE.PLANNING); // past Specifying

    s.put("plan.md", "# Plan");
    assert.equal(at().stage, STAGE.IMPLEMENTING); // past Planning, no tasks yet

    s.put("tasks.md", EARLY_WORK);
    assert.equal(at().stage, STAGE.IMPLEMENTING); // unchecked work before the final phase

    s.put("tasks.md", FINAL_ONLY);
    assert.equal(at().stage, STAGE.VALIDATING); // only the final phase remains

    s.put("tasks.md", ALL_DONE);
    assert.equal(at().stage, STAGE.REVIEWING); // everything proven
    assert.equal(at().status, STATUS.DONE_ELIGIBLE); // Done-eligibility unchanged
  } finally { s.done(); }
});

test("stage ladder: a single-phase tasks.md never reads as validating", () => {
  const s = scratch();
  try {
    s.put("spec.md", "# Spec");
    s.put("plan.md", "# Plan");
    s.put("tasks.md", "- [x] T1 a\n- [ ] T2 b\n"); // one synthetic phase
    assert.equal(deriveSpecState(s.dir).stage, STAGE.IMPLEMENTING);
    s.put("tasks.md", "- [x] T1 a\n- [x] T2 b\n");
    assert.equal(deriveSpecState(s.dir).stage, STAGE.REVIEWING);
  } finally { s.done(); }
});

test("stage ladder: strict mode holds an all-checked spec at validating until analysis is clean", () => {
  const s = scratch();
  try {
    const strict = { requireAnalysis: true };
    s.put("spec.md", "# Spec");
    s.put("plan.md", "# Plan");
    s.put("tasks.md", ALL_DONE);

    let state = deriveSpecState(s.dir, strict);
    assert.equal(state.stage, STAGE.VALIDATING); // analysis.md missing
    assert.equal(state.status, STATUS.IN_PROGRESS);

    s.put("analysis.md", "| C1 | CRITICAL | payment race condition |");
    assert.equal(deriveSpecState(s.dir, strict).stage, STAGE.VALIDATING);

    s.put("analysis.md", "no blocking findings");
    state = deriveSpecState(s.dir, strict);
    assert.equal(state.stage, STAGE.REVIEWING);
    assert.equal(state.status, STATUS.DONE_ELIGIBLE);
  } finally { s.done(); }
});

test("parity by construction: status is always the fixed collapse of the stage", () => {
  assert.deepEqual(STAGES.map(coarseStatus), [
    STATUS.TODO, STATUS.IN_PROGRESS, STATUS.IN_PROGRESS, STATUS.IN_PROGRESS, STATUS.DONE_ELIGIBLE,
  ]);
  const s = scratch();
  try {
    const check = () => {
      const state = deriveSpecState(s.dir);
      assert.equal(state.status, coarseStatus(state.stage));
      const strictState = deriveSpecState(s.dir, { requireAnalysis: true });
      assert.equal(strictState.status, coarseStatus(strictState.stage));
    };
    check();
    s.put("spec.md", "# Spec"); check();
    s.put("plan.md", "# Plan"); check();
    for (const body of [EARLY_WORK, FINAL_ONLY, ALL_DONE]) { s.put("tasks.md", body); check(); }
    s.put("analysis.md", "clean"); check();
  } finally { s.done(); }
});

/* ── the opt-in vocabulary profile ───────────────────────────────────────── */

test("vocabularyProfile: absent, malformed, or rename-free config opts out (null)", () => {
  assert.equal(vocabularyProfile({}), null);
  assert.equal(vocabularyProfile({ strictDone: true }), null);
  assert.equal(vocabularyProfile({ statusVocabulary: null }), null);
  assert.equal(vocabularyProfile({ statusVocabulary: "Validating" }), null);
  assert.equal(vocabularyProfile({ statusVocabulary: ["Validating"] }), null);
  assert.equal(vocabularyProfile({ statusVocabulary: {} }), null);
  // unknown stage keys and non-string values are ignored, never guessed
  assert.equal(vocabularyProfile({ statusVocabulary: { bogus: "X", implementing: 7, validating: " " } }), null);
});

test("vocabularyProfile: partial maps overlay the defaults; cover spans merge same-named stages", () => {
  const p = vocabularyProfile({ statusVocabulary: { validating: "Validating" } });
  assert.equal(p.names[STAGE.VALIDATING], "Validating");
  assert.equal(p.names[STAGE.IMPLEMENTING], DEFAULT_STAGE_NAMES[STAGE.IMPLEMENTING]); // untouched default
  assert.deepEqual(p.cover.get("in progress"), { min: 1, max: 2 }); // planning + implementing
  assert.deepEqual(p.cover.get("validating"), { min: 3, max: 3 });
  assert.deepEqual(p.cover.get("done"), { min: 4, max: 4 }); // Done always covers the top stage
});

test("stageVerdict: exceeds/lags/ok/unknown at phase grain, Done semantics unchanged", () => {
  const p = vocabularyProfile(VOCAB);
  assert.equal(stageVerdict("In Review", STAGE.VALIDATING, p), "exceeds");
  assert.equal(stageVerdict("Validating", STAGE.IMPLEMENTING, p), "exceeds");
  assert.equal(stageVerdict("Planning", STAGE.PLANNING, p), "ok");
  assert.equal(stageVerdict("validating", STAGE.VALIDATING, p), "ok"); // case-insensitive
  assert.equal(stageVerdict("In Progress", STAGE.VALIDATING, p), "lags");
  assert.equal(stageVerdict("To Do", STAGE.PLANNING, p), "lags");
  assert.equal(stageVerdict("Done", STAGE.REVIEWING, p), "ok"); // Done-eligibility unchanged
  assert.equal(stageVerdict("In Review", STAGE.REVIEWING, p), "ok"); // all-checked-unmerged = review stage
  assert.equal(stageVerdict("Done", STAGE.VALIDATING, p), "exceeds");
  assert.equal(stageVerdict("Blocked", STAGE.IMPLEMENTING, p), "unknown"); // custom: don't guess
});

test("stageVerdict on an unrenamed vocabulary reproduces verdict() over every combination", () => {
  // reviewing→"Done" IS the default name, so this profile is defaults-only: the fine ruler
  // must agree with the coarse one everywhere — the parity contract behind "absent config
  // = today's behavior".
  const p = vocabularyProfile({ statusVocabulary: { reviewing: "Done" } });
  for (const status of ["To Do", "In Progress", "Done", "done", "Blocked", ""])
    for (const stage of STAGES)
      assert.equal(
        stageVerdict(status, stage, p), verdict(status, coarseStatus(stage)),
        `disagree at status="${status}" stage="${stage}"`
      );
});

/* ── the gate at phase granularity ───────────────────────────────────────── */

test("opt-in gate: a status mapping to a later stage than the artifacts prove blocks, naming task/spec/shortfall", () => {
  const p = project();
  try {
    p.config(VOCAB);
    p.task("TASK-1", "In Review", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": FINAL_ONLY });
    const { problems, warnings } = checkBridge(p.root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /TASK-1/);
    assert.match(problems[0], /specs\/001-a/);
    assert.match(problems[0], /only proves "Validating"/);
    assert.match(problems[0], /1 of 3 tasks unchecked \(Spec: 1\/1 · Implement: 1\/1 · Prove: 0\/1\)/);
    assert.equal(warnings.length, 0);
  } finally { p.done(); }
});

test("opt-in gate: lagging warns naming the finer derived name; agreeing is silent; unmapped statuses stay unknown", () => {
  const p = project();
  try {
    p.config(VOCAB);
    p.task("TASK-1", "In Progress", "Spec: specs/001-a/"); // artifacts already validate → lags
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": FINAL_ONLY });
    p.task("TASK-2", "Validating", "Spec: specs/002-b/"); // agrees → silent
    p.spec("specs/002-b", { "spec.md": "s", "plan.md": "p", "tasks.md": FINAL_ONLY });
    p.task("TASK-3", "Paused", "Spec: specs/002-b/"); // outside the vocabulary → unknown
    const { links, problems, warnings } = checkBridge(p.root);
    assert.equal(problems.length, 0);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /TASK-1/);
    assert.match(warnings[0], /already derives "Validating"/);
    assert.equal(links.find((l) => l.id === "TASK-3").verdict, "unknown");
    assert.equal(links.find((l) => l.id === "TASK-2").derived.stage, STAGE.VALIDATING);
  } finally { p.done(); }
});

test("opt-in gate rides the Stop hook: phase-grain exceed blocks through the gate-runner", () => {
  const p = project();
  try {
    p.config(VOCAB);
    p.task("TASK-1", "Validating", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": EARLY_WORK }); // only implementing
    const r = evalAt(p.root);
    assert.equal(r.block, true);
    assert.match(r.message, /TASK-1/);
    assert.match(r.message, /only proves "In Progress"/); // implementing keeps its default name here
  } finally { p.done(); }
});

/* ── plan under the opt-in ───────────────────────────────────────────────── */

test("opt-in plan: status targets speak the board's vocabulary", () => {
  const p = project();
  try {
    p.config(VOCAB);
    p.task("TASK-1", "In Progress", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": FINAL_ONLY });
    const { commands, skipped } = planBridge(p.root);
    assert.deepEqual(skipped, []);
    assert.equal(commands[0], "backlog task edit TASK-1 -s 'Validating'");
    assert.match(commands.at(-1), /status In Progress → Validating/);
  } finally { p.done(); }
});

test("opt-in plan: a named review stage is the target for all-checked specs — no auto-Done, no final summary", () => {
  const p = project();
  try {
    p.config(VOCAB);
    p.task("TASK-1", "Validating", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    const { commands } = planBridge(p.root);
    assert.equal(commands[0], "backlog task edit TASK-1 -s 'In Review'");
    assert.ok(!commands.some((c) => c.includes("--final-summary")), commands.join("\n"));
    // and a board already In Review over an all-checked spec is reconciled on status
    p.task("TASK-2", "In Review", "Spec: specs/001-a/");
    assert.ok(!planBridge(p.root).commands.some((c) => c.includes("TASK-2 -s")), "In Review agrees; no status move");
  } finally { p.done(); }
});

test("opt-in plan: reviewing left at its default still plans '-s Done' with the derived final summary", () => {
  const p = project();
  try {
    p.config({ statusVocabulary: { validating: "Validating" } }); // reviewing unrenamed
    p.task("TASK-1", "Validating", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    const { commands } = planBridge(p.root);
    assert.match(commands[0], /^backlog task edit TASK-1 -s 'Done' --final-summary /);
  } finally { p.done(); }
});

/* ── config-absent parity: today's 3-status contract, bit for bit ────────── */

test("no statusVocabulary: exceeds message is byte-identical to the 3-status contract", () => {
  const p = project();
  try {
    p.task("TASK-5", "Done", "Spec: specs/001-pay/");
    p.spec("specs/001-pay", { "spec.md": "# S", "plan.md": "# P", "tasks.md": "## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [ ] T002 b\n" });
    const { problems } = checkBridge(p.root);
    assert.deepEqual(problems, [
      '[spec-bridge] TASK-5 is "Done" but specs/001-pay only proves "In Progress": ' +
      '1 of 2 tasks unchecked (Setup: 1/1 · Core: 0/1). Finish the spec work or set the task back (backlog task edit TASK-5 -s "...").',
    ]);
  } finally { p.done(); }
});

test("no statusVocabulary: plan output is byte-identical to the 3-status contract", () => {
  const p = project();
  try {
    p.config({ strictDone: false }); // config present but no vocabulary — still opted out
    p.task("TASK-1", "To Do", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": "## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [ ] T002 b\n" });
    const { commands } = planBridge(p.root);
    assert.deepEqual(commands, [
      "backlog task edit TASK-1 -s 'In Progress'",
      "backlog task edit TASK-1 --ac 'Spec phase: Setup'",
      "backlog task edit TASK-1 --ac 'Spec phase: Core'",
      "backlog task edit TASK-1 --check-ac 1",
      "backlog task edit TASK-1 --append-notes 'spec-bridge sync: Setup: 1/1 · Core: 0/1 — status To Do → In Progress'",
    ]);
  } finally { p.done(); }
});

test("no statusVocabulary: finer stages never leak — an In Progress task is ok from planning through validating", () => {
  const p = project();
  try {
    p.task("TASK-1", "In Progress", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s" }); // planning
    assert.equal(checkBridge(p.root).problems.length + checkBridge(p.root).warnings.length, 0);
    p.spec("specs/001-a", { "plan.md": "p", "tasks.md": FINAL_ONLY }); // validating
    const { problems, warnings } = checkBridge(p.root);
    assert.equal(problems.length, 0);
    assert.equal(warnings.length, 0);
  } finally { p.done(); }
});
