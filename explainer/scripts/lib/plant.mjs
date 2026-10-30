// plant.mjs — plant (or refresh) explainer's marked block in a host project's AGENTS.md, with a
// thin `@AGENTS.md` pointer kept in CLAUDE.md (the same split pdlc's own planter uses, spec 074:
// AGENTS.md is load-bearing for every harness, CLAUDE.md just imports it for Claude Code). The
// block is created when AGENTS.md is absent, appended when it has no block, replaced between the
// markers when it does (a version bump or a hand edit alike); text outside the markers is never
// touched. A legacy block still resident in CLAUDE.md (pre-074) is a different case — it is
// reported as drift and migrated into AGENTS.md only under `--force`, never silently.
import fs from "node:fs";
import path from "node:path";

import { render } from "../../lib/template.mjs";

const BEGIN = /<!-- explainer BEGIN\b[^\n]*-->/;
const END = "<!-- explainer END -->";
// Load-bearing content of the host's CLAUDE.md: Claude Code expands this import, so a Claude
// Code session reads the exact same block bytes AGENTS.md carries.
export const POINTER = "@AGENTS.md";

/** Split `text` into { before, block, after } around the marked block, or null if absent. */
function extractBlock(text) {
  const begin = text.match(BEGIN);
  const endAt = text.indexOf(END);
  if (!begin || endAt === -1) return null;
  const from = begin.index;
  const to = endAt + END.length;
  return { before: text.slice(0, from), block: text.slice(from, to).trim() + "\n", after: text.slice(to) };
}

/**
 * Plant the block into `<root>/AGENTS.md` and ensure `<root>/CLAUDE.md`'s pointer.
 * Returns `{ agentsMd, claudeMd }`: `agentsMd` is one of
 * created | appended | replaced | unchanged | drifted; `claudeMd` is one of
 * created | pointer-added | unchanged | migrated | drifted. `--check` writes nothing.
 */
export function plant({ root, pluginRoot, check = false, force = false }) {
  const version = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8")).version;
  const block = render(fs.readFileSync(path.join(pluginRoot, "templates", "AGENTS.md"), "utf8"), { EXPLAINER_VERSION: version }).trim() + "\n";
  const agentsPath = path.join(root, "AGENTS.md");
  const claudePath = path.join(root, "CLAUDE.md");

  // A legacy (pre-074) host carries the block in CLAUDE.md itself — detect it so the migration
  // path (honest drift, --force to move it) can fire.
  const claudeCurrent = fs.existsSync(claudePath) ? fs.readFileSync(claudePath, "utf8") : null;
  const legacyBlock = claudeCurrent ? extractBlock(claudeCurrent) : null;

  const agentsCurrent = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, "utf8") : null;
  const agentsFound = agentsCurrent ? extractBlock(agentsCurrent) : null;

  let agentsMd, nextAgents;
  if (legacyBlock && !agentsFound) {
    // Migration is one act covering both files — nothing lands in AGENTS.md until --force.
    if (!force) {
      agentsMd = "drifted";
    } else {
      agentsMd = agentsCurrent ? "appended" : "created";
      nextAgents = agentsCurrent ? `${agentsCurrent.replace(/\n*$/, "\n\n")}${block}` : block;
    }
  } else if (!agentsCurrent) {
    agentsMd = "created";
    nextAgents = block;
  } else if (!agentsFound) {
    agentsMd = "appended";
    nextAgents = `${agentsCurrent.replace(/\n*$/, "\n\n")}${block}`;
  } else if (agentsFound.block === block) {
    agentsMd = "unchanged";
  } else {
    // An ordinary refresh (e.g. a version bump, or a hand-edited block) — replaced
    // unconditionally, same as before this file had a migration to gate. Only the
    // CLAUDE.md-resident legacy block (above) needs --force consent.
    agentsMd = "replaced";
    nextAgents = agentsFound.before + block + agentsFound.after;
  }
  if (!check && nextAgents !== undefined) fs.writeFileSync(agentsPath, nextAgents);

  let claudeMd, nextClaude;
  if (legacyBlock) {
    if (!force) {
      claudeMd = "drifted"; // migration needs consent; nothing written to either file
    } else {
      claudeMd = "migrated";
      // Project text around the old block stays in CLAUDE.md, below the pointer.
      const before = legacyBlock.before.replace(/\n*$/, "");
      const after = legacyBlock.after.replace(/^\n*/, "");
      const rest = [before, after].filter(Boolean).join("\n\n");
      nextClaude = rest ? `${POINTER}\n\n${rest}\n` : `${POINTER}\n`;
    }
  } else if (!claudeCurrent) {
    claudeMd = "created";
    nextClaude = `${POINTER}\n`;
  } else if (claudeCurrent.split("\n", 1)[0] === POINTER) {
    claudeMd = "unchanged";
  } else {
    claudeMd = "pointer-added"; // project content survives untouched, below the new first line
    nextClaude = `${POINTER}\n\n${claudeCurrent}`;
  }
  if (!check && nextClaude !== undefined) fs.writeFileSync(claudePath, nextClaude);

  return { agentsMd, claudeMd };
}
