// reorient: the artifact-presence output gate (checkReorient), corpus classification +
// grounding detection, the run lifecycle CLI (the only writer), and the Stop-hook paths
// through the shared gate-runner. Run records are pointed at a scratch dir via
// $REORIENT_HOME so no test touches a real .handoff/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, realpathSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkReorient, hasAnalysisNote, runsDirFor, reorientGate } from "../reorient/gates/reorient.mjs";
import { classifyCorpus, detectGrounding } from "../reorient/scripts/run.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const runMjs = join(repo, "reorient", "scripts", "run.mjs");

/** A sample host project: a research vault with two branches, a wiki, and a board. */
function makeProject({ vault = true, wiki = true, board = true } = {}) {
  // realpath: macOS tmpdir is a /var -> /private/var symlink; the run CLI records resolved
  // paths, so comparisons need both sides physical.
  const root = realpathSync(mkdtempSync(join(tmpdir(), "reorient-proj-")));
  if (vault) {
    mkdirSync(join(root, "research", "Topic-A"), { recursive: true });
    mkdirSync(join(root, "research", "Topic-B"), { recursive: true });
    writeFileSync(join(root, "research", ".research-vault"), "");
    writeFileSync(join(root, "research", "Topic-A", "_grounding.md"), "# g\n");
    writeFileSync(join(root, "research", "Topic-B", "_grounding.md"), "# g\n");
  }
  mkdirSync(join(root, "corpus", "adhoc-notes"), { recursive: true });
  writeFileSync(join(root, "corpus", "adhoc-notes", "notes.md"), "# notes\n");
  if (wiki) mkdirSync(join(root, "docs", "wiki"), { recursive: true });
  if (board) mkdirSync(join(root, "backlog"), { recursive: true });
  return root;
}

const ANALYSIS = `---
title: Analysis — fit
type: analysis
---
# Analysis
Opinion.
`;

const goodSynthesis = (names) => `# proj — reorientation synthesis

**TL;DR:** reorient toward the lens.

## Decisions
1. Decided X.

## Merged positions
${names.map((n) => `- ${n}: contributes Y.`).join("\n")}

## Course of action
- Wave 1: build Z. Refactor assessment: not necessary.

## Board moves
| Move | What |
|---|---|
| TASK-1 | rescope |

## Open questions
- None.
`;

/** An in-memory run record over a makeProject() root. */
function makeRun(root, { corpus, synthesis, board = true, lens = "the lens" } = {}) {
  const entries = corpus ?? [
    { path: "research/Topic-A", name: "Topic-A", kind: "vault-branch" },
    { path: "research/Topic-B", name: "Topic-B", kind: "vault-branch" },
  ];
  return {
    id: "r1",
    state: "in-flight",
    root,
    lens,
    corpus: entries,
    grounding: { vault: entries.some((c) => c.kind === "vault-branch"), wiki: "docs/wiki", board },
    synthesis: synthesis ?? join(root, "docs", "design", "reorient-x.md"),
    cwd: root,
  };
}

/** Land the artifacts that make `run` pass its gate. */
function landArtifacts(root, run) {
  for (const c of run.corpus)
    if (c.kind === "vault-branch") writeFileSync(join(root, c.path, "Analysis-Fit.md"), ANALYSIS);
  mkdirSync(dirname(run.synthesis), { recursive: true });
  writeFileSync(run.synthesis, goodSynthesis(run.corpus.map((c) => c.name)));
}

test("checkReorient: blocks until analyses + synthesis exist, then passes", () => {
  const root = makeProject();
  const run = makeRun(root);
  let problems = checkReorient(run);
  assert.ok(problems.some((p) => p.includes("no Analysis-*.md")), `wants analyses: ${problems}`);
  assert.ok(problems.some((p) => p.includes("synthesis not written")), `wants synthesis: ${problems}`);

  landArtifacts(root, run);
  assert.deepEqual(checkReorient(run), []);
  rmSync(root, { recursive: true, force: true });
});

