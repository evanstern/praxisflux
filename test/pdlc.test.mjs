import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, realpathSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { plant, renderGrounding, extractBlock, resolveProjectName, PEERS, HOOKS, rootGuardHookEntries, SENTINEL, excludeSet } from "../pdlc/scripts/plant.mjs";
import { generate, validateConfig, agentPath, CONFIG_PATH, GENERATED_MARKER } from "../pdlc/scripts/tiers.mjs";
import { parseFrontmatter } from "../lib/markdown.mjs";
import { ensureExclude } from "../lib/installer.mjs";

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
  assert.match(skill, /^description: \S/m, "description (the trigger surface) must be present");
});

// --- refactor-triage skill (spec 033; deepened per spec 047) ---

test("refactor-triage SKILL.md has the frontmatter the bump gate keys on and the full phase skeleton", () => {
  const skill = readFileSync(join(repo, "pdlc", "skills", "refactor-triage", "SKILL.md"), "utf8");
  const fm = parseFrontmatter(skill);
  assert.equal(fm.name, "refactor-triage");
  assert.match(fm.version, /^\d+\.\d+\.\d+$/);
  assert.ok(fm.description && fm.description.length > 0, "description (the trigger surface) must be present");
  // The new-plugin standard's four sections, mapped onto this skill's actual phases —
  // a gutted phase (engine orchestration, triage record, the Execute contract) drops a
  // header along with the prose, so this fails loud instead of the tests staying green.
  for (const section of [
    "## Precondition gate",
    "## Phase 1 — SCOPE",
    "## Phase 2 — EVALUATE",
    "## Phase 3 — TRIAGE",
    "## Phase 4 — EXECUTE",
    "## Output gate",
    "## Handing off",
  ]) assert.ok(skill.includes(section), `SKILL.md missing "${section}"`);
});

test("refactor-triage phase-content anchors: triage-record path, backlog-CLI-only Execute, lens framing", () => {
  const skill = readFileSync(join(repo, "pdlc", "skills", "refactor-triage", "SKILL.md"), "utf8");
  assert.match(
    skill, /docs\/reviews\/refactor-triage-<run-id>\.md/,
    "the tracked triage-record path template must be named",
  );
  assert.match(
    skill, /via the `backlog` CLI/,
    "Phase 4 must state the backlog-CLI-only Execute contract",
  );
  assert.match(
    skill, /lens parameter/,
    "the team-review lens framing must be named",
  );
});

