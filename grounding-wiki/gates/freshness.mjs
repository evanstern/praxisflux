// freshness.mjs — read-only staleness check for a code-grounded corpus (docs/corpus-spec.md).
//
// A note is STALE when any path in its `sources:` frontmatter changed after its
// `verified_against:` pin. Verified with git plumbing against the repo the corpus lives in.
// Never writes to disk (gates/ contract).
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, isAbsolute, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { parseFrontmatter, stripCode, extractWikilinks } from "../lib/markdown.mjs";

function git(repoRoot, args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

/**
 * Parse a `sources:` block list from raw frontmatter text. lib/markdown.mjs handles only
 * inline `[a, b]` arrays; corpus notes use YAML block lists for readability.
 */
export function parseSourcesBlock(text) {
  const m = /^---\s*\n([\s\S]*?)\n---/.exec((text || "").replace(/^﻿/, "").replace(/^\s+/, ""));
  if (!m) return [];
  const out = [];
  let inBlock = false;
  for (const line of m[1].split("\n")) {
    if (/^sources:\s*$/.test(line)) { inBlock = true; continue; }
    if (!inBlock) continue;
    const item = /^\s+-\s+(.+)$/.exec(line);
    if (item) { out.push(item[1].trim()); continue; }
    if (!/^\s/.test(line)) inBlock = false;
  }
  return out;
}

/**
 * Check every note in a corpus for staleness against the repo's git history.
 * corpusDir is relative to repoRoot unless absolute. Returns { fails, warns, checked };
 * fails non-empty ⇒ the corpus is stale (or malformed) and the gate should block.
 */
export function validateFreshness(repoRoot, corpusDir = "docs/wiki") {
  const fails = [];
  const warns = [];
  const dir = isAbsolute(corpusDir) ? corpusDir : join(repoRoot, corpusDir);

  if (!existsSync(join(dir, "INDEX.md"))) {
    return { fails: [`not a corpus: ${join(dir, "INDEX.md")} missing`], warns, checked: 0 };
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "INDEX.md").sort();
  const names = new Set(files.map((f) => basename(f, ".md")));
  let checked = 0;

  for (const file of files) {
    const rel = `${corpusDir}/${file}`;
    const text = readFileSync(join(dir, file), "utf8");
    const fm = parseFrontmatter(text);
    checked++;

    if (!fm) { fails.push(`${rel}: no frontmatter — not a corpus note`); continue; }

    const pin = fm.verified_against;
    if (!pin) { fails.push(`${rel}: no verified_against pin`); continue; }
    try {
      git(repoRoot, ["cat-file", "-e", `${pin}^{commit}`]);
    } catch {
      fails.push(`${rel}: pin ${pin} is not a known commit`);
      continue;
    }

    const sources = parseSourcesBlock(text);
    if (sources.length === 0) {
      warns.push(`${rel}: no sources listed — staleness is unverifiable`);
    } else {
      let changed = "";
      try {
        changed = git(repoRoot, ["log", "--oneline", `${pin}..HEAD`, "--", ...sources]);
      } catch (e) {
        fails.push(`${rel}: git log failed for its sources (${String(e).split("\n")[0]})`);
        continue;
      }
      if (changed) {
        const lines = changed.split("\n");
        fails.push(`${rel}: STALE — sources changed since ${pin.slice(0, 12)} (${lines.length} commit(s), e.g. ${lines[0]})`);
      }
    }

    for (const link of extractWikilinks(stripCode(text))) {
      if (!names.has(link)) warns.push(`${rel}: [[${link}]] does not resolve to a sibling note`);
    }
  }

  return { fails, warns, checked };
}
