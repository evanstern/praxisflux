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
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  evaluateProjectGates, runGateCommand, checkBridge, verifyBridge, GATE_TIMEOUT_MS,
  isTreeDirty, bridgeGate,
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

test("blocking: Done-eligible spec + a red required gate blocks, naming the gate and affected count (spec 061 R1: collapsed, not per-spec)", () => {
  const p = project();
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY);
    const { problems, warnings } = checkBridge(p.root, { run: RED("exited 1") });
    assert.deepEqual(problems, [
      `[spec-bridge] the required gate "tests" is red (exited 1) — 1 linked spec affected. ${TAIL}`,
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
    const { problems } = verifyBridge(p.root, { run });
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
      `[spec-bridge] the red-by-construction gate "freshness" is red (exited 1) — 1 linked spec affected. ${TAIL}`,
    ];
    // The Stop hook (checkBridge) evaluates BOTH buckets at Done-eligible…
    assert.deepEqual(checkBridge(p.root, { run: testsGreenFreshnessRed }).problems, expected);
    // …and the CLI verify entry point agrees by construction (both buckets when Done-eligible).
    assert.deepEqual(verifyBridge(p.root, { run: testsGreenFreshnessRed }).problems, expected);
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

/* ── spec 050 Phase 5, defect 1: the reentrancy guard gates only the DEFAULT runner ──────────
 * SPEC_BRIDGE_GATE_ACTIVE stops a spawned gate command from re-forking the bridge — but an
 * injected `run` is a test double that spawns nothing, so it must bypass the guard. This bypass
 * is what lets the bridge dogfood itself: `node --test` runs THIS suite with the flag set, and
 * every injected-run assertion above must still hold. The test save/restores the flag, so the
 * suite is hermetic — its result never depends on the caller's environment. */

test("defect 1: an injected run bypasses SPEC_BRIDGE_GATE_ACTIVE; the default runner still short-circuits", () => {
  const saved = process.env.SPEC_BRIDGE_GATE_ACTIVE;
  process.env.SPEC_BRIDGE_GATE_ACTIVE = "1"; // simulate running nested under a gate command
  const p = project();
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY);
    // Injected run (a test double, spawns nothing): bypasses the guard, red required gate is caught.
    assert.equal(checkBridge(p.root, { run: RED("exited 1") }).problems.length, 1, "injected run must bypass the guard");
    assert.equal(verifyBridge(p.root, { run: RED("exited 1") }).problems.length, 1, "injected run must bypass the guard");
    // Default runner + flag set: the guard holds — zero commands spawned, no findings, no recursion.
    assert.deepEqual(checkBridge(p.root).problems, [], "default runner must short-circuit under the flag");
    assert.deepEqual(verifyBridge(p.root).problems, [], "default runner must short-circuit under the flag");
  } finally {
    if (saved === undefined) delete process.env.SPEC_BRIDGE_GATE_ACTIVE;
    else process.env.SPEC_BRIDGE_GATE_ACTIVE = saved;
    p.done();
  }
});

/* ── spec 050 Phase 5, defect 2: declared gates run ONCE per invocation, shared across specs ───
 * Declared gates are project-wide, not per-spec. With N Done-eligible specs the full set must
 * still spawn each command exactly once (not N×), while every spec gets its OWN finding naming its
 * own phase/box/gate — the gate RESULT is shared, never the finding. */

