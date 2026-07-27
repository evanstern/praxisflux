#!/usr/bin/env node
// scripts/run.mjs — reorient's state-mutating run tracker (the ONLY writer; gates/ never writes).
//
// A run record is the paper trail that a reorientation is in flight, and the manifest the
// output gate verifies against ("a status can't exceed the artifacts that prove it"): which
// corpus branches were evaluated, under what lens, and which grounding surfaces (research
// vault, docs/wiki, Backlog board) were available — the everything-optional posture means the
// gate demands exactly what the manifest recorded, no more. Records ride the `.handoff/`
// transport at the TARGET project's root — the root each subcommand was given, never the
// invoking cwd — so the run is visible to sessions working in the target (transient plumbing,
// gitignored); the durable residue is the analyses + synthesis themselves. $REORIENT_HOME
// overrides the location (tests).
//
// Runs are OWNED: begin stamps the manifest with the beginning session's identity
// ($CLAUDE_CODE_SESSION_ID, or --session) plus user@host provenance and a heartbeat the
// owner's Stop hook keeps fresh — so the Stop gate nags only the owner, `list` makes
// orphan-vs-live decidable, and adopting someone else's run is an explicit `takeover`.
//
// Runs are WORKTREE-FIRST: begin refuses a registry root that is a shared primary checkout
// (`.git` is a directory; a worktree carries a `gitdir:` file) unless --shared-checkout is
// given — the override lands on the manifest and is surfaced by list/owner provenance.
//
//   begin <root> --lens "<purpose>" --corpus <path> [--corpus <path> ...]
//                [--synthesis <path>] [--session <id>] [--shared-checkout]
//   finish <id|root>                 run the output gate; pass -> state done; fail -> exit 2
//   abandon <id|root> [reason...]    close without a synthesis, keeping durable residue
//                                    (owner-only: take over a foreign run first)
//   takeover <id|root>               explicitly adopt an in-flight run begun elsewhere
//   list [root]                      show runs, states, owners, and heartbeat ages
//
// Every subcommand locates the registry from the RESOLVED TARGET root — begin from its
// <root> argument, the others from a directory key (a run id falls back to the invoking
// cwd's registry, which after begin IS the target's) — never from module-load cwd.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative, basename, dirname } from "node:path";
import { hostname, userInfo } from "node:os";
import { checkReorient, runsDirFor, ownsRun, describeOwner } from "../gates/reorient.mjs";
import { runAsCli } from "../lib/cli.mjs";

// No module-load registry: every subcommand resolves its own runs dir from the RESOLVED
// TARGET root after parsing its args — capturing process.cwd() here is exactly the bug
// that stranded run records at the invoking checkout instead of the target's.
const runPath = (runsDir, id) => join(runsDir, `${id}.json`);

function loadRuns(runsDir) {
  try {
    return readdirSync(runsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(runsDir, f), "utf8")));
  } catch { return []; }
}

/** Find a run by exact id, else the newest in-flight run whose root matches. */
function findRun(runsDir, key) {
  const runs = loadRuns(runsDir);
  return (
    runs.find((r) => r.id === key) ||
    runs
      .filter((r) => r.state === "in-flight" && (r.root === resolve(key) || basename(r.root) === key))
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
  );
}

/** A corpus path is a vault branch when any ancestor (up to and including `root`'s parent)
 *  carries the research plugin's `.research-vault` sentinel; anything else is ad-hoc corpus. */
export function classifyCorpus(root, path) {
  const abs = resolve(root, path);
  let d = abs;
  while (true) {
    if (existsSync(join(d, ".research-vault"))) return "vault-branch";
    const up = dirname(d);
    if (up === d || d === dirname(resolve(root))) break;
    d = up;
  }
  return "adhoc";
}

/** Detect the host project's optional grounding surfaces. Everything-optional: absence is
 *  recorded, never an error — the skill states its degradation, the gate scales its demands. */
export function detectGrounding(root, corpus) {
  return {
    vault: corpus.some((c) => c.kind === "vault-branch"),
    wiki: existsSync(join(root, "docs", "wiki")) ? "docs/wiki" : null,
    board: existsSync(join(root, "backlog")),
  };
}

const save = (runsDir, run) => { mkdirSync(runsDir, { recursive: true }); writeFileSync(runPath(runsDir, run.id), JSON.stringify(run, null, 2) + "\n"); };

/** The invoking session's identity, if the harness exposes one. */
export const currentSessionId = (explicit) => explicit || process.env.CLAUDE_CODE_SESSION_ID || null;

/** Owner stamp for a manifest: session identity + user@host provenance. */
export function makeOwner(sessionId) {
  let user = null;
  try { user = userInfo().username; } catch { user = process.env.USER || null; }
  return { sessionId: sessionId || null, user, host: hostname() };
}

/** Compact "how long ago" for heartbeat display. */
export const ago = (iso) => {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return "unknown";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "<1m ago" : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
};

/** Refresh heartbeatAt on every in-flight run under `startDir`'s registry owned by
 *  `sessionId`. The owner's Stop hook calls this each turn (via stop.mjs), keeping
 *  liveness observable from other sessions; writes stay in this module — the only writer.
 *  Returns the number of runs touched. */
