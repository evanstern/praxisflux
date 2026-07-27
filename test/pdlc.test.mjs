import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, realpathSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { plant, renderGrounding, extractBlock, resolveProjectName, PEERS, SENTINEL } from "../pdlc/scripts/plant.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url));
const TEMPLATE = readFileSync(join(repo, "pdlc", "templates", "CLAUDE.md"), "utf8");
const opts = (extra = {}) => ({
  templatePath: join(repo, "pdlc", "templates", "CLAUDE.md"),
  version: "9.9.9",
  ...extra,
});

function proj() {
  const root = mkdtempSync(join(tmpdir(), "pdlc-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

// --- plugin registration (new-plugin checklist) ---

test("pdlc is a registered plugin with a resolving lib symlink", () => {
  const mp = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
  const entry = mp.plugins.find((p) => p.name === "pdlc");
  const pj = JSON.parse(readFileSync(join(repo, "pdlc", ".claude-plugin", "plugin.json"), "utf8"));
  assert.ok(entry, "pdlc missing from marketplace.json");
  assert.equal(entry.source, "./pdlc");
  assert.equal(entry.description, pj.description, "catalog description must follow plugin.json");
  assert.equal(realpathSync(join(repo, "pdlc", "lib")), realpathSync(join(repo, "lib")));
});

test("bootstrap SKILL.md has the frontmatter the bump gate keys on", () => {
  const skill = readFileSync(join(repo, "pdlc", "skills", "bootstrap", "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: bootstrap\nversion: \d+\.\d+\.\d+\n/);
});

// --- refactor-triage skill (spec 033) ---

test("refactor-triage SKILL.md has the frontmatter the bump gate keys on", () => {
  const skill = readFileSync(join(repo, "pdlc", "skills", "refactor-triage", "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: refactor-triage\nversion: \d+\.\d+\.\d+\n/);
  assert.match(skill, /^description: \S/m, "description (the trigger surface) must be present");
});

test("refactor-triage names all three entry modes and carries an output gate", () => {
  const skill = readFileSync(join(repo, "pdlc", "skills", "refactor-triage", "SKILL.md"), "utf8");
  assert.match(skill, /--range/, "range mode (post-sweep) must be named");
  assert.match(skill, /[Ww]hole-repo/, "whole-repo mode (periodic) must be named");
  assert.match(skill, /[Hh]eadless/, "headless/harness mode must be named");
  assert.match(skill, /declared triage policy/i, "headless mode rides a declared policy");
  assert.match(skill, /^## Output gate$/m, "the gate→work→gate shape needs an output gate");
});

test("sweep's Handing off names refactor-triage as the post-sweep review step", () => {
  const sweep = readFileSync(join(repo, "pdlc", "skills", "sweep", "SKILL.md"), "utf8");
  const handingOff = sweep.split(/^## Handing off$/m)[1];
  assert.ok(handingOff, "sweep SKILL.md must have a Handing off section");
  assert.match(handingOff, /refactor-triage/, "post-sweep review step must be named");
});

// --- template shape ---

test("template markers are well-formed: one grounding block, both peer blocks inside it", () => {
  assert.equal(TEMPLATE.match(/pdlc:grounding BEGIN/g).length, 1);
  assert.equal(TEMPLATE.match(/pdlc:grounding END/g).length, 1);
  for (const p of PEERS) {
    assert.ok(TEMPLATE.includes(`<!-- pdlc:peer:${p} BEGIN -->`), `${p} BEGIN missing`);
    assert.ok(TEMPLATE.includes(`<!-- pdlc:peer:${p} END -->`), `${p} END missing`);
  }
});

test("template carries the foundational (101) principles from docs/principles.md", () => {
  // P1 — artifact-grounded action; P2 — one TASK, one PR. Canonical statement lives in
  // docs/principles.md; every bootstrapped project must inherit the operational form.
  assert.ok(existsSync(join(repo, "docs", "principles.md")), "canonical principles doc missing");
  assert.match(TEMPLATE, /\*\*Artifact-grounded action:\*\*/);
  assert.match(TEMPLATE, /\*\*One TASK, one PR:\*\*/);
  assert.match(TEMPLATE, /never gets its own PR/);
});

test("renderGrounding substitutes tokens and strips non-opted peer blocks", () => {
  const none = renderGrounding(TEMPLATE, { projectName: "acme", version: "9.9.9", peers: [] });
  assert.ok(none.includes("# acme — praxis development lifecycle"));
  assert.ok(none.includes("v9.9.9"));
  assert.ok(!none.includes("pdlc:peer:"), "no peer blocks when none opted in");
  assert.ok(!none.includes("{{"), "no unrendered tokens");

  const backlog = renderGrounding(TEMPLATE, { projectName: "acme", version: "9.9.9", peers: ["backlog"] });
  assert.ok(backlog.includes("pdlc:peer:backlog BEGIN"));
  assert.ok(backlog.includes("Never hand-edit"));
  assert.ok(!backlog.includes("pdlc:peer:spec-kit"), "spec-kit block must be stripped");
});

// --- planting ---

test("fresh plant: creates CLAUDE.md, sentinel, and .handoff/ gitignore; then idempotent", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: ["backlog", "spec-kit"] }));
    assert.deepEqual(
      { mode: r.mode, claudeMd: r.claudeMd, gitignore: r.gitignore, pdlcFile: r.pdlcFile, missing: r.missing },
      { mode: "fresh", claudeMd: "created", gitignore: "added", pdlcFile: "written", missing: [] },
    );
    const sentinel = JSON.parse(readFileSync(join(root, SENTINEL), "utf8"));
    assert.deepEqual(sentinel.peers, ["backlog", "spec-kit"]);
    assert.ok(readFileSync(join(root, ".gitignore"), "utf8").split("\n").includes(".handoff/"));

    const again = plant(root, opts({ peers: ["backlog", "spec-kit"] }));
    assert.equal(again.mode, "update");
    assert.equal(again.claudeMd, "unchanged");
    assert.equal(again.pdlcFile, "unchanged");
  } finally { done(); }
});

test("existing CLAUDE.md without markers is appended to, never clobbered", () => {
  const { root, done } = proj();
  try {
    writeFileSync(join(root, "CLAUDE.md"), "# my project\n\nHouse rules here.\n");
    const r = plant(root, opts({ peers: [] }));
    assert.equal(r.claudeMd, "appended");
    const out = readFileSync(join(root, "CLAUDE.md"), "utf8");
    assert.ok(out.startsWith("# my project"), "user content stays first");
    assert.ok(out.includes("pdlc:grounding BEGIN"));
    const { before } = extractBlock(out);
    assert.ok(before.includes("House rules here."));
  } finally { done(); }
});

test("drifted block is never overwritten without force, and the sentinel does not advance", () => {
  const { root, done } = proj();
  try {
    plant(root, opts({ peers: [] }));
    const edited = readFileSync(join(root, "CLAUDE.md"), "utf8").replace("## The loop", "## The loop (edited by user)");
    writeFileSync(join(root, "CLAUDE.md"), edited);

    const r = plant(root, opts({ peers: [], version: "10.0.0" })); // upgrade attempt, no force
    assert.equal(r.claudeMd, "drifted");
    assert.equal(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).version, "9.9.9", "sentinel must not advance past a drifted block");
    assert.ok(readFileSync(join(root, "CLAUDE.md"), "utf8").includes("(edited by user)"));

    const forced = plant(root, opts({ peers: [], version: "10.0.0", force: true }));
    assert.equal(forced.claudeMd, "replaced");
    assert.ok(!readFileSync(join(root, "CLAUDE.md"), "utf8").includes("(edited by user)"));
    assert.equal(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).version, "10.0.0");
  } finally { done(); }
});

test("changing peer opt-ins on update rewrites the block and the sentinel (with force)", () => {
  const { root, done } = proj();
  try {
    plant(root, opts({ peers: [] }));
    const r = plant(root, opts({ peers: ["backlog"] }));
    assert.equal(r.claudeMd, "drifted", "peer change alters the expected block");
    const forced = plant(root, opts({ peers: ["backlog"], force: true }));
    assert.equal(forced.claudeMd, "replaced");
    assert.ok(readFileSync(join(root, "CLAUDE.md"), "utf8").includes("pdlc:peer:backlog BEGIN"));
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).peers, ["backlog"]);
  } finally { done(); }
});