test("refactor-triage and team-review agree on the docs/reviews/team-review-<run-id>.md spelling", () => {
  const rt = readFileSync(join(repo, "pdlc", "skills", "refactor-triage", "SKILL.md"), "utf8");
  const tr = readFileSync(join(repo, "team-review", "skills", "team-review", "SKILL.md"), "utf8");
  const PATH_RE = /docs\/reviews\/team-review-<[^>]+>\.md/g;
  const rtMatches = [...rt.matchAll(PATH_RE)].map((m) => m[0]);
  const trMatches = [...tr.matchAll(PATH_RE)].map((m) => m[0]);
  assert.ok(rtMatches.length > 0, "refactor-triage SKILL.md must name the tracked report path");
  assert.ok(trMatches.length > 0, "team-review SKILL.md must name the tracked report path");
  assert.ok(rtMatches.every((m) => m === rtMatches[0]), "refactor-triage must spell the path consistently");
  assert.ok(trMatches.every((m) => m === trMatches[0]), "team-review must spell the path consistently");
  assert.equal(
    rtMatches[0], trMatches[0],
    "both skills must spell the shared docs/reviews/team-review-<run-id>.md template identically",
  );
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

// --- model-tier rubric (spec 048) ---
// The contract, not the prose: assertions anchor on stable strings (paths, marker names,
// `model:`, the field-case date) so a reword of the planted section leaves them green.

/** The model-tier section body: from its heading up to the first peer block that follows it. */
function tierSection() {
  const begin = TEMPLATE.indexOf("## Model tiers");
  assert.notEqual(begin, -1, "template must carry a ## Model tiers section");
  const end = TEMPLATE.indexOf("pdlc:peer:", begin);
  return TEMPLATE.slice(begin, end === -1 ? undefined : end);
}

test("template plants the model-tier rubric inside the grounding markers, before the peer blocks", () => {
  const begin = TEMPLATE.indexOf("pdlc:grounding BEGIN");
  const end = TEMPLATE.indexOf("pdlc:grounding END");
  assert.ok(begin !== -1 && end !== -1 && begin < end, "grounding markers must bracket the block");
  const grounding = TEMPLATE.slice(begin, end);
  const heading = grounding.indexOf("## Model tiers");
  assert.ok(heading !== -1, "the model-tier section must sit inside the grounding markers");
  const firstPeer = grounding.indexOf("pdlc:peer:");
  assert.ok(firstPeer === -1 || heading < firstPeer, "the tier section precedes the opt-in peer blocks");
});

test("the model-tier section names frontmatter pinning and cites the 2026-07-31 field case", () => {
  const section = tierSection();
  // the mechanism that holds is a model: in an agent definition's frontmatter
  assert.match(section, /\.claude\/agents\/<tier>-implementer\.md/, "the agent-def path is the pin location");
  assert.match(section, /model:/, "frontmatter model: is the pinning mechanism");
  // the field case is what makes the frontmatter pin the default over the dispatch-call param
  assert.match(section, /2026-07-31/, "the field case date must be cited");
  assert.match(section, /board-cost-test-runbook\.md/, "the field case source must be cited");
});

test("the model-tier section names the agent definition as authoritative, the table as planted default", () => {
  const section = tierSection();
  assert.match(section, /authoritative/, "the section must name which pin is authoritative at dispatch");
  assert.match(section, /planted default/, "the table is the planted default; the frontmatter pins");
});

test("bootstrap SKILL.md resolves model IDs against the live harness, never from memory", () => {
  const skill = readFileSync(join(repo, "pdlc", "skills", "bootstrap", "SKILL.md"), "utf8");
  assert.match(skill, /claude-api/, "the standing source for current model IDs must be named");
  assert.match(skill, /from memory/i, "the never-author-from-memory instruction must be present");
  assert.match(skill, /\.claude\/agents\/<tier>-implementer\.md/, "the availability check keys on the agent-definition surface");
});

test("sweep Phase 1 item 2 names where a bootstrapped project's rubric lives", () => {
  const sweep = readFileSync(join(repo, "pdlc", "skills", "sweep", "SKILL.md"), "utf8");
  // R5 two-way contract: sweep must name both halves bootstrap plants — the planted section
  // (the ladder) and the agent-def frontmatter (the authoritative pin).
  assert.match(sweep, /## Model tiers/, "sweep must name the planted rubric section");
  assert.match(sweep, /\.claude\/agents\/<tier>-implementer\.md/, "sweep must name the authoritative pin location");
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

// --- Jira peer (spec 054 phase 2) ---
// AC #6's grep test, written FIRST — before the pdlc:peer:jira block is authored — so the
// block is written against a failing test rather than checked after the fact.

test('pdlc:peer:jira block contains zero occurrences of "backlog " (AC #6 grep test)', () => {
  const rendered = renderGrounding(TEMPLATE, { projectName: "acme", version: "9.9.9", peers: ["jira"] });
  const begin = rendered.indexOf("<!-- pdlc:peer:jira BEGIN -->");
  const end = rendered.indexOf("<!-- pdlc:peer:jira END -->");
  assert.ok(begin !== -1 && end !== -1, "pdlc:peer:jira block must be present when opted in");
  assert.ok(!rendered.slice(begin, end).includes("backlog "), "no backlog CLI command string in the jira block (copy-paste guard)");
});

test("PEERS names jira; the block renders with --peer jira and strips without it (AC #4)", () => {
  assert.deepEqual(PEERS, ["backlog", "spec-kit", "jira"]);
  const withJira = renderGrounding(TEMPLATE, { projectName: "acme", version: "9.9.9", peers: ["jira"] });
  assert.ok(withJira.includes("pdlc:peer:jira BEGIN"));
  const without = renderGrounding(TEMPLATE, { projectName: "acme", version: "9.9.9", peers: [] });
  assert.ok(!without.includes("pdlc:peer:jira"));
});

test("backlog and jira peers are mutually exclusive, with the reason named (AC #5)", () => {
  const { root, done } = proj();
  try {
    assert.throws(
      () => plant(root, opts({ peers: ["backlog", "jira"] })),
      /one board is the plan of record/,
    );
  } finally { done(); }
});

test("sentinel records jira under peers/peersOmitted with no sentinel schema change (AC #7)", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: ["jira"] }));
    assert.deepEqual(r.peersOmitted, ["backlog", "spec-kit"]);
    const sentinel = JSON.parse(readFileSync(join(root, SENTINEL), "utf8"));
    assert.deepEqual(sentinel.peers, ["jira"]);
    assert.deepEqual(sentinel.peersOmitted, ["backlog", "spec-kit"]);
    assert.deepEqual(
      Object.keys(sentinel).sort(),
      ["planted", "version", "name", "peers", "peersOmitted", "hooks", "plantedAt"].sort(),
      "no new sentinel fields — jira rides the existing peers/peersOmitted shape",
    );
  } finally { done(); }
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
    assert.deepEqual(r.peersOmitted, ["spec-kit", "jira"]);
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).peersOmitted, ["spec-kit", "jira"]);

    const before = readFileSync(join(root, SENTINEL), "utf8");
    const again = plant(root, opts({ peers: ["backlog"] }));
    assert.equal(again.claudeMd, "unchanged");
    assert.equal(again.pdlcFile, "unchanged", "re-plant with the same peers must stay idempotent");
    assert.equal(readFileSync(join(root, SENTINEL), "utf8"), before, "sentinel bytes must not churn");

    // backlog + jira are mutually exclusive (R4) — [...PEERS] can no longer be opted into at
    // once, so "nothing omitted" now means the largest peer set that excludes one of the pair.
    const compatible = PEERS.filter((p) => p !== "backlog");
    const all = plant(root, opts({ peers: compatible, force: true }));
    assert.deepEqual(all.peersOmitted, ["backlog"], "backlog is the only known peer that can't join jira");
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).peersOmitted, ["backlog"]);
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
      'plant: peer "jira" omitted — pdlc:peer:jira block stripped (recorded in .pdlc peersOmitted)',
    ]);

    const none = spawnSync(process.execPath, [cli, "--root", b.root], { encoding: "utf8" });
    assert.equal(none.status, 0);
    assert.deepEqual(none.stderr.trim().split("\n"), PEERS.map(
      (p) => `plant: peer "${p}" omitted — pdlc:peer:${p} block stripped (recorded in .pdlc peersOmitted)`,
    ), "one line per omitted peer, in known-peer order");

    // backlog + jira are mutually exclusive (R4), so no combination ever opts into every known
    // peer at once anymore; opting into the two peers compatible with each other (spec-kit +
    // jira) leaves exactly backlog — the one peer that can't join jira — as the sole notice.
    const both = spawnSync(process.execPath, [cli, "--root", a.root, "--peer", "spec-kit", "--peer", "jira", "--force"], { encoding: "utf8" });
    assert.equal(both.status, 0);
    assert.deepEqual(both.stderr.trim().split("\n"), [
      'plant: peer "backlog" omitted — pdlc:peer:backlog block stripped (recorded in .pdlc peersOmitted)',
    ], "backlog is the only peer that can't join jira");
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
    assert.deepEqual(JSON.parse(readFileSync(sentinelPath, "utf8")).peersOmitted, ["spec-kit", "jira"], "a real update gains the field");
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
    // "jira" is now a KNOWN peer (spec 054) — use a name that stays unknown to keep testing
    // the same behavior this test is actually named for.
    assert.throws(() => plant(root, opts({ peers: ["trello"] })), /unknown peer/);
  } finally { done(); }
});