test("defect 2 + spec 061 R1: node --test is spawned ONCE across many Done-eligible specs, and now yields ONE collapsed finding naming the count", () => {
  const p = project();
  try {
    p.config(REQUIRED_ONLY);
    const N = 5;
    for (let i = 1; i <= N; i++) {
      p.task(`TASK-${i}`, "Done", `Spec: specs/00${i}-a/`);
      p.spec(`specs/00${i}-a`, { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    }
    const spawned = [];
    const run = (cmd) => { spawned.push(cmd.join(" ")); return { ok: false, kind: "red", reason: "exited 1" }; };
    const { problems } = checkBridge(p.root, { run });
    assert.deepEqual(problems, [
      `[spec-bridge] the required gate "tests" is red (exited 1) — ${N} linked specs affected. ${TAIL}`,
    ]);
    assert.deepEqual(spawned, ["node --test"], `expected a single spawn; got: ${JSON.stringify(spawned)}`);
  } finally { p.done(); }
});

test("defect 2 + spec 061 R1: verifyBridge shares one gate result across specs — one spawn, one collapsed finding naming the count", () => {
  const p = project();
  try {
    p.config(REQUIRED_ONLY);
    const N = 4;
    for (let i = 1; i <= N; i++) {
      p.task(`TASK-${i}`, "In Progress", `Spec: specs/00${i}-a/`);
      p.spec(`specs/00${i}-a`, { "spec.md": "s", "plan.md": "p", "tasks.md": MID_PR });
    }
    const spawned = [];
    const run = (cmd) => { spawned.push(cmd.join(" ")); return { ok: false, kind: "red", reason: "exited 1" }; };
    const { problems } = verifyBridge(p.root, { run });
    assert.deepEqual(problems, [
      `[spec-bridge] the required gate "tests" is red (exited 1) — ${N} linked specs affected. ${TAIL}`,
    ]);
    assert.deepEqual(spawned, ["node --test"], `expected a single spawn; got: ${JSON.stringify(spawned)}`);
  } finally { p.done(); }
});

/* ── spec 061 R1/R3.1: the fan-out regression, with its negative control ─────────────────────
 * Pre-fix, one red gate produced one finding PER Done-eligible linked spec (see the defect-2
 * tests above, which used to assert problems.length === N). Post-fix it must be exactly ONE,
 * naming the gate and the affected count. The negative control (`notEqual(..., N)`) is what
 * makes this a regression test rather than a tautology: an assertion of `=== 1` alone would
 * also pass by coincidence if N happened to be 1, so the control pins N >= 2 and asserts the
 * fixed count is NOT the old fan-out count. */

test("R1 fan-out collapse: a red required gate + N (>=2) Done-eligible specs yields exactly ONE finding naming the gate, not N (negative control: pre-fix behavior was N)", () => {
  const p = project();
  try {
    p.config(REQUIRED_ONLY);
    const N = 3;
    for (let i = 1; i <= N; i++) {
      p.task(`TASK-${i}`, "Done", `Spec: specs/00${i}-a/`);
      p.spec(`specs/00${i}-a`, { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    }
    const { problems } = checkBridge(p.root, { run: RED("exited 1") });
    // Negative control: pre-fix behavior was ONE finding PER spec (N total) — this would be
    // true under the defect and false only once collapsed.
    assert.notEqual(problems.length, N, `pre-fix fan-out would yield ${N} findings, one per spec`);
    assert.equal(problems.length, 1, "one red gate must yield exactly one finding, not one per linked spec");
    assert.match(problems[0], /"tests"/, "the single finding must name the failing gate");
    assert.match(problems[0], new RegExp(String(N)), "the finding must state the affected count");
  } finally { p.done(); }
});

test("R1 fan-out collapse: verifyBridge collapses the same way, preserving the bucket asymmetry", () => {
  const p = project();
  try {
    p.config(BOTH_BUCKETS);
    const N = 3;
    for (let i = 1; i <= N; i++) {
      p.task(`TASK-${i}`, "Done", `Spec: specs/00${i}-a/`); // Done-eligible: held to BOTH buckets
      p.spec(`specs/00${i}-a`, { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    }
    p.task("TASK-99", "In Progress", "Spec: specs/099-mid/"); // mid-PR: required only
    p.spec("specs/099-mid", { "spec.md": "s", "plan.md": "p", "tasks.md": MID_PR });
    const { problems } = verifyBridge(p.root, { run: testsGreenFreshnessRed });
    // redByConstruction ("freshness") counts only the 3 Done-eligible specs it applies to —
    // the mid-PR spec is never held to it, so it must NOT inflate the count to 4.
    assert.deepEqual(problems, [
      `[spec-bridge] the red-by-construction gate "freshness" is red (exited 1) — ${N} linked specs affected. ${TAIL}`,
    ]);
  } finally { p.done(); }
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

test("no projectGates: verifyBridge is inert — returns { problems: [], warnings: [] } and runs nothing", () => {
  const p = project();
  try {
    bridged(p, "In Progress", MID_PR, null); // ticked boxes present, but no opt-in
    let calls = 0;
    assert.deepEqual(
      verifyBridge(p.root, { run: (cmd) => { calls++; return { ok: false, kind: "red", reason: "exited 1" }; } }),
      { problems: [], warnings: [] }
    );
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

/* ── spec 061 R2/R3.2: the dirty-tree label — a verdict sampled against an uncommitted tree
 * proves nothing about the commit (this repo's own F6 finding, mirrored here for false reds
 * instead of false greens) and must not block. `isDirty` is injectable, same pattern as `run`,
 * so every case below drives the decision without a real git spawn — except the one bridgeGate
 * integration test at the end, which has no injection seam and proves the actual wiring with a
 * real (tiny) subprocess. */

test("isTreeDirty fail-closed: a spawn that throws is treated as clean (blocks), never dirty", () => {
  const spawn = () => { throw new Error("boom"); };
  assert.equal(isTreeDirty("/nonexistent", { spawn }), false);
});

test("isTreeDirty fail-closed: a nonzero git exit is treated as clean (blocks), never dirty", () => {
  const spawn = () => ({ status: 128, stdout: "", stderr: "fatal: not a git repository" });
  assert.equal(isTreeDirty("/nonexistent", { spawn }), false);
});

test("isTreeDirty: non-empty porcelain output is dirty", () => {
  const spawn = () => ({ status: 0, stdout: " M some/file.js\n", stderr: "" });
  assert.equal(isTreeDirty("/whatever", { spawn }), true);
});

test("isTreeDirty: empty porcelain output is clean", () => {
  const spawn = () => ({ status: 0, stdout: "", stderr: "" });
  assert.equal(isTreeDirty("/whatever", { spawn }), false);
});

test("R2: dirty tree + red required gate ⇒ labeled, non-blocking (routed to warnings, not problems)", () => {
  const p = project();
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY);
    const { problems, warnings } = checkBridge(p.root, { run: RED("exited 1"), isDirty: () => true });
    assert.deepEqual(problems, [], "a dirty-tree sample must not block");
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /"tests"/);
    assert.match(warnings[0], /DIRTY working tree/, "must be unmistakably labeled as a dirty-tree sample");
  } finally { p.done(); }
});

test("R2 control: clean tree + the SAME red required gate still blocks", () => {
  const p = project();
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY);
    const { problems, warnings } = checkBridge(p.root, { run: RED("exited 1"), isDirty: () => false });
    assert.deepEqual(problems, [
      `[spec-bridge] the required gate "tests" is red (exited 1) — 1 linked spec affected. ${TAIL}`,
    ]);
    assert.deepEqual(warnings, []);
  } finally { p.done(); }
});

test("R2 fail-closed: undeterminable dirtiness (real isTreeDirty against a non-git tmpdir) still blocks", () => {
  const p = project(); // a plain tmpdir, not a git repo — `git status` fails, isTreeDirty fails closed to false
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY);
    const { problems, warnings } = checkBridge(p.root, { run: RED("exited 1") }); // default isDirty = real isTreeDirty
    assert.equal(problems.length, 1, "undeterminable dirtiness must fail closed to blocking, not warn");
    assert.deepEqual(warnings, []);
  } finally { p.done(); }
});

test("R2: non-gate findings are unaffected by the dirty-tree label — exceeds still blocks, the gate finding still warns", () => {
  const p = project();
  try {
    p.config(REQUIRED_ONLY);
    // TASK-1: Done-eligible — holds the required gate, which is red.
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    // TASK-2: claims Done over an incomplete spec — a non-gate "exceeds" finding, which reads
    // committed board/spec artifacts, not a sampled tree, so the dirty-tree label never applies.
    p.task("TASK-2", "Done", "Spec: specs/002-b/");
    p.spec("specs/002-b", { "spec.md": "s", "plan.md": "p", "tasks.md": "## Phase\n- [ ] not done\n" });
    const { problems, warnings } = checkBridge(p.root, { run: RED("exited 1"), isDirty: () => true });
    assert.equal(problems.length, 1, "the exceeds finding must still block, dirty tree or not");
    assert.match(problems[0], /TASK-2/);
    assert.match(problems[0], /only proves/);
    assert.equal(warnings.length, 1, "the gate finding is labeled and routed to warnings instead");
    assert.match(warnings[0], /"tests"/);
  } finally { p.done(); }
});

/* ── T011: bridgeGate.check()/warn() wiring — the dirty-tree label must reach warn() WITHOUT
 * running gates a second time. `bridgeGate.warn` deliberately calls `checkBridge(root, {
 * runGates: false })` so a Stop pays for gate subprocesses once, not twice (the cost regression
 * spec 050 fixed); flipping that to re-run gates so warn() can see the dirty-tree label would
 * reopen it. bridgeGate has no injection seam (it matches gate-runner's fixed `(root) => …`
 * shape), so this is the one test here that spawns a real subprocess — a spy command counts its
 * own invocations, proving the gate ran exactly once across check()+warn() combined. */

test("bridgeGate: a dirty-tree gate warning reaches warn() from check()'s single gate run — subprocess count does not increase", () => {
  const p = project();
  const spy = join(p.root, "spy.count");
  try {
    spawnSync("git", ["init", "-q"], { cwd: p.root }); // untracked files alone make the tree dirty — no commit needed
    p.config({ projectGates: { required: [
      { name: "tests", command: ["node", "-e", "require('fs').appendFileSync(process.env.SPY_FILE,'x');process.exit(1)"] },
    ] } });
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    process.env.SPY_FILE = spy;
    try {
      // T027: gateActive:false makes this call hermetic to the caller's own environment (the
      // suite may itself be running as this repo's declared `tests` gate, i.e. under an
      // ambient SPEC_BRIDGE_GATE_ACTIVE=1) — same principle as "defect 1"'s save/restore, via
      // the injectable seam instead of touching process.env.
      const problems = bridgeGate.check(p.root, { gateActive: false });
      assert.deepEqual(problems, [], "a dirty-tree sample must not block, even through the real Stop-hook wiring");
      const warnings = bridgeGate.warn(p.root, { gateActive: false });
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /"tests"/);
      assert.match(warnings[0], /DIRTY working tree/);
    } finally { delete process.env.SPY_FILE; }
    const spawnCount = existsSync(spy) ? readFileSync(spy, "utf8").length : 0;
    assert.equal(spawnCount, 1, "the gate command must run exactly once across check()+warn(), not twice");
  } finally { p.done(); }
});

/* ── spec 061 T018a: close the `verify` dirty-tree gap ───────────────────────────────────────
 * Phase 2 scoped R2's dirty-tree label to checkBridge only; verifyBridge (the mid-PR CLI
 * counterpart) still hard-blocked on a dirty-tree sample — reproducing P2 in exactly the window
 * (mid-PR) where a tree is dirtiest. verifyBridge now returns { problems, warnings }, same
 * shape and same routing as checkBridge: dirty ⇒ labeled and non-blocking; clean ⇒ unchanged. */

test("T018a: verify — dirty tree + red required gate ⇒ labeled, non-blocking (routed to warnings, not problems)", () => {
  const p = project();
  try {
    bridged(p, "In Progress", MID_PR, REQUIRED_ONLY);
    const { problems, warnings } = verifyBridge(p.root, { run: RED("exited 1"), isDirty: () => true });
    assert.deepEqual(problems, [], "verify must not block on a dirty-tree sample");
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /"tests"/);
    assert.match(warnings[0], /DIRTY working tree/, "the label must stay visible, not be dropped silently");
  } finally { p.done(); }
});

test("T018a control: verify — clean tree + the SAME red required gate still blocks", () => {
  const p = project();
  try {
    bridged(p, "In Progress", MID_PR, REQUIRED_ONLY);
    const { problems, warnings } = verifyBridge(p.root, { run: RED("exited 1"), isDirty: () => false });
    assert.deepEqual(problems, [
      `[spec-bridge] the required gate "tests" is red (exited 1) — 1 linked spec affected. ${TAIL}`,
    ]);
    assert.deepEqual(warnings, []);
  } finally { p.done(); }
});

/* ── spec 061 R4 (T014-T017): opt-in Stop-time instrumentation ───────────────────────────────
 * Off by default: SPEC_BRIDGE_GATE_TRACE unset ⇒ no file written, verdict unchanged. Set ⇒ one
 * JSONL record per bridgeGate.check() call, naming the resolved roots and each gate command's
 * argv/cwd/status/stdout/stderr (bounded). Verdict-neutral in both directions: a write failure
 * never flips a green gate red, and enabling tracing never changes the verdict itself. */

test("R4: SPEC_BRIDGE_GATE_TRACE unset ⇒ no trace file is written and the verdict is unchanged", () => {
  const p = project();
  // The default trace destination this repo's own scratch convention would use — proving THIS
  // path gains nothing is the closest thing to proving "no file is created" without guessing
  // every possible location on disk.
  const defaultTrace = join(process.env.CLAUDE_JOB_DIR || tmpdir(), "spec-bridge-gate-trace.jsonl");
  const before = existsSync(defaultTrace) ? readFileSync(defaultTrace, "utf8").length : null;
  try {
    spawnSync("git", ["init", "-q"], { cwd: p.root });
    p.config({ projectGates: { required: [{ name: "tests", command: ["node", "-e", "process.exit(1)"] }] } });
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    spawnSync("git", ["-C", p.root, "config", "user.email", "test@example.com"]);
    spawnSync("git", ["-C", p.root, "config", "user.name", "Test"]);
    spawnSync("git", ["-C", p.root, "add", "-A"]);
    spawnSync("git", ["-C", p.root, "commit", "-q", "-m", "init"]); // clean tree ⇒ a red gate blocks
    delete process.env.SPEC_BRIDGE_GATE_TRACE;
    // T027: gateActive:false — hermetic to whatever SPEC_BRIDGE_GATE_ACTIVE the caller's own
    // process happens to carry (this suite may itself be running as the `tests` gate's child).
    const problems = bridgeGate.check(p.root, { gateActive: false });
    assert.equal(problems.length, 1, "a clean tree with a red required gate must still block");
    const after = existsSync(defaultTrace) ? readFileSync(defaultTrace, "utf8").length : null;
    assert.equal(after, before, "absent env var must not write to the default trace location — not one extra syscall");
  } finally { p.done(); }
});

test("R4: SPEC_BRIDGE_GATE_TRACE set ⇒ one JSONL record naming resolved roots + bounded per-command capture, verdict unchanged", () => {
  const p = project();
  const traceDir = mkdtempSync(join(tmpdir(), "gate-trace-"));
  const tracePath = join(traceDir, "trace.jsonl");
  try {
    spawnSync("git", ["init", "-q"], { cwd: p.root });
    p.config({ projectGates: { required: [{ name: "tests", command: ["node", "-e", "process.stdout.write('x'.repeat(10)); process.exit(1)"] }] } });
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    spawnSync("git", ["-C", p.root, "config", "user.email", "test@example.com"]);
    spawnSync("git", ["-C", p.root, "config", "user.name", "Test"]);
    spawnSync("git", ["-C", p.root, "add", "-A"]);
    spawnSync("git", ["-C", p.root, "commit", "-q", "-m", "init"]); // clean tree ⇒ a red gate blocks
    process.env.SPEC_BRIDGE_GATE_TRACE = tracePath;
    let problems;
    // Real Stop-hook wiring calls resolveRoots(start) once, then check(root) per resolved root
    // (lib/gate-runner.mjs's evaluate loop) — mirror that order so the trace sees a real roots list.
    bridgeGate.resolveRoots(p.root);
    // T027: gateActive:false — hermetic to the caller's own SPEC_BRIDGE_GATE_ACTIVE.
    try { problems = bridgeGate.check(p.root, { gateActive: false }); } finally { delete process.env.SPEC_BRIDGE_GATE_TRACE; }
    assert.equal(problems.length, 1, "enabling the trace must not change the verdict");
    const lines = readFileSync(tracePath, "utf8").trim().split("\n");
    assert.equal(lines.length, 1, "one record per bridgeGate.check() invocation");
    const record = JSON.parse(lines[0]);
    assert.ok(record.ts, "record must carry a timestamp");
    assert.ok(Array.isArray(record.roots) && record.roots.includes(p.root), "record must name the resolved roots (R4's point)");
    assert.equal(record.commands.length, 1);
    assert.equal(record.commands[0].command.join(" "), "node -e process.stdout.write('x'.repeat(10)); process.exit(1)");
    assert.equal(record.commands[0].status, 1);
    assert.equal(record.commands[0].stdout, "x".repeat(10));
  } finally { rmSync(traceDir, { recursive: true, force: true }); p.done(); }
});

test("R4: bounded capture — stdout longer than the cap is truncated, not dropped or unbounded", () => {
  const p = project();
  const traceDir = mkdtempSync(join(tmpdir(), "gate-trace-"));
  const tracePath = join(traceDir, "trace.jsonl");
  try {
    spawnSync("git", ["init", "-q"], { cwd: p.root });
    p.config({ projectGates: { required: [
      { name: "tests", command: ["node", "-e", "process.stdout.write('y'.repeat(10000)); process.exit(1)"] },
    ] } });
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    spawnSync("git", ["-C", p.root, "config", "user.email", "test@example.com"]);
    spawnSync("git", ["-C", p.root, "config", "user.name", "Test"]);
    spawnSync("git", ["-C", p.root, "add", "-A"]);
    spawnSync("git", ["-C", p.root, "commit", "-q", "-m", "init"]); // clean tree ⇒ a red gate blocks
    process.env.SPEC_BRIDGE_GATE_TRACE = tracePath;
    // T027: gateActive:false — hermetic to the caller's own SPEC_BRIDGE_GATE_ACTIVE.
    try { bridgeGate.check(p.root, { gateActive: false }); } finally { delete process.env.SPEC_BRIDGE_GATE_TRACE; }
    const record = JSON.parse(readFileSync(tracePath, "utf8").trim());
    assert.ok(record.commands[0].stdout.length < 10000, "a 10000-char stream must be capped, not stored in full");
    assert.match(record.commands[0].stdout, /truncated/);
  } finally { rmSync(traceDir, { recursive: true, force: true }); p.done(); }
});

test("R4 verdict-neutral: an unwritable trace path is swallowed — the gate verdict is unaffected, nothing throws", () => {
  const p = project();
  try {
    spawnSync("git", ["init", "-q"], { cwd: p.root });
    p.config({ projectGates: { required: [{ name: "tests", command: ["node", "-e", "process.exit(1)"] }] } });
    p.task("TASK-1", "Done", "Spec: specs/001-a/");
    p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_DONE });
    spawnSync("git", ["-C", p.root, "config", "user.email", "test@example.com"]);
    spawnSync("git", ["-C", p.root, "config", "user.name", "Test"]);
    spawnSync("git", ["-C", p.root, "add", "-A"]);
    spawnSync("git", ["-C", p.root, "commit", "-q", "-m", "init"]); // clean tree ⇒ a red gate blocks
    // A path inside a nonexistent directory: appendFileSync throws ENOENT.
    process.env.SPEC_BRIDGE_GATE_TRACE = join(p.root, "no-such-dir", "trace.jsonl");
    let problems;
    // T027: gateActive:false — hermetic to the caller's own SPEC_BRIDGE_GATE_ACTIVE.
    try { assert.doesNotThrow(() => { problems = bridgeGate.check(p.root, { gateActive: false }); }); }
    finally { delete process.env.SPEC_BRIDGE_GATE_TRACE; }
    assert.equal(problems.length, 1, "a swallowed trace failure must not affect the gate verdict");
  } finally { p.done(); }
});

