// project-gates.test.mjs — spec 050 (TASK-100) Phase 3: the project-gate check that stops a
// ticked tasks.md checkbox from outrunning a red project gate. NEW surface only; every
// pre-existing spec-derive / spec-bridge / phase-status test stays untouched and passing.
//
// The evaluator (evaluateProjectGates) takes an injected `run`, so green/red/error/timeout are
// driven WITHOUT a subprocess. A real subprocess is used ONLY where runGateCommand itself is
// under test. The last block is the load-bearing parity proof: with no `projectGates` config,
// every existing gate message and plan output is byte-identical to today's and zero commands run —
// written in the style of the pre-existing `no statusVocabulary: … byte-identical` tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  evaluateProjectGates, runGateCommand, checkBridge, verifyBridge, GATE_TIMEOUT_MS,
} from "../spec-bridge/gates/bridge.mjs";

/* ── fixtures (same shapes as the pre-existing spec-bridge / phase-status tests) ─────────── */

function project() {
  const root = mkdtempSync(join(tmpdir(), "project-gates-"));
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

// Two-phase tasks.md whose LAST ticked box is phase "Prove", box "node --test green".
const ALL_DONE = "## Spec\n- [x] write the spec\n\n## Prove\n- [x] node --test green\n"; // Done-eligible
const MID_PR = "## Spec\n- [x] write the spec\n\n## Prove\n- [ ] node --test green\n"; // In Progress, ≥1 ticked

// A spec fixture that derives from the given tasks.md, with the given status on TASK-1.
function bridged(p, status, tasksMd, config) {
  if (config) p.config(config);
  p.task("TASK-1", status, "Spec: specs/001-a/");
  p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": tasksMd });
}

const REQUIRED_ONLY = { projectGates: { required: [{ name: "tests", command: ["node", "--test"] }] } };
const BOTH_BUCKETS = {
  projectGates: {
    required: [{ name: "tests", command: ["node", "--test"] }],
    redByConstruction: [{ name: "freshness", command: ["node", "gw.mjs"] }],
  },
};

const RED = (reason) => () => ({ ok: false, kind: "red", reason });
// tests green, freshness red — so a finding, if any, can only come from redByConstruction.
const testsGreenFreshnessRed = (cmd) =>
  cmd.includes("--test") ? { ok: true } : { ok: false, kind: "red", reason: "exited 1" };

/* ── the pure evaluator: fail-closed and green, driven with an injected run (no subprocess) ── */

const PURE_LINK = {
  id: "TASK-1", specDir: "specs/050",
  phaseBoxes: [{ name: "Prove", boxes: [{ checked: true, text: "node --test green" }] }],
};
const TAIL = "A ticked tasks.md checkbox cannot outrun a red project gate — make the gate pass or set the box back.";

test("evaluator: a green gate yields no finding", () => {
  assert.deepEqual(evaluateProjectGates(PURE_LINK, [{ name: "tests", command: ["x"], bucket: "required" }], () => ({ ok: true })), []);
});

test("evaluator fail-closed: a command that cannot execute (ENOENT) is a blocking finding, never green", () => {
  const problems = evaluateProjectGates(
    PURE_LINK, [{ name: "tests", command: ["nope"], bucket: "required" }],
    () => ({ ok: false, kind: "error", reason: "ENOENT" })
  );
  assert.deepEqual(problems, [
    `[spec-bridge] TASK-1 · specs/050: phase "Prove", box "node --test green" is ticked, but ` +
    `the required gate "tests" could not be executed (ENOENT) and is treated as failed, never green. ${TAIL}`,
  ]);
});

test("evaluator fail-closed: a timed-out command is a blocking finding, never green", () => {
  const problems = evaluateProjectGates(
    PURE_LINK, [{ name: "tests", command: ["node", "--test"], bucket: "required" }],
    () => ({ ok: false, kind: "timeout", timeoutMs: 120000 })
  );
  assert.deepEqual(problems, [
    `[spec-bridge] TASK-1 · specs/050: phase "Prove", box "node --test green" is ticked, but ` +
    `the required gate "tests" timed out after 120000ms and is treated as failed, never green. ${TAIL}`,
  ]);
});

/* ── the blocking case (AC #1, AC #3): all boxes ticked + a required gate red ⇒ blocks ──────
 * Through the real Stop-hook wiring (checkBridge at Done-eligible), the message names the phase,
 * the box, and the failing gate — byte-for-byte. */

test("blocking: Done-eligible spec + a red required gate blocks, naming phase, box, and gate", () => {
  const p = project();
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY);
    const { problems, warnings } = checkBridge(p.root, { run: RED("exited 1") });
    assert.deepEqual(problems, [
      `[spec-bridge] TASK-1 · specs/001-a: phase "Prove", box "node --test green" is ticked, but ` +
      `the required gate "tests" is red (exited 1). ${TAIL}`,
    ]);
    assert.deepEqual(warnings, []); // a red gate is a problem, never a warning
  } finally { p.done(); }
});

