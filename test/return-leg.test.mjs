// The return-leg enforcement: at done, a delegated build needs foldedIn evidence AND durable
// residue on disk — a flag alone can't rubber-stamp the most-skipped step.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gateProblemsForProject } from "../educate/gates/dod.mjs";

function project({ handoff, residue }) {
  const root = mkdtempSync(join(tmpdir(), "praxis-rl-"));
  const ldir = join(root, "topics", "t", "101");
  mkdirSync(ldir, { recursive: true });
  writeFileSync(join(ldir, "checklist.md"), "");
  writeFileSync(join(ldir, "raw-notes.md"), residue ? "# notes\n## Post-build\nfindings folded in\n" : "# notes\n");
  writeFileSync(join(root, "topics", "t", "progress.json"),
    JSON.stringify({ definitionOfDone: { delegatedBuild: ["spec->build->fold"] }, lessons: [{ id: "101", status: "done", artifacts: {}, handoff }] }));
  return root;
}

test("done + foldedIn but NO residue on disk -> blocked", () => {
  const problems = gateProblemsForProject(project({ handoff: { returned: true, foldedIn: true }, residue: false }));
  assert.ok(problems.some((p) => p.includes("durable return-leg residue")), problems.join("; "));
});

test("done + foldedIn WITH a ## Post-build section on disk -> clean", () => {
  assert.deepEqual(gateProblemsForProject(project({ handoff: { returned: true, foldedIn: true }, residue: true })), []);
});
