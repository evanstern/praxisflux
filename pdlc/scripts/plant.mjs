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
// The rendered PROJECT_NAME never blindly trusts basename(root) (the TASK-43 dogfood trap:
// planting from a worktree named task-43 bakes "# task-43 — …" into the block). Ladder:
// an explicit --name wins; else the name the `.pdlc` sentinel already records; else, when
// root is a git WORKTREE (.git is a `gitdir:` file), the PRIMARY checkout's basename; else
// basename(root). Once planted the name is sticky — a re-plant from a differently-named
// checkout of the same project is `unchanged`, never spuriously `drifted`; only --name
// changes it, and that change surfaces as honest drift (consent + --force).
//
//   node plant.mjs --root <dir> [--name <name>] [--peer backlog] [--peer spec-kit] [--check] [--force]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureGitignore, verifyPresent } from "../lib/installer.mjs";
import { render } from "../lib/template.mjs";
import { runAsCli } from "../lib/cli.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PEERS = ["backlog", "spec-kit"];
export const SENTINEL = ".pdlc";
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

/**
 * Plant (or report on, with check:true) the PDLC grounding in `root`.
 * Returns { mode, claudeMd, gitignore, pdlcFile, projectName, peersOmitted, missing } —
 * claudeMd is one of created | appended | replaced | unchanged | drifted; projectName is
 * the resolved heading name (see resolveProjectName); peersOmitted lists the known peers
 * not opted in at plant time (their blocks were stripped from the rendered grounding).
 */
export function plant(root, { peers = [], check = false, force = false, templatePath, version, name } = {}) {
  root = resolve(root);
  templatePath ??= join(here, "..", "templates", "CLAUDE.md");
  version ??= JSON.parse(readFileSync(join(here, "..", ".claude-plugin", "plugin.json"), "utf8")).version;
  const unknown = peers.filter((p) => !PEERS.includes(p));
  if (unknown.length) throw new Error(`unknown peer(s): ${unknown.join(", ")} (known: ${PEERS.join(", ")})`);
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

  const desired = { planted: "pdlc:bootstrap", version, name: projectName, peers: [...peers].sort(), peersOmitted };
  // peersOmitted is derived from peers, so comparing version + peers + name is enough — and
  // tolerating an absent field keeps legacy sentinels (written before `peersOmitted` or
  // `name` existed) "unchanged" instead of churning them just to gain the field.
  const same = existing && existing.version === desired.version &&
    JSON.stringify([...(existing.peers || [])].sort()) === JSON.stringify(desired.peers) &&
    (existing.name === undefined || existing.name === desired.name);
  // A drifted, unconfirmed block means nothing was planted — don't advance the sentinel past it.
  const pdlcFile = claudeMd === "drifted" ? (existing ? "unchanged" : "skipped")
    : same ? "unchanged" : existing ? "updated" : "written";
  if (!check && !same && claudeMd !== "drifted") {
    writeFileSync(sentinelPath, JSON.stringify({ ...desired, plantedAt: new Date().toISOString() }, null, 2) + "\n");
  }

  const missing = check ? [] : verifyPresent(root, ["CLAUDE.md", SENTINEL, ".gitignore"]);
  return { mode, claudeMd, gitignore, pdlcFile, projectName, peersOmitted, missing };
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
  if (!root) { console.error("usage: plant.mjs --root <dir> [--name <name>] [--peer backlog] [--peer spec-kit] [--check] [--force]"); process.exit(2); }
  const peers = args.flatMap((a, i) => (a === "--peer" ? [args[i + 1]] : []));
  const check = args.includes("--check");
  const report = plant(root, { peers, check, force: args.includes("--force"), name: opt("--name") });
  for (const p of report.peersOmitted) {
    console.error(`plant: peer "${p}" omitted — pdlc:peer:${p} block stripped (recorded in ${SENTINEL} peersOmitted)`);
  }
  console.log(JSON.stringify(report, null, 2));
  const pending = report.claudeMd !== "unchanged" || report.pdlcFile !== "unchanged" || report.gitignore !== "present";
  if (check && pending) process.exit(1); // --check: nonzero when planting would change something
  if (report.missing.length) process.exit(1);
}