// --- opt-in root-guard hook (spec 051 / TASK-101) ---

/** Read a planted host's .claude/settings.json (or {} if absent). */
function readSettings(root) {
  const p = join(root, ".claude", "settings.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}
/** Every PreToolUse command string declared in a settings object. */
function preToolUseCommands(settings) {
  return (settings.hooks?.PreToolUse ?? []).flatMap((e) => (e.hooks ?? []).map((h) => h.command ?? ""));
}

test("no --hook: nothing under .claude/, sentinel records hooks: [] , report hooks: absent", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: [] }));
    assert.equal(r.hooks, "absent");
    assert.ok(!existsSync(join(root, ".claude")), "no .claude/ tree when the hook is not opted in");
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).hooks, []);
  } finally { done(); }
});

test("opt-in root-guard copies BOTH files and injects both PreToolUse entries; then idempotent", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: [], hooks: ["root-guard"] }));
    assert.equal(r.hooks, "installed");
    // BOTH files land — a hook missing its scanner is broken (Phase 2 §1).
    for (const f of ["root-guard-hook.mjs", "shell-scan.mjs"])
      assert.ok(existsSync(join(root, ".claude", "hooks", f)), `${f} must be copied into the host`);
    // The host copy imports its scanner relatively — prove the import target is present.
    const hookSrc = readFileSync(join(root, ".claude", "hooks", "root-guard-hook.mjs"), "utf8");
    assert.match(hookSrc, /from '\.\/shell-scan\.mjs'/, "the planted hook imports ./shell-scan.mjs");
    // Both PreToolUse entries wired, referencing the host copy via $CLAUDE_PROJECT_DIR.
    const cmds = preToolUseCommands(readSettings(root));
    for (const { command } of rootGuardHookEntries()) assert.ok(cmds.includes(command), `missing wiring: ${command}`);
    assert.ok(cmds.some((c) => c.includes("pre-bash")) && cmds.some((c) => c.includes("pre-write")),
      "both pre-bash (Bash) and pre-write (Write|Edit|NotebookEdit) entries present");
    assert.deepEqual(JSON.parse(readFileSync(join(root, SENTINEL), "utf8")).hooks, ["root-guard"]);

    const again = plant(root, opts({ peers: [], hooks: ["root-guard"] }));
    assert.equal(again.hooks, "unchanged", "already-wired hook re-plants as unchanged");
    assert.equal(again.pdlcFile, "unchanged");
    // No duplicate PreToolUse entries on a second plant.
    assert.equal(preToolUseCommands(readSettings(root)).filter((c) => c.includes("root-guard-hook.mjs")).length, 2);
  } finally { done(); }
});

