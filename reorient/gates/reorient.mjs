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

/** A non-owned in-flight run whose heartbeat is older than this is flagged as possibly
 *  orphaned (non-blocking warn). The owner's Stop hook refreshes the heartbeat every turn,
 *  so an hour of silence means the owning session is likely gone. */
export const STALE_HEARTBEAT_MS = 60 * 60 * 1000;

/** Does this run belong to `sessionId`? Returns true/false when both sides recorded an
 *  identity, else null (undecidable — legacy records or a session without an id; callers
 *  fall back to checkout scoping). */
export function ownsRun(run, sessionId) {
  if (!run?.owner?.sessionId || !sessionId) return null;
  return run.owner.sessionId === sessionId;
}

/** Ownership provenance in one line: who began the run, from where, and when — the facts
 *  that make orphan-vs-live decidable instead of guesswork. A run begun in a shared
 *  primary checkout via --shared-checkout carries that deliberate choice here too. */
export function describeOwner(run) {
  const o = run.owner || {};
  const who = o.sessionId ? `session ${o.sessionId}` : "an unrecorded session";
  const origin = [o.user, o.host].filter(Boolean).join("@");
  const hb = run.heartbeatAt || run.startedAt;
  return `${who}${origin ? ` (${origin})` : ""}, begun ${run.startedAt || "?"} from ${run.cwd || "?"}` +
    (run.sharedCheckout ? " (--shared-checkout: shared primary checkout)" : "") +
    (hb ? `, last heartbeat ${hb}` : "");
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

const runnerPath = () => join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "run.mjs");

/** @praxisflux/gates gate over the runs registry. Ownership scopes the nag: an in-flight run
 *  BLOCKS only the session that owns it (manifest owner.sessionId vs ctx.sessionId); other
 *  sessions in the same checkout are never blocked by someone else's run — at most they get a
 *  non-blocking orphan notice once the owner's heartbeat goes stale. Records without an owner
 *  (or a session without an identity) fall back to the legacy checkout scoping. */
export const reorientGate = {
  name: "reorient",
  resolveRoots: (startDir, ctx) => {
    const runsDir = runsDirFor(startDir);
    let entries = [];
    try { entries = readdirSync(runsDir).filter((f) => f.endsWith(".json")); } catch { return []; }
    const roots = [];
    for (const f of entries) {
      try {
        const run = JSON.parse(readFileSync(join(runsDir, f), "utf8"));
        if (run.state !== "in-flight") continue;
        const owned = ownsRun(run, ctx?.sessionId);
        const inCheckout = !!startDir && !!run.cwd && (startDir === run.cwd || startDir.startsWith(run.cwd + sep));
        // Owned runs always resolve (the owner is nagged wherever it stops); everything else
        // stays checkout-scoped — undecidable ones to block (legacy behavior), foreign ones
        // so warn() can surface staleness.
        if (owned === true || inCheckout) roots.push(join(runsDir, f));
      } catch { /* unreadable run records never block */ }
    }
    return roots;
  },
  check: (runFile, ctx) => {
    const run = JSON.parse(readFileSync(runFile, "utf8"));
    if (ownsRun(run, ctx?.sessionId) === false) return []; // someone else's run never blocks
    const problems = checkReorient(run).map((p) => `[${run.id}] ${p}`);
    if (problems.length) {
      const runner = runnerPath();
      problems.push(
        `[${run.id}] finish it (land the analyses + synthesis, then \`node ${runner} finish ${run.id}\`) ` +
          `or close it with residue (\`node ${runner} abandon ${run.id} <reason>\`)`,
      );
    }
    return problems;
  },
  warn: (runFile, ctx) => {
    const run = JSON.parse(readFileSync(runFile, "utf8"));
    if (ownsRun(run, ctx?.sessionId) !== false) return []; // owned/undecidable runs block instead
    const hb = Date.parse(run.heartbeatAt || run.startedAt || "");
    if (Number.isFinite(hb) && Date.now() - hb < STALE_HEARTBEAT_MS) return []; // live elsewhere: silence
    const runner = runnerPath();
    return [
      `[${run.id}] in-flight reorient run owned by another session looks orphaned — ${describeOwner(run)}. ` +
        `It never blocks this session; to adopt it run \`node ${runner} takeover ${run.id}\` ` +
        `(then finish or abandon it), or leave it for its owner.`,
    ];
  },
};

// CLI: node gates/reorient.mjs <run.json>
if (runAsCli(import.meta.url)) {
  const run = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const problems = checkReorient(run);
  if (problems.length) { console.error(problems.join("\n")); process.exit(2); }
  console.log("reorient gate: PASS");
}
