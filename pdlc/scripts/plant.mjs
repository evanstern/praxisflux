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
//   node plant.mjs --root <dir> [--peer backlog] [--peer spec-kit] [--check] [--force]
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
 * Returns { mode, claudeMd, gitignore, pdlcFile, missing } — claudeMd is one of
 * created | appended | replaced | unchanged | drifted.
 */
export function plant(root, { peers = [], check = false, force = false, templatePath, version } = {}) {
  root = resolve(root);
  templatePath ??= join(here, "..", "templates", "CLAUDE.md");
  version ??= JSON.parse(readFileSync(join(here, "..", ".claude-plugin", "plugin.json"), "utf8")).version;
  const unknown = peers.filter((p) => !PEERS.includes(p));
  if (unknown.length) throw new Error(`unknown peer(s): ${unknown.join(", ")} (known: ${PEERS.join(", ")})`);

  const expected = renderGrounding(readFileSync(templatePath, "utf8"), {
    projectName: basename(root), version, peers,
  });
  const mode = existsSync(join(root, SENTINEL)) ? "update" : "fresh";
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

  const sentinelPath = join(root, SENTINEL);
  const desired = { planted: "pdlc:bootstrap", version, peers: [...peers].sort() };
  let existing = null;
  try { existing = JSON.parse(readFileSync(sentinelPath, "utf8")); } catch { /* absent or invalid */ }
  const same = existing && existing.version === desired.version &&
    JSON.stringify([...(existing.peers || [])].sort()) === JSON.stringify(desired.peers);
  // A drifted, unconfirmed block means nothing was planted — don't advance the sentinel past it.
  const pdlcFile = claudeMd === "drifted" ? (existing ? "unchanged" : "skipped")
    : same ? "unchanged" : existing ? "updated" : "written";
  if (!check && !same && claudeMd !== "drifted") {
    writeFileSync(sentinelPath, JSON.stringify({ ...desired, plantedAt: new Date().toISOString() }, null, 2) + "\n");
  }

  const missing = check ? [] : verifyPresent(root, ["CLAUDE.md", SENTINEL, ".gitignore"]);
  return { mode, claudeMd, gitignore, pdlcFile, missing };
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
  if (!root) { console.error("usage: plant.mjs --root <dir> [--peer backlog] [--peer spec-kit] [--check] [--force]"); process.exit(2); }
  const peers = args.flatMap((a, i) => (a === "--peer" ? [args[i + 1]] : []));
  const check = args.includes("--check");
  const report = plant(root, { peers, check, force: args.includes("--force") });
  console.log(JSON.stringify(report, null, 2));
  const pending = report.claudeMd !== "unchanged" || report.pdlcFile !== "unchanged" || report.gitignore !== "present";
  if (check && pending) process.exit(1); // --check: nonzero when planting would change something
  if (report.missing.length) process.exit(1);
}
