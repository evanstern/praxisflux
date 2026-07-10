import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { deriveSpecState, parseTasks, progressNote, findCriticalFindings, STATUS } from "../lib/spec-derive.mjs";

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "spec-derive-"));
  return { dir, put: (name, body) => writeFileSync(join(dir, name), body), done: () => rmSync(dir, { recursive: true, force: true }) };
}

const TASKS_MD = `# Tasks: Payment Flow

## Phase 3.1: Setup
- [x] T001 Create project structure
- [x] T002 [P] Initialize linting

## Phase 3.2: Tests First
- [x] T003 [P] Contract test POST /pay
- [ ] T004 Integration test happy path

## Dependencies
Notes only, no checkboxes here.

## Phase 3.3: Core
- [ ] T005 Payment model
- [ ] T006 Charge endpoint
`;

test("spec lifecycle stages derive the correct status", () => {
  const s = scratch();
  try {
    // empty dir: nothing authored yet
    assert.equal(deriveSpecState(s.dir).status, STATUS.TODO);

    // spec.md alone: work has started
    s.put("spec.md", "# Feature Spec");
    assert.equal(deriveSpecState(s.dir).status, STATUS.IN_PROGRESS);

    // spec + plan + partially checked tasks
    s.put("plan.md", "# Plan");
    s.put("tasks.md", TASKS_MD);
    assert.equal(deriveSpecState(s.dir).status, STATUS.IN_PROGRESS);

    // all boxes checked -> eligible, not "Done"
    s.put("tasks.md", TASKS_MD.replaceAll("- [ ]", "- [x]"));
    assert.equal(deriveSpecState(s.dir).status, STATUS.DONE_ELIGIBLE);
  } finally { s.done(); }
});

test("all-checked tasks without spec.md or plan.md never reach Done-eligible", () => {
  const s = scratch();
  try {
    s.put("tasks.md", "- [x] T001 only task");
    assert.equal(deriveSpecState(s.dir).status, STATUS.TODO); // no spec.md at all

    s.put("spec.md", "# Spec");
    assert.equal(deriveSpecState(s.dir).status, STATUS.IN_PROGRESS); // still no plan.md
  } finally { s.done(); }
});

test("phase names and per-phase counts come from headings and checkboxes", () => {
  const phases = parseTasks(TASKS_MD);
  assert.deepEqual(phases, [
    { name: "Setup", done: 2, total: 2 },
    { name: "Tests First", done: 1, total: 2 },
    { name: "Core", done: 0, total: 2 },
  ]);
  assert.equal(progressNote(phases), "Setup: 2/2 · Tests First: 1/2 · Core: 0/2");
});

test("checkbox lines before any heading fall into a synthetic Tasks phase", () => {
  const phases = parseTasks("- [x] T001 stray\n- [ ] T002 stray\n## Phase 1: Real\n- [ ] T003 x");
  assert.deepEqual(phases.map((p) => p.name), ["Tasks", "Real"]);
  assert.deepEqual(phases[0], { name: "Tasks", done: 1, total: 2 });
});

test("regenerated tasks.md re-derives fresh with no stale residue", () => {
  const s = scratch();
  try {
    s.put("spec.md", "# Spec");
    s.put("plan.md", "# Plan");
    s.put("tasks.md", TASKS_MD.replaceAll("- [ ]", "- [x]"));
    assert.equal(deriveSpecState(s.dir).status, STATUS.DONE_ELIGIBLE);

    // /speckit.tasks regenerates: phases renamed, one removed, one added, boxes wiped
    s.put("tasks.md", `## Phase 1: Scaffold
- [ ] T001 redo structure

## Phase 2: Ship It
- [x] T002 carried over
- [ ] T003 brand new
`);
    const state = deriveSpecState(s.dir);
    assert.equal(state.status, STATUS.IN_PROGRESS); // honest regression from Done-eligible
    assert.deepEqual(state.phases, [
      { name: "Scaffold", done: 0, total: 1 },
      { name: "Ship It", done: 1, total: 2 },
    ]);
    assert.equal(state.progressNote, "Scaffold: 0/1 · Ship It: 1/2");
    assert.ok(!state.progressNote.includes("Setup")); // nothing from the old file survives
  } finally { s.done(); }
});

test("strict mode: all boxes checked is not enough without a clean analysis.md", () => {
  const s = scratch();
  try {
    s.put("spec.md", "# Spec");
    s.put("plan.md", "# Plan");
    s.put("tasks.md", "- [x] T001 done");
    const strict = { requireAnalysis: true };

    // AC3: without strict mode, prior behavior is untouched
    assert.equal(deriveSpecState(s.dir).status, STATUS.DONE_ELIGIBLE);

    // AC1: strict + no report -> In Progress
    let state = deriveSpecState(s.dir, strict);
    assert.equal(state.status, STATUS.IN_PROGRESS);
    assert.deepEqual(state.analysis, { required: true, present: false, criticals: [] });

    // AC2: report with an unresolved CRITICAL -> still In Progress, finding surfaced
    s.put("analysis.md", "| C1 | CRITICAL | Missing auth check on /pay |\n| C2 | LOW | typo |");
    state = deriveSpecState(s.dir, strict);
    assert.equal(state.status, STATUS.IN_PROGRESS);
    assert.equal(state.analysis.criticals.length, 1);
    assert.match(state.analysis.criticals[0], /Missing auth check/);

    // resolved on the same line (or a checked box) clears the finding
    s.put("analysis.md", "| C1 | CRITICAL | Missing auth check | resolved in T009 |\n- [x] CRITICAL C2 handled");
    assert.equal(deriveSpecState(s.dir, strict).status, STATUS.DONE_ELIGIBLE);
  } finally { s.done(); }
});

test("findCriticalFindings is line-based and case-exact on the severity word", () => {
  const criticals = findCriticalFindings("CRITICAL: a\ncritical lowercase ignored\nCRITICAL but resolved here\n");
  assert.deepEqual(criticals, ["CRITICAL: a"]);
  assert.deepEqual(findCriticalFindings(""), []);
});

test("malformed and missing files degrade instead of crashing", () => {
  const s = scratch();
  try {
    s.put("spec.md", "# Spec");
    s.put("plan.md", "# Plan");

    // missing tasks.md: in progress, zero tasks, empty note
    let state = deriveSpecState(s.dir);
    assert.equal(state.status, STATUS.IN_PROGRESS);
    assert.deepEqual(state.phases, []);
    assert.equal(state.tasksTotal, 0);
    assert.equal(state.progressNote, "");

    // headings but no checkboxes anywhere
    s.put("tasks.md", "## Phase 1: Empty\n\n## Phase 2: Also Empty\n");
    state = deriveSpecState(s.dir);
    assert.equal(state.status, STATUS.IN_PROGRESS);
    assert.deepEqual(state.phases, []);

    // tasks.md is a directory: read fails, degrades to "no tasks"
    rmSync(join(s.dir, "tasks.md"));
    mkdirSync(join(s.dir, "tasks.md"));
    assert.equal(deriveSpecState(s.dir).status, STATUS.IN_PROGRESS);

    // nonexistent spec dir
    assert.equal(deriveSpecState(join(s.dir, "no-such-dir")).status, STATUS.TODO);
  } finally { s.done(); }
});