test("check mode writes nothing and the CLI exits nonzero while planting is pending", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: [], check: true }));
    assert.equal(r.claudeMd, "created");
    assert.ok(!existsSync(join(root, "CLAUDE.md")));
    assert.ok(!existsSync(join(root, SENTINEL)));

    const cli = join(repo, "pdlc", "scripts", "plant.mjs");
    let status = 0;
    try { execFileSync(process.execPath, [cli, "--root", root, "--check"]); }
    catch (e) { status = e.status; }
    assert.equal(status, 1, "--check must exit 1 while planting is pending");
    execFileSync(process.execPath, [cli, "--root", root]); // plant for real
    execFileSync(process.execPath, [cli, "--root", root, "--check"]); // now clean → exit 0
    assert.ok(readFileSync(join(root, "CLAUDE.md"), "utf8").includes("pdlc:grounding BEGIN"));
  } finally { done(); }
});

// --- absent-peer trace (spec 016) ---

test("sentinel records peersOmitted — known peers not opted in at plant time — and idempotence holds", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: ["backlog"] }));
    assert.deepEqual(r.peersOmitted, ["spec-kit"]);
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).peersOmitted, ["spec-kit"]);

    const before = readFileSync(join(root, SENTINEL), "utf8");
    const again = plant(root, opts({ peers: ["backlog"] }));
    assert.equal(again.claudeMd, "unchanged");
    assert.equal(again.pdlcFile, "unchanged", "re-plant with the same peers must stay idempotent");
    assert.equal(readFileSync(join(root, SENTINEL), "utf8"), before, "sentinel bytes must not churn");

    const all = plant(root, opts({ peers: [...PEERS], force: true }));
    assert.deepEqual(all.peersOmitted, [], "nothing omitted when every known peer is opted in");
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).peersOmitted, []);
  } finally { done(); }
});

