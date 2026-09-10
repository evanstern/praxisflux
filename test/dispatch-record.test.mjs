// dispatch-record.test.mjs — spec 066 R3 (TASK-0125) Phase 3: the fail-closed check that a
// claimed card carries a dispatch record naming the model that ACTUALLY SERVED.
//
// Why the rule needs a gate at all: an inline-implemented task leaves artifacts identical to a
// dispatched one — same commits, same spec dir, same ticked boxes — so `served=` is the only
// residue that separates them (field case 2026-09-10, docs/design/lane-4-dispatch-gap.md).
//
// NEW surface only. Fixture shapes are lifted from the sibling suites (test/spec-bridge.test.mjs,
// test/project-gates.test.mjs) so the three read as one family; no framework, no subprocess —
// `runGates: false` keeps every checkBridge call here away from declared gate commands.
//
// The last block is the parity proof: with no `requireDispatchRecord` opt-in, a card with no
// record anywhere produces byte-identically the findings it produced before this check existed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  checkBridge, servedModel, dispatchRecordRequired, parseDispatchRecords,
} from "../spec-bridge/gates/bridge.mjs";
import { parseLinkedTask, validateMirror, projectBacklog } from "../lib/board-mirror.mjs";

/* ── fixtures ─────────────────────────────────────────────────────────────────────────────── */

function project() {
  const root = mkdtempSync(join(tmpdir(), "dispatch-record-"));
  mkdirSync(join(root, "backlog", "tasks"), { recursive: true });
  return {
    root,
    config: (obj) => writeFileSync(join(root, ".spec-bridge.json"), JSON.stringify(obj)),
    task: (id, status, body) =>
      writeFileSync(
        join(root, "backlog", "tasks", `${id.toLowerCase()} - fixture.md`),
        `---\nid: ${id}\ntitle: 'Fixture ${id}'\nstatus: ${status}\nassignee: []\n---\n\n## Description\n\n${body}\n`
      ),
    spec: (dir, files) => {
      mkdirSync(join(root, dir), { recursive: true });
      for (const [name, content] of Object.entries(files)) writeFileSync(join(root, dir, name), content);
    },
    done: () => rmSync(root, { recursive: true, force: true }),
  };
}

const HALF_CHECKED = "## Phase 1\n- [x] T001 a\n\n## Phase 2\n- [ ] T002 b\n"; // In Progress
const ALL_CHECKED = "## Phase 1\n- [x] T001 a\n\n## Phase 2\n- [x] T002 b\n"; // Done-eligible
const OPT_IN = { requireDispatchRecord: true };
const GOOD_RECORD = "Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5";

/** A claimed (In Progress) linked card whose spec derives In Progress — the honest mid-PR
 *  state, so nothing but the dispatch check can produce a finding. */
function claimed(p, body) {
  p.task("TASK-1", "In Progress", `Spec: specs/001-a/\n\n${body}`);
  p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": HALF_CHECKED });
}

const dispatchFindings = (r) => r.problems.filter((m) => m.includes("dispatch record") || m.includes("`served=`"));

/* ── servedModel: what counts as a served model ───────────────────────────────────────────── */

test("servedModel accepts a bare model ID, wherever the key sits in the payload", () => {
  assert.equal(servedModel("tier=opus pinned=cc/claude-opus-5[1m] served=claude-opus-5"), "claude-opus-5");
  assert.equal(servedModel("served=claude-opus-5 tier=opus pinned=x"), "claude-opus-5");
  assert.equal(servedModel("tier=s, pinned=y, served=claude-sonnet-5"), "claude-sonnet-5");
  assert.equal(servedModel("tier=x pinned=y served=cc/claude-sonnet-5[1m]"), "cc/claude-sonnet-5[1m]");
});

test("servedModel rejects a missing, empty, or placeholder value", () => {
  assert.equal(servedModel("tier=opus pinned=x"), null);
  assert.equal(servedModel("tier=opus pinned=x served="), null);
  assert.equal(servedModel("tier=opus pinned=x served=TBD"), null);
  assert.equal(servedModel("tier=opus pinned=x served=pending"), null);
  assert.equal(servedModel("tier=opus pinned=x served=to-be-filled"), null);
  assert.equal(servedModel(""), null);
  assert.equal(servedModel(undefined), null);
});