/* ── spec 061 Phase 3b, T027-T029: this repo's own dogfood defect ────────────────────────────
 * Diagnosis: this repo's `.spec-bridge.json` declares its `tests` gate as bare `node --test` —
 * so a REAL Stop-hook run of `bridgeGate.check` on THIS repo spawns the whole suite as a child
 * with SPEC_BRIDGE_GATE_ACTIVE=1 (runGateCommand's own reentrancy guard, spec 050 defect 1).
 * Every `bridgeGate.check`/`.warn` test above calls the real Stop-hook wrapper directly (no
 * injected `run` — that's the point, they prove the REAL wiring), so before T027 they inherited
 * that ambient flag and silently saw zero gate findings whenever the suite happened to be run
 * under it — invisible unflagged, exactly the shape of spec 050 defect 1 recurring through a
 * path (bridgeGate.check/.warn) that had no injection seam at all. Reproduced directly (not by
 * shelling out to a nested `node --test`, which would be pathologically slow): flip the SAME
 * flag this test's own ambient environment might or might not carry, and prove BOTH halves
 * without needing to know which:
 *   1. the seam — `gateActive: false` — makes bridgeGate.check honest regardless of the flag.
 *   2. the guard — omitting the seam — still stops the DEFAULT runner cold under the flag,
 *      exactly as spec 050 defect 1 requires (no recursive spawning is ever green-lit).
 * This is what T029 asks for: an assertion that would have caught the defect from inside the
 * suite, on both a flagged AND an unflagged run, with the invariant pinned either way. */