test("hook injection preserves a host's pre-existing hooks", () => {
  const { root, done } = proj();
  try {
    mkdirSync(join(root, ".claude"), { recursive: true });
    const existing = { hooks: { Stop: [{ hooks: [{ type: "command", command: "node existing-stop.mjs" }] }] } };
    writeFileSync(join(root, ".claude", "settings.json"), JSON.stringify(existing, null, 2) + "\n");
    plant(root, opts({ peers: [], hooks: ["root-guard"] }));
    const settings = readSettings(root);
    assert.ok(settings.hooks.Stop, "the pre-existing Stop hook survives");
    assert.equal(settings.hooks.Stop[0].hooks[0].command, "node existing-stop.mjs");
    assert.equal(preToolUseCommands(settings).length, 2, "the two root-guard PreToolUse entries were added");
  } finally { done(); }
});

test("--check with --hook writes nothing and the CLI exits nonzero while wiring is pending", () => {
  const { root, done } = proj();
  try {
    const r = plant(root, opts({ peers: [], hooks: ["root-guard"], check: true }));
    assert.equal(r.hooks, "installed", "check reports the hook would be installed");
    assert.ok(!existsSync(join(root, ".claude")), "check mode writes no hook files");

    const cli = join(repo, "pdlc", "scripts", "plant.mjs");
    let status = 0;
    try { execFileSync(process.execPath, [cli, "--root", root, "--hook", "root-guard", "--check"]); }
    catch (e) { status = e.status; }
    assert.equal(status, 1, "--check must exit 1 while hook wiring is pending");
    execFileSync(process.execPath, [cli, "--root", root, "--hook", "root-guard"]); // wire for real
    execFileSync(process.execPath, [cli, "--root", root, "--hook", "root-guard", "--check"]); // now clean → exit 0
    assert.ok(existsSync(join(root, ".claude", "hooks", "shell-scan.mjs")));
  } finally { done(); }
});

