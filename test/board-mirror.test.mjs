import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { execFileSync } from "node:child_process";
import {
  readMirror, writeMirror, validateMirror, compareIds, mirrorPath,
  mirrorStaleness, providers, projectBacklog, findLinkedTasks,
  loadBoardConfig, validateBoardConfig,
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
