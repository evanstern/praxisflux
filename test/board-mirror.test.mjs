import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { execFileSync } from "node:child_process";
import {
  readMirror, writeMirror, validateMirror, compareIds, mirrorPath,
  mirrorStaleness, providers, projectBacklog, findLinkedTasks,
  loadBoardConfig, validateBoardConfig, isPausedLink,
  renderSpecPhasesBlock, parseSpecPhasesBlock, toSiteStatus, toBridgeStatus,
} from "../lib/board-mirror.mjs";

const CLI = new URL("../lib/board-mirror.mjs", import.meta.url).pathname;

/** Build a throwaway project with one linked Backlog task file, so `projectBacklog` has
 *  something real to recompute against (mirrors parseLinkedTask's expected shape). */
function backlogProjectWithOneTask({ id = "TASK-1", status = "To Do", specDir = "specs/001-a" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "board-mirror-cli-"));
  const tasksDir = join(root, "backlog", "tasks");
  mkdirSync(tasksDir, { recursive: true });
  writeFileSync(
    join(tasksDir, `${id}.md`),
    `---\nid: ${id}\nstatus: ${status}\n---\n\nSpec: ${specDir}\n\n<!-- AC:BEGIN -->\n- [x] #1 first\n<!-- AC:END -->\n`,
  );
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

function runCli(root) {
  try {
    const stdout = execFileSync("node", [CLI, "--check", "--root", root], { encoding: "utf8" });
    return { status: 0, stdout };
  } catch (e) {
    return { status: e.status, stdout: e.stdout };
  }
}

// AC #8 — the --check CLI.
test("--check CLI: exits 0 with the stated line when no mirror exists", () => {
  const p = project();
  try {
    const { status, stdout } = runCli(p.root);
    assert.equal(status, 0);
    assert.match(stdout, /no mirror; nothing to check/);
  } finally {
    p.done();
  }
});

test("--check CLI: exits 0 on a freshly written mirror", () => {
  const b = backlogProjectWithOneTask();
  try {
    writeMirror(b.root, { schema: 1, provider: "backlog", generatedAt: "x", links: projectBacklog(b.root) });
    const { status, stdout } = runCli(b.root);
    assert.equal(status, 0);
    assert.match(stdout, /matches the recomputed projection/);
  } finally {
    b.done();
  }
});

test("--check CLI: exits nonzero after a one-status hand edit, naming the drifted id", () => {
  const b = backlogProjectWithOneTask({ id: "TASK-7" });
  try {
    writeMirror(b.root, { schema: 1, provider: "backlog", generatedAt: "x", links: projectBacklog(b.root) });
    // Hand-edit: flip the on-disk status without touching the backlog task file it was
    // projected from — this is exactly the drift a hand-edited mirror produces.
    const raw = readFileSync(mirrorPath(b.root), "utf8");
    writeFileSync(mirrorPath(b.root), raw.replace('"To Do"', '"In Progress"'));
    const { status, stdout } = runCli(b.root);
    assert.equal(status, 1);
    assert.match(stdout, /TASK-7/);
  } finally {
    b.done();
  }
});