test("CLI emits a one-line stderr notice naming each omitted peer's stripped block", () => {
  const a = proj(), b = proj();
  try {
    const cli = join(repo, "pdlc", "scripts", "plant.mjs");
    const r = spawnSync(process.execPath, [cli, "--root", a.root, "--peer", "backlog"], { encoding: "utf8" });
    assert.equal(r.status, 0);
    assert.deepEqual(r.stderr.trim().split("\n"), [
      'plant: peer "spec-kit" omitted — pdlc:peer:spec-kit block stripped (recorded in .pdlc peersOmitted)',
    ]);

    const none = spawnSync(process.execPath, [cli, "--root", b.root], { encoding: "utf8" });
    assert.equal(none.status, 0);
    assert.deepEqual(none.stderr.trim().split("\n"), PEERS.map(
      (p) => `plant: peer "${p}" omitted — pdlc:peer:${p} block stripped (recorded in .pdlc peersOmitted)`,
    ), "one line per omitted peer, in known-peer order");

    const both = spawnSync(process.execPath, [cli, "--root", a.root, "--peer", "backlog", "--peer", "spec-kit", "--force"], { encoding: "utf8" });
    assert.equal(both.stderr, "", "no notice when every known peer is opted in");
  } finally { a.done(); b.done(); }
});

test("legacy sentinels without peersOmitted stay readable and re-plant as unchanged", () => {
  const { root, done } = proj();
  try {
    plant(root, opts({ peers: ["backlog"] }));
    const sentinelPath = join(root, SENTINEL);
    const legacy = JSON.parse(readFileSync(sentinelPath, "utf8"));
    delete legacy.peersOmitted; // what a pre-trace plant wrote
    writeFileSync(sentinelPath, JSON.stringify(legacy, null, 2) + "\n");

    const r = plant(root, opts({ peers: ["backlog"] }));
    assert.equal(r.claudeMd, "unchanged");
    assert.equal(r.pdlcFile, "unchanged", "matching version+peers must not rewrite a legacy sentinel");
    assert.ok(!("peersOmitted" in JSON.parse(readFileSync(sentinelPath, "utf8"))), "legacy sentinel left as-is");

    const upgraded = plant(root, opts({ peers: ["backlog"], version: "10.0.0", force: true }));
    assert.equal(upgraded.pdlcFile, "updated");
    assert.deepEqual(JSON.parse(readFileSync(sentinelPath, "utf8")).peersOmitted, ["spec-kit"], "a real update gains the field");
  } finally { done(); }
});

// --- name resolution (spec 017) ---

/** A real primary checkout named `primaryName` plus a git worktree named `wtName`. */
function gitPair(primaryName, wtName) {
  const base = mkdtempSync(join(tmpdir(), "pdlc-wt-"));
  const primary = join(base, primaryName);
  mkdirSync(primary);
  const git = (cwd, ...args) =>
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd, encoding: "utf8" });
  git(primary, "init", "-q");
  writeFileSync(join(primary, "seed"), "seed\n");
  git(primary, "add", "seed");
  git(primary, "commit", "-qm", "seed");
  const wt = join(base, wtName);
  git(primary, "worktree", "add", "-q", "-b", `${wtName}-branch`, wt);
  return { primary, wt, done: () => rmSync(base, { recursive: true, force: true }) };
}