test("unknown hooks are rejected; HOOKS names root-guard", () => {
  const { root, done } = proj();
  try {
    assert.deepEqual(HOOKS, ["root-guard"]);
    assert.throws(() => plant(root, opts({ peers: [], hooks: ["danger"] })), /unknown hook/);
  } finally { done(); }
});

// --- model-tier config → generated agent definitions (TASK-106) ---
// The chain under test: .claude/model-tiers.json → tiers.mjs → .claude/agents/*.md → harness.
// The harness honors ONLY the generated def's frontmatter `model:` (the dispatch-call param was
// observed silently ignored on 2026-07-31), so these assertions guard the pin, not the prose.

const TIERS_TEMPLATE = join(repo, "pdlc", "templates", "implementer-agent.md");
const TIERS_CLI = join(repo, "pdlc", "scripts", "tiers.mjs");
const tierOpts = (extra = {}) => ({ templatePath: TIERS_TEMPLATE, ...extra });

/** A project root carrying `config` at .claude/model-tiers.json. */
function tierProj(config) {
  const { root, done } = proj();
  mkdirSync(join(root, ".claude"), { recursive: true });
  writeFileSync(join(root, CONFIG_PATH.replace("/", "/")), JSON.stringify(config, null, 2));
  return { root, done };
}

/** The template's own planted default — what bootstrap copies into a fresh host. */
function plantedConfig() {
  return JSON.parse(readFileSync(join(repo, "pdlc", "templates", "model-tiers.json"), "utf8"));
}