test("T027-T029 regression: bridgeGate.check stays honest under SPEC_BRIDGE_GATE_ACTIVE via the gateActive seam, and the reentrancy guard still holds without it", () => {
  const p = project();
  const saved = process.env.SPEC_BRIDGE_GATE_ACTIVE;
  process.env.SPEC_BRIDGE_GATE_ACTIVE = "1"; // simulate being spawned as this repo's own `tests` gate child
  try {
    bridged(p, "Done", ALL_DONE, REQUIRED_ONLY); // a red required gate would block if it ran
    const spy = join(p.root, "spy.count");
    p.config({ projectGates: { required: [
      { name: "tests", command: ["node", "-e", "require('fs').appendFileSync(process.env.SPY_FILE,'x');process.exit(1)"] },
    ] } });
    process.env.SPY_FILE = spy;
    try {
      // 1. Test-owned seam: real gate execution happens even under the ambient flag.
      const honest = bridgeGate.check(p.root, { gateActive: false });
      assert.equal(honest.length, 1, "gateActive:false must run the declared gate for real, catching the red result");
      assert.equal(existsSync(spy) && readFileSync(spy, "utf8").length, 1, "the declared command must actually have spawned");
    } finally { delete process.env.SPY_FILE; }
    // 2. No seam: the DEFAULT runner still short-circuits — real recursive spawning stays blocked.
    assert.deepEqual(bridgeGate.check(p.root), [], "without the seam, the flag must still fully arm the reentrancy guard");
  } finally {
    if (saved === undefined) delete process.env.SPEC_BRIDGE_GATE_ACTIVE;
    else process.env.SPEC_BRIDGE_GATE_ACTIVE = saved;
    p.done();
  }
});
