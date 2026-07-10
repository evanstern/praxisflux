#!/usr/bin/env node
// run-gates.mjs — the praxis CI consumption surface: run selected praxis gates against a
// consumer repository. This is what action.yml (the composite GitHub Action) invokes; it also
// runs by hand from any praxis checkout:
//
//   node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness [--path <root>]
//                              [--wiki-dir docs/wiki] [--course-dir docs/course]
//
// Gate names, options, and exit codes are praxis's versioned consumer contract
// (docs/consuming-gates.md): exit 0 when every gate passes, 1 when any gate fails, 2 on a
// usage error (unknown gate, missing --gates). Each failure line names its fix. This same
// file ships as the @praxisflux/gates npm bin (scripts/build-npm.mjs carves the package).
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runAsCli } from "../lib/cli.mjs";
import { checkBridge } from "../spec-bridge/gates/bridge.mjs";
import { validateFreshness } from "../grounding-wiki/gates/freshness.mjs";
import { validateCourse } from "../codebase-to-course/gates/course.mjs";

/** wiki-freshness resolves verified_against pins through git history, which a shallow CI
 *  clone doesn't have — catch that up front with the exact fix instead of a wall of
 *  unknown-pin failures. */
function shallowCloneProblem(root) {
  const r = spawnSync("git", ["rev-parse", "--is-shallow-repository"], { cwd: root, encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim() === "true")
    return `${root} is a shallow clone — wiki-freshness needs full history to resolve verified_against pins; set "fetch-depth: 0" on actions/checkout`;
  return null;
}

/** Each gate takes {root, wikiDir, courseDir} and returns {problems, warnings, ok} where
 *  ok is the one-line success summary. */
export const GATES = {
  "spec-bridge": ({ root }) => {
    const { links, problems, warnings } = checkBridge(root);
    return { problems, warnings, ok: `spec-bridge ok: ${links.length} linked task(s), none exceed their artifacts` };
  },
  "wiki-freshness": ({ root, wikiDir }) => {
    const shallow = shallowCloneProblem(root);
    if (shallow) return { problems: [shallow], warnings: [], ok: "" };
    const { fails, warns, checked } = validateFreshness(root, wikiDir);
    return { problems: fails, warnings: warns, ok: `wiki-freshness ok: ${checked} note(s) fresh against their pinned sources` };
  },
  "course": ({ root, courseDir }) => {
    const { fails, warns, modules } = validateCourse(join(root, courseDir));
    return { problems: fails, warnings: warns, ok: `course ok: ${modules} module(s) pass the course gate` };
  },
};

/** Run the named gates against opts.root. Returns [{gate, problems, warnings, ok}].
 *  Throws on an unknown or empty gate list — a misspelled gate must fail the build loudly,
 *  never skip silently. */
export function runGates(names, opts) {
  if (!names.length) throw new Error(`no gates requested — pass --gates with any of: ${Object.keys(GATES).join(", ")}`);
  for (const n of names)
    if (!GATES[n]) throw new Error(`unknown gate "${n}" — valid gates: ${Object.keys(GATES).join(", ")}`);
  return names.map((gate) => ({ gate, ...GATES[gate](opts) }));
}

if (runAsCli(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => {
    const i = args.indexOf(`--${name}`);
    return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : dflt;
  };
  const opts = {
    root: resolve(opt("path", ".")),
    wikiDir: opt("wiki-dir", "docs/wiki"),
    courseDir: opt("course-dir", "docs/course"),
  };
  const names = opt("gates", "").split(",").map((s) => s.trim()).filter(Boolean);

  let results;
  try {
    results = runGates(names, opts);
  } catch (e) {
    console.error(`usage error: ${e.message}`);
    process.exit(2);
  }
  let failed = 0;
  for (const { gate, problems, warnings, ok } of results) {
    for (const w of warnings) console.log(`[${gate}] warn: ${w}`);
    if (problems.length) {
      failed++;
      console.log(`[${gate}] GATE FAILED (${problems.length} issue(s)):`);
      for (const p of problems) console.log(`  - ${p}`);
    } else {
      console.log(`[${gate}] ${ok}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
