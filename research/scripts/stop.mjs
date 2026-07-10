#!/usr/bin/env node
// stop.mjs — research's Stop-hook entry, on the shared gate-runner.
//
// The research pipeline's branch/analysis gates are phase gates the skills run at their own
// boundaries (a half-built branch mid-research is normal, so those must NOT block every Stop).
// The one research invariant that should always hold — and is cheap and binary — is that any
// RENDERED page in a vault is self-contained (the Artifact CSP blocks external loads). So this
// Stop gate refuses to finish while any *.html inside a detected vault fails self-containment.
//
// Vaults are drop-anywhere: detected by a `.research-vault` sentinel at the vault root. The
// gate-runner honors stop_hook_active and is a no-op when no vault is in scope. educate ships
// its own Stop hook, so a tree that is both an educate project and holds vaults is gated by both.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { runStopHook } from "../lib/gate-runner.mjs";
import { hasChild, findRootsDownwards } from "../lib/project-root.mjs";
import { validateArtifact } from "../gates/artifact.mjs";

const SENTINEL = ".research-vault";

function htmlFilesUnder(dir, acc = [], depth = 0) {
  if (depth > 8) return acc;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFilesUnder(p, acc, depth + 1);
    else if (e.name.toLowerCase().endsWith(".html")) acc.push(p);
  }
  return acc;
}

const researchGate = {
  name: "research",
  resolveRoots: (startDir) => findRootsDownwards(startDir, hasChild(SENTINEL)),
  check: (vaultRoot) => {
    const problems = [];
    for (const html of htmlFilesUnder(vaultRoot)) {
      const { ok, fails } = validateArtifact(html);
      if (!ok) for (const f of fails) problems.push(`${html}: ${f}`);
    }
    return problems;
  },
};

runStopHook({ gates: [researchGate] });