test("resolveProjectName ladder: override > recorded > worktree gitdir parse > basename", () => {
  const { root, done } = proj();
  try {
    assert.equal(resolveProjectName(root), basename(root), "non-git dir keeps basename");
    writeFileSync(join(root, ".git"), "gitdir: /elsewhere/my-primary/.git/worktrees/task-1\n");
    assert.equal(resolveProjectName(root), "my-primary", "absolute gitdir pointer → primary basename");
    writeFileSync(join(root, ".git"), "gitdir: ../rel-primary/.git/worktrees/task-1\n");
    assert.equal(resolveProjectName(root), "rel-primary", "relative pointers resolve against root");
    writeFileSync(join(root, ".git"), "gitdir: ../super/.git/modules/sub\n");
    assert.equal(resolveProjectName(root), basename(root), "non-worktree pointer (submodule) falls back");
    assert.equal(resolveProjectName(root, { recorded: "kept" }), "kept", "sentinel name beats derivation");
    assert.equal(resolveProjectName(root, { name: "flag", recorded: "kept" }), "flag", "--name beats everything");
  } finally { done(); }
});

test("worktree plant renders the PRIMARY checkout's name; re-plants from either side stay unchanged, never drifted", () => {
  const { primary, wt, done } = gitPair("primary-proj", "task-999-elsewhere");
  try {
    const r = plant(wt, opts({ peers: [] }));
    assert.equal(r.projectName, "primary-proj");
    assert.ok(readFileSync(join(wt, "CLAUDE.md"), "utf8").includes("# primary-proj — praxis development lifecycle"));
    assert.equal(JSON.parse(readFileSync(join(wt, SENTINEL), "utf8")).name, "primary-proj");

    const again = plant(wt, opts({ peers: [], check: true }));
    assert.equal(again.claudeMd, "unchanged", "re-plant from the same worktree must be a no-op");

    // the branch merges: the planted files land in the primary checkout byte-identical
    for (const f of ["CLAUDE.md", SENTINEL, ".gitignore"]) copyFileSync(join(wt, f), join(primary, f));
    const back = plant(primary, opts({ peers: [], check: true }));
    assert.equal(back.claudeMd, "unchanged", "re-plant from the primary must not spuriously drift");
    assert.equal(back.pdlcFile, "unchanged");
  } finally { done(); }
});

test("--name beats derivation, is recorded in the sentinel, and a later rename is honest drift", () => {
  const { wt, done } = gitPair("primary-two", "task-1000");
  try {
    const r = plant(wt, opts({ peers: [], name: "flux" }));
    assert.equal(r.projectName, "flux");
    assert.ok(readFileSync(join(wt, "CLAUDE.md"), "utf8").includes("# flux — praxis development lifecycle"));
    assert.equal(JSON.parse(readFileSync(join(wt, SENTINEL), "utf8")).name, "flux");

    const again = plant(wt, opts({ peers: [] }));
    assert.equal(again.claudeMd, "unchanged", "re-plant without --name reuses the recorded name");
    assert.equal(again.pdlcFile, "unchanged");

    const renamed = plant(wt, opts({ peers: [], name: "flux2" }));
    assert.equal(renamed.claudeMd, "drifted", "a rename never lands silently");
    const forced = plant(wt, opts({ peers: [], name: "flux2", force: true }));
    assert.equal(forced.claudeMd, "replaced");
    assert.equal(JSON.parse(readFileSync(join(wt, SENTINEL), "utf8")).name, "flux2", "the sentinel follows the rename");
  } finally { done(); }
});

test("plain dirs keep basename(root); the CLI accepts --name and reports the resolved name", () => {
  const a = proj(), b = proj();
  try {
    const r = plant(a.root, opts({ peers: [] }));
    assert.equal(r.projectName, basename(a.root));
    assert.ok(readFileSync(join(a.root, "CLAUDE.md"), "utf8").includes(`# ${basename(a.root)} — praxis development lifecycle`));

    const cli = join(repo, "pdlc", "scripts", "plant.mjs");
    const out = spawnSync(process.execPath, [cli, "--root", b.root, "--name", "acme"], { encoding: "utf8" });
    assert.equal(out.status, 0);
    assert.equal(JSON.parse(out.stdout).projectName, "acme");
    assert.ok(readFileSync(join(b.root, "CLAUDE.md"), "utf8").includes("# acme — praxis development lifecycle"));
  } finally { a.done(); b.done(); }
});

test("unknown peers are rejected", () => {
  const { root, done } = proj();
  try {
    assert.throws(() => plant(root, opts({ peers: ["jira"] })), /unknown peer/);
  } finally { done(); }
});