function project() {
  const root = mkdtempSync(join(tmpdir(), "board-mirror-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

const BASE_MIRROR = {
  schema: 1,
  provider: "backlog",
  generatedAt: "2026-08-27T14:02:11.000Z",
  links: [
    { id: "TASK-9", status: "To Do", specDir: "specs/009-a", acs: [] },
    { id: "TASK-10", status: "In Progress", specDir: "specs/010-b", acs: [{ index: 1, checked: true, text: "Spec phase: Seam" }] },
  ],
};

// AC #3 — natural id ordering.
test("compareIds sorts TASK-9 before TASK-10 and TASK-6.2 before TASK-6.10", () => {
  assert.ok(compareIds("TASK-9", "TASK-10") < 0);
  assert.ok(compareIds("TASK-10", "TASK-9") > 0);
  assert.ok(compareIds("TASK-6.2", "TASK-6.10") < 0);
  assert.equal(compareIds("TASK-9", "TASK-9"), 0);
});

// AC #2 — absent, malformed, and unknown-schema reads.
test("readMirror: null when absent, throws on malformed JSON, throws on unknown schema", () => {
  const p = project();
  try {
    assert.equal(readMirror(p.root), null);

    mkdirSync(join(p.root, ".board"), { recursive: true });
    writeFileSync(join(p.root, ".board", "links.json"), "{not json");
    assert.throws(() => readMirror(p.root), /malformed JSON/);

    writeFileSync(join(p.root, ".board", "links.json"), JSON.stringify({ schema: 99, provider: "x", generatedAt: "y", links: [] }));
    assert.throws(() => readMirror(p.root), /unknown schema/);
  } finally {
    p.done();
  }
});

test("readMirror round-trips a well-formed mirror written by writeMirror", () => {
  const p = project();
  try {
    writeMirror(p.root, BASE_MIRROR);
    const back = readMirror(p.root);
    assert.equal(back.schema, 1);
    assert.equal(back.links.length, 2);
  } finally {
    p.done();
  }
});

// AC #3 — byte-determinism and natural sort in writeMirror's output.
test("writeMirror is byte-deterministic and sorts links naturally", () => {
  const p = project();
  try {
    // Feed links out of order; writeMirror must sort them.
    const scrambled = { ...BASE_MIRROR, links: [...BASE_MIRROR.links].reverse() };
    writeMirror(p.root, scrambled);
    const first = readFileSync(mirrorPath(p.root), "utf8");

    writeMirror(p.root, scrambled);
    const second = readFileSync(mirrorPath(p.root), "utf8");
    assert.equal(first, second, "writing the same logical mirror twice must produce identical bytes");

    assert.ok(first.endsWith("\n"));
    const parsed = JSON.parse(first);
    assert.deepEqual(parsed.links.map((l) => l.id), ["TASK-9", "TASK-10"]);
  } finally {
    p.done();
  }
});

test("writeMirror round-trips unknown top-level and per-link keys", () => {
  const p = project();
  try {
    const withExtras = {
      ...BASE_MIRROR,
      futureField: "kept",
      links: [{ ...BASE_MIRROR.links[0], futureLinkField: 42 }],
    };
    writeMirror(p.root, withExtras);
    const back = readMirror(p.root);
    assert.equal(back.futureField, "kept");
    assert.equal(back.links[0].futureLinkField, 42);
  } finally {
    p.done();
  }
});

// AC #4 — validateMirror's checks.
test("validateMirror catches missing required fields and wrong types", () => {
  assert.deepEqual(validateMirror({ provider: "backlog", generatedAt: "x", links: [] }), [
    "schema: expected number, got missing",
  ]);
  const problems = validateMirror({ schema: "1", provider: 5, generatedAt: "x", links: [] });
  assert.ok(problems.some((m) => m === "schema: expected number, got string"));
  assert.ok(problems.some((m) => m === "provider: expected string, got number"));
});

test("validateMirror catches duplicate id and duplicate specDir", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [] },
      { id: "TASK-1", status: "To Do", specDir: "specs/002-b", acs: [] },
      { id: "TASK-2", status: "To Do", specDir: "specs/002-b", acs: [] },
    ],
  };
  const problems = validateMirror(mirror);
  assert.ok(problems.includes("duplicate id: TASK-1"));
  assert.ok(problems.includes("duplicate specDir: specs/002-b"));
});

test("validateMirror catches non-monotonic acs index", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [
        { index: 2, checked: true, text: "b" },
        { index: 1, checked: false, text: "a" },
      ] },
    ],
  };
  const problems = validateMirror(mirror);
  assert.ok(problems.some((m) => m.includes("acs index not monotonic")));
});

test("validateMirror is clean on a well-formed mirror", () => {
  assert.deepEqual(validateMirror(BASE_MIRROR), []);
});

// AC #6 (spec 055 R4) — labels[] is optional and additive; a mirror written before this
// field existed has no `labels` key at all and must still validate (backward compat).
test("validateMirror: a link with no labels key at all is still valid", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [{ id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [] }],
  };
  assert.deepEqual(validateMirror(mirror), []);
});

test("validateMirror: a well-formed labels list round-trips clean", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [{ id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [], labels: ["paused", "chassis"] }],
  };
  assert.deepEqual(validateMirror(mirror), []);
});