/** Run the tiers CLI, returning its exit status (0 when it throws nothing). */
function tiersCli(args) {
  const r = spawnSync(process.execPath, [TIERS_CLI, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

test("the planted tier config is valid and encodes the Sonnet-default / Opus-escalation posture", () => {
  const config = plantedConfig();
  assert.doesNotThrow(() => validateConfig(config));
  // Execution is the default; thinking is reached for deliberately. This is the posture the
  // planted CLAUDE.md states in prose — asserted here so the two cannot drift apart.
  assert.equal(config.defaultTier, "sonnet", "an unmarked task must default to the execution tier");
  assert.equal(config.tiers[config.escalationTier].escalation, true, "the escalation tier must be marked escalation:true");
  assert.ok(config.tiers.haiku, "the cheap execution tier ships by default");
});

test("generated agent definitions pin exactly the model IDs the config declares", () => {
  const config = plantedConfig();
  const { root, done } = tierProj(config);
  try {
    const report = generate(root, tierOpts({ config }));
    for (const [name, tier] of Object.entries(config.tiers)) {
      assert.equal(report.agents[name].status, "created");
      const fm = parseFrontmatter(readFileSync(join(root, agentPath(name)), "utf8"));
      // The pin is the whole point: a def whose model: drifts from the config is the silent
      // wrong-model dispatch this mechanism exists to prevent.
      assert.equal(fm.model, tier.model, `${name} must pin ${tier.model}`);
      assert.equal(fm.name, `${name}-implementer`, "agent name follows the tier name");
    }
  } finally { done(); }
});

test("a tier the plugin never anticipated generates a valid pinned definition", () => {
  // The extensibility claim: model families rev on independent cadences and new ones arrive
  // unannounced, so adding a tier must be a config key, never a code change.
  const config = {
    configVersion: 1,
    defaultTier: "sonnet",
    tiers: {
      sonnet: { model: "claude-sonnet-5", for: "execution" },
      fable: { model: "claude-fable-5", escalation: true, for: "the hardest long-horizon reasoning" },
    },
  };
  const { root, done } = tierProj(config);
  try {
    const report = generate(root, tierOpts({ config }));
    assert.equal(report.agents.fable.status, "created");
    const fm = parseFrontmatter(readFileSync(join(root, agentPath("fable")), "utf8"));
    assert.equal(fm.model, "claude-fable-5", "an unanticipated tier still pins its declared ID");
    assert.match(fm.description, /ESCALATION TIER/, "escalation:true surfaces in the description an orchestrator reads");
  } finally { done(); }
});

test("a per-tier fallback reaches both the description and the agent body", () => {
  const config = plantedConfig();
  const { root, done } = tierProj(config);
  try {
    generate(root, tierOpts({ config }));
    const opus = readFileSync(join(root, agentPath("opus")), "utf8");
    assert.match(opus, /claude-opus-4-8/, "the fallback ID must reach the def");
    assert.match(opus, /actually served/, "the record-what-served rule rides with the fallback");
  } finally { done(); }
});

test("every schema rejection is a NAMED error, never a silent skip", () => {
  // A tier that fails to resolve must fail loudly: an unpinned dispatch silently inherits the
  // orchestrator's session model, which is the expensive failure mode (2026-07-31 field case).
  const ok = { model: "m", for: "f" };
  const cases = [
    [{ tiers: { a: ok } }, /defaultTier/, "missing defaultTier"],
    [{ defaultTier: "ghost", tiers: { a: ok } }, /not a declared tier/, "unknown defaultTier"],
    [{ defaultTier: "a", escalationTier: "ghost", tiers: { a: ok } }, /not a declared tier/, "unknown escalationTier"],
    [{ defaultTier: "a", tiers: {} }, /empty/, "no tiers declared"],
    [{ defaultTier: "a", tiers: { a: { for: "f" } } }, /missing a "model"/, "tier without a model ID"],
    [{ defaultTier: "a", tiers: { a: { model: "m" } } }, /missing a "for"/, "tier without a scope"],
    [{ defaultTier: "A b", tiers: { "A b": ok } }, /lowercase/, "tier name that is not filename-safe"],
    [{ defaultTier: "a", tiers: { a: { model: "m", for: "f", fallback: 7 } } }, /fallback/, "non-string fallback"],
  ];
  for (const [config, pattern, label] of cases) {
    assert.throws(() => validateConfig(config), pattern, label);
  }
});

test("--check exits nonzero while a definition is missing or stale, zero once in sync", () => {
  const config = plantedConfig();
  const { root, done } = tierProj(config);
  try {
    assert.equal(tiersCli(["--root", root, "--check"]).status, 1, "missing defs → exit 1");
    assert.equal(tiersCli(["--root", root]).status, 0, "generating for real succeeds");
    assert.equal(tiersCli(["--root", root, "--check"]).status, 0, "in sync → exit 0");

    // Bump a model ID the way an operator would: edit the config, not the def.
    const bumped = plantedConfig();
    bumped.tiers.sonnet.model = "claude-sonnet-6";
    writeFileSync(join(root, CONFIG_PATH), JSON.stringify(bumped, null, 2));
    assert.equal(tiersCli(["--root", root, "--check"]).status, 1, "a stale pin must fail --check");
    assert.equal(tiersCli(["--root", root]).status, 0, "regenerating clears it");
    const fm = parseFrontmatter(readFileSync(join(root, agentPath("sonnet")), "utf8"));
    assert.equal(fm.model, "claude-sonnet-6", "the regenerated def carries the bumped ID");
  } finally { done(); }
});

test("a hand-authored definition is reported drifted and never silently overwritten", () => {
  const config = plantedConfig();
  const { root, done } = tierProj(config);
  try {
    generate(root, tierOpts({ config }));
    const mine = join(root, agentPath("sonnet"));
    writeFileSync(mine, "---\nname: sonnet-implementer\nmodel: my-own-pin\n---\nhand written\n");

    const report = generate(root, tierOpts({ config }));
    assert.equal(report.agents.sonnet.status, "drifted");
    assert.match(readFileSync(mine, "utf8"), /hand written/, "the operator's file survives untouched");

    // Drift must be loud in WRITE mode too — exiting 0 there would report success over a live
    // config/pin mismatch, the same silent state the mechanism exists to prevent.
    assert.equal(tiersCli(["--root", root]).status, 1, "drift fails the write-mode run");
    assert.match(readFileSync(mine, "utf8"), /hand written/, "still not clobbered by the CLI run");

    assert.equal(tiersCli(["--root", root, "--force"]).status, 0, "--force is the consent path");
    assert.doesNotMatch(readFileSync(mine, "utf8"), /hand written/, "--force replaces it");
    assert.match(readFileSync(mine, "utf8"), new RegExp(GENERATED_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally { done(); }
});

test("a stale GENERATED definition refreshes without --force", () => {
  // Regenerating our own output is not a consent event; only the operator's text is protected.
  const config = plantedConfig();
  const { root, done } = tierProj(config);
  try {
    generate(root, tierOpts({ config }));
    const p = join(root, agentPath("haiku"));
    writeFileSync(p, readFileSync(p, "utf8").replace("You are a dispatched implementer", "STALE"));
    assert.equal(generate(root, tierOpts({ config })).agents.haiku.status, "replaced");
    assert.match(readFileSync(p, "utf8"), /You are a dispatched implementer/);
  } finally { done(); }
});

test("the CLI fails with a named error and exit 2 when the config is absent or unparseable", () => {
  const { root, done } = proj();
  try {
    let r = tiersCli(["--root", root]);
    assert.equal(r.status, 2, "absent config exits 2");
    assert.match(r.stderr, /not found/, "and says so by name");

    mkdirSync(join(root, ".claude"), { recursive: true });
    writeFileSync(join(root, CONFIG_PATH), "{not json");
    r = tiersCli(["--root", root]);
    assert.equal(r.status, 2, "unparseable config exits 2");
    assert.match(r.stderr, /invalid JSON/, "and names the parse failure");
  } finally { done(); }
});

test("the planted tier section points at the config and warns off hand-editing generated defs", () => {
  const section = tierSection();
  assert.match(section, /model-tiers\.json/, "the section must name where the ladder actually lives");
  assert.match(section, /tiers\.mjs/, "and how to regenerate after a config edit");
  // The block must not carry a LADDER — a tier→model table here is what made a model bump a
  // re-plant + consent + --force. Naming an ID inline as an illustrative example is fine (the
  // host-form guidance needs one); what must be gone is any tier label paired with an ID.
  const ladderRow = /\|\s*(default implementer|mechanical|fallback|escalation)\s*\|/i;
  assert.doesNotMatch(section, ladderRow, "no tier→model ladder table in the planted block");
  assert.doesNotMatch(section, /^\s*\|\s*Tier\s*\|/m, "no tier table header in the planted block");
});

test("bootstrap and sweep both route through the config, not a hardcoded ladder", () => {
  const bootstrap = readFileSync(join(repo, "pdlc", "skills", "bootstrap", "SKILL.md"), "utf8");
  assert.match(bootstrap, /model-tiers\.json/, "bootstrap must plant the config");
  assert.match(bootstrap, /tiers\.mjs/, "bootstrap must generate the definitions");

  const sweep = readFileSync(join(repo, "pdlc", "skills", "sweep", "SKILL.md"), "utf8");
  assert.match(sweep, /model-tiers\.json/, "sweep reads tiers from the config");
  assert.match(sweep, /defaultTier/, "sweep names the default it assigns unmarked tasks");
  // TASK-97: step 5 taught the dispatch-call param, the mechanism the board-cost-test falsified.
  assert.match(sweep, /served model/i, "sweep must require served-model verification");
});

test("the planted tier section teaches host-form IDs, dual pin mechanisms, and the registry cache", () => {
  // Three findings from the 2026-08-10 live-dispatch proof, each of which cost a failed
  // dispatch to learn. They are doctrine because a host hits all three on day one.
  const section = tierSection();
  assert.match(section, /host/i, "the ID form is host-dependent — say so");
  // Both mechanisms have now been observed failing, on different hosts. Asserting both dates
  // keeps a future edit from quietly restoring the never-works claim about either one.
  assert.match(section, /2026-07-31/, "the dispatch-param field case");
  assert.match(section, /2026-08-10/, "the frontmatter-pin counter-case");
  assert.match(section, /session/i, "the agent registry is read at session start");
});

// --- local-only planting: exclude helper + scoped set (spec 060, Phase 1) ---

/** A real (non-worktree) git repo in a fresh temp dir. */
function gitRoot() {
  const root = mkdtempSync(join(tmpdir(), "pdlc-git-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("excludeSet: always-on lines only when no peers/hooks opted in; each opt-in adds exactly its lines", () => {
  const base = excludeSet({ peers: [], hooks: [] });
  assert.ok(!base.includes("/backlog/") && !base.includes("/.specify/"));
  assert.ok(!base.includes("/.claude/settings.json") && !base.includes("/.claude/hooks/"));
  for (const always of ["/.pdlc", "/CLAUDE.md", "/AGENTS.md", "/.handoff/", "/.worktrees/", "/specs/", "/docs/wiki/"]) {
    assert.ok(base.includes(always), `always-on line ${always} missing`);
  }
  assert.deepEqual(excludeSet({ peers: ["backlog"] }).filter((l) => !base.includes(l)), ["/backlog/"]);
  assert.deepEqual(excludeSet({ peers: ["spec-kit"] }).filter((l) => !base.includes(l)), ["/.specify/"]);
  assert.deepEqual(
    excludeSet({ hooks: ["root-guard"] }).filter((l) => !base.includes(l)),
    ["/.claude/settings.json", "/.claude/hooks/"],
  );
  assert.equal(excludeSet().length, base.length, "no-args defaults to peers/hooks off");
});

test("ensureExclude: writes .git/info/exclude, idempotent, appends only missing lines", () => {
  const { root, done } = gitRoot();
  try {
    const first = ensureExclude(root, ["/.pdlc", "/CLAUDE.md"]);
    assert.deepEqual(first, { status: "added", added: ["/.pdlc", "/CLAUDE.md"] });
    const excludePath = join(root, ".git", "info", "exclude");
    const lines = readFileSync(excludePath, "utf8").split("\n");
    assert.ok(lines.includes("/.pdlc") && lines.includes("/CLAUDE.md"));

    const again = ensureExclude(root, ["/.pdlc", "/CLAUDE.md"]);
    assert.deepEqual(again, { status: "unchanged", added: [] });

    const grew = ensureExclude(root, ["/.pdlc", "/backlog/"]);
    assert.deepEqual(grew, { status: "added", added: ["/backlog/"] }, "only the new line is added");
    assert.equal(readFileSync(excludePath, "utf8").split("\n").filter((l) => l === "/.pdlc").length, 1);
  } finally { done(); }
});

test("ensureExclude: .git as a worktree pointer file writes to the resolved gitdir", () => {
  const { primary, wt, done } = gitPair("primary-exclude", "wt-exclude");
  try {
    const r = ensureExclude(wt, ["/.pdlc"]);
    assert.equal(r.status, "added");
    const realGitDir = join(primary, ".git", "worktrees", "wt-exclude");
    assert.ok(readFileSync(join(realGitDir, "info", "exclude"), "utf8").includes("/.pdlc"));
  } finally { done(); }
});

test("ensureExclude: no .git degrades to a reported no-git result, nothing written, never throws", () => {
  const { root, done } = proj();
  try {
    assert.deepEqual(ensureExclude(root, ["/.pdlc"]), { status: "no-git", added: [] });
    assert.ok(!existsSync(join(root, ".git")));
  } finally { done(); }
});
