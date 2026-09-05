#!/usr/bin/env node
// plant.mjs — deterministic planting for pdlc:bootstrap (dual-use: library + CLI).
//
// Renders the grounding template (peer blocks stripped unless opted in) and lands it in the
// target project: a fresh CLAUDE.md when none exists, appended when one exists without pdlc
// markers, replaced-between-markers on refresh. A block whose on-disk content differs from
// what this version would plant is reported as `drifted` and is never overwritten without
// --force — the skill shows the diff and gets consent first. Also stamps the `.pdlc` sentinel
// and gitignores `.handoff/`. Writes nothing in --check mode.
//
// Absent peers leave a deterministic trace: the sentinel records the known peers NOT opted
// in under `peersOmitted`, and the CLI prints a one-line stderr notice per omitted peer
// naming its stripped block — omission stays the opt-out, but never a silent one.
//
// OPT-IN HOOKS (spec 051, TASK-101). Besides the grounding block and peers, a host may opt
// into the hardened **root-guard PreToolUse hook** with `--hook root-guard`. Unlike the
// grounding block (marked text) and the peers (their own CLIs), this planting COPIES files
// into the host: BOTH `pdlc/hooks/root-guard-hook.mjs` AND its scanner
// `pdlc/hooks/shell-scan.mjs` (the hook imports `./shell-scan.mjs` — a planted hook missing
// its scanner is a broken hook) land in `<root>/.claude/hooks/`, and two `PreToolUse`
// entries are MERGED into `<root>/.claude/settings.json` (Bash → pre-bash;
// Write|Edit|NotebookEdit → pre-write), preserving any hooks already there. It is opt-in,
// **never default-on**: a hard blocker (exit 2) enforcing the root-read-only + worktree-only
// workflow doctrine is praxisflux's own convention, not universal — wiring it by default
// would break bootstrap's "safe to install anywhere" property (spec 051 Phase 1 decision
// #5). Absent `--hook`, nothing is copied or wired. The opt-in is recorded in the `.pdlc`
// sentinel's `hooks` array and re-presented as a default on update, exactly like the peers.
//
// The rendered PROJECT_NAME never blindly trusts basename(root) (the TASK-43 dogfood trap:
// planting from a worktree named task-43 bakes "# task-43 — …" into the block). Ladder:
// an explicit --name wins; else the name the `.pdlc` sentinel already records; else, when
// root is a git WORKTREE (.git is a `gitdir:` file), the PRIMARY checkout's basename; else
// basename(root). Once planted the name is sticky — a re-plant from a differently-named
// checkout of the same project is `unchanged`, never spuriously `drifted`; only --name
// changes it, and that change surfaces as honest drift (consent + --force).
//
//   node plant.mjs --root <dir> [--name <name>] [--peer backlog] [--peer spec-kit] [--peer jira] [--hook root-guard] [--check] [--force]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { copyFile, ensureGitignore, verifyPresent } from "../lib/installer.mjs";
import { render } from "../lib/template.mjs";
import { runAsCli } from "../lib/cli.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PEERS = ["backlog", "spec-kit", "jira"];
// Opt-in planted hooks (spec 051). Each names a copy-into-host artifact wired via the host's
// own .claude/settings.json — NOT a marked CLAUDE.md block and NOT a peer utility CLI.
export const HOOKS = ["root-guard"];
// The two files the root-guard hook needs in the host (the .mjs imports the scanner).
const ROOT_GUARD_FILES = ["root-guard-hook.mjs", "shell-scan.mjs"];
export const SENTINEL = ".pdlc";
// Local-only planting mode (spec 060). Always-on: every artifact pdlc's OWN plant creates
// or a peer init creates that the sweep touches regardless of which peer CLI is installed
// (specs/, docs/wiki/ — this repo hand-authors both with no spec-kit). Peer- and
// hook-conditional lines are added only for what was actually opted into (R2) — excluding a
// path the host's own team tracks would hide their files from their own `git status`.
const ALWAYS_ON_EXCLUDES = [
  "/.pdlc", "/CLAUDE.md", "/AGENTS.md", "/.handoff/", "/.worktrees/",
  "/specs/", "/docs/wiki/", "/.claude/agents/", "/.claude/model-tiers.json",
  "/.claude/commands/", "/.claude/skills/",
];

