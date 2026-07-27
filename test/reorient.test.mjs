// reorient: the artifact-presence output gate (checkReorient), corpus classification +
// grounding detection, the run lifecycle CLI (the only writer), and the Stop-hook paths
// through the shared gate-runner. Run records are pointed at a scratch dir via
// $REORIENT_HOME so no test touches a real .handoff/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, realpathSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkReorient, hasAnalysisNote, runsDirFor, reorientGate, ownsRun, describeOwner } from "../reorient/gates/reorient.mjs";
import { classifyCorpus, detectGrounding, heartbeatOwnedRuns } from "../reorient/scripts/run.mjs";
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

/** A controlled registry root: $REORIENT_HOME points inside it, so run.mjs resolves it as
 *  the registry root whose `.git` shape the worktree-first check inspects. */
function scratchRegistry() {
  const reg = realpathSync(mkdtempSync(join(tmpdir(), "reorient-reg-")));
  const home = join(reg, ".handoff", "reorient", "runs");
  return { reg, home, env: { ...process.env, REORIENT_HOME: home } };
}

test("run CLI: worktree-first — begin refuses a shared primary checkout (.git dir), accepts worktrees (.git file), non-git roots, and the override", () => {
  const root = makeProject();
  const { reg, home, env } = scratchRegistry();
  const beginArgs = [runMjs, "begin", root, "--lens", "x", "--corpus", join(root, "research", "Topic-A")];

  // Shared primary checkout: .git is a DIRECTORY → refused, actionable, nothing written.
  mkdirSync(join(reg, ".git"));
  const refused = spawnSync("node", beginArgs, { encoding: "utf8", env, cwd: root });
  assert.notEqual(refused.status, 0, "a shared primary checkout must be refused");
  assert.ok(refused.stderr.includes("shared primary checkout"), refused.stderr);
  assert.ok(refused.stderr.includes("git worktree add .worktrees/<name> -b <branch>"), "refusal names the worktree recipe: " + refused.stderr);
  assert.ok(refused.stderr.includes("--shared-checkout"), "refusal names the override: " + refused.stderr);
  assert.equal(existsSync(home), false, "refusal must not create a run record");

  // Worktree: .git is a `gitdir:` FILE → accepted with no override, nothing extra recorded.
  rmSync(join(reg, ".git"), { recursive: true, force: true });
  writeFileSync(join(reg, ".git"), "gitdir: /elsewhere/.git/worktrees/lane\n");
  const wt = spawnSync("node", beginArgs, { encoding: "utf8", env, cwd: root });
  assert.equal(wt.status, 0, wt.stderr);
  const wtRun = JSON.parse(readFileSync(join(home, `${wt.stdout.match(/run (\S+) in flight/)[1]}.json`), "utf8"));
  assert.equal(wtRun.sharedCheckout, undefined, "a worktree begin records no override");

  // A no-op --shared-checkout in a worktree leaves no false audit claim behind.
  const wtFlag = spawnSync("node", [...beginArgs, "--shared-checkout"], { encoding: "utf8", env, cwd: root });
  assert.equal(wtFlag.status, 0, wtFlag.stderr);
  const wtFlagRun = JSON.parse(readFileSync(join(home, `${wtFlag.stdout.match(/run (\S+) in flight/)[1]}.json`), "utf8"));
  assert.equal(wtFlagRun.sharedCheckout, undefined, "the flag records nothing when it overrode nothing");

  // Non-git registry root: today's behavior unchanged — begin passes.
  rmSync(join(reg, ".git"), { force: true });
  const nogit = spawnSync("node", beginArgs, { encoding: "utf8", env, cwd: root });
  assert.equal(nogit.status, 0, nogit.stderr);

  // The explicit override on a primary checkout: accepted and recorded (R2's audit trail).
  mkdirSync(join(reg, ".git"));
  const over = spawnSync("node", [...beginArgs, "--shared-checkout"], { encoding: "utf8", env, cwd: root });
  assert.equal(over.status, 0, over.stderr);
  assert.ok(over.stdout.includes("--shared-checkout override recorded"), over.stdout);
  const overRun = JSON.parse(readFileSync(join(home, `${over.stdout.match(/run (\S+) in flight/)[1]}.json`), "utf8"));
  assert.equal(overRun.sharedCheckout, true, "the override that permitted the run is on the manifest");
  rmSync(root, { recursive: true, force: true });
  rmSync(reg, { recursive: true, force: true });
});

