#!/usr/bin/env node
// gates/reorient.mjs — reorient's read-only output gate. NEVER writes to disk.
//
// A reorientation "run" is proven done by artifacts, not by claim: every corpus branch the
// run declared has its analysis note (vault branches), the synthesis file exists OUTSIDE the
// corpus with the required sections, and the synthesis actually merges — it names every corpus
// branch it claims to have reconciled. Unlike team-review, reorient operates ON the invoking
// project and is allowed to write into it (analyses, synthesis); the gate therefore proves
// presence-and-merge, not untouched-ness. This module only verifies; all state mutation (run
// records) lives in scripts/run.mjs.
//
// `reorientGate` at the bottom speaks the @praxisflux/gates contract
// ({ name, resolveRoots, check }) so scripts/stop.mjs is a thin lib/gate-runner.mjs entry.
//
//   node gates/reorient.mjs <run.json>     exit 0 = pass, 2 = problems (printed to stderr)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

/** Where a project's reorient run records live: the gitignored `.handoff/` transport at the
 *  INVOKING project's root (nearest ancestor holding `.git` or an existing `.handoff`;
 *  fallback `dir`). $REORIENT_HOME overrides everything (tests). Read-only resolver —
 *  creating the directory is scripts/run.mjs's job. */
export function runsDirFor(dir) {
  if (process.env.REORIENT_HOME) return process.env.REORIENT_HOME;
  let d = resolve(dir);
  while (true) {
    if (existsSync(join(d, ".git")) || existsSync(join(d, ".handoff"))) break;
    const up = dirname(d);
    if (up === d) { d = resolve(dir); break; }
    d = up;
  }
  return join(d, ".handoff", "reorient", "runs");
}

/** Sections the synthesis must carry, matched case-insensitively against headings/bold leads.
 *  `when` gates conditional sections on the run's recorded grounding (everything-optional
 *  posture: a section is only demanded when the surface it reports on was available). */
const SECTIONS = [
  { name: "TL;DR / verdict", re: /(^|\n)\s*(#+\s+.*(tl;?dr|verdict)|\*\*tl;?dr)/i },
  { name: "Decisions", re: /(^|\n)#+\s+.*decisions/i },
  { name: "Course of action", re: /(^|\n)#+\s+.*(course of action|plan\b)/i },
  { name: "Open questions", re: /(^|\n)#+\s+.*open questions/i },
  { name: "Board moves", re: /(^|\n)#+\s+.*board/i, when: (run) => !!run.grounding?.board },
];

/** True when `dir` holds at least one `Analysis-*.md` whose frontmatter says `type: analysis`
 *  (the research plugin's QUERY-phase artifact; reorient checks shape only — deep validity
 *  belongs to the research plugin's own gates). */
export function hasAnalysisNote(dir) {
  let entries = [];
  try { entries = readdirSync(dir).filter((f) => /^Analysis-.*\.md$/.test(f)); } catch { return false; }
  return entries.some((f) => {
    try { return /(^|\n)type:\s*analysis(\s|$)/.test(readFileSync(join(dir, f), "utf8")); } catch { return false; }
  });
}

/** The output gate. Returns a list of problems; empty = pass. Read-only. */
export function checkReorient(run) {
  const problems = [];
  const root = run.root && resolve(run.root);
  if (!root || !existsSync(root)) return [`project root missing: ${run.root}`];
  if (!run.lens || !String(run.lens).trim()) problems.push("run has no lens — the purpose statement everything was pressure-tested against must be recorded at begin");
  const corpus = Array.isArray(run.corpus) ? run.corpus : [];
  if (!corpus.length) problems.push("run declares no corpus entries — nothing was evaluated");
  if (!run.synthesis) return [...problems, "run record has no synthesis path"];
  const synthesis = resolve(run.synthesis);

  for (const c of corpus) {
    const cdir = resolve(root, c.path);
    if (!existsSync(cdir)) { problems.push(`corpus entry missing: ${c.path}`); continue; }
    if ((synthesis + sep).startsWith(cdir + sep))
      problems.push(`synthesis lives INSIDE corpus entry ${c.path} — the merge document is the cross-branch connective tissue and must live outside every branch`);
    if (c.kind === "vault-branch" && !hasAnalysisNote(cdir))
      problems.push(`vault branch ${c.path} has no Analysis-*.md (type: analysis) — the cross-ground phase must land its analysis note before the run can finish`);
  }

  if (!existsSync(synthesis)) {
    problems.push(`synthesis not written yet: ${synthesis}`);
  } else if (statSync(synthesis).isFile()) {
    const text = readFileSync(synthesis, "utf8");
    for (const s of SECTIONS) {
      if (s.when && !s.when(run)) continue;
      if (!s.re.test(text)) problems.push(`synthesis missing section: ${s.name}`);
    }
    for (const c of corpus) {
      const name = c.name || basename(c.path);
      if (!text.includes(name))
        problems.push(`synthesis never mentions corpus entry "${name}" — a merge that doesn't name a branch didn't merge it`);
    }
  } else {
    problems.push(`synthesis path is not a file: ${synthesis}`);
  }
  return problems;
}

/** @praxisflux/gates gate over the runs registry: roots are the in-flight run records scoped to
 *  the session's project dir; no runs in scope = no roots = no-op. */
export const reorientGate = {
  name: "reorient",
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
    const problems = checkReorient(run).map((p) => `[${run.id}] ${p}`);
    if (problems.length) {
      const runner = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "run.mjs");
      problems.push(
        `[${run.id}] finish it (land the analyses + synthesis, then \`node ${runner} finish ${run.id}\`) ` +
          `or close it with residue (\`node ${runner} abandon ${run.id} <reason>\`)`,
      );
    }
    return problems;
  },
};

// CLI: node gates/reorient.mjs <run.json>
if (runAsCli(import.meta.url)) {
  const run = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const problems = checkReorient(run);
  if (problems.length) { console.error(problems.join("\n")); process.exit(2); }
  console.log("reorient gate: PASS");
}