/** The scoped `.git/info/exclude` line set for `{ peers, hooks }` (spec 060 R2). */
export function excludeSet({ peers = [], hooks = [] } = {}) {
  const lines = [...ALWAYS_ON_EXCLUDES];
  if (peers.includes("backlog")) lines.push("/backlog/");
  if (peers.includes("spec-kit")) lines.push("/.specify/");
  if (hooks.includes("root-guard")) lines.push("/.claude/settings.json", "/.claude/hooks/");
  return lines;
}
const BEGIN = /^<!-- pdlc:grounding BEGIN\b.*$/m;
const END = "<!-- pdlc:grounding END -->";

/** Drop a peer's block (markers + content) from `text`; keep it when opted in. */
function stripPeerBlock(text, name) {
  const re = new RegExp(`\\n?<!-- pdlc:peer:${name} BEGIN -->[\\s\\S]*?<!-- pdlc:peer:${name} END -->\\n?`);
  return text.replace(re, "\n").replace(/\n{3,}/g, "\n\n");
}

/** The exact grounding block this plugin version would plant for `peers`. */
export function renderGrounding(templateText, { projectName, version, peers = [] }) {
  let out = render(templateText, { PROJECT_NAME: projectName, PDLC_VERSION: version });
  for (const p of PEERS) if (!peers.includes(p)) out = stripPeerBlock(out, p);
  return out.trim() + "\n";
}

/**
 * Resolve the PROJECT_NAME the grounding heading renders. Ladder: explicit override >
 * the name the `.pdlc` sentinel recorded at a previous plant > for a git worktree
 * (`.git` is a `gitdir:` pointer file), the PRIMARY checkout's basename — parsed from
 * the pointer's `…/.git/worktrees/<x>` shape — > basename(root) as the last fallback.
 */
export function resolveProjectName(root, { name, recorded } = {}) {
  if (name) return name;
  if (recorded) return recorded;
  try {
    const m = /^gitdir:\s*(.+?)\s*$/m.exec(readFileSync(join(root, ".git"), "utf8"));
    // …/.git/worktrees/<x> → the primary checkout is the directory holding .git.
    // A relative pointer resolves against the worktree root; non-worktree pointer
    // files (e.g. a submodule's …/.git/modules/<x>) fall through to basename.
    const wt = m && /^(.+?)[\\/]\.git[\\/]worktrees[\\/][^\\/]+$/.exec(resolve(root, m[1]));
    if (wt) return basename(wt[1]);
  } catch { /* .git is a directory (plain repo) or absent (non-git dir) */ }
  return basename(root);
}

/** Split a CLAUDE.md into { before, block, after }, or null when it has no pdlc markers. */
export function extractBlock(text) {
  const begin = text.match(BEGIN);
  const endAt = text.indexOf(END);
  if (!begin || endAt === -1) return null;
  const from = text.indexOf(begin[0]);
  const to = endAt + END.length;
  return { before: text.slice(0, from), block: text.slice(from, to).trim() + "\n", after: text.slice(to) };
}

// The two `PreToolUse` entries the root-guard hook wires into a host's .claude/settings.json.
// The command references the host copy via $CLAUDE_PROJECT_DIR (the same convention the repo's
// own Stop hook uses) — NOT ${CLAUDE_PLUGIN_ROOT}, which is unset in the host's own session.
export function rootGuardHookEntries() {
  const bin = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/root-guard-hook.mjs"';
  return [
    { matcher: "Bash", command: `${bin} pre-bash` },
    { matcher: "Write|Edit|NotebookEdit", command: `${bin} pre-write` },
  ];
}

/** Every command string already declared under settings.hooks.PreToolUse. */
function preToolUseCommands(settings) {
  return (settings?.hooks?.PreToolUse ?? []).flatMap((e) => (e?.hooks ?? []).map((h) => h?.command ?? ""));
}

/**
 * Is the root-guard hook FULLY wired in `root`? True iff both files are copied into
 * `.claude/hooks/` AND both PreToolUse commands are present in `.claude/settings.json`.
 */