test("run CLI: the recorded --shared-checkout override is surfaced by list and owner provenance", () => {
  const root = makeProject();
  const { reg, home, env } = scratchRegistry();
  mkdirSync(join(reg, ".git")); // shared primary checkout
  const begin = spawnSync(
    "node",
    [runMjs, "begin", root, "--lens", "x", "--corpus", join(root, "research", "Topic-A"), "--shared-checkout"],
    { encoding: "utf8", env: { ...env, CLAUDE_CODE_SESSION_ID: "sess-A" }, cwd: root },
  );
  assert.equal(begin.status, 0, begin.stderr);
  const id = begin.stdout.match(/run (\S+) in flight/)[1];
  const run = JSON.parse(readFileSync(join(home, `${id}.json`), "utf8"));

  const list = spawnSync("node", [runMjs, "list"], { encoding: "utf8", env });
  assert.ok(list.stdout.includes("--shared-checkout"), `list surfaces the override: ${list.stdout}`);
  assert.ok(describeOwner(run).includes("--shared-checkout"), `provenance surfaces the override: ${describeOwner(run)}`);
  assert.ok(describeOwner(run).includes("shared primary checkout"), describeOwner(run));

  // A run without the override keeps both surfaces clean.
  rmSync(join(reg, ".git"), { recursive: true, force: true });
  writeFileSync(join(reg, ".git"), "gitdir: /elsewhere/.git/worktrees/lane\n");
  const wt = spawnSync("node", [runMjs, "begin", root, "--lens", "x", "--corpus", join(root, "research", "Topic-A")], { encoding: "utf8", env, cwd: root });
  const wtRun = JSON.parse(readFileSync(join(home, `${wt.stdout.match(/run (\S+) in flight/)[1]}.json`), "utf8"));
  assert.ok(!describeOwner(wtRun).includes("--shared-checkout"), describeOwner(wtRun));
  rmSync(root, { recursive: true, force: true });
  rmSync(reg, { recursive: true, force: true });
});

