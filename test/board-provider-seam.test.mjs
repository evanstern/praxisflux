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
import {
  bridgeGate, checkBridge, planBridge, planIntents, renderBacklog, planLinkedTask,
} from "../spec-bridge/gates/bridge.mjs";
import { evaluate } from "../lib/gate-runner.mjs";
import { deriveSpecState } from "../lib/spec-derive.mjs";

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

/* ── spec 053 phase 3: the planner split (R5) and the differential proof (AC #3) ──
 *
 * The protected files (test/spec-bridge.test.mjs, test/phase-status.test.mjs) already prove
 * the split is byte-faithful — they call planBridge/renderBacklog transitively through
 * planLinkedTask and assert exact command strings, unedited. What they can't show is the
 * split's *shape*: that the ordering decisions (removal order, post-edit indexes) really do
 * live in planIntents rather than in renderBacklog. That's what the first test below checks
 * directly; the second and third cover AC #8 and AC #3. */

test("planIntents/renderBacklog: ordering is baked into the intent, not decided at render time; the split reproduces planLinkedTask's exact bytes", () => {
  const p = scratch();
  try {
    // Same regeneration scenario as spec-bridge.test.mjs's "post-regeneration re-mirror" test
    // (TASK-3): "Old" is gone, "Core" is new, "Setup" reverts to unchecked.
    const specDir = "specs/003-c";
    mkdirSync(join(p.root, specDir), { recursive: true });
    writeFileSync(join(p.root, specDir, "spec.md"), "# s");
    writeFileSync(join(p.root, specDir, "plan.md"), "# p");
    writeFileSync(join(p.root, specDir, "tasks.md"), "## Setup\n- [ ] T1 a\n\n## Core\n- [ ] T2 b\n");
    const task = {
      id: "TASK-3", status: "In Progress",
      acs: [
        { index: 1, checked: false, text: "Human criterion" },
        { index: 2, checked: true, text: "Spec phase: Old" },
        { index: 3, checked: true, text: "Spec phase: Setup" },
        { index: 4, checked: true, text: "Spec phase: Old" },
      ],
    };
    const derived = deriveSpecState(join(p.root, specDir), {});
    const intents = planIntents(task, derived);

    assert.deepEqual(intents.acRemove, [4, 2], "highest index first, decided in planIntents");
    assert.deepEqual(intents.acAdd, ["Spec phase: Core"]);
    assert.deepEqual(intents.acCheck, []);
    assert.deepEqual(intents.acUncheck, [2], "Setup renumbered to 2 post-removal, decided in planIntents");
    assert.equal(intents.statusTo, null, "In Progress agrees with In Progress: no status move");

    assert.deepEqual(renderBacklog(task.id, intents), planLinkedTask(task, derived));
  } finally {
    p.done();
  }
});

test('planBridge (AC #8): "backlog" keeps today\'s exact command strings; a non-backlog resolved provider gets intents plus a notice', () => {
  const p = scratch();
  try {
    const specDir = "specs/001-a";
    mkdirSync(join(p.root, specDir), { recursive: true });
    writeFileSync(join(p.root, specDir, "spec.md"), "# s");
    writeFileSync(join(p.root, specDir, "plan.md"), "# p");
    writeFileSync(join(p.root, specDir, "tasks.md"), "## Setup\n- [x] T1 a\n\n## Core\n- [ ] T2 b\n");

    // Mirror declares "backlog" — planBridge must still render commands (mirror-sourced links
    // are not special-cased away from rendering; only the RESOLVED PROVIDER decides).
    mkdirSync(join(p.root, ".board"), { recursive: true });
    writeFileSync(
      join(p.root, ".board", "links.json"),
      JSON.stringify({
        schema: 1, provider: "backlog", generatedAt: "x",
        links: [{ id: "TASK-9", status: "To Do", specDir, acs: [] }],
      })
    );
    const backlogPlan = planBridge(p.root);
    assert.ok(Array.isArray(backlogPlan.commands), "backlog provider renders commands");
    assert.equal(backlogPlan.intents, undefined);
    assert.ok(backlogPlan.commands.some((c) => c === "backlog task edit TASK-9 -s 'In Progress'"));

    // Now the mirror declares "jira" — same board state, but planBridge must stop rendering
    // backlog-flavored commands and hand back structured intents plus the stated notice.
    writeFileSync(
      join(p.root, ".board", "links.json"),
      JSON.stringify({
        schema: 1, provider: "jira", generatedAt: "x",
        links: [{ id: "TASK-9", status: "To Do", specDir, acs: [] }],
      })
    );
    const jiraPlan = planBridge(p.root);
    assert.equal(jiraPlan.commands, undefined, "no backlog command strings for a non-backlog provider");
    assert.equal(jiraPlan.intents.length, 1);
    assert.equal(jiraPlan.intents[0].id, "TASK-9");
    assert.equal(jiraPlan.intents[0].statusTo, "In Progress");
    assert.match(jiraPlan.notice, /provider-specific/);
  } finally {
    p.done();
  }
});

