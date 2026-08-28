import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readMirror, writeMirror, validateMirror, compareIds, mirrorPath } from "../lib/board-mirror.mjs";

function project() {
  const root = mkdtempSync(join(tmpdir(), "board-mirror-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

const BASE_MIRROR = {
  schema: 1,
  provider: "backlog",
  generatedAt: "2026-08-27T14:02:11.000Z",
  links: [
    { id: "TASK-9", status: "To Do", specDir: "specs/009-a", acs: [] },
    { id: "TASK-10", status: "In Progress", specDir: "specs/010-b", acs: [{ index: 1, checked: true, text: "Spec phase: Seam" }] },
  ],
};

// AC #3 — natural id ordering.
test("compareIds sorts TASK-9 before TASK-10 and TASK-6.2 before TASK-6.10", () => {
  assert.ok(compareIds("TASK-9", "TASK-10") < 0);
  assert.ok(compareIds("TASK-10", "TASK-9") > 0);
  assert.ok(compareIds("TASK-6.2", "TASK-6.10") < 0);
  assert.equal(compareIds("TASK-9", "TASK-9"), 0);
});

// AC #2 — absent, malformed, and unknown-schema reads.
test("readMirror: null when absent, throws on malformed JSON, throws on unknown schema", () => {
  const p = project();
  try {
    assert.equal(readMirror(p.root), null);

    mkdirSync(join(p.root, ".board"), { recursive: true });
    writeFileSync(join(p.root, ".board", "links.json"), "{not json");
    assert.throws(() => readMirror(p.root), /malformed JSON/);

    writeFileSync(join(p.root, ".board", "links.json"), JSON.stringify({ schema: 99, provider: "x", generatedAt: "y", links: [] }));
    assert.throws(() => readMirror(p.root), /unknown schema/);
  } finally {
    p.done();
  }
});

test("readMirror round-trips a well-formed mirror written by writeMirror", () => {
  const p = project();
  try {
    writeMirror(p.root, BASE_MIRROR);
    const back = readMirror(p.root);
    assert.equal(back.schema, 1);
    assert.equal(back.links.length, 2);
  } finally {
    p.done();
  }
});

// AC #3 — byte-determinism and natural sort in writeMirror's output.
test("writeMirror is byte-deterministic and sorts links naturally", () => {
  const p = project();
  try {
    // Feed links out of order; writeMirror must sort them.
    const scrambled = { ...BASE_MIRROR, links: [...BASE_MIRROR.links].reverse() };
    writeMirror(p.root, scrambled);
    const first = readFileSync(mirrorPath(p.root), "utf8");

    writeMirror(p.root, scrambled);
    const second = readFileSync(mirrorPath(p.root), "utf8");
    assert.equal(first, second, "writing the same logical mirror twice must produce identical bytes");

    assert.ok(first.endsWith("\n"));
    const parsed = JSON.parse(first);
    assert.deepEqual(parsed.links.map((l) => l.id), ["TASK-9", "TASK-10"]);
  } finally {
    p.done();
  }
});

test("writeMirror round-trips unknown top-level and per-link keys", () => {
  const p = project();
  try {
    const withExtras = {
      ...BASE_MIRROR,
      futureField: "kept",
      links: [{ ...BASE_MIRROR.links[0], futureLinkField: 42 }],
    };
    writeMirror(p.root, withExtras);
    const back = readMirror(p.root);
    assert.equal(back.futureField, "kept");
    assert.equal(back.links[0].futureLinkField, 42);
  } finally {
    p.done();
  }
});

// AC #4 — validateMirror's checks.
test("validateMirror catches missing required fields and wrong types", () => {
  assert.deepEqual(validateMirror({ provider: "backlog", generatedAt: "x", links: [] }), [
    "schema: expected number, got missing",
  ]);
  const problems = validateMirror({ schema: "1", provider: 5, generatedAt: "x", links: [] });
  assert.ok(problems.some((m) => m === "schema: expected number, got string"));
  assert.ok(problems.some((m) => m === "provider: expected string, got number"));
});

test("validateMirror catches duplicate id and duplicate specDir", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [] },
      { id: "TASK-1", status: "To Do", specDir: "specs/002-b", acs: [] },
      { id: "TASK-2", status: "To Do", specDir: "specs/002-b", acs: [] },
    ],
  };
  const problems = validateMirror(mirror);
  assert.ok(problems.includes("duplicate id: TASK-1"));
  assert.ok(problems.includes("duplicate specDir: specs/002-b"));
});

test("validateMirror catches non-monotonic acs index", () => {
  const mirror = {
    schema: 1, provider: "backlog", generatedAt: "x",
    links: [
      { id: "TASK-1", status: "To Do", specDir: "specs/001-a", acs: [
        { index: 2, checked: true, text: "b" },
        { index: 1, checked: false, text: "a" },
      ] },
    ],
  };
  const problems = validateMirror(mirror);
  assert.ok(problems.some((m) => m.includes("acs index not monotonic")));
});

test("validateMirror is clean on a well-formed mirror", () => {
  assert.deepEqual(validateMirror(BASE_MIRROR), []);
});