// Both leaks below were MEASURED on a first draft of this parser, not imagined — the first
// one against this very task's own card, which said `served=TO BE FILLED`.
test("servedModel rejects a multi-word value: `served=TO BE FILLED` is not the model \"TO\"", () => {
  assert.equal(servedModel("tier=opus pinned=x served=TO BE FILLED"), null);
  assert.equal(servedModel("tier=opus pinned=x served=TO BE FILLED FROM TRANSCRIPT"), null);
});

test("servedModel rejects prose smuggled after the ID (a model ID has no spaces)", () => {
  assert.equal(servedModel("tier=x pinned=y served=claude-opus-5 (37 occurrences)"), null);
});

test("servedModel does not match a lookalike key", () => {
  assert.equal(servedModel("observed=claude-opus-5"), null);
  assert.equal(servedModel("unserved=claude-opus-5"), null);
});

/* ── parseDispatchRecords: the marker, and one line per dispatch ──────────────────────────── */

test("parseDispatchRecords collects every Dispatch: line in document order", () => {
  const text = `## Description\n\nSpec: specs/001-a\n\n## Comments\n\n${GOOD_RECORD}\n\nprose\n\nDispatch: tier=opus pinned=p served=claude-opus-5\n`;
  assert.deepEqual(parseDispatchRecords(text), [
    "tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5",
    "tier=opus pinned=p served=claude-opus-5",
  ]);
  assert.deepEqual(parseDispatchRecords("no marker here"), []);
});

test("parseLinkedTask exposes dispatches, and omits the key entirely when there are none", () => {
  const withNone = parseLinkedTask("---\nid: TASK-3\nstatus: In Progress\n---\n\nSpec: specs/001-a/\n");
  // Byte-identical to the pre-spec-066 shape — the same additive contract `labels` has.
  assert.deepEqual(withNone, { id: "TASK-3", status: "In Progress", specDir: "specs/001-a", acs: [] });

  const withOne = parseLinkedTask(`---\nid: TASK-3\nstatus: In Progress\n---\n\nSpec: specs/001-a/\n\n${GOOD_RECORD}\n`);
  assert.deepEqual(withOne.dispatches, ["tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5"]);
});

/* ── scoping ──────────────────────────────────────────────────────────────────────────────── */

test("dispatchRecordRequired binds claimed cards and never a merged one", () => {
  assert.equal(dispatchRecordRequired({ status: "In Progress" }), true);
  assert.equal(dispatchRecordRequired({ status: "To Do" }), true);
  assert.equal(dispatchRecordRequired({ status: "Done" }), false);
  assert.equal(dispatchRecordRequired({ status: "done" }), false);
});

/* ── the check, both directions ───────────────────────────────────────────────────────────── */

test("FAILS CLOSED: a claimed card with no dispatch record is reported and blocks", (t) => {
  const p = project();
  t.after(() => p.done());
  p.config(OPT_IN);
  claimed(p, "no record anywhere on this card");

  const { problems } = checkBridge(p.root, { runGates: false });
  const found = problems.filter((m) => m.includes("carries no dispatch record"));
  assert.equal(found.length, 1, problems.join("; "));
  // A failure line names its fix (docs/wiki/gates-convention.md).
  assert.match(found[0], /TASK-1/);
  assert.match(found[0], /not\s+merge-ready/);
  assert.match(found[0], /Dispatch: tier=<tier> pinned=<model-id> served=<model-id>/);
  assert.match(found[0], /backlog task edit TASK-1/);
});

test("CLEAN: a claimed card carrying a record with a real served model passes", (t) => {
  const p = project();
  t.after(() => p.done());
  p.config(OPT_IN);
  claimed(p, GOOD_RECORD);

  const { problems } = checkBridge(p.root, { runGates: false });
  assert.deepEqual(dispatchFindings({ problems }), [], problems.join("; "));
});

