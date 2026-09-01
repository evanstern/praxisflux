// board-provider-seam.test.mjs — spec 053 phase 1: root resolution stops meaning "has a
// backlog dir", and the Stop hook + CLI must never disagree about what a project is (R2, AC #4).
// Later phases append coverage for boardLinks' fail-closed findings and the planner split here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { hasAnyChild } from "../lib/project-root.mjs";
import { bridgeGate, checkBridge } from "../spec-bridge/gates/bridge.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

const CLI = new URL("../spec-bridge/gates/cli.mjs", import.meta.url).pathname;

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "board-provider-seam-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("hasAnyChild: true when ANY named child is present, false when none are", () => {
  const p = scratch();
  try {
    mkdirSync(join(p.root, "backlog"));
    assert.equal(hasAnyChild(".board", "backlog")(p.root), true);
    assert.equal(hasAnyChild(".board", "nope")(p.root), false);
  } finally {
    p.done();
  }
});

// AC #4 — a `.board`-only, a `backlog`-only, and a both-present root must all resolve under
// BOTH resolvers: bridgeGate.resolveRoots (the Stop hook) and cli.mjs's findRootUpwards call
// (the `state` command). Observed indirectly for the CLI, which is a script (not an exported
// function): a resolved root is what makes `state` pick up .spec-bridge.json's strictDone,
// visible as `analysis.required` flipping true — a root miss silently stays false.
const layouts = [
  { name: ".board-only", make: (root) => mkdirSync(join(root, ".board"), { recursive: true }) },
  { name: "backlog-only", make: (root) => mkdirSync(join(root, "backlog"), { recursive: true }) },
  {
    name: "both-present",
    make: (root) => {
      mkdirSync(join(root, ".board"), { recursive: true });
      mkdirSync(join(root, "backlog"), { recursive: true });
    },
  },
];

for (const layout of layouts) {
  test(`root resolution agrees for a ${layout.name} project (hook and CLI)`, () => {
    const p = scratch();
    try {
      layout.make(p.root);
      writeFileSync(join(p.root, ".spec-bridge.json"), JSON.stringify({ strictDone: true }));
      const specDir = join(p.root, "specs", "001-a");
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, "spec.md"), "# spec");
      writeFileSync(join(specDir, "plan.md"), "# plan");

      // Hook side.
      assert.deepEqual(bridgeGate.resolveRoots(p.root), [p.root]);

      // CLI side.
      const out = JSON.parse(execFileSync("node", [CLI, "state", specDir], { encoding: "utf8" }));
      assert.equal(out.analysis.required, true);
    } finally {
      p.done();
    }
  });
}

/* ── spec 053 phase 2: the fail-closed findings (R3/R4) — asserted on message content, so
 * the fail-closed path can never be mistaken for an empty board (ACs #5, #6, #7). ── */

test("checkBridge: a stale requiresSync:true mirror yields exactly one blocking problem naming the reason and the remedy (AC #5)", () => {
  const p = scratch();
  try {
    mkdirSync(join(p.root, ".board"), { recursive: true });
    // provider "jira" isn't in the registry yet (spec 056) — unknown providers fail closed to
    // requiresSync:true, same as a declared-but-unimplemented one would. No observedSha on a
    // requiresSync provider is mirrorStaleness's "no observedSha" stale case. status is a custom
    // value so the per-task verdict is "unknown" (no exceeds/lags noise) — isolates the finding.
    writeFileSync(
      join(p.root, ".board", "links.json"),
      JSON.stringify({
        schema: 1, provider: "jira", generatedAt: "x",
        links: [{ id: "TASK-1", status: "Custom", specDir: "specs/001-a", acs: [] }],
      })
    );
    const { problems } = checkBridge(p.root, { runGates: false });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /board mirror is stale/);
    assert.match(problems[0], /no observedSha/);
    assert.match(problems[0], /run the board:sync skill/);
    assert.match(problems[0], /\.board\/links\.json/);
  } finally {
    p.done();
  }
});

test("checkBridge: a stale requiresSync:false mirror yields NO staleness problem — live projection is preferred (AC #6)", () => {
  const p = scratch();
  try {
    mkdirSync(join(p.root, ".board"), { recursive: true });
    // provider "backlog" (requiresSync:false). observedSha references a commit this non-git
    // root cannot verify — mirrorStaleness() itself would call this stale — but the R3
    // asymmetry means checkBridge never even asks for requiresSync:false: it prefers
    // recomputation over complaint, so no staleness problem should appear.
    writeFileSync(
      join(p.root, ".board", "links.json"),
      JSON.stringify({
        schema: 1, provider: "backlog", generatedAt: "x",
        links: [{
          id: "TASK-2", status: "Custom", specDir: "specs/002-a", acs: [],
          observedSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        }],
      })
    );
    const { problems } = checkBridge(p.root, { runGates: false });
    assert.equal(problems.length, 0);
  } finally {
    p.done();
  }
});

test('checkBridge: a declared requiresSync:true provider with an absent mirror yields the R4 "no board evidence" problem (AC #7)', () => {
  const p = scratch();
  try {
    writeFileSync(join(p.root, ".board.json"), JSON.stringify({ provider: "jira" }));
    const { problems } = checkBridge(p.root, { runGates: false });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /provider "jira" is declared/);
    assert.match(problems[0], /\.board\/links\.json is missing/);
    assert.match(problems[0], /no board evidence to check/);
    assert.match(problems[0], /board:sync/);
  } finally {
    p.done();
  }
});

test("checkBridge: no .board.json and no mirror default to provider \"backlog\" — no R3/R4 problem (backward compat)", () => {
  const p = scratch();
  try {
    const { problems } = checkBridge(p.root, { runGates: false });
    assert.equal(problems.length, 0);
  } finally {
    p.done();
  }
});

// DoD #6: a throwing readMirror (malformed mirror JSON) must surface through gate-runner.mjs's
// evaluate() as a blocking problem naming the gate — never a crash that takes down the Stop
// hook process itself. Exercised end-to-end: real bridgeGate, real evaluate(), a real (broken)
// mirror file on disk.
test("gate-runner: a malformed mirror's readMirror throw surfaces as a blocking problem, not a crash (DoD #6)", () => {
  const p = scratch();
  try {
    mkdirSync(join(p.root, ".board"), { recursive: true });
    writeFileSync(join(p.root, ".board", "links.json"), "{ not valid json");
    const verdict = evaluate({}, [bridgeGate], { cwd: p.root });
    assert.equal(verdict.block, true);
    assert.match(verdict.message, /\[spec-bridge\] crashed on .*: .*malformed JSON/);
  } finally {
    p.done();
  }
});