test("checkReorient: synthesis must name every corpus branch and carry sections", () => {
  const root = makeProject();
  const run = makeRun(root);
  landArtifacts(root, run);
  writeFileSync(run.synthesis, goodSynthesis(["Topic-A"])); // Topic-B never mentioned
  let problems = checkReorient(run);
  assert.ok(problems.some((p) => p.includes('"Topic-B"')), `wants merge proof: ${problems}`);

  writeFileSync(run.synthesis, "# thin\n\n**TL;DR:** fine. Topic-A Topic-B\n");
  problems = checkReorient(run);
  for (const missing of ["Decisions", "Course of action", "Open questions", "Board moves"])
    assert.ok(problems.some((p) => p.includes(missing)), `wants ${missing}: ${problems}`);
  rmSync(root, { recursive: true, force: true });
});

test("checkReorient: board section only demanded when a board was detected; adhoc corpus needs no analysis note", () => {
  const root = makeProject({ board: false });
  const run = makeRun(root, {
    corpus: [{ path: "corpus/adhoc-notes", name: "adhoc-notes", kind: "adhoc" }],
    board: false,
  });
  mkdirSync(dirname(run.synthesis), { recursive: true });
  const noBoard = goodSynthesis(["adhoc-notes"]).replace(/## Board moves[\s\S]*?(?=## Open questions)/, "");
  writeFileSync(run.synthesis, noBoard);
  assert.deepEqual(checkReorient(run), []);
  rmSync(root, { recursive: true, force: true });
});

test("checkReorient: refuses a synthesis inside a corpus branch, and an empty lens", () => {
  const root = makeProject();
  const run = makeRun(root, { synthesis: join(root, "research", "Topic-A", "synth.md"), lens: " " });
  landArtifacts(root, run);
  const problems = checkReorient(run);
  assert.ok(problems.some((p) => p.includes("INSIDE corpus entry")), `wants isolation: ${problems}`);
  assert.ok(problems.some((p) => p.includes("no lens")), `wants lens: ${problems}`);
  rmSync(root, { recursive: true, force: true });
});

test("hasAnalysisNote: requires the Analysis- prefix AND type: analysis frontmatter", () => {
  const dir = mkdtempSync(join(tmpdir(), "reorient-notes-"));
  assert.equal(hasAnalysisNote(dir), false);
  writeFileSync(join(dir, "Analysis-Wrong.md"), "---\ntype: note\n---\n");
  assert.equal(hasAnalysisNote(dir), false);
  writeFileSync(join(dir, "Analysis-Right.md"), ANALYSIS);
  assert.equal(hasAnalysisNote(dir), true);
  rmSync(dir, { recursive: true, force: true });
});

test("classifyCorpus + detectGrounding: vault sentinel and optional surfaces", () => {
  const root = makeProject();
  assert.equal(classifyCorpus(root, join(root, "research", "Topic-A")), "vault-branch");
  assert.equal(classifyCorpus(root, join(root, "corpus", "adhoc-notes")), "adhoc");
  const corpus = [{ kind: "vault-branch" }];
  assert.deepEqual(detectGrounding(root, corpus), { vault: true, wiki: "docs/wiki", board: true });
  const bare = makeProject({ vault: false, wiki: false, board: false });
  assert.deepEqual(detectGrounding(bare, [{ kind: "adhoc" }]), { vault: false, wiki: null, board: false });
  rmSync(root, { recursive: true, force: true });
  rmSync(bare, { recursive: true, force: true });
});

function scratchHome() {
  const home = realpathSync(mkdtempSync(join(tmpdir(), "reorient-home-")));
  return { home, env: { ...process.env, REORIENT_HOME: home } };
}

test("run CLI: begin records manifest, finish blocks then passes; gate-runner integration", () => {
  const root = makeProject();
  const { home, env } = scratchHome();
  const begin = spawnSync(
    "node",
    [runMjs, "begin", root, "--lens", "the lens", "--corpus", join(root, "research", "Topic-A"), "--corpus", join(root, "corpus", "adhoc-notes")],
    { encoding: "utf8", env, cwd: root },
  );
  assert.equal(begin.status, 0, begin.stderr);
  const id = begin.stdout.match(/run (\S+) in flight/)[1];
  const run = JSON.parse(readFileSync(join(home, `${id}.json`), "utf8"));
  assert.equal(run.state, "in-flight");
  assert.equal(run.lens, "the lens");
  assert.deepEqual(run.corpus.map((c) => c.kind), ["vault-branch", "adhoc"]);
  assert.equal(run.grounding.board, true);

  // Stop-hook path: an in-flight run under this cwd blocks with actionable problems.
  // The gate resolves the runs dir in-process, so it needs the same $REORIENT_HOME.
  const prevHome = process.env.REORIENT_HOME;
  const prevProj = process.env.CLAUDE_PROJECT_DIR; // evaluate() prefers it over the passed cwd
  process.env.REORIENT_HOME = home;
  delete process.env.CLAUDE_PROJECT_DIR;
  try {
    assert.equal(reorientGate.resolveRoots(root).length, 1, "in-flight run must resolve as a root");
    const verdict = evaluate({}, [reorientGate], { cwd: root });
    assert.equal(verdict.block, true, "in-flight run must block the Stop hook");

    const blocked = spawnSync("node", [runMjs, "finish", id], { encoding: "utf8", env });
    assert.equal(blocked.status, 2, "finish must block before artifacts exist");

    landArtifacts(root, run);
    const finished = spawnSync("node", [runMjs, "finish", id], { encoding: "utf8", env });
    assert.equal(finished.status, 0, finished.stderr);
    assert.equal(JSON.parse(readFileSync(join(home, `${id}.json`), "utf8")).state, "done");
    assert.equal(reorientGate.resolveRoots(root).length, 0, "done runs never block");
  } finally {
    if (prevHome === undefined) delete process.env.REORIENT_HOME; else process.env.REORIENT_HOME = prevHome;
    if (prevProj !== undefined) process.env.CLAUDE_PROJECT_DIR = prevProj;
  }

  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

test("run CLI: begin refuses a missing lens or empty corpus; abandon keeps residue", () => {
  const root = makeProject();
  const { home, env } = scratchHome();
  assert.notEqual(spawnSync("node", [runMjs, "begin", root, "--corpus", join(root, "research", "Topic-A")], { encoding: "utf8", env }).status, 0);
  assert.notEqual(spawnSync("node", [runMjs, "begin", root, "--lens", "x"], { encoding: "utf8", env }).status, 0);

  const begin = spawnSync("node", [runMjs, "begin", root, "--lens", "x", "--corpus", join(root, "research", "Topic-A")], { encoding: "utf8", env });
  const id = begin.stdout.match(/run (\S+) in flight/)[1];
  const abandon = spawnSync("node", [runMjs, "abandon", id, "user", "cancelled"], { encoding: "utf8", env });
  assert.equal(abandon.status, 0, abandon.stderr);
  const run = JSON.parse(readFileSync(join(home, `${id}.json`), "utf8"));
  assert.equal(run.state, "abandoned");
  assert.equal(run.reason, "user cancelled");
  assert.equal(readdirSync(home).length, 1, "residue kept");
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

test("runsDirFor: honors $REORIENT_HOME and roots at .git/.handoff ancestors", () => {
  const { home, env } = scratchHome();
  const prev = process.env.REORIENT_HOME;
  process.env.REORIENT_HOME = home;
  try {
    assert.equal(runsDirFor("/anywhere"), home);
  } finally {
    if (prev === undefined) delete process.env.REORIENT_HOME; else process.env.REORIENT_HOME = prev;
  }
  const root = realpathSync(mkdtempSync(join(tmpdir(), "reorient-root-")));
  mkdirSync(join(root, ".git"));
  mkdirSync(join(root, "deep", "nested"), { recursive: true });
  assert.equal(runsDirFor(join(root, "deep", "nested")), join(root, ".handoff", "reorient", "runs"));
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
  void env;
});