function rootGuardWired(root) {
  const filesPresent = ROOT_GUARD_FILES.every((f) => existsSync(join(root, ".claude", "hooks", f)));
  if (!filesPresent) return false;
  const settingsPath = join(root, ".claude", "settings.json");
  if (!existsSync(settingsPath)) return false;
  let settings;
  try { settings = JSON.parse(readFileSync(settingsPath, "utf8")); } catch { return false; }
  const cmds = preToolUseCommands(settings);
  return rootGuardHookEntries().every(({ command }) => cmds.includes(command));
}

/**
 * Copy both hook files into `<root>/.claude/hooks/` and merge the two PreToolUse entries into
 * `<root>/.claude/settings.json`, preserving any hooks already there (idempotent — an entry
 * whose command is already present is not duplicated). Never called in --check mode.
 */
function wireRootGuard(root) {
  const srcDir = join(here, "..", "hooks");
  for (const f of ROOT_GUARD_FILES) copyFile(join(srcDir, f), join(root, ".claude", "hooks", f));

  const settingsPath = join(root, ".claude", "settings.json");
  let settings = {};
  if (existsSync(settingsPath)) {
    try { settings = JSON.parse(readFileSync(settingsPath, "utf8")); } catch { settings = {}; }
  }
  settings.hooks ??= {};
  settings.hooks.PreToolUse ??= [];
  const have = new Set(preToolUseCommands(settings));
  for (const { matcher, command } of rootGuardHookEntries()) {
    if (!have.has(command)) settings.hooks.PreToolUse.push({ matcher, hooks: [{ type: "command", command }] });
  }
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

/**
 * Plant (or report on, with check:true) the PDLC grounding in `root`.
 * Returns { mode, claudeMd, gitignore, pdlcFile, hooks, projectName, peersOmitted, missing } —
 * claudeMd is one of created | appended | replaced | unchanged | drifted; hooks is `absent`
 * (root-guard not opted in), `installed` (opted in and newly wired, or would be under --check),
 * or `unchanged` (opted in and already fully wired); projectName is the resolved heading name
 * (see resolveProjectName); peersOmitted lists the known peers not opted in at plant time
 * (their blocks were stripped from the rendered grounding).
 */
export function plant(root, { peers = [], hooks = [], check = false, force = false, templatePath, version, name } = {}) {
  root = resolve(root);
  templatePath ??= join(here, "..", "templates", "CLAUDE.md");
  version ??= JSON.parse(readFileSync(join(here, "..", ".claude-plugin", "plugin.json"), "utf8")).version;
  const unknown = peers.filter((p) => !PEERS.includes(p));
  if (unknown.length) throw new Error(`unknown peer(s): ${unknown.join(", ")} (known: ${PEERS.join(", ")})`);
  // Design invariant 2 (board-provider-seam.md): one board, singular. backlog and jira are
  // both "the board" — opting into both would leave two plans of record.
  if (peers.includes("backlog") && peers.includes("jira")) {
    throw new Error("peers backlog and jira are mutually exclusive — one board is the plan of record");
  }
  const unknownHooks = hooks.filter((h) => !HOOKS.includes(h));
  if (unknownHooks.length) throw new Error(`unknown hook(s): ${unknownHooks.join(", ")} (known: ${HOOKS.join(", ")})`);
  // The deterministic absent-peer trace: known peers not opted in, in KNOWN-peer order.
  const peersOmitted = PEERS.filter((p) => !peers.includes(p));

  const sentinelPath = join(root, SENTINEL);
  let existing = null;
  try { existing = JSON.parse(readFileSync(sentinelPath, "utf8")); } catch { /* absent or invalid */ }
  const projectName = resolveProjectName(root, { name, recorded: existing?.name });

  const expected = renderGrounding(readFileSync(templatePath, "utf8"), {
    projectName, version, peers,
  });
  const mode = existsSync(sentinelPath) ? "update" : "fresh";
  const claudePath = join(root, "CLAUDE.md");

  let claudeMd, nextClaude;
  if (!existsSync(claudePath)) {
    claudeMd = "created";
    nextClaude = expected;
  } else {
    const current = readFileSync(claudePath, "utf8");
    const found = extractBlock(current);
    if (!found) {
      claudeMd = "appended";
      nextClaude = current.replace(/\n*$/, "\n\n") + expected;
    } else if (found.block === expected) {
      claudeMd = "unchanged";
    } else if (!force) {
      claudeMd = "drifted"; // on-disk block ≠ what this version plants; caller must confirm + --force
    } else {
      claudeMd = "replaced";
      nextClaude = found.before + expected + found.after;
    }
  }
  if (!check && nextClaude !== undefined) writeFileSync(claudePath, nextClaude);

  const gitignore = check
    ? (readGitignoreHas(root, ".handoff/") ? "present" : "added")
    : ensureGitignore(root, ".handoff/") ? "added" : "present";

  // Opt-in root-guard hook: copy both files + merge the PreToolUse entries. `absent` when not
  // opted in; else `installed` (needs wiring — reported in --check, done for real otherwise)
  // or `unchanged` (already fully wired). Independent of the grounding block.
  let hooksReport = "absent";
  if (hooks.includes("root-guard")) {
    hooksReport = rootGuardWired(root) ? "unchanged" : "installed";
    if (!check && hooksReport === "installed") wireRootGuard(root);
  }

  const desired = { planted: "pdlc:bootstrap", version, name: projectName, peers: [...peers].sort(), peersOmitted, hooks: [...hooks].sort() };
  // peersOmitted is derived from peers, so comparing version + peers + name + hooks is enough
  // — and tolerating an absent field keeps legacy sentinels (written before `peersOmitted`,
  // `name`, or `hooks` existed) "unchanged" instead of churning them just to gain the field.
  const same = existing && existing.version === desired.version &&
    JSON.stringify([...(existing.peers || [])].sort()) === JSON.stringify(desired.peers) &&
    (existing.name === undefined || existing.name === desired.name) &&
    (existing.hooks === undefined || JSON.stringify([...existing.hooks].sort()) === JSON.stringify(desired.hooks));
  // A drifted, unconfirmed block means nothing was planted — don't advance the sentinel past it.
  const pdlcFile = claudeMd === "drifted" ? (existing ? "unchanged" : "skipped")
    : same ? "unchanged" : existing ? "updated" : "written";
  if (!check && !same && claudeMd !== "drifted") {
    writeFileSync(sentinelPath, JSON.stringify({ ...desired, plantedAt: new Date().toISOString() }, null, 2) + "\n");
  }

  const missing = check ? [] : verifyPresent(root, ["CLAUDE.md", SENTINEL, ".gitignore"]);
  return { mode, claudeMd, gitignore, pdlcFile, hooks: hooksReport, projectName, peersOmitted, missing };
}

function readGitignoreHas(root, entry) {
  const p = join(root, ".gitignore");
  if (!existsSync(p)) return false;
  return readFileSync(p, "utf8").split("\n").some((l) => l.trim() === entry);
}

if (runAsCli(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
  const root = opt("--root");
  if (!root) { console.error("usage: plant.mjs --root <dir> [--name <name>] [--peer backlog] [--peer spec-kit] [--peer jira] [--hook root-guard] [--check] [--force]"); process.exit(2); }
  const peers = args.flatMap((a, i) => (a === "--peer" ? [args[i + 1]] : []));
  const hooks = args.flatMap((a, i) => (a === "--hook" ? [args[i + 1]] : []));
  const check = args.includes("--check");
  const report = plant(root, { peers, hooks, check, force: args.includes("--force"), name: opt("--name") });
  for (const p of report.peersOmitted) {
    console.error(`plant: peer "${p}" omitted — pdlc:peer:${p} block stripped (recorded in ${SENTINEL} peersOmitted)`);
  }
  console.log(JSON.stringify(report, null, 2));
  const pending = report.claudeMd !== "unchanged" || report.pdlcFile !== "unchanged"
    || report.gitignore !== "present" || report.hooks === "installed";
  if (check && pending) process.exit(1); // --check: nonzero when planting would change something
  if (report.missing.length) process.exit(1);
}
