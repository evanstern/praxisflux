// branch.mjs — GATE: is a topic branch a well-formed, analyzable wiki?
// Node port of verify_branch.py, built on the lib/ chassis.
import { join, basename, relative } from "node:path";
import { extractWikilinks } from "../lib/markdown.mjs";
import { loadNotes, localNames, listBranches, KNOWN_TYPES } from "./vault.mjs";

/** Validate one branch → { fails: string[], warns: string[] }. */
export function validateBranch(root, branch) {
  const bdir = join(root, branch);
  const { notes, texts, fms, vaultNotes } = loadNotes(bdir);
  const fails = [], warns = [];
  const rel = (p) => relative(root, p);

  // 1. MOC named after the folder
  const moc = join(bdir, branch + ".md");
  if (!(moc in fms) || fms[moc] === null) {
    fails.push(`[${branch}] missing MOC '${branch}.md' (the branch entry note)`);
  } else if (fms[moc].type !== "moc") {
    fails.push(`[${branch}] '${branch}.md' must have type: moc (found ${JSON.stringify(fms[moc].type)})`);
  }

  // 2. grounding file present
  const hasGrounding = notes.some(
    (p) => basename(p).toLowerCase().startsWith("_grounding") && fms[p] && fms[p].type === "source",
  );
  if (!hasGrounding) {
    fails.push(`[${branch}] no grounding file (_grounding.md, type: source) — a branch is not analyzable without its source-of-truth layer`);
  }

  // 3. frontmatter sanity
  for (const p of vaultNotes) {
    const fm = fms[p];
    if (!fm.title) fails.push(`[${branch}] ${rel(p)}: missing 'title' in frontmatter`);
    if (!KNOWN_TYPES.has(fm.type)) {
      fails.push(`[${branch}] ${rel(p)}: type ${JSON.stringify(fm.type)} not one of ${[...KNOWN_TYPES].sort().join(", ")}`);
    }
  }

  // 4. isolation + broken links (only within-branch names resolve)
  const names = localNames(branch, vaultNotes, fms);
  for (const p of vaultNotes) {
    for (const tgt of extractWikilinks(texts[p] || "")) {
      if (tgt && !names.has(tgt.toLowerCase())) {
        fails.push(`[${branch}] ${rel(p)}: [[${tgt}]] does not resolve inside this branch (cross-branch link or broken link)`);
      }
    }
  }

  // 5. orphan warning: non-MOC notes nobody links to
  const linked = new Set();
  for (const p of vaultNotes) for (const tgt of extractWikilinks(texts[p] || "")) linked.add(tgt.toLowerCase());
  for (const p of vaultNotes) {
    const base = basename(p);
    if (base === branch + ".md") continue;
    const stem = base.replace(/\.md$/i, "").toLowerCase();
    if (!linked.has(stem) && stem !== branch.toLowerCase()) {
      warns.push(`[${branch}] ${rel(p)} is not linked from any note (orphan?) — list it in the MOC`);
    }
  }

  return { fails, warns };
}

/** Validate a whole vault, or a single branch when `only` is given. */
export function validateVault(root, only) {
  const all = listBranches(root);
  if (only && !all.includes(only)) return { fails: [`branch '${only}' not found in ${root}`], warns: [], count: 0 };
  const branches = only ? [only] : all;
  const fails = [], warns = [];
  for (const b of branches) {
    const r = validateBranch(root, b);
    fails.push(...r.fails);
    warns.push(...r.warns);
  }
  return { fails, warns, count: branches.length };
}