test("validateMirror: a non-array labels is an error naming the offending link", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [{ id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [], labels: "paused" }],
  };
  const problems = validateMirror(mirror);
  assert.ok(problems.some((m) => m === "links[0].labels: expected array, got string"));
});

test("validateMirror: a labels array with a non-string entry is an error naming the link and index", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [{ id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [], labels: ["paused", 42] }],
  };
  const problems = validateMirror(mirror);
  assert.ok(problems.some((m) => m === "links[0].labels[1]: expected string, got number"));
});

test("writeMirror + readMirror round-trip a link's labels", () => {
  const p = project();
  try {
    writeMirror(p.root, { ...BASE_MIRROR, links: [{ ...BASE_MIRROR.links[0], labels: ["paused"] }] });
    const back = readMirror(p.root);
    assert.deepEqual(back.links.find((l) => l.id === "TASK-9").labels, ["paused"]);
  } finally {
    p.done();
  }
});

// AC #5 — mirrorStaleness's three fail-closed cases.

function gitRepoWithTwoCommits() {
  const root = mkdtempSync(join(tmpdir(), "board-mirror-git-"));
  const run = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  run("init", "-q");
  run("config", "user.email", "test@example.com");
  run("config", "user.name", "Test");
  writeFileSync(join(root, "a.txt"), "one");
  run("add", "a.txt");
  run("commit", "-q", "-m", "first");
  const older = run("rev-parse", "HEAD").trim();
  writeFileSync(join(root, "a.txt"), "two");
  run("add", "a.txt");
  run("commit", "-q", "-m", "second");
  const newer = run("rev-parse", "HEAD").trim();
  return { root, older, newer, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("mirrorStaleness: observedSha not an ancestor of headSha is stale", () => {
  const g = gitRepoWithTwoCommits();
  try {
    // `newer` is a descendant of `older`, so it is NOT an ancestor of `older` — checking
    // staleness against the older commit as headSha must report the newer sha as non-ancestor.
    const mirror = { schema: 1, provider: "backlog", generatedAt: "x", links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [], observedSha: g.newer },
    ] };
    const result = mirrorStaleness(g.root, mirror, { headSha: g.older });
    assert.equal(result.stale, true);
    assert.match(result.reason, /not an ancestor/);
  } finally {
    g.done();
  }
});

test("mirrorStaleness: an ancestor observedSha is not stale", () => {
  const g = gitRepoWithTwoCommits();
  try {
    const mirror = { schema: 1, provider: "backlog", generatedAt: "x", links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [], observedSha: g.older },
    ] };
    const result = mirrorStaleness(g.root, mirror, { headSha: g.newer });
    assert.equal(result.stale, false);
  } finally {
    g.done();
  }
});

test("mirrorStaleness: absent observedSha on a requiresSync provider is stale", () => {
  // No `jira` key is registered yet (spec 056's non-goal here); an unregistered provider name
  // is treated as requiresSync by default (fail-closed), which is exactly the shape a
  // model-backed provider without a `--check`-computable projector has.
  const p = project();
  try {
    const mirror = { schema: 1, provider: "jira", generatedAt: "x", links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [] },
    ] };
    const result = mirrorStaleness(p.root, mirror, { headSha: "HEAD" });
    assert.equal(result.stale, true);
    assert.match(result.reason, /no observedSha/);
  } finally {
    p.done();
  }
});

test("mirrorStaleness: absent observedSha on a non-requiresSync provider is fine", () => {
  const p = project();
  try {
    const mirror = { schema: 1, provider: "backlog", generatedAt: "x", links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [] },
    ] };
    assert.equal(mirrorStaleness(p.root, mirror, { headSha: "HEAD" }).stale, false);
  } finally {
    p.done();
  }
});

test("mirrorStaleness: a non-git root is stale", () => {
  const p = project();
  try {
    const mirror = { schema: 1, provider: "backlog", generatedAt: "x", links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [], observedSha: "deadbeef" },
    ] };
    const result = mirrorStaleness(p.root, mirror, { headSha: "HEAD" });
    assert.equal(result.stale, true);
    assert.match(result.reason, /cannot verify/);
  } finally {
    p.done();
  }
});