test("differential (AC #3): equivalent backlog/tasks/*.md and .board/links.json board state yield identical problems and warnings", () => {
  const live = mkdtempSync(join(tmpdir(), "board-diff-live-"));
  const mirrored = mkdtempSync(join(tmpdir(), "board-diff-mirror-"));
  try {
    const HALF_CHECKED = "## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [ ] T002 b\n";
    const spec = (root, dir, files) => {
      mkdirSync(join(root, dir), { recursive: true });
      for (const [name, content] of Object.entries(files)) writeFileSync(join(root, dir, name), content);
    };
    const specs = {
      "specs/001-a": { "spec.md": "# S", "plan.md": "# P", "tasks.md": HALF_CHECKED },
      "specs/002-b": { "spec.md": "# S", "plan.md": "# P", "tasks.md": HALF_CHECKED },
    };
    for (const [dir, files] of Object.entries(specs)) {
      spec(live, dir, files);
      spec(mirrored, dir, files);
    }

    // Live path: backlog/tasks/*.md. TASK-1 "Done" over half-checked artifacts exceeds
    // (a problem); TASK-2 "To Do" under a half-checked spec lags (a warning) — the fixture
    // exercises both channels, not just one.
    mkdirSync(join(live, "backlog", "tasks"), { recursive: true });
    const writeTask = (id, status, specDir) =>
      writeFileSync(
        join(live, "backlog", "tasks", `${id.toLowerCase()} - fixture.md`),
        `---\nid: ${id}\ntitle: 'Fixture ${id}'\nstatus: ${status}\nassignee: []\n---\n\n## Description\n\nSpec: ${specDir}/\n`
      );
    writeTask("TASK-1", "Done", "specs/001-a");
    writeTask("TASK-2", "To Do", "specs/002-b");

    // Mirror path: same ids, same statuses, same specDirs, as .board/links.json — the artifact
    // 052 says is equivalent evidence.
    mkdirSync(join(mirrored, ".board"), { recursive: true });
    writeFileSync(
      join(mirrored, ".board", "links.json"),
      JSON.stringify({
        schema: 1, provider: "backlog", generatedAt: "x",
        links: [
          { id: "TASK-1", status: "Done", specDir: "specs/001-a", acs: [] },
          { id: "TASK-2", status: "To Do", specDir: "specs/002-b", acs: [] },
        ],
      })
    );

    const fromLive = checkBridge(live, { runGates: false });
    const fromMirror = checkBridge(mirrored, { runGates: false });

    assert.deepEqual(fromLive.problems, fromMirror.problems);
    assert.deepEqual(fromLive.warnings, fromMirror.warnings);
    assert.ok(fromLive.problems.length > 0, "fixture must exercise the problems channel");
    assert.ok(fromLive.warnings.length > 0, "fixture must exercise the warnings channel");
  } finally {
    rmSync(live, { recursive: true, force: true });
    rmSync(mirrored, { recursive: true, force: true });
  }
});