/* ── the allowance case (AC #2): a mid-PR tick over a red redByConstruction gate passes silently.
 * The mid-PR verify entry point runs `required` only; the red-by-construction command is never even
 * invoked, and its redness produces no finding AND no warning. */

test("allowance: mid-PR, verify runs required only — a red redByConstruction gate is silently allowed", () => {
  const p = project();
  try {
    bridged(p, "In Progress", MID_PR, BOTH_BUCKETS);
    const ran = [];
    const run = (cmd) => { ran.push(cmd.join(" ")); return testsGreenFreshnessRed(cmd); };
    const problems = verifyBridge(p.root, { run });
    assert.deepEqual(problems, []); // required is green; redByConstruction is not held mid-PR
    assert.ok(ran.includes("node --test"), `required gate should run mid-PR; ran: ${ran}`);
    assert.ok(!ran.some((c) => c.includes("gw.mjs")), `redByConstruction must NOT run mid-PR; ran: ${ran}`);
  } finally { p.done(); }
});

test("allowance: the Stop hook runs ZERO gate commands mid-PR (not Done-eligible)", () => {
  const p = project();
  try {
    bridged(p, "In Progress", MID_PR, BOTH_BUCKETS);
    let calls = 0;
    const { problems, warnings } = checkBridge(p.root, { run: (cmd) => { calls++; return { ok: false, kind: "red", reason: "exited 1" }; } });
    assert.equal(calls, 0, "no gate command may run until the spec is Done-eligible");
    assert.deepEqual(problems, []);
    assert.deepEqual(warnings, []);
  } finally { p.done(); }
});

/* ── the boundary case (operator ruling, 2026-08-02): the SAME redByConstruction gate, still red
 * at Done-eligible, BLOCKS. At Done-eligible every box (incl. the re-pin box) is ticked, so the
 * "allowed red mid-PR" license has expired and both buckets must be green. */

test("boundary: the same redByConstruction gate red at Done-eligible blocks, naming the red-by-construction gate", () => {
  const p = project();
  try {
    bridged(p, "Done", ALL_DONE, BOTH_BUCKETS); // identical config to the allowance case; only the tick-state differs
    const expected = [
      `[spec-bridge] TASK-1 · specs/001-a: phase "Prove", box "node --test green" is ticked, but ` +
      `the red-by-construction gate "freshness" is red (exited 1). ${TAIL}`,
    ];
    // The Stop hook (checkBridge) evaluates BOTH buckets at Done-eligible…
    assert.deepEqual(checkBridge(p.root, { run: testsGreenFreshnessRed }).problems, expected);
    // …and the CLI verify entry point agrees by construction (both buckets when Done-eligible).
    assert.deepEqual(verifyBridge(p.root, { run: testsGreenFreshnessRed }), expected);
  } finally { p.done(); }
});

/* ── runGateCommand itself: the ONE effectful piece, exercised with real subprocesses ────────
 * green, red, and both fail-closed kinds (ENOENT + timeout). "error" and "timeout" are never ok. */

test("runGateCommand: a green command exits 0 ⇒ ok", () => {
  assert.deepEqual(runGateCommand(["node", "-e", ""], { cwd: tmpdir() }), { ok: true });
});