// AC #6 — the backlog projector matches findLinkedTasks(".") entry-for-entry.
test("projectBacklog matches findLinkedTasks(\".\") on id, status, specDir, acs", () => {
  const projected = projectBacklog(".");
  const found = findLinkedTasks(".");
  assert.equal(projected.length, found.length);
  assert.ok(projected.length > 0, "this repo's own backlog/tasks/ must have linked tasks to compare against");
  const strip = (t) => ({ id: t.id, status: t.status, specDir: t.specDir, acs: t.acs });
  assert.deepEqual(projected.map(strip), found.map(strip));
});

// AC #6 (spec 055 R4) — projectBacklog reads labels from frontmatter's `labels:` list.
test("projectBacklog: projects labels from a task's frontmatter labels: block list", () => {
  const root = mkdtempSync(join(tmpdir(), "board-mirror-labels-"));
  try {
    const tasksDir = join(root, "backlog", "tasks");
    mkdirSync(tasksDir, { recursive: true });
    writeFileSync(
      join(tasksDir, "task-1.md"),
      "---\nid: TASK-1\nstatus: To Do\nlabels:\n  - paused\n  - chassis\n---\n\nSpec: specs/001-a\n",
    );
    const [link] = projectBacklog(root);
    assert.deepEqual(link.labels, ["paused", "chassis"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("projectBacklog: an unlabelled task (labels: [] or the key absent) projects with no labels key at all", () => {
  const root = mkdtempSync(join(tmpdir(), "board-mirror-nolabels-"));
  try {
    const tasksDir = join(root, "backlog", "tasks");
    mkdirSync(tasksDir, { recursive: true });
    writeFileSync(join(tasksDir, "task-1.md"), "---\nid: TASK-1\nstatus: To Do\nlabels: []\n---\n\nSpec: specs/001-a\n");
    writeFileSync(join(tasksDir, "task-2.md"), "---\nid: TASK-2\nstatus: To Do\n---\n\nSpec: specs/002-b\n");
    const links = projectBacklog(root);
    assert.deepEqual(links.map((l) => "labels" in l), [false, false], "an unlabelled task's projected link stays byte-identical to before this field existed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// AC #7 — the paused-lane doctrine works from mirror labels alone: a mirror-only project (no
// backlog/tasks/ present at all) whose link carries `paused` is excluded from conflict
// analysis, proving the fix a Jira-only host needs (spec 055 R4).
test("isPausedLink: a mirror-only project's paused-labelled link is excluded from lane-conflict analysis using mirror labels alone (AC #7)", () => {
  const p = project(); // no backlog/tasks/ anywhere under p.root — the mirror is the ONLY board file
  try {
    const mirror = {
      schema: 1, provider: "backlog", generatedAt: "x",
      links: [
        { id: "TASK-1", status: "In Progress", specDir: "specs/001-a", acs: [], labels: ["paused"] },
        { id: "TASK-2", status: "In Progress", specDir: "specs/002-b", acs: [] },
      ],
    };
    writeMirror(p.root, mirror);
    const read = readMirror(p.root);
    assert.deepEqual(validateMirror(read), []);
    const forConflictAnalysis = read.links.filter((l) => !isPausedLink(l));
    assert.deepEqual(
      forConflictAnalysis.map((l) => l.id),
      ["TASK-2"],
      "TASK-1 is paused and must be excluded, resolved entirely from the mirror's labels with no backlog/tasks/ to fall back on",
    );
  } finally {
    p.done();
  }
});

test("isPausedLink: false for a link with no labels, or a labels list without \"paused\"", () => {
  assert.equal(isPausedLink({ id: "TASK-1" }), false);
  assert.equal(isPausedLink({ id: "TASK-1", labels: ["chassis"] }), false);
  assert.equal(isPausedLink({ id: "TASK-1", labels: ["paused"] }), true);
});

// R4 — the registry shape itself: no provider-name conditional, `requiresSync`/`project`
// carry the distinction.
test("providers registry: backlog is requiresSync:false with a project function", () => {
  assert.equal(providers.backlog.requiresSync, false);
  assert.equal(typeof providers.backlog.project, "function");
});

// AC #1/#2 — loadBoardConfig: absent, malformed, unknown provider.
test("loadBoardConfig: { provider: \"backlog\" } when .board.json is absent", () => {
  const p = project();
  try {
    assert.deepEqual(loadBoardConfig(p.root), { provider: "backlog" });
  } finally {
    p.done();
  }
});

test("loadBoardConfig: throws on malformed JSON", () => {
  const p = project();
  try {
    writeFileSync(join(p.root, ".board.json"), "{not json");
    assert.throws(() => loadBoardConfig(p.root), /malformed JSON/);
  } finally {
    p.done();
  }
});

test("loadBoardConfig: throws naming the known providers on an unknown provider name", () => {
  const p = project();
  try {
    writeFileSync(join(p.root, ".board.json"), JSON.stringify({ provider: "trello" }));
    assert.throws(() => loadBoardConfig(p.root), /unknown board provider "trello".*backlog.*jira/);
  } finally {
    p.done();
  }
});

test("loadBoardConfig: never falls back to backlog for an unrecognized provider — it throws instead", () => {
  const p = project();
  try {
    writeFileSync(join(p.root, ".board.json"), JSON.stringify({ provider: "typo-of-jira" }));
    assert.throws(() => loadBoardConfig(p.root));
    // The throw above is the only behavior — there is no code path that returns a config here.
  } finally {
    p.done();
  }
});

test("loadBoardConfig: reads a well-formed jira config back verbatim", () => {
  const p = project();
  try {
    const config = { provider: "jira", jira: { cloudId: "x.atlassian.net", projectKey: "PROJ", issueTypeName: "Task" } };
    writeFileSync(join(p.root, ".board.json"), JSON.stringify(config));
    assert.deepEqual(loadBoardConfig(p.root), config);
  } finally {
    p.done();
  }
});

// AC #1/#3 — validateBoardConfig's cases, including the complete-valid-config case.
test("validateBoardConfig: { provider: \"backlog\" } is a complete valid config", () => {
  assert.deepEqual(validateBoardConfig({ provider: "backlog" }), []);
});

test("validateBoardConfig: catches provider as an array", () => {
  const problems = validateBoardConfig({ provider: ["backlog", "jira"] });
  assert.ok(problems.some((m) => m.includes("array")));
});

test("validateBoardConfig: catches an unknown provider, naming the known set", () => {
  const problems = validateBoardConfig({ provider: "trello" });
  assert.ok(problems.some((m) => /unknown board provider "trello"/.test(m) && /backlog/.test(m) && /jira/.test(m)));
});

test("validateBoardConfig: catches jira missing each of cloudId/projectKey/issueTypeName", () => {
  const problems = validateBoardConfig({ provider: "jira", jira: {} });
  assert.ok(problems.some((m) => m.includes("jira.cloudId")));
  assert.ok(problems.some((m) => m.includes("jira.projectKey")));
  assert.ok(problems.some((m) => m.includes("jira.issueTypeName")));
});

test("validateBoardConfig: a complete jira config is clean", () => {
  const problems = validateBoardConfig({
    provider: "jira",
    jira: { cloudId: "x.atlassian.net", projectKey: "PROJ", issueTypeName: "Task", statusMap: { "To Do": "To Do" } },
  });
  assert.deepEqual(problems, []);
});

test("validateBoardConfig: catches a non-object statusMap", () => {
  const problems = validateBoardConfig({
    provider: "jira",
    jira: { cloudId: "x", projectKey: "PROJ", issueTypeName: "Task", statusMap: "not an object" },
  });
  assert.ok(problems.some((m) => m.includes("statusMap")));
});

/* ── spec 056 Phase 2 (AC #1, #5) — the jira provider entry and both mapping directions.
 * The ratified shape (specs/056-jira-provider/findings/phase-2-operator-rulings.md, ruling 2):
 * statusMap is bridge->site and MUST be injective; statusReadMap is site->bridge and is
 * many-to-one by design. Fixtures below use the operator-ratified live mapping. ── */

// The ratified map, as it will appear in a real host's .board.json.
const RATIFIED = {
  statusMap: { "To Do": "Open", "In Progress": "In Dev", Done: "Closed" },
  statusReadMap: {
    Open: "To Do", "Waiting for Info": "To Do", "Requirements clarification": "To Do",
    "On Hold": "To Do", "Transferred to Support": "To Do",
    "Ready for Dev": "In Progress", "Functional Design": "In Progress",
    "Technical Design": "In Progress", "In Dev": "In Progress", "Code Review": "In Progress",
    "In Testing": "In Progress", "Ready for UAT": "In Progress",
    "Deployed to UAT": "Done", Closed: "Done", Archived: "Done",
  },
};

// AC #1 — registering the provider is what activates 052 R5 / 053 R3+R4 for a Jira host.
test("providers.jira is registered as requiresSync:true with a null projector", () => {
  assert.equal(providers.jira.requiresSync, true);
  assert.equal(providers.jira.project, null, "project must be null: no node-only recompute exists");
});

// AC #5 — the write direction.
test("toSiteStatus maps the bridge vocabulary to the site's canonical write targets", () => {
  assert.equal(toSiteStatus("To Do", RATIFIED), "Open");
  assert.equal(toSiteStatus("In Progress", RATIFIED), "In Dev");
  assert.equal(toSiteStatus("Done", RATIFIED), "Closed");
});

// AC #5 — the read direction, many-to-one. `In Dev` is the case the handoff's previewed
// candidate map did not contain; 7 live issues sat in it.
test("toBridgeStatus collapses all fifteen live site statuses onto the bridge's three", () => {
  for (const [site, bridge] of Object.entries(RATIFIED.statusReadMap))
    assert.equal(toBridgeStatus(site, RATIFIED), bridge, `${site} should read back as ${bridge}`);
  assert.equal(toBridgeStatus("In Dev", RATIFIED), "In Progress");
});

// AC #5 — unmapped falls through UNCHANGED in both directions (spec 054 R1's stated rule).
test("both directions fall through unchanged on an unmapped status", () => {
  assert.equal(toSiteStatus("Blocked", RATIFIED), "Blocked");
  assert.equal(toBridgeStatus("Some Custom Status", RATIFIED), "Some Custom Status");
  assert.equal(toSiteStatus("To Do", {}), "To Do", "no config at all is a total fall-through");
  assert.equal(toBridgeStatus("Open", {}), "Open");
});

// With no statusReadMap, the read direction inverts statusMap — a host predating the new
// field keeps its exact prior behavior.
test("toBridgeStatus inverts statusMap when no statusReadMap is present", () => {
  const legacy = { statusMap: { "In Progress": "In Dev" } };
  assert.equal(toBridgeStatus("In Dev", legacy), "In Progress");
  assert.equal(toBridgeStatus("Code Review", legacy), "Code Review", "unmapped still falls through");
});

// AC #5 — a non-injective statusMap is an ERROR naming the colliding pair, never a silent
// first-wins (which would make verdicts depend on key order).
test("validateBoardConfig: a non-injective statusMap is an error naming the colliding pair", () => {
  const problems = validateBoardConfig({
    provider: "jira",
    jira: {
      cloudId: "x", projectKey: "PROJ", issueTypeName: "Task",
      statusMap: { "To Do": "Open", "In Progress": "Open" },
    },
  });
  const hit = problems.find((m) => m.includes("non-injective"));
  assert.ok(hit, `expected a non-injective problem, got ${JSON.stringify(problems)}`);
  assert.ok(hit.includes("To Do") && hit.includes("In Progress") && hit.includes("Open"));
});

// The asymmetry is the point: the same many-to-one shape is LEGAL in statusReadMap.
test("validateBoardConfig: a many-to-one statusReadMap is valid — the exemption is deliberate", () => {
  const problems = validateBoardConfig({
    provider: "jira",
    jira: { cloudId: "x", projectKey: "PROJ", issueTypeName: "Task", ...RATIFIED },
  });
  assert.deepEqual(problems, [], "the ratified live mapping must validate clean");
});

test("validateBoardConfig: catches a non-object statusReadMap", () => {
  const problems = validateBoardConfig({
    provider: "jira",
    jira: { cloudId: "x", projectKey: "PROJ", issueTypeName: "Task", statusReadMap: ["nope"] },
  });
  assert.ok(problems.some((m) => m.includes("statusReadMap")));
});

// AC #1 — lib/ stays MCP-free and network-free (design invariant 4): the whole point of
// `project: null` is that the MCP half lives in a SKILL, never here. Two standing exceptions,
// both verified non-calls: lib/selfcontained.mjs holds a DETECTOR regex containing the literal
// `fetch(`, and lib/toolkit/code-translation.md is a teaching document. Asserting against the
// real file list (not a bare grep) is what keeps this honest as lib/ grows — a new real call
// site fails here loudly.
test("lib/ contains no MCP or network calls (spec 056 AC #1)", () => {
  const libDir = new URL("../lib/", import.meta.url).pathname;
  const out = execFileSync("grep", ["-rl", "mcp__\\|fetch(", libDir], { encoding: "utf8" })
    .split("\n").filter(Boolean).map((f) => f.replace(libDir, "")).sort();
  assert.deepEqual(out, ["selfcontained.mjs", "toolkit/code-translation.md"],
    `unexpected MCP/network reference in lib/: ${JSON.stringify(out)}`);
});

/* ── spec 056 Phase 2 — the LIVE read path, against verbatim bytes returned by a real Jira
 * JQL read on 2026-09-10 (not hand-written fixtures). Fixtures are what finding F1 warned
 * about: they produce none of Jira's silent normalizations. These strings are copied exactly
 * from the wire. ── */

// Verbatim from the live response. Note THREE normalizations, not the two Phase 1 recorded:
//   1. a blank line inserted after BEGIN,
//   2. two trailing spaces on the last checkbox line,
//   3. NEW — two trailing spaces on the END MARKER LINE itself.
const LIVE_LINKED = "Scratch issue for praxisflux spec 056 Phase 2/3 verification. Safe to close or delete.\n\nThis line is human-authored text that the bridge must never modify.\n\n<!-- spec-phases BEGIN -->\n\n- [x] Phase 1 — Verify the MCP surface\n- [ ] Phase 2 — Read path\n- [ ] Phase 3 — Write path  \n<!-- spec-phases END -->  \nSpec: specs/056-jira-provider\n\n";
const LIVE_UNLINKED = "Scratch issue for praxisflux spec 056. Safe to close or delete.\n\nThis issue deliberately has NO Spec: marker. It must be EXCLUDED from the mirror and counted as unlinked.";

test("parseSpecPhasesBlock: live Jira bytes parse to the mirror's acs shape (3 normalizations)", () => {
  assert.deepEqual(parseSpecPhasesBlock(LIVE_LINKED), [
    { index: 1, checked: true, text: "Phase 1 — Verify the MCP surface" },
    { index: 2, checked: false, text: "Phase 2 — Read path" },
    { index: 3, checked: false, text: "Phase 3 — Write path" },
  ]);
});

// Normalization 3, isolated: Jira appends trailing whitespace to the END MARKER LINE. The
// parser slices on indexOf(END) so the trailing spaces land AFTER the slice and never reach
// an item — but the marker line is no longer byte-equal to what we wrote, so any future
// exact-line comparison against SPEC_PHASES_END would silently stop matching. Pinned here so
// that change fails loudly rather than emptying every block.
test("parseSpecPhasesBlock: trailing whitespace on the END marker line is tolerated", () => {
  const items = parseSpecPhasesBlock("<!-- spec-phases BEGIN -->\n- [x] A\n<!-- spec-phases END -->  \nSpec: specs/001-x");
  assert.deepEqual(items, [{ index: 1, checked: true, text: "A" }]);
});

// AC #4 — an issue with no Spec: marker is not bridged work and must be excluded. Same
// MARKER regex bridge.mjs uses, asserted against live bytes.
test("the Spec: marker survives live normalization, and an unlinked issue yields none", () => {
  const MARKER = /^Spec:\s*(\S+?)\/?\s*$/m;
  assert.equal(LIVE_LINKED.match(MARKER)?.[1], "specs/056-jira-provider",
    "the marker must still match with trailing whitespace on the preceding END line");
  assert.equal(LIVE_UNLINKED.match(MARKER), null, "an unlinked issue must produce no specDir");
});

/* ── spec 055 Phase 3 (R2/AC #5) — the marked spec-phases description block ── */

// AC #5 — render -> parse round-trips to the mirror's own acs shape, 1-based positional.
test("renderSpecPhasesBlock/parseSpecPhasesBlock: clean round-trip yields [{ index, checked, text }]", () => {
  const items = [
    { checked: true, text: "Spec phase: Seam" },
    { checked: false, text: "Spec phase: Provider" },
  ];
  const block = renderSpecPhasesBlock(items);
  assert.equal(
    block,
    "<!-- spec-phases BEGIN -->\n- [x] Spec phase: Seam\n- [ ] Spec phase: Provider\n<!-- spec-phases END -->",
  );
  assert.deepEqual(parseSpecPhasesBlock(block), [
    { index: 1, checked: true, text: "Spec phase: Seam" },
    { index: 2, checked: false, text: "Spec phase: Provider" },
  ]);
});

// The two live-observed Jira normalizations (spec 056 phase 1 findings, every read) — a parser
// that assumes clean fixtures misses exactly this. Fixture below reproduces both in one string:
// a blank line right after BEGIN, and two trailing spaces on the LAST checkbox line.
test("parseSpecPhasesBlock: tolerates a blank line after BEGIN and trailing whitespace on the last checkbox line (live Jira normalizations)", () => {
  const observed =
    "<!-- spec-phases BEGIN -->\n" +
    "\n" + // Jira inserts this blank line on every read
    "- [x] Spec phase: Seam\n" +
    "- [ ] Spec phase: Provider  \n" + // two trailing spaces, only on the last line
    "<!-- spec-phases END -->";
  assert.deepEqual(parseSpecPhasesBlock(observed), [
    { index: 1, checked: true, text: "Spec phase: Seam" },
    { index: 2, checked: false, text: "Spec phase: Provider" },
  ]);
});

// Idempotence: parsing this repo's own render output, then re-rendering the parsed shape, must
// reproduce byte-identical text — the write→read→write cycle spec 056 phase 1 observed converges
// rather than rotting.
test("renderSpecPhasesBlock(parseSpecPhasesBlock(x)) is idempotent once normalized", () => {
  const items = [{ checked: true, text: "Spec phase: Setup" }, { checked: false, text: "Spec phase: Core" }];
  const first = renderSpecPhasesBlock(items);
  const reparsed = parseSpecPhasesBlock(first).map(({ checked, text }) => ({ checked, text }));
  assert.equal(renderSpecPhasesBlock(reparsed), first);
});

test("parseSpecPhasesBlock: no block present returns [] (absent is not an error)", () => {
  assert.deepEqual(parseSpecPhasesBlock("just some human prose\nSpec: specs/001-a\n"), []);
});

// AC #4 — two blocks in one description is a validation error, not a merge.
test("parseSpecPhasesBlock: a second BEGIN or END marker throws, naming the counts", () => {
  const doubled = renderSpecPhasesBlock([{ checked: true, text: "a" }]) + "\n" +
    renderSpecPhasesBlock([{ checked: false, text: "b" }]);
  assert.throws(() => parseSpecPhasesBlock(doubled), /2 BEGIN marker\(s\) and 2 END marker\(s\)/);
});

// R2: the `Spec: <dir>` marker line stays OUTSIDE the block and after it — confirm bridge.mjs's
// MARKER regex (replicated here verbatim; it is a private const in spec-bridge/gates/bridge.mjs)
// still matches when a spec-phases block sits between the human prose and the marker line. Do
// not assume — that regex arms the whole bridge gate.
test("R2 fixture: the Spec: marker still matches bridge.mjs's MARKER when it follows a spec-phases block", () => {
  const MARKER = /^Spec:\s*(\S+?)\/?\s*$/m; // bridge.mjs:253, replicated for verification only
  const block = renderSpecPhasesBlock([
    { checked: true, text: "Spec phase: Seam" },
    { checked: false, text: "Spec phase: Provider" },
  ]);
  const description = `Human-authored prose, never touched.\n\n${block}\nSpec: specs/052-board-adapter-seam\n`;
  const match = description.match(MARKER);
  assert.ok(match, "MARKER must still match with a spec-phases block preceding it");
  assert.equal(match[1], "specs/052-board-adapter-seam");
});
