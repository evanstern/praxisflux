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
  bridgeGate, checkBridge, planBridge, planIntents, renderBacklog, planLinkedTask, renderJira,
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
  // removed (spec 062 R5): an explicitly-passed { cwd } now wins over $CLAUDE_PROJECT_DIR, so
  // the guard that used to delete/restore the var here is redundant — evaluate() below already
  // passes { cwd: p.root } and resolves against the fixture regardless of the ambient var.
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

// spec 062 R4/AC#3 — decoy regression: an explicitly-passed { cwd } must win over
// CLAUDE_PROJECT_DIR, not just "not lose to a deleted one" (that's the DoD#6 guard above).
// Here the env var is SET to a decoy directory whose content would produce a different,
// distinguishable verdict (no board evidence -> resolveRoots []) than the fixture passed as
// cwd (malformed mirror -> crash-on-malformed-JSON problem, same shape as DoD#6). Today's
// lib/gate-runner.mjs:39 lets $CLAUDE_PROJECT_DIR win, so this test resolves against the
// decoy and gets block:false — RED against unmodified lib/. Phase 2 makes it pass.
test("gate-runner: an explicit cwd wins over CLAUDE_PROJECT_DIR set to a decoy (spec 062 R4)", () => {
  const fixture = scratch();
  const decoy = scratch();
  const prevProj = process.env.CLAUDE_PROJECT_DIR;
  try {
    mkdirSync(join(fixture.root, ".board"), { recursive: true });
    writeFileSync(join(fixture.root, ".board", "links.json"), "{ not valid json");
    // decoy stays empty: no .board, no backlog -> resolveRoots finds nothing there, so if the
    // buggy precedence samples the decoy instead of the fixture, no gate even runs.

    process.env.CLAUDE_PROJECT_DIR = decoy.root;
    const verdict = evaluate({}, [bridgeGate], { cwd: fixture.root });
    assert.equal(verdict.block, true, "must resolve against the passed fixture, not $CLAUDE_PROJECT_DIR's decoy");
    assert.match(verdict.message, /\[spec-bridge\] crashed on .*: .*malformed JSON/);
  } finally {
    fixture.done();
    decoy.done();
    if (prevProj !== undefined) process.env.CLAUDE_PROJECT_DIR = prevProj;
    else delete process.env.CLAUDE_PROJECT_DIR;
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

/* ── spec 055 Phase 3 (R6/AC #9) — renderJira: renderBacklog's sibling for the jira provider.
 * Fixture intents throughout (not run through planIntents) — renderJira's own AC asks for it to
 * be "unit-tested against fixture intents", independent of how planIntents happens to shape a
 * given scenario. ── */

const noAcChange = { acRemove: [], acAdd: [], acCheck: [], acUncheck: [] };

test("renderJira: a plain status move resolves through config.statusMap and emits one transitionJiraIssue call", () => {
  const intents = {
    id: "TASK-9", statusFrom: "To Do", statusTo: "In Progress", finalSummary: null, note: null, ...noAcChange,
  };
  const calls = renderJira("TASK-9", intents, { statusMap: { "In Progress": "In Dev" } });
  assert.deepEqual(calls, [
    { tool: "transitionJiraIssue", args: { issueIdOrKey: "TASK-9", status: "In Dev" }, why: "status To Do -> In Progress" },
  ]);
});

test("renderJira: an unmapped status target falls through unchanged (same rule as .board.json's statusMap elsewhere)", () => {
  const intents = { id: "TASK-9", statusFrom: "To Do", statusTo: "In Progress", finalSummary: null, note: null, ...noAcChange };
  const calls = renderJira("TASK-9", intents, {});
  assert.equal(calls[0].args.status, "In Progress");
});

test("renderJira: Done comments the final summary THEN transitions (board:final's jira column), and a separate note comment lands after", () => {
  const intents = {
    id: "TASK-9", statusFrom: "In Progress", statusTo: "Done",
    finalSummary: "All spec tasks complete (Setup: 1/1). Derived Done by spec-bridge sync.",
    note: "spec-bridge sync: Setup: 1/1 — status In Progress → Done",
    ...noAcChange,
  };
  const calls = renderJira("TASK-9", intents, { statusMap: { Done: "Closed" } });
  assert.deepEqual(calls.map((c) => c.tool), ["addOrEditJiraIssueComment", "transitionJiraIssue", "addOrEditJiraIssueComment"]);
  assert.equal(calls[0].args.commentBody, intents.finalSummary);
  assert.equal(calls[1].args.status, "Closed");
  assert.equal(calls[2].args.commentBody, intents.note);
});

test("renderJira: all four ac* arrays collapse into exactly ONE editJiraIssue call carrying the raw diff", () => {
  const intents = {
    id: "TASK-9", statusFrom: "In Progress", statusTo: null, finalSummary: null,
    note: "spec-bridge sync: Setup: 1/1 · Core: 1/2",
    acRemove: [4, 2], acAdd: ["Spec phase: Core"], acCheck: [1], acUncheck: [2],
  };
  const calls = renderJira("TASK-9", intents, {});
  assert.equal(calls.length, 2, "one editJiraIssue call plus the trailing note comment — never one call per ac* entry");
  assert.deepEqual(calls[0], {
    tool: "editJiraIssue",
    args: { issueIdOrKey: "TASK-9", acRemove: [4, 2], acAdd: ["Spec phase: Core"], acCheck: [1], acUncheck: [2] },
    why: intents.note,
  });
  assert.equal(calls[1].tool, "addOrEditJiraIssueComment");
});

test("renderJira: nothing changed emits no calls", () => {
  const intents = { id: "TASK-9", statusFrom: "To Do", statusTo: null, finalSummary: null, note: null, ...noAcChange };
  assert.deepEqual(renderJira("TASK-9", intents, {}), []);
});

test("renderJira is pure: no MCP tool prefix and no network primitive appears anywhere in bridge.mjs's source", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../spec-bridge/gates/bridge.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /mcp__/);
  assert.doesNotMatch(src, /\bfetch\(/);
});

/* ── spec 056 Phase 2 (AC #9 point 3) — THE feature's reason for existing.
 * A card set Done in the Jira UI over unchecked tasks.md boxes must produce a BLOCKING
 * finding. Reproduced live against a real Jira board on 2026-09-10 and pinned here (issue key
 * neutralized — finding F7: no live site identifiers in this public, auto-published repo).
 * The subtlety worth keeping: the MIRROR is valid and fresh — board-mirror --check exits 0.
 * The dishonesty is not a broken artifact, it is a status outrunning its evidence, and only
 * the bridge gate can see it. A test that asserted only on the mirror would pass while the
 * hole stayed open. ── */
test("jira: a card Done in the UI over unchecked boxes is a BLOCKING bridge finding", () => {
  const root = mkdtempSync(join(tmpdir(), "jira-ui-done-"));
  execFileSync("git", ["init", "-q"], { cwd: root });

  const specDir = "specs/056-jira-provider";
  mkdirSync(join(root, specDir), { recursive: true });
  writeFileSync(join(root, specDir, "spec.md"), "# spec\n");
  writeFileSync(join(root, specDir, "plan.md"), "# plan\n");
  writeFileSync(join(root, specDir, "tasks.md"),
    "# tasks\n## Phase 1 — Read path\n- [x] done thing\n## Phase 2 — Write path\n- [ ] NOT done\n- [ ] also not done\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "spec"], { cwd: root });
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

  // The mirror as board-sync would write it after a human dragged the card to Done.
  mkdirSync(join(root, ".board"), { recursive: true });
  writeFileSync(join(root, ".board", "links.json"), JSON.stringify({
    schema: 1, provider: "jira", generatedAt: "2026-09-10T14:00:00.000Z",
    links: [{
      id: "SCRATCH-122", status: "Done", specDir,
      acs: [{ index: 1, checked: true, text: "Phase 1 — Read path" },
            { index: 2, checked: false, text: "Phase 2 — Write path" }],
      observedAt: "2026-09-10T14:00:00.000Z", observedSha: sha,
    }],
  }, null, 2) + "\n");

  const { problems } = checkBridge(root, { runGates: false });
  const hit = problems.find((m) => String(m).includes("SCRATCH-122"));
  assert.ok(hit, `expected a blocking problem for the Done-over-unchecked card, got ${JSON.stringify(problems)}`);
  const msg = String(hit);
  assert.match(msg, /"Done"/, "the finding must name the dishonest claimed status");
  assert.match(msg, /In Progress/, "and what the artifacts actually prove");
  assert.match(msg, /unchecked/, "and why");

  rmSync(root, { recursive: true, force: true });
});
