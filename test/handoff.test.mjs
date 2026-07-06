// Tests for the shared handoff transport + educate's progress.json evidence gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { writeHandoff, readHandoff, listHandoffs, markConsumed, handoffDir } from "../lib/handoff.mjs";
import { gateProblemsForProject } from "../educate/gates/dod.mjs";

const scratch = () => mkdtempSync(join(tmpdir(), "praxis-ho-"));

test("handoff transport: write/read round-trip, opaque body, gitignored", () => {
  const root = scratch();
  writeHandoff(root, { id: "spec-101", kind: "request", from: "educate", to: "build", title: "Build a demo", body: "## SPEC\n- do X\n" });
  const h = readHandoff(root, "spec-101");
  assert.equal(h.envelope.kind, "request");
  assert.equal(h.envelope.from, "educate");
  assert.match(h.body, /## SPEC/);           // payload preserved verbatim
  // .handoff/ is gitignored so it never pollutes git status
  assert.match(readFileSync(join(root, ".gitignore"), "utf8"), /^\.handoff\/$/m);
  assert.ok(existsSync(join(handoffDir(root), "spec-101.md")));
});

test("handoff transport: filter + consume", () => {
  const root = scratch();
  writeHandoff(root, { id: "a", kind: "request", from: "educate", to: "build" });
  writeHandoff(root, { id: "b", kind: "response", from: "build", to: "educate", ref: "a" });
  assert.equal(listHandoffs(root, { kind: "response" }).length, 1);
  assert.equal(listHandoffs(root, { to: "build" }).length, 1);
  assert.equal(markConsumed(root, "a"), true);
  assert.equal(listHandoffs(root).length, 1);                       // a no longer pending
  assert.ok(existsSync(join(handoffDir(root), "consumed", "a.md"))); // archived, not deleted
});

// Build a minimal delegated-build educate project and gate it.
function delegatedProject(lesson) {
  const root = scratch();
  mkdirSync(join(root, "topics", "t", "101"), { recursive: true });
  writeFileSync(join(root, "topics", "t", "101", "checklist.md"), "");
  // include return-leg residue so the done+foldedIn case tests the evidence path, not residue
  writeFileSync(join(root, "topics", "t", "101", "raw-notes.md"), "# notes\n## Post-build\nfolded in\n");
  writeFileSync(join(root, "topics", "t", "progress.json"),
    JSON.stringify({ definitionOfDone: { delegatedBuild: ["spec->build->fold"] }, lessons: [{ id: "101", status: lesson.status, artifacts: {}, handoff: lesson.handoff }] }));
  return root;
}

test("delegated-build evidence gate reads progress.json, not loose files", () => {
  // built with no returned-evidence -> blocked
  assert.ok(gateProblemsForProject(delegatedProject({ status: "built" })).some((p) => p.includes("handoff.returned")));
  // built with returned evidence -> clean
  assert.deepEqual(gateProblemsForProject(delegatedProject({ status: "built", handoff: { returned: true } })), []);
  // done without the return leg folded -> blocked
  assert.ok(gateProblemsForProject(delegatedProject({ status: "done", handoff: { returned: true } })).some((p) => p.includes("foldedIn")));
  // done with the return leg folded -> clean
  assert.deepEqual(gateProblemsForProject(delegatedProject({ status: "done", handoff: { returned: true, foldedIn: true } })), []);
});