test("a record whose served= is still a placeholder is reported, naming that as the reason", (t) => {
  const p = project();
  t.after(() => p.done());
  p.config(OPT_IN);
  claimed(p, "Dispatch: tier=opus pinned=cc/claude-opus-5[1m] served=TO BE FILLED");

  const { problems } = checkBridge(p.root, { runGates: false });
  const found = problems.filter((m) => m.includes("`served=` is still a placeholder"));
  assert.equal(found.length, 1, problems.join("; "));
  // The distinct message matters: "you wrote the record, now fill it in" is a different
  // instruction from "you wrote no record", and the reader acts on which one they get.
  assert.ok(!problems.some((m) => m.includes("carries no dispatch record")), problems.join("; "));
});

test("one valid record among several placeholders satisfies the check", (t) => {
  const p = project();
  t.after(() => p.done());
  p.config(OPT_IN);
  claimed(p, `Dispatch: tier=opus pinned=p served=TBD\n\n${GOOD_RECORD}`);

  assert.deepEqual(dispatchFindings(checkBridge(p.root, { runGates: false })), []);
});

test("a Done card with no record is NOT reported — merged work is out of scope by construction", (t) => {
  const p = project();
  t.after(() => p.done());
  p.config(OPT_IN);
  p.task("TASK-1", "Done", "Spec: specs/001-a/\n\nno record, and never had one");
  p.spec("specs/001-a", { "spec.md": "s", "plan.md": "p", "tasks.md": ALL_CHECKED });

  assert.deepEqual(dispatchFindings(checkBridge(p.root, { runGates: false })), []);
});

test("the finding is independent of the status verdict: an honest card still owes its record", (t) => {
  const p = project();
  t.after(() => p.done());
  p.config(OPT_IN);
  claimed(p, "no record"); // In Progress over an In Progress spec: verdict "ok"

  const { links, problems } = checkBridge(p.root, { runGates: false });
  assert.equal(links[0].verdict, "ok");
  assert.equal(problems.filter((m) => m.includes("carries no dispatch record")).length, 1);
});

/* ── the mirror carries the field too ─────────────────────────────────────────────────────── */

test("projectBacklog projects dispatches, and validateMirror treats the field as optional", (t) => {
  const p = project();
  t.after(() => p.done());
  claimed(p, GOOD_RECORD);
  const links = projectBacklog(p.root);
  assert.deepEqual(links[0].dispatches, ["tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5"]);

  const mirror = { schema: 1, provider: "backlog", generatedAt: "x", links };
  assert.deepEqual(validateMirror(mirror), []);
  // Absent is valid (every mirror written before this field existed).
  assert.deepEqual(validateMirror({ ...mirror, links: [{ id: "T", status: "Done", specDir: "s", acs: [] }] }), []);
  // Present-but-malformed names the offending link, exactly as labels does.
  assert.ok(validateMirror({ ...mirror, links: [{ id: "T", status: "Done", specDir: "s", acs: [], dispatches: "x" }] })
    .some((m) => m === "links[0].dispatches: expected array, got string"));
});

/* ── parity: no opt-in, no behavior change ────────────────────────────────────────────────── */

test("without the opt-in, a claimed card with no record anywhere produces byte-identical output", (t) => {
  const p = project();
  t.after(() => p.done());
  claimed(p, "no record anywhere"); // NO .spec-bridge.json at all

  const { problems, warnings } = checkBridge(p.root, { runGates: false });
  assert.deepEqual(problems, []);
  assert.deepEqual(warnings, []);
});

test("a non-boolean requireDispatchRecord does not opt in — the flag is strictly === true", (t) => {
  const p = project();
  t.after(() => p.done());
  claimed(p, "no record anywhere");
  for (const value of ["true", 1, {}, null]) {
    p.config({ requireDispatchRecord: value });
    assert.deepEqual(checkBridge(p.root, { runGates: false }).problems, [], `opted in on ${JSON.stringify(value)}`);
  }
});
