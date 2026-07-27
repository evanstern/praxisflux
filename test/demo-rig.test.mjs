// demo-rig.test.mjs — the PDLC demo rig cannot rot silently (specs/034-demo-rig R6/R8).
//
// Regenerates the demo repo from tracked fixtures and asserts: every stage tag exists,
// every stage passes its own gates (--check: app tests at stage-0/3, wiki-freshness at
// 1/3/4, spec-bridge at 2/3/4), and a SECOND generation is identical — same demo-board
// task IDs, same tags, same stage tree hashes. Everything runs against the GENERATED
// repos under the OS temp dir; this repo's git is never touched, and there is no
// network and no secret — the presenter-only sandbox wiring (--remote) is never invoked
// (the generator itself refuses it under CI).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATE = join(REPO, "demo", "generate.mjs");
const MANIFEST = JSON.parse(readFileSync(join(REPO, "demo", "fixtures", "manifest.json"), "utf8"));

const run = (args, opts = {}) =>
  execFileSync(process.execPath, [GENERATE, ...args], { encoding: "utf8", ...opts });
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** The comparable identity of a generated demo repo: tag commits, tag tree hashes,
 *  and the demo board's task IDs. */
function fingerprint(dir) {
  const tags = {};
  const trees = {};
  for (const { tag } of MANIFEST.stages) {
    tags[tag] = git(dir, ["rev-parse", `refs/tags/${tag}`]);
    trees[tag] = git(dir, ["rev-parse", `refs/tags/${tag}^{tree}`]);
  }
  const taskIds = readdirSync(join(dir, "backlog", "tasks"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.split(" ")[0])
    .sort();
  return { tags, trees, taskIds };
}

test("demo rig: regenerate → stage tags exist → per-stage gates pass → regeneration is identical (R6/R8)", (t) => {
  const a = mkdtempSync(join(tmpdir(), "pfx-demo-rig-a-"));
  const b = mkdtempSync(join(tmpdir(), "pfx-demo-rig-b-"));
  t.after(() => { rmSync(a, { recursive: true, force: true }); rmSync(b, { recursive: true, force: true }); });

  // Generate (into a dir mkdtemp already created: --reset wipes the empty placeholder).
  run(["--dir", a, "--reset"]);

  // Every stage tag exists, and the manifest covers all five lifecycle stages.
  assert.deepEqual(MANIFEST.stages.map((s) => s.tag), ["stage-0", "stage-1", "stage-2", "stage-3", "stage-4"]);
  const fpA = fingerprint(a);
  for (const { tag } of MANIFEST.stages) assert.match(fpA.tags[tag], /^[0-9a-f]{40}$/);

  // The demo narrative's board is present: the sweep tasks and the triage debt cards.
  for (const id of ["task-1", "task-2", "task-3", "task-4", "task-5"])
    assert.ok(fpA.taskIds.includes(id), `demo board is missing ${id}`);

  // Per-stage gate matrix (R2's contract, asserted through scripts/run-gates.mjs and
  // the app's own node --test). A failure prints the generator's own gate output.
  const check = run(["--dir", a, "--check"]);
  assert.match(check, /gate matrix: all stages green/);

  // Repeatability (R8): a second generation from the same fixtures is identical.
  run(["--dir", b, "--reset"]);
  assert.deepEqual(fingerprint(b), fpA);
});
