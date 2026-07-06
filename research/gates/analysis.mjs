// analysis.mjs — GATE: does a grounded type:analysis note exist over a branch?
// Node port of verify_analysis.py, built on the lib/ chassis.
import { join, relative } from "node:path";
import { extractWikilinks } from "../../lib/markdown.mjs";
import { loadNotes, localNames } from "./vault.mjs";

const BASIS_RE = /^#{2,}\s*(basis|grounding|evidence|sources)\b/im;

/** Validate the analysis layer of a branch → { fails, warns, count }. */
export function validateAnalysis(root, branch) {
  const bdir = join(root, branch);
  const { texts, fms, vaultNotes } = loadNotes(bdir);
  const analyses = vaultNotes.filter((p) => fms[p].type === "analysis");
  if (analyses.length === 0) {
    return {
      fails: [`branch '${branch}' has no note with type: analysis. Run the analyze phase first — the artifact phase renders an analysis's argument, so one must exist.`],
      warns: [], count: 0,
    };
  }
  const names = localNames(branch, vaultNotes, fms);
  const fails = [];
  for (const p of analyses) {
    const rel = relative(root, p);
    const fm = fms[p], text = texts[p] || "";
    if (!fm.title) fails.push(`${rel}: analysis missing 'title'`);
    const links = extractWikilinks(text);
    const citesCorpus = links.some((t) => t.toLowerCase().startsWith("_grounding") || names.has(t.toLowerCase()));
    if (!(citesCorpus || BASIS_RE.test(text))) {
      fails.push(`${rel}: analysis does not cite the branch — link [[_grounding]] or a note, or add a '## Basis' section. An analysis must rest on the corpus.`);
    }
    for (const t of links) {
      if (t && !names.has(t.toLowerCase())) {
        fails.push(`${rel}: [[${t}]] does not resolve inside branch '${branch}' (cross-branch or broken link)`);
      }
    }
  }
  return { fails, warns: [], count: analyses.length };
}
