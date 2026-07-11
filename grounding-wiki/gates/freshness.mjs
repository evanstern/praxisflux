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

/* ── plan: classify stale notes into computed re-pins vs review work ───── */

// The ONE provably-safe diff class. A changed line is a lockstep version stamp when it is a
// version key ("version": "1.2.3" / version: 1.2.3) or an npm-style pin (@scope/name@1.2.3).
const STAMP_LINE = /(["']?version["']?\s*[:=]\s*["']?\d+\.\d+\.\d+)|(@[\w.-]+\/[\w.-]+@\d+\.\d+\.\d+)/;
const SEMVER = /\d+\.\d+\.\d+/;

/**
 * Pure classifier. `changedLines` are the +/- content lines of the diff over a note's
 * sources since its pin; `noteBody` is the note's full text. RE-PIN-ONLY iff every changed
 * line is a version stamp AND the note quotes no semver literal anywhere (a note that names
 * versions may claim the very number that just changed). Anything else — including an empty
 * diff we couldn't read — defaults to NEEDS-REVIEW: a pin is a verification claim, and the
 * planner must never make one it can't prove.
 */
export function classifyNote(changedLines, noteBody) {
  if (!changedLines.length) return { cls: "REVIEW", reason: "diff could not be read — verify by hand" };
  if (!changedLines.every((l) => STAMP_LINE.test(l)))
    return { cls: "REVIEW", reason: "sources changed beyond version stamps — re-verify the prose against the diff" };
  // Raw body, deliberately: notes quote versions in backticks (`0.6.3`), which stripCode
  // would hide — and hiding them would flip the classification in the UNSAFE direction.
  if (SEMVER.test(String(noteBody ?? "")))
    return { cls: "REVIEW", reason: "stamp-only diff, but the note quotes version literals — update them, then re-pin" };
  return { cls: "REPIN", reason: "version stamps only, and the note quotes no versions" };
}

/**
 * Plan the reconciliation of a stale corpus: for each stale note, the diff summary since its
 * pin and a classification. Read-only (gates/ contract) — the CLI prints, the wiki-update
 * skill executes. Returns { head, entries, problems }; a fresh corpus yields entries: [].
 * Notes that fail structurally (no pin, unknown pin) land in `problems` — plan doesn't
 * paper over what the freshness gate would reject.
 */
export function planFreshness(repoRoot, corpusDir = "docs/wiki") {
  const entries = [];
  const problems = [];
  const dir = isAbsolute(corpusDir) ? corpusDir : join(repoRoot, corpusDir);
  if (!existsSync(join(dir, "INDEX.md"))) return { head: "", entries, problems: [`not a corpus: ${join(dir, "INDEX.md")} missing`] };
  const head = git(repoRoot, ["rev-parse", "HEAD"]);

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "INDEX.md").sort()) {
    const rel = `${corpusDir}/${file}`;
    const text = readFileSync(join(dir, file), "utf8");
    const pin = parseFrontmatter(text)?.verified_against;
    if (!pin) { problems.push(`${rel}: no verified_against pin`); continue; }
    try { git(repoRoot, ["cat-file", "-e", `${pin}^{commit}`]); }
    catch { problems.push(`${rel}: pin ${pin} is not a known commit`); continue; }
    const sources = parseSourcesBlock(text);
    if (!sources.length) continue; // unverifiable — the freshness gate already warns

    const log = git(repoRoot, ["log", "--oneline", `${pin}..HEAD`, "--", ...sources]);
    if (!log) continue; // fresh
    const commits = log.split("\n").length;
    const files = git(repoRoot, ["diff", "--numstat", `${pin}..HEAD`, "--", ...sources])
      .split("\n").filter(Boolean)
      .map((l) => { const [plus, minus, path] = l.split("\t"); return { path, plus: +plus || 0, minus: +minus || 0 }; });
    const changedLines = git(repoRoot, ["diff", "-U0", `${pin}..HEAD`, "--", ...sources])
      .split("\n")
      .filter((l) => (/^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)))
      .map((l) => l.slice(1))
      .filter((l) => l.trim() !== "");
    entries.push({ note: rel, absPath: join(dir, file), pin, head, commits, files, ...classifyNote(changedLines, text) });
  }
  return { head, entries, problems };
}