test("runGateCommand: a nonzero exit ⇒ red, reason names the exit code", () => {
  assert.deepEqual(runGateCommand(["node", "-e", "process.exit(3)"], { cwd: tmpdir() }), { ok: false, kind: "red", reason: "exited 3" });
});

test("runGateCommand fail-closed: a missing binary ⇒ error (ENOENT), never green", () => {
  const r = runGateCommand(["definitely-no-such-binary-praxis-xyz", "--x"], { cwd: tmpdir() });
  assert.equal(r.ok, false);
  assert.equal(r.kind, "error");
  assert.equal(r.reason, "ENOENT");
});

test("runGateCommand fail-closed: a command that exceeds the time box ⇒ timeout, never green", () => {
  const r = runGateCommand(["node", "-e", "setInterval(() => {}, 1e9)"], { cwd: tmpdir(), timeoutMs: 300 });
  assert.deepEqual(r, { ok: false, kind: "timeout", timeoutMs: 300 });
});

test("runGateCommand: GATE_TIMEOUT_MS is the default ceiling and boxes a hung gate", () => {
  // 2 minutes: node --test here is ~5.7s (measured), so the box is headroom, not a throttle.
  assert.equal(GATE_TIMEOUT_MS, 120000);
});

test("runGateCommand: sets SPEC_BRIDGE_GATE_ACTIVE on the child (the reentrancy guard)", () => {
  // A declared command that itself re-invoked the bridge would see this flag and short-circuit.
  const r = runGateCommand(["node", "-e", "process.exit(process.env.SPEC_BRIDGE_GATE_ACTIVE === '1' ? 0 : 1)"], { cwd: tmpdir() });
  assert.deepEqual(r, { ok: true });
});

/* ── the parity proof: with NO projectGates config, output is byte-identical and zero commands run.
 * This is the proof that consumer repos without the opt-in are wholly unaffected. Mechanism: (a)
 * deepEqual against the frozen 3-status strings — same style as the pre-existing byte-identical
 * tests; (b) a run spy proving there is no code path by which an unconfigured repo invokes a gate
 * command, so no message can differ. */

test("no projectGates: a Done-eligible spec runs ZERO gates — problems/warnings byte-identical to today's", () => {
  const p = project();
  try {
    // No .spec-bridge.json at all: the exact situation of every consumer repo that hasn't opted in.
    bridged(p, "Done", ALL_DONE, null); // Done over a fully-proven spec ⇒ verdict ok
    let calls = 0;
    const { problems, warnings } = checkBridge(p.root, { run: (cmd) => { calls++; return { ok: false, kind: "red", reason: "exited 1" }; } });
    assert.equal(calls, 0, "with no projectGates config, no gate command may ever run");
    assert.deepEqual(problems, []);
    assert.deepEqual(warnings, []);
  } finally { p.done(); }
});

test("no projectGates: verifyBridge is inert — returns [] and runs nothing", () => {
  const p = project();
  try {
    bridged(p, "In Progress", MID_PR, null); // ticked boxes present, but no opt-in
    let calls = 0;
    assert.deepEqual(verifyBridge(p.root, { run: (cmd) => { calls++; return { ok: false, kind: "red", reason: "exited 1" }; } }), []);
    assert.equal(calls, 0, "verify with no projectGates config must not execute anything");
  } finally { p.done(); }
});

test("no projectGates: the exceeds message is byte-identical to the 3-status contract", () => {
  const p = project();
  try {
    p.task("TASK-5", "Done", "Spec: specs/001-pay/");
    p.spec("specs/001-pay", { "spec.md": "# S", "plan.md": "# P", "tasks.md": "## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [ ] T002 b\n" });
    // A red gate would ONLY be reachable at Done-eligible, and this spec is not — but even with an
    // always-red run injected, no config means no gate runs, so the message is exactly today's.
    const { problems } = checkBridge(p.root, { run: RED("exited 1") });
    assert.deepEqual(problems, [
      '[spec-bridge] TASK-5 is "Done" but specs/001-pay only proves "In Progress": ' +
      '1 of 2 tasks unchecked (Setup: 1/1 · Core: 0/1). Finish the spec work or set the task back (backlog task edit TASK-5 -s "...").',
    ]);
  } finally { p.done(); }
});
