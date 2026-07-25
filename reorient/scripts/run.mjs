#!/usr/bin/env node
// scripts/run.mjs — reorient's state-mutating run tracker (the ONLY writer; gates/ never writes).
//
// A run record is the paper trail that a reorientation is in flight, and the manifest the
// output gate verifies against ("a status can't exceed the artifacts that prove it"): which
// corpus branches were evaluated, under what lens, and which grounding surfaces (research
// vault, docs/wiki, Backlog board) were available — the everything-optional posture means the
// gate demands exactly what the manifest recorded, no more. Records ride the `.handoff/`
// transport at the invoking project's root (transient plumbing, gitignored); the durable
// residue is the analyses + synthesis themselves. $REORIENT_HOME overrides the location (tests).
//
//   begin <root> --lens "<purpose>" --corpus <path> [--corpus <path> ...] [--synthesis <path>]
//   finish <id|root>                 run the output gate; pass -> state done; fail -> exit 2
//   abandon <id|root> [reason...]    close without a synthesis, keeping durable residue
//   list                             show runs and states
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, relative, basename, dirname } from "node:path";
import { checkReorient, runsDirFor } from "../gates/reorient.mjs";
import { runAsCli } from "../lib/cli.mjs";

const RUNS = runsDirFor(process.cwd());
const runPath = (id) => join(RUNS, `${id}.json`);

function loadRuns() {
  try {
    return readdirSync(RUNS)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(RUNS, f), "utf8")));
  } catch { return []; }
}

/** Find a run by exact id, else the newest in-flight run whose root matches. */
function findRun(key) {
  const runs = loadRuns();
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

const save = (run) => { mkdirSync(RUNS, { recursive: true }); writeFileSync(runPath(run.id), JSON.stringify(run, null, 2) + "\n"); };

if (runAsCli(import.meta.url)) {
  const [cmd, key, ...rest] = process.argv.slice(2);

  if (cmd === "begin") {
    const root = resolve(key || ".");
    if (!existsSync(root)) { console.error(`no such project root: ${root}`); process.exit(1); }
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
    while (existsSync(runPath(id))) id += "x"; // never overwrite an existing run record
    const synthesis = resolve(
      flag("--synthesis") ||
        (existsSync(join(root, "docs")) ? join(root, "docs", "design", `reorient-${stamp.slice(0, 10)}.md`) : join(root, `reorient-${stamp.slice(0, 10)}.md`)),
    );
    save({ id, state: "in-flight", root, lens, corpus, grounding, synthesis, cwd: process.cwd(), startedAt: new Date().toISOString() });
    const handoffRoot = dirname(dirname(dirname(RUNS)));
    if (existsSync(join(handoffRoot, ".git"))) {
      let ignored = false;
      try { ignored = /(^|\n)\.handoff\/?(\n|$)/.test(readFileSync(join(handoffRoot, ".gitignore"), "utf8")); } catch { /* no .gitignore */ }
      if (!ignored) console.error(`warning: ${handoffRoot}/.gitignore does not cover .handoff/ — add it (handoff transport must never clutter git status)`);
    }
    console.log(
      `run ${id} in flight\n` +
        `  lens:      ${lens}\n` +
        corpus.map((c) => `  corpus:    ${c.path} (${c.kind})`).join("\n") + "\n" +
        `  grounding: vault=${grounding.vault} wiki=${grounding.wiki || "none"} board=${grounding.board}\n` +
        `  synthesis: ${synthesis}\n` +
        `  finish:    node ${process.argv[1]} finish ${id}`,
    );
  } else if (cmd === "finish") {
    const run = findRun(key || ".");
    if (!run) { console.error(`no run matching '${key}' — see: run.mjs list`); process.exit(1); }
    const problems = checkReorient(run);
    if (problems.length) { console.error(`reorient gate BLOCKED for ${run.id}:\n` + problems.map((p) => `  - ${p}`).join("\n")); process.exit(2); }
    run.state = "done";
    run.finishedAt = new Date().toISOString();
    save(run);
    console.log(`run ${run.id} done — synthesis proven at ${run.synthesis}`);
  } else if (cmd === "abandon") {
    const run = findRun(key || ".");
    if (!run) { console.error(`no run matching '${key}'`); process.exit(1); }
    run.state = "abandoned";
    run.finishedAt = new Date().toISOString();
    run.reason = rest.join(" ") || "unspecified";
    save(run);
    console.log(`run ${run.id} abandoned (${run.reason}) — residue kept at ${runPath(run.id)}`);
  } else if (cmd === "list") {
    for (const r of loadRuns().sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)))
      console.log(`${r.state.padEnd(9)} ${r.id}  →  ${r.synthesis}`);
  } else {
    console.error('usage: run.mjs begin <root> --lens "<purpose>" --corpus <path> [--corpus <path> ...] [--synthesis <path>] | finish <id|root> | abandon <id|root> [reason] | list');
    process.exit(1);
  }
}