export function heartbeatOwnedRuns(startDir, sessionId) {
  if (!sessionId) return 0;
  const dir = runsDirFor(startDir);
  let entries = [];
  try { entries = readdirSync(dir).filter((f) => f.endsWith(".json")); } catch { return 0; }
  let touched = 0;
  for (const f of entries) {
    try {
      const run = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (run.state !== "in-flight" || ownsRun(run, sessionId) !== true) continue;
      run.heartbeatAt = new Date().toISOString();
      writeFileSync(join(dir, f), JSON.stringify(run, null, 2) + "\n");
      touched++;
    } catch { /* unreadable records are never touched */ }
  }
  return touched;
}

if (runAsCli(import.meta.url)) {
  const [cmd, key, ...rest] = process.argv.slice(2);

  /** The registry a subcommand key selects: an existing DIRECTORY is a target root and
   *  owns its own registry (runsDirFor walks up from it); anything else is a run id,
   *  looked up in the invoking cwd's registry — after `begin`, that registry lives at the
   *  target root, so ids resolve for sessions working in the target. $REORIENT_HOME still
   *  overrides everything (inside runsDirFor). */
  const registryFor = (k) => {
    const abs = resolve(k || ".");
    let isDir = false;
    try { isDir = statSync(abs).isDirectory(); } catch { /* not a path — treat as a run id */ }
    return runsDirFor(isDir ? abs : process.cwd());
  };

  if (cmd === "begin") {
    const root = resolve(key || ".");
    if (!existsSync(root)) { console.error(`no such project root: ${root}`); process.exit(1); }
    // The registry is resolved from the TARGET root — the manifest must land where the
    // target's sessions (and their Stop gates) will look for it, never at the invoking cwd.
    const runs = runsDirFor(root);
    // Worktree-first doctrine: the runs registry is shared mutable state at the registry
    // root — the TARGET's checkout, since that's where the registry now lives — so a shared
    // PRIMARY checkout — `.git` is a DIRECTORY there; a worktree carries a `gitdir:` FILE
    // instead — is refused by default (session ownership is defense-in-depth, not
    // isolation). `--shared-checkout` is the explicit, manifest-recorded exception;
    // non-git registry roots are untouched by this check.
    const registryRoot = dirname(dirname(dirname(runs)));
    const sharedCheckoutFlag = rest.includes("--shared-checkout");
    let checkoutKind = null; // "primary" | "worktree" | null (registry root is not a git checkout)
    try { checkoutKind = statSync(join(registryRoot, ".git")).isDirectory() ? "primary" : "worktree"; } catch { /* not a git checkout */ }
    if (checkoutKind === "primary" && !sharedCheckoutFlag) {
      console.error(
        `begin refused: registry root ${registryRoot} is a shared primary checkout (.git is a directory), so every session working here would share one .handoff/ run registry.\n` +
          `  Worktree-first: begin the run from inside a git worktree so the registry stays lane-local —\n` +
          `    git worktree add .worktrees/<name> -b <branch>\n` +
          `  To deliberately run in this shared checkout anyway, re-run with --shared-checkout;\n` +
          `  the override is recorded on the run manifest and surfaced by list/owner provenance.`,
      );
      process.exit(1);
    }
    const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
    const lens = flag("--lens");
    if (!lens || !lens.trim()) { console.error("begin requires --lens \"<the purpose statement everything gets pressure-tested against>\""); process.exit(1); }
    const corpusPaths = rest.flatMap((a, i) => (a === "--corpus" && rest[i + 1] ? [rest[i + 1]] : []));
    if (!corpusPaths.length) { console.error("begin requires at least one --corpus <path> (a vault branch or an ad-hoc corpus dir)"); process.exit(1); }
    const corpus = corpusPaths.map((p) => {
      const abs = resolve(root, p);
      if (!existsSync(abs)) { console.error(`no such corpus dir: ${abs}`); process.exit(1); }
      return { path: relative(root, abs) || ".", name: basename(abs), kind: classifyCorpus(root, abs) };
    });
    const grounding = detectGrounding(root, corpus);
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    let id = `${basename(root)}-${stamp}`;
    while (existsSync(runPath(runs, id))) id += "x"; // never overwrite an existing run record
    // Synthesis default is keyed by RUN ID, never by date — two same-day runs must never
    // collide on one output path.
    const synthesis = resolve(
      flag("--synthesis") ||
        (existsSync(join(root, "docs")) ? join(root, "docs", "design", `reorient-${id}.md`) : join(root, `reorient-${id}.md`)),
    );
    const owner = makeOwner(currentSessionId(flag("--session")));
    // Concurrent-session visibility: an existing in-flight run for this root is not an
    // error (runs are session-owned), but the operator must see whose it is.
    for (const other of loadRuns(runs).filter((r) => r.state === "in-flight" && r.root === root))
      console.error(`note: another run is already in flight for this root — ${other.id}, owned by ${describeOwner(other)} (heartbeat ${ago(other.heartbeatAt || other.startedAt)})`);
    const startedAt = new Date().toISOString();
    // The override is recorded ONLY when it actually permitted a shared primary checkout —
    // the manifest field is the audit trail of that deliberate choice (surfaced by
    // list/describeOwner); a no-op flag in a worktree leaves no false claim behind.
    const sharedCheckout = checkoutKind === "primary" && sharedCheckoutFlag;
    save(runs, { id, state: "in-flight", root, lens, corpus, grounding, synthesis, cwd: process.cwd(), owner, startedAt, heartbeatAt: startedAt, ...(sharedCheckout ? { sharedCheckout: true } : {}) });
    if (checkoutKind !== null) {
      let ignored = false;
      try { ignored = /(^|\n)\.handoff\/?(\n|$)/.test(readFileSync(join(registryRoot, ".gitignore"), "utf8")); } catch { /* no .gitignore */ }
      if (!ignored) console.error(`warning: ${registryRoot}/.gitignore does not cover .handoff/ — add it (handoff transport must never clutter git status)`);
    }
    console.log(
      `run ${id} in flight\n` +
        `  lens:      ${lens}\n` +
        corpus.map((c) => `  corpus:    ${c.path} (${c.kind})`).join("\n") + "\n" +
        `  grounding: vault=${grounding.vault} wiki=${grounding.wiki || "none"} board=${grounding.board}\n` +
        `  owner:     ${owner.sessionId ? `session ${owner.sessionId}` : "no session identity (Stop gate falls back to checkout scoping)"} (${[owner.user, owner.host].filter(Boolean).join("@")})\n` +
        (sharedCheckout ? `  registry:  shared primary checkout — --shared-checkout override recorded on the manifest\n` : "") +
        `  synthesis: ${synthesis}\n` +
        `  finish:    node ${process.argv[1]} finish ${id}`,
    );
  } else if (cmd === "finish") {
    const runs = registryFor(key);
    const run = findRun(runs, key || ".");
    if (!run) { console.error(`no run matching '${key}' — see: run.mjs list`); process.exit(1); }
    if (ownsRun(run, currentSessionId()) === false)
      console.error(`note: finishing a run begun by another session — ${describeOwner(run)}`);
    const problems = checkReorient(run);
    if (problems.length) { console.error(`reorient gate BLOCKED for ${run.id}:\n` + problems.map((p) => `  - ${p}`).join("\n")); process.exit(2); }
    run.state = "done";
    run.finishedAt = new Date().toISOString();
    save(runs, run);
    console.log(`run ${run.id} done — synthesis proven at ${run.synthesis}`);
  } else if (cmd === "abandon") {
    const runs = registryFor(key);
    const run = findRun(runs, key || ".");
    if (!run) { console.error(`no run matching '${key}'`); process.exit(1); }
    if (ownsRun(run, currentSessionId()) === false) {
      // Abandoning someone else's live-looking run is exactly the incident this guards
      // against: adoption must be explicit, with provenance in front of the operator.
      console.error(
        `run ${run.id} is owned by another session — ${describeOwner(run)} (heartbeat ${ago(run.heartbeatAt || run.startedAt)})\n` +
          `  take it over explicitly first: node ${process.argv[1]} takeover ${run.id}`,
      );
      process.exit(1);
    }
    run.state = "abandoned";
    run.finishedAt = new Date().toISOString();
    run.reason = rest.join(" ") || "unspecified";
    save(runs, run);
    console.log(`run ${run.id} abandoned (${run.reason}) — residue kept at ${runPath(runs, run.id)}`);
  } else if (cmd === "takeover") {
    const runs = registryFor(key);
    const run = findRun(runs, key || ".");
    if (!run) { console.error(`no run matching '${key}'`); process.exit(1); }
    if (run.state !== "in-flight") { console.error(`run ${run.id} is ${run.state} — only in-flight runs can be taken over`); process.exit(1); }
    const previously = describeOwner(run);
    run.owner = makeOwner(currentSessionId());
    run.heartbeatAt = new Date().toISOString();
    save(runs, run);
    console.log(`run ${run.id} taken over — now owned by ${describeOwner(run)}\n  previously: ${previously}`);
  } else if (cmd === "list") {
    for (const r of loadRuns(registryFor(key)).sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1))) {
      const o = r.owner || {};
      const who = `${[o.user, o.host].filter(Boolean).join("@") || "?"} ${o.sessionId ? `session ${o.sessionId.slice(0, 8)}…` : "no-session"}`;
      const hb = r.state === "in-flight" ? `, heartbeat ${ago(r.heartbeatAt || r.startedAt)}` : "";
      const shared = r.sharedCheckout ? ", --shared-checkout" : "";
      console.log(`${r.state.padEnd(9)} ${r.id}  [${who}, begun ${r.startedAt || "?"}${hb}${shared}]  →  ${r.synthesis}`);
    }
  } else {
    console.error('usage: run.mjs begin <root> --lens "<purpose>" --corpus <path> [--corpus <path> ...] [--synthesis <path>] [--session <id>] [--shared-checkout] | finish <id|root> | abandon <id|root> [reason] | takeover <id|root> | list [root]');
    process.exit(1);
  }
}
