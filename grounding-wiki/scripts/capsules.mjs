#!/usr/bin/env node
// capsules.mjs — the ONE writer for the capsule tier: (re)generate a corpus's CAPSULES.md.
//
//   node capsules.mjs <repo-root> [corpus-dir]      (corpus-dir defaults to docs/wiki)
//
// Renders through gates/capsules.mjs (gates stay read-only; this is the wiki analogue of
// repin.mjs), so the freshness gate's regenerate-and-compare check and this command can
// never disagree about what CAPSULES.md must contain. CAPSULES.md is derived state
// (docs/corpus-spec.md v2): run this whenever any note's `description:` changes — the
// wiki-build and wiki-update skills do it as part of every pass.
import { writeFileSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { runAsCli } from "../lib/cli.mjs";
import { renderCapsules } from "../gates/capsules.mjs";

/** Render and write <corpus-dir>/CAPSULES.md. Returns the path written. */
export function writeCapsules(repoRoot, corpusDir = "docs/wiki", opts = {}) {
  const content = renderCapsules(repoRoot, corpusDir, opts);
  const path = join(isAbsolute(corpusDir) ? corpusDir : join(repoRoot, corpusDir), "CAPSULES.md");
  writeFileSync(path, content);
  return path;
}

if (runAsCli(import.meta.url)) {
  const [root, corpusDir] = process.argv.slice(2);
  if (!root) { console.error("usage: capsules.mjs <repo-root> [corpus-dir]"); process.exit(2); }
  try {
    console.log(`regenerated ${writeCapsules(root, corpusDir || "docs/wiki")}`);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
