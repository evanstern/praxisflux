#!/usr/bin/env node
// gates/review.mjs — team-review's read-only output gate. NEVER writes to disk.
//
// A review "run" is proven done by artifacts, not by claim: a report file with the required
// sections, citations that resolve into the reviewed repo, and a target repo left byte-for-byte
// untouched (git snapshot taken at begin == git snapshot now). This module only verifies; all
// state mutation (run records, snapshots) lives in scripts/run.mjs.
//
// `reviewGate` at the bottom speaks the @praxisflux/gates contract ({ name, resolveRoots, check })
// so scripts/stop.mjs is a thin lib/gate-runner.mjs entry like every other plugin's.
//
//   node gates/review.mjs <run.json>     exit 0 = pass, 2 = problems (printed to stderr)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

/** Where a project's team-review run records live: the gitignored `.handoff/` transport at the
 *  project root (praxisflux handoff protocol — transient plumbing, never clutters git status).
 *  Root = nearest ancestor of `dir` holding `.git` or an existing `.handoff`; fallback `dir`.
 *  This is the INVOKING project's root, never the reviewed target (skill-patterns §6, third
 *  placement model). $TEAM_REVIEW_HOME overrides everything (used by tests). Read-only
 *  resolver — creating the directory is scripts/run.mjs's job. */
export function runsDirFor(dir) {
  if (process.env.TEAM_REVIEW_HOME) return process.env.TEAM_REVIEW_HOME;
  let d = resolve(dir);
  while (true) {
    if (existsSync(join(d, ".git")) || existsSync(join(d, ".handoff"))) break;
    const up = dirname(d);
    if (up === d) { d = resolve(dir); break; }
    d = up;
  }
  return join(d, ".handoff", "team-review", "runs");
}

/** Required report sections, matched case-insensitively against headings/bold leads. */
const SECTIONS = [
  { name: "TL;DR", re: /(^|\n)\s*(#+\s+.*TL;?DR|\*\*TL;?DR)/i },
  { name: "What we like", re: /(^|\n)#+\s+what we like/i },
  { name: "What could be improved", re: /(^|\n)#+\s+what could be improved/i },
  { name: "What should be removed", re: /(^|\n)#+\s+what should be removed/i },
  { name: "Stealing for later", re: /(^|\n)#+\s+steal/i },
  { name: "Questions", re: /(^|\n)#+\s+questions/i },
];

const MIN_RESOLVING_CITATIONS = 5;

/** Current git evidence for a repo: { git, head, porcelain } (git:false when not a repo). */
export function gitSnapshot(repo) {
  const run = (args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
  try {
    return { git: true, head: run(["rev-parse", "HEAD"]), porcelain: run(["status", "--porcelain"]) };
  } catch {
    return { git: false, head: null, porcelain: null };
  }
}

/** Extract candidate file citations (`path/to/file.ext` or `file.ext:123`) from report text. */
export function citations(text) {
  const seen = new Set();
  for (const m of text.matchAll(/`([\w@./-]+\.[A-Za-z]{1,5})(?::\d+(?:-\d+)?)?`/g)) seen.add(m[1]);
  return [...seen];
}

/** True when `p` resolves to a real file under the target repo (tolerating a repeated
 *  repo-basename prefix, e.g. `bookie/engine.py` cited from inside the bookie repo). */
function resolves(target, p) {
  if (existsSync(join(target, p))) return true;
  const parts = p.split("/");
  return parts.length > 1 && existsSync(join(target, parts.slice(1).join("/")));
}

/** The output gate. Returns a list of problems; empty = pass. Read-only. */
export function checkReview(run) {
  const problems = [];
  const target = run.target && resolve(run.target);
  if (!target || !existsSync(target)) return [`target repo missing: ${run.target}`];
  if (!run.report) return ["run record has no report path"];
  const report = resolve(run.report);

  if ((report + sep).startsWith(target + sep))
    problems.push(`report lives INSIDE the reviewed repo (${report}) — reviews are read-only; write it elsewhere`);

  if (!existsSync(report)) {
    problems.push(`report not written yet: ${report}`);
  } else {
    const text = readFileSync(report, "utf8");
    for (const s of SECTIONS) if (!s.re.test(text)) problems.push(`report missing section: ${s.name}`);
    const cited = citations(text);
    const resolving = cited.filter((p) => resolves(target, p));
    if (resolving.length < MIN_RESOLVING_CITATIONS)
      problems.push(
        `only ${resolving.length}/${MIN_RESOLVING_CITATIONS} required citations resolve to real files in ` +
          `${target} (found ${cited.length} candidates) — load-bearing claims need file:line evidence`,
      );
  }

  if (run.snapshot?.git) {
    const now = gitSnapshot(target);
    if (now.head !== run.snapshot.head || now.porcelain !== run.snapshot.porcelain)
      problems.push(`target repo changed during the review (HEAD or working tree differs from the begin snapshot) — a review must be read-only`);
  }
  return problems;
}

/** @praxisflux/gates gate over the runs registry: roots are the in-flight run records scoped to
 *  the session's project dir; no runs in scope = no roots = no-op. */
export const reviewGate = {
  name: "team-review",
  resolveRoots: (startDir) => {
    const runsDir = runsDirFor(startDir);
    let entries = [];
    try { entries = readdirSync(runsDir).filter((f) => f.endsWith(".json")); } catch { return []; }
    const roots = [];
    for (const f of entries) {
      try {
        const run = JSON.parse(readFileSync(join(runsDir, f), "utf8"));
        if (run.state === "in-flight" && startDir && (startDir === run.cwd || startDir.startsWith(run.cwd + sep)))
          roots.push(join(runsDir, f));
      } catch { /* unreadable run records never block */ }
    }
    return roots;
  },
  check: (runFile) => {
    const run = JSON.parse(readFileSync(runFile, "utf8"));
    const problems = checkReview(run).map((p) => `[${run.id}] ${p}`);
    if (problems.length) {
      const runner = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "run.mjs");
      problems.push(
        `[${run.id}] finish it (write the report, then \`node ${runner} finish ${run.id}\`) ` +
          `or close it with residue (\`node ${runner} abandon ${run.id} <reason>\`)`,
      );
    }
    return problems;
  },
};

// CLI: node gates/review.mjs <run.json>
if (runAsCli(import.meta.url)) {
  const run = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const problems = checkReview(run);
  if (problems.length) { console.error(problems.join("\n")); process.exit(2); }
  console.log("review gate: PASS");
}