test("run CLI: begin stamps owner + heartbeat; synthesis is run-id-keyed so same-day runs never collide", () => {
  const root = makeProject();
  const { home, env } = scratchHome();
  const envA = { ...env, CLAUDE_CODE_SESSION_ID: "sess-A" };
  const beginArgs = [runMjs, "begin", root, "--lens", "x", "--corpus", join(root, "research", "Topic-A")];
  const b1 = spawnSync("node", beginArgs, { encoding: "utf8", env: envA, cwd: root });
  assert.equal(b1.status, 0, b1.stderr);
  const id1 = b1.stdout.match(/run (\S+) in flight/)[1];
  const r1 = JSON.parse(readFileSync(join(home, `${id1}.json`), "utf8"));
  assert.equal(r1.owner.sessionId, "sess-A");
  assert.ok(r1.owner.host, "owner records host provenance");
  assert.ok(r1.heartbeatAt, "begin sets the first heartbeat");
  assert.ok(r1.synthesis.endsWith(`reorient-${id1}.md`), `run-id-keyed synthesis: ${r1.synthesis}`);
  assert.ok(b1.stdout.includes("sess-A"), "begin prints the owner");

  // A second same-day run: distinct id, distinct synthesis target, and the collision is
  // surfaced with the first run's owner + provenance.
  const b2 = spawnSync("node", beginArgs, { encoding: "utf8", env: { ...env, CLAUDE_CODE_SESSION_ID: "sess-B" }, cwd: root });
  assert.equal(b2.status, 0, b2.stderr);
  const id2 = b2.stdout.match(/run (\S+) in flight/)[1];
  assert.notEqual(id2, id1);
  const r2 = JSON.parse(readFileSync(join(home, `${id2}.json`), "utf8"));
  assert.notEqual(r2.synthesis, r1.synthesis, "same-day runs must not collide on one output path");
  assert.ok(b2.stderr.includes("another run is already in flight") && b2.stderr.includes("sess-A"), b2.stderr);
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

test("reorientGate: blocks only the owning session; foreign runs warn only once the heartbeat is stale", () => {
  const root = makeProject();
  const { home } = scratchHome();
  const prevHome = process.env.REORIENT_HOME;
  const prevProj = process.env.CLAUDE_PROJECT_DIR;
  process.env.REORIENT_HOME = home;
  delete process.env.CLAUDE_PROJECT_DIR;
  try {
    const now = new Date().toISOString();
    const run = { ...makeRun(root), id: "owned-1", owner: { sessionId: "sess-A", user: "ua", host: "ha" }, startedAt: now, heartbeatAt: now };
    writeFileSync(join(home, "owned-1.json"), JSON.stringify(run));

    assert.equal(ownsRun(run, "sess-A"), true);
    assert.equal(ownsRun(run, "sess-B"), false);
    assert.equal(ownsRun({ ...run, owner: {} }, "sess-A"), null, "legacy records are undecidable");
    assert.ok(describeOwner(run).includes("sess-A") && describeOwner(run).includes("ua@ha"));

    const asOwner = evaluate({ session_id: "sess-A" }, [reorientGate], { cwd: root });
    assert.equal(asOwner.block, true, "the owner is nagged");

    const asOther = evaluate({ session_id: "sess-B" }, [reorientGate], { cwd: root });
    assert.equal(asOther.block, false, "someone else's run never blocks");
    assert.equal(asOther.warnings, "", "fresh heartbeat → live elsewhere → silence");

    run.heartbeatAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    writeFileSync(join(home, "owned-1.json"), JSON.stringify(run));
    const asOtherStale = evaluate({ session_id: "sess-B" }, [reorientGate], { cwd: root });
    assert.equal(asOtherStale.block, false, "even an orphan-looking run never blocks a non-owner");
    assert.ok(asOtherStale.warnings.includes("orphaned") && asOtherStale.warnings.includes("sess-A"), asOtherStale.warnings);
    assert.ok(asOtherStale.warnings.includes("takeover"), asOtherStale.warnings);

    // A legacy record (no owner) keeps the old checkout-scoped blocking for every session.
    writeFileSync(join(home, "owned-1.json"), JSON.stringify(makeRun(root)));
    assert.equal(evaluate({ session_id: "sess-B" }, [reorientGate], { cwd: root }).block, true);
  } finally {
    if (prevHome === undefined) delete process.env.REORIENT_HOME; else process.env.REORIENT_HOME = prevHome;
    if (prevProj !== undefined) process.env.CLAUDE_PROJECT_DIR = prevProj;
  }
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

test("run CLI: abandon is owner-only; takeover is explicit, prints provenance, and transfers ownership", () => {
  const root = makeProject();
  const { home, env } = scratchHome();
  const envA = { ...env, CLAUDE_CODE_SESSION_ID: "sess-A" };
  const envB = { ...env, CLAUDE_CODE_SESSION_ID: "sess-B" };
  const begin = spawnSync("node", [runMjs, "begin", root, "--lens", "x", "--corpus", join(root, "research", "Topic-A")], { encoding: "utf8", env: envA, cwd: root });
  const id = begin.stdout.match(/run (\S+) in flight/)[1];

  const refused = spawnSync("node", [runMjs, "abandon", id, "looked", "orphaned"], { encoding: "utf8", env: envB });
  assert.notEqual(refused.status, 0, "non-owner abandon must be refused");
  assert.ok(refused.stderr.includes("owned by another session") && refused.stderr.includes("sess-A"), refused.stderr);
  assert.ok(refused.stderr.includes("takeover"), refused.stderr);
  assert.equal(JSON.parse(readFileSync(join(home, `${id}.json`), "utf8")).state, "in-flight", "refusal must not mutate the run");

  const takeover = spawnSync("node", [runMjs, "takeover", id], { encoding: "utf8", env: envB });
  assert.equal(takeover.status, 0, takeover.stderr);
  assert.ok(takeover.stdout.includes("previously") && takeover.stdout.includes("sess-A"), takeover.stdout);
  assert.equal(JSON.parse(readFileSync(join(home, `${id}.json`), "utf8")).owner.sessionId, "sess-B");

  const abandon = spawnSync("node", [runMjs, "abandon", id, "adopted and closed"], { encoding: "utf8", env: envB });
  assert.equal(abandon.status, 0, abandon.stderr);
  assert.equal(JSON.parse(readFileSync(join(home, `${id}.json`), "utf8")).state, "abandoned");

  const done = spawnSync("node", [runMjs, "takeover", id], { encoding: "utf8", env: envA });
  assert.notEqual(done.status, 0, "only in-flight runs can be taken over");

  const list = spawnSync("node", [runMjs, "list"], { encoding: "utf8", env: envA });
  assert.ok(list.stdout.includes("sess-B") && list.stdout.includes("begun"), `list surfaces owner + provenance: ${list.stdout}`);
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

test("heartbeatOwnedRuns: refreshes only in-flight runs owned by the session", () => {
  const { home } = scratchHome();
  const prev = process.env.REORIENT_HOME;
  process.env.REORIENT_HOME = home;
  try {
    const old = "2020-01-01T00:00:00.000Z";
    const mk = (id, sessionId, state = "in-flight") =>
      writeFileSync(join(home, `${id}.json`), JSON.stringify({ id, state, owner: { sessionId }, startedAt: old, heartbeatAt: old }));
    mk("mine", "sess-A");
    mk("theirs", "sess-B");
    mk("mine-done", "sess-A", "done");
    assert.equal(heartbeatOwnedRuns("/anywhere", "sess-A"), 1);
    assert.notEqual(JSON.parse(readFileSync(join(home, "mine.json"), "utf8")).heartbeatAt, old, "owned in-flight run is refreshed");
    assert.equal(JSON.parse(readFileSync(join(home, "theirs.json"), "utf8")).heartbeatAt, old, "foreign run untouched");
    assert.equal(JSON.parse(readFileSync(join(home, "mine-done.json"), "utf8")).heartbeatAt, old, "closed run untouched");
    assert.equal(heartbeatOwnedRuns("/anywhere", null), 0, "no session identity → no writes");
  } finally {
    if (prev === undefined) delete process.env.REORIENT_HOME; else process.env.REORIENT_HOME = prev;
  }
  rmSync(home, { recursive: true, force: true });
});

/** Env for the cross-directory tests: $REORIENT_HOME must NOT leak in — these tests prove
 *  the real target-root resolution, not the override. */
function envWithoutHome(extra = {}) {
  const env = { ...process.env, ...extra };
  delete env.REORIENT_HOME;
  return env;
}

test("run CLI: registry lives at the TARGET root, not the invoking cwd — begin elsewhere, gate + finish in-target", () => {
  const dirA = realpathSync(mkdtempSync(join(tmpdir(), "reorient-elsewhere-"))); // invoking cwd
  const rootB = makeProject(); // the target
  // Worktree-shaped target (`gitdir:` FILE): begin is accepted and runsDirFor roots at B.
  writeFileSync(join(rootB, ".git"), "gitdir: /elsewhere/.git/worktrees/lane\n");
  const env = envWithoutHome({ CLAUDE_CODE_SESSION_ID: "sess-A" });

  const begin = spawnSync(
    "node",
    [runMjs, "begin", rootB, "--lens", "the lens", "--corpus", join(rootB, "research", "Topic-A")],
    { encoding: "utf8", env, cwd: dirA },
  );
  assert.equal(begin.status, 0, begin.stderr);
  const id = begin.stdout.match(/run (\S+) in flight/)[1];

  // R1: the manifest landed under the TARGET's registry; the invoking cwd got nothing.
  const targetRuns = join(rootB, ".handoff", "reorient", "runs");
  const run = JSON.parse(readFileSync(join(targetRuns, `${id}.json`), "utf8"));
  assert.equal(existsSync(join(dirA, ".handoff")), false, "invoking cwd must not grow a registry");
  assert.equal(run.root, rootB, "manifest records the resolved target root");
  assert.equal(run.cwd, dirA, "manifest keeps the invoking cwd as provenance");

  // R2: the Stop gate resolves the run for sessions working in the target...
  // (evaluate() falls back to $CLAUDE_CODE_SESSION_ID, so the harness's own id must not leak in)
  const prevHome = process.env.REORIENT_HOME;
  const prevProj = process.env.CLAUDE_PROJECT_DIR;
  const prevSess = process.env.CLAUDE_CODE_SESSION_ID;
  delete process.env.REORIENT_HOME;
  delete process.env.CLAUDE_PROJECT_DIR;
  delete process.env.CLAUDE_CODE_SESSION_ID;
  try {
    assert.equal(reorientGate.resolveRoots(rootB, {}).length, 1, "a session in the target sees the run");
    assert.equal(evaluate({}, [reorientGate], { cwd: rootB }).block, true, "undecidable ownership blocks in-target (legacy scoping)");
    assert.equal(evaluate({ session_id: "sess-A" }, [reorientGate], { cwd: rootB }).block, true, "the owner is nagged in the target");
    assert.equal(evaluate({ session_id: "sess-B" }, [reorientGate], { cwd: rootB }).block, false, "someone else's run never blocks");
    // ...and NOT at the invoking cwd — the registry (and the run) belong to the target.
    assert.equal(reorientGate.resolveRoots(dirA, { sessionId: "sess-B" }).length, 0, "the invoking dir's registry is empty");
  } finally {
    if (prevHome !== undefined) process.env.REORIENT_HOME = prevHome;
    if (prevProj !== undefined) process.env.CLAUDE_PROJECT_DIR = prevProj;
    if (prevSess !== undefined) process.env.CLAUDE_CODE_SESSION_ID = prevSess;
  }

  // R2/R4: finish run FROM the target resolves the run — by root key and by bare id.
  const blocked = spawnSync("node", [runMjs, "finish", rootB], { encoding: "utf8", env, cwd: rootB });
  assert.equal(blocked.status, 2, `finish must find the run and block on missing artifacts: ${blocked.stderr}`);
  landArtifacts(rootB, run);
  const finished = spawnSync("node", [runMjs, "finish", id], { encoding: "utf8", env, cwd: rootB });
  assert.equal(finished.status, 0, finished.stderr);
  assert.equal(JSON.parse(readFileSync(join(targetRuns, `${id}.json`), "utf8")).state, "done");

  // list from the target sees it too.
  const list = spawnSync("node", [runMjs, "list"], { encoding: "utf8", env, cwd: rootB });
  assert.ok(list.stdout.includes(id), `in-target list surfaces the run: ${list.stdout}`);
  rmSync(dirA, { recursive: true, force: true });
  rmSync(rootB, { recursive: true, force: true });
});

test("run CLI: worktree-first refusal is keyed to the TARGET checkout, not the invoking one", () => {
  const env = envWithoutHome();

  // Invoking from a worktree, targeting a shared PRIMARY checkout → refused (no override).
  const wtDir = realpathSync(mkdtempSync(join(tmpdir(), "reorient-wt-")));
  writeFileSync(join(wtDir, ".git"), "gitdir: /elsewhere/.git/worktrees/lane\n");
  const primRoot = makeProject();
  mkdirSync(join(primRoot, ".git"));
  const beginArgs = [runMjs, "begin", primRoot, "--lens", "x", "--corpus", join(primRoot, "research", "Topic-A")];
  const refused = spawnSync("node", beginArgs, { encoding: "utf8", env, cwd: wtDir });
  assert.notEqual(refused.status, 0, "targeting a shared primary checkout must be refused regardless of the invoking checkout");
  assert.ok(refused.stderr.includes("shared primary checkout"), refused.stderr);
  assert.ok(refused.stderr.includes(primRoot), `the refusal names the TARGET's registry root: ${refused.stderr}`);
  assert.equal(existsSync(join(primRoot, ".handoff")), false, "refusal must not create a run record");
  assert.equal(existsSync(join(wtDir, ".handoff")), false, "refusal must not touch the invoking dir either");

  // Same shape with the explicit override → accepted, recorded on the manifest under the target.
  const over = spawnSync("node", [...beginArgs, "--shared-checkout"], { encoding: "utf8", env, cwd: wtDir });
  assert.equal(over.status, 0, over.stderr);
  const overId = over.stdout.match(/run (\S+) in flight/)[1];
  const overRun = JSON.parse(readFileSync(join(primRoot, ".handoff", "reorient", "runs", `${overId}.json`), "utf8"));
  assert.equal(overRun.sharedCheckout, true, "the override that permitted the run is on the manifest");

  // Invoking from a shared PRIMARY checkout, targeting a worktree → accepted, no override needed.
  const primDir = realpathSync(mkdtempSync(join(tmpdir(), "reorient-prim-")));
  mkdirSync(join(primDir, ".git"));
  const wtRoot = makeProject();
  writeFileSync(join(wtRoot, ".git"), "gitdir: /elsewhere/.git/worktrees/lane\n");
  const wt = spawnSync(
    "node",
    [runMjs, "begin", wtRoot, "--lens", "x", "--corpus", join(wtRoot, "research", "Topic-A")],
    { encoding: "utf8", env, cwd: primDir },
  );
  assert.equal(wt.status, 0, `targeting a worktree is accepted from anywhere: ${wt.stderr}`);
  const wtId = wt.stdout.match(/run (\S+) in flight/)[1];
  const wtRun = JSON.parse(readFileSync(join(wtRoot, ".handoff", "reorient", "runs", `${wtId}.json`), "utf8"));
  assert.equal(wtRun.sharedCheckout, undefined, "a worktree target records no override");
  for (const d of [wtDir, primRoot, primDir, wtRoot]) rmSync(d, { recursive: true, force: true });
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
