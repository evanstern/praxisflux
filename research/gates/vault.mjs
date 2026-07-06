// vault.mjs — shared note-loading for the research gates. Built on the lib/ chassis.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { parseFrontmatter, namesFor } from "../../lib/markdown.mjs";

export const KNOWN_TYPES = new Set(["moc", "note", "source", "analysis"]);

export function read(path) {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

/** All .md paths directly in a branch dir, sorted. */
export function branchNotes(bdir) {
  return readdirSync(bdir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort()
    .map((f) => join(bdir, f));
}

/** Load a branch's notes: raw text + parsed frontmatter; vaultNotes = those with frontmatter. */
export function loadNotes(bdir) {
  const notes = branchNotes(bdir);
  const texts = {}, fms = {};
  for (const p of notes) { texts[p] = read(p); fms[p] = parseFrontmatter(texts[p]); }
  const vaultNotes = notes.filter((p) => fms[p] !== null);
  return { notes, texts, fms, vaultNotes };
}

/** The set of lowercased names valid as in-branch link targets (branch + every note's names). */
export function localNames(branch, vaultNotes, fms) {
  const names = new Set([branch.toLowerCase()]);
  for (const p of vaultNotes) {
    for (const n of namesFor(basename(p, extname(p)), fms[p])) names.add(n);
  }
  return names;
}

/** Top-level branch folders in a vault (skip _-/.- prefixed: scaffolding & hidden). */
export function listBranches(root) {
  return readdirSync(root)
    .filter((d) => !d.startsWith("_") && !d.startsWith(".") && statSync(join(root, d)).isDirectory())
    .sort();
}
