// markdown.mjs — the small slice of Markdown/YAML/wikilink parsing the gates need.
//
// Ported from the research gates' Python (verify_branch/verify_analysis). Deliberately
// minimal: inline `key: value` and inline `[key]` arrays in frontmatter, code-span
// stripping, and Obsidian `[[wikilink]]` extraction. Zero-dependency.

const FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`]*`/g;
const LINK_RE = /\[\[([^\]]+)\]\]/g;

const unquote = (s) => s.replace(/^["']|["']$/g, "");

/** Remove fenced and inline code so links inside code spans are ignored. */
export function stripCode(text) {
  return (text || "").replace(FENCE_RE, "").replace(INLINE_CODE_RE, "");
}

/**
 * Parse a leading `---` YAML frontmatter block into a flat object, or null if the
 * file has no block (i.e. it is not a vault note). Values that look like `[a, b]`
 * become arrays; everything else is an unquoted string. `type` is lowercased.
 */
export function parseFrontmatter(text) {
  if (!text) return null;
  const t = text.replace(/^﻿/, "").replace(/^\s+/, "");
  if (!t.startsWith("---")) return null;
  const m = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(t);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      fm[key] = val.slice(1, -1).split(",").map((s) => unquote(s.trim())).filter(Boolean);
    } else {
      fm[key] = unquote(val);
    }
  }
  if (typeof fm.type === "string") fm.type = fm.type.toLowerCase();
  return fm;
}

/** Reduce a raw wikilink body to its target note name (drop `|alias`, `#head`, `^block`). */
export function linkTarget(raw) {
  return raw.split("|")[0].split("#")[0].split("^")[0].trim();
}

/** Every wikilink target in `text`, ignoring links inside code spans. */
export function extractWikilinks(text) {
  const stripped = stripCode(text);
  const out = [];
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(stripped)) !== null) out.push(linkTarget(m[1]));
  return out;
}

/** The set of names a note answers to: its filename stem, title, and aliases (lowercased). */
export function namesFor(basenameNoExt, fm) {
  const names = new Set([basenameNoExt.toLowerCase()]);
  if (fm) {
    if (fm.title) names.add(String(fm.title).toLowerCase());
    for (const a of fm.aliases || []) names.add(String(a).toLowerCase());
  }
  return names;
}

/**
 * Partition wikilink targets into those that resolve against `knownNames` (a Set of
 * lowercased names) and those that do not (cross-branch or broken).
 */
export function resolveLinks(targets, knownNames) {
  const resolved = [], unresolved = [];
  for (const t of targets) {
    if (!t) continue;
    (knownNames.has(t.toLowerCase()) ? resolved : unresolved).push(t);
  }
  return { resolved, unresolved };
}
