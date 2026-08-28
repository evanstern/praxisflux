// repin-window.mjs — is a stale note stale *because of unmerged work on this branch*?
//
// Freshness is arithmetic: a note is STALE when `git log <pin>..HEAD -- <sources>` is
// non-empty (./freshness.mjs). That answer is correct but incomplete for deciding whether to
// BLOCK: mid-task, staleness is red **by construction**. Doctrine sequences the re-pin AFTER
// the commit that touched the sources (read the diff the pin covers, then bump — the honest
// re-pins rule), so between those two commits a stale note is the expected state, not neglect.
//
// This module draws that line, and only that line. It answers ONE question per note:
//
//     Are the commits that stale this note themselves unmerged?
//
//   inside the window  — yes: unmerged work on this branch stales it; the re-pin is legitimately
//                        owed later (before the PR). A caller may downgrade blocking to a notice.
//   outside the window — no: the staleness is explained by something already on the base branch,
//                        or by nothing at all. That is neglect, and callers block as before.
//
// It does NOT decide what to do about the answer — stop-docs.mjs and (later) TASK-105's
// sign-off gate own that. Read-only, like everything in gates/: no writes, ever.
//
// WHY THE OBVIOUS TEST IS WRONG (do not "simplify" to it). The tempting definition is
// "the branch has commits not on origin/main" — i.e. treat any non-base checkout as mid-task.
// It fails on this very repo: under the two-track landing rule, board/bookkeeping commits land
// directly on `main`, so a local `main` routinely sits AHEAD of `origin/main` (2 commits ahead
// when this was written). Under that test `main` itself reads as "mid-task" and the window
// opens exactly where it must stay shut. The per-note form below cannot make that mistake: it
// asks which commits stale THIS note, not where HEAD happens to be.
//
// FAIL CLOSED. Every unknown resolves to OUTSIDE the window (block). No base ref, no git, an
// unreadable note — none of them open the window. A gate that cannot prove the mid-task
// excuse must not grant it; the cost of a wrong "outside" is one honest re-pin, and the cost
// of a wrong "inside" is the silent staleness this corpus exists to prevent.
import { readFileSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { parseFrontmatter } from "../lib/markdown.mjs";
import { noteSources } from "./freshness.mjs";
import { noteFiles } from "./capsules.mjs";

/** The base a branch's work is measured against. Overridable for tests and for hosts whose
 *  default branch isn't `main`. */
export const DEFAULT_BASE = "origin/main";

/** Run git, returning { ok, out }. Never throws: a git failure is data here, not an exception,
 *  because every failure mode resolves to the same fail-closed answer. */
function git(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.error || r.status !== 0) return { ok: false, out: "" };
  return { ok: true, out: (r.stdout || "").trim() };
}

/** Does `ref` resolve in this repo? A missing base (fresh clone, no remote, detached CI
 *  checkout) is the most common reason the window must stay shut. */
export function baseExists(repoRoot, base = DEFAULT_BASE) {
  return git(repoRoot, ["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).ok;
}

/**
 * The window test for ONE note, given its pin and sources.
 *
 * Returns { inside, reason, commits } where `commits` is the unmerged staling commits (oneline)
 * when inside, and [] otherwise. `reason` always explains the verdict in one clause, because
 * every caller surfaces it to a human.
 *
 * The command is deliberately `<pin>..HEAD --not <base> -- <sources>`: the `..HEAD` half is the
 * same range freshness.mjs uses to decide staleness at all, and `--not <base>` subtracts
 * everything already merged. What survives is precisely "commits that stale this note AND are
 * not yet on the base branch".
 */
export function noteWindow(repoRoot, { pin, sources, base = DEFAULT_BASE }) {
  if (!pin) return { inside: false, reason: "no verified_against pin", commits: [] };
  if (!sources?.length) return { inside: false, reason: "no sources listed", commits: [] };
  if (!baseExists(repoRoot, base))
    return { inside: false, reason: `base ref ${base} does not resolve — cannot prove the staling work is unmerged`, commits: [] };

  const r = git(repoRoot, ["log", "--oneline", `${pin}..HEAD`, "--not", base, "--", ...sources]);
  if (!r.ok)
    return { inside: false, reason: `git log failed over ${sources.length} source path(s)`, commits: [] };
  if (!r.out)
    return { inside: false, reason: `no unmerged commits touch its sources — the staleness is already on ${base}`, commits: [] };

  const commits = r.out.split("\n");
  return {
    inside: true,
    reason: `${commits.length} unmerged commit(s) on this branch touch its sources (e.g. ${commits[0]})`,
    commits,
  };
}

/**
 * The same test across a whole corpus. Returns { notes, allInside, base } where `notes` is
 * [{ file, inside, reason }] for every note carrying a pin and sources.
 *
 * `allInside` is the caller's usual decision input, and it is deliberately an AND over the
 * notes that are actually stale: a branch may legitimately explain note A's staleness while
 * note B is stale for an unrelated, older reason. Forgiving both because one is excused is the
 * failure this per-note grain exists to prevent — so callers pass the stale set and block
 * unless EVERY member of it is inside.
 */
export function corpusWindow(repoRoot, corpusDir = "docs/wiki", { base = DEFAULT_BASE, only } = {}) {
  const dir = isAbsolute(corpusDir) ? corpusDir : join(repoRoot, corpusDir);
  const notes = [];
  for (const file of noteFiles(dir)) {
    if (only && !only.has(`${corpusDir}/${file}`) && !only.has(file)) continue;
    let text;
    try { text = readFileSync(join(dir, file), "utf8"); }
    catch { notes.push({ file, inside: false, reason: "unreadable" }); continue; }
    const fm = parseFrontmatter(text);
    const w = noteWindow(repoRoot, { pin: fm?.verified_against, sources: noteSources(text, fm), base });
    notes.push({ file, inside: w.inside, reason: w.reason });
  }
  return { notes, allInside: notes.length > 0 && notes.every((n) => n.inside), base };
}

/** The stale notes named by freshness.mjs `fails` lines, as a Set of corpus-relative paths.
 *  Callers pair this with corpusWindow's `only` so the window is asked only about notes that
 *  are actually stale — never about the whole corpus. */
export function staleNotesFrom(fails) {
  const out = new Set();
  for (const f of fails || []) {
    const m = /^(\S+\.md):\s*STALE\b/.exec(f);
    if (m) out.add(m[1]);
  }
  return out;
}
