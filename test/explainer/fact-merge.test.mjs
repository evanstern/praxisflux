import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { mergeFactCheck, mergeFactCheckFiles } from "../../explainer/scripts/lib/fact-merge.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, "..", "..", "explainer", "scripts", "explainer.mjs");

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", ...opts });
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "explainer-fact-merge-"));
}

function entry(page, claim, status = "supported", extra = {}) {
  return { page, claim, status, fact_ids: [], note: "", ...extra };
}

// --- pure mergeFactCheck -----------------------------------------------------

test("mergeFactCheck replaces only the recheck's pages, keeping others verbatim and in order", () => {
  const base = [
    entry("overview", "Claim A", "supported"),
    entry("overview", "Claim B", "wrong", { note: "stale" }),
    entry("details", "Claim C", "supported"),
    entry("faq", "Claim D", "unsupported", { note: "no fact" }),
  ];
  const recheck = [
    entry("overview", "Claim A", "supported"),
    entry("overview", "Claim B fixed", "supported"),
  ];

  const { merged, pagesReplaced, counts } = mergeFactCheck({ base, recheck });

  // "details" and "faq" entries are untouched, in their original position.
  assert.deepEqual(
    merged.filter((e) => e.page === "details"),
    [entry("details", "Claim C", "supported")]
  );
  assert.deepEqual(
    merged.filter((e) => e.page === "faq"),
    [entry("faq", "Claim D", "unsupported", { note: "no fact" })]
  );
  // "overview"'s old entries are gone; the recheck's entries replace them,
  // in the recheck's own order.
  assert.deepEqual(
    merged.filter((e) => e.page === "overview"),
    recheck
  );
  assert.deepEqual(pagesReplaced, ["overview"]);
  assert.deepEqual(counts, { supported: 3, unsupported: 1 });

  // Order: untouched pages first (in their original relative order), then
  // the recheck's entries appended.
  assert.deepEqual(
    merged.map((e) => e.page),
    ["details", "faq", "overview", "overview"]
  );
});

test("mergeFactCheck appends a recheck entry for a page the base never had", () => {
  const base = [entry("overview", "Claim A", "supported")];
  const recheck = [
    entry("overview", "Claim A", "supported"),
    entry("glossary", "Claim A recurs here too", "wrong", { note: "recurrence" }),
  ];

  const { merged, pagesReplaced, counts } = mergeFactCheck({ base, recheck });

  assert.deepEqual(
    merged.find((e) => e.page === "glossary"),
    entry("glossary", "Claim A recurs here too", "wrong", { note: "recurrence" })
  );
  // "glossary" never had a base entry to drop, so it's not reported as a
  // "replaced" page — only "overview" is.
  assert.deepEqual(pagesReplaced, ["overview"]);
  assert.deepEqual(counts, { supported: 1, wrong: 1 });
});

test("mergeFactCheck throws a clear error for a non-array base or recheck", () => {
  assert.throws(() => mergeFactCheck({ base: { not: "an array" }, recheck: [] }), /fact-check\.json must be a JSON array/);
  assert.throws(() => mergeFactCheck({ base: [], recheck: "nope" }), /fact-check\.recheck\.json must be a JSON array/);
});

test("mergeFactCheck throws a clear error for an entry missing page/claim/status", () => {
  assert.throws(() => mergeFactCheck({ base: [{ claim: "x", status: "supported" }], recheck: [] }), /missing a string "page"/);
  assert.throws(() => mergeFactCheck({ base: [], recheck: [{ page: "a", status: "supported" }] }), /missing a string "claim"/);
  assert.throws(() => mergeFactCheck({ base: [{ page: "a", claim: "x" }], recheck: [] }), /missing a string "status"/);
});

// --- file-level wrapper -------------------------------------------------------

test("mergeFactCheckFiles writes the merged file and deletes the recheck file", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    fs.writeFileSync(
      path.join(dir, "dist", "fact-check.json"),
      JSON.stringify([entry("overview", "Claim A", "wrong", { note: "stale" }), entry("details", "Claim C")])
    );
    fs.writeFileSync(
      path.join(dir, "dist", "fact-check.recheck.json"),
      JSON.stringify([entry("overview", "Claim A fixed", "supported")])
    );

    const result = mergeFactCheckFiles({ dir });

    assert.equal(result.ok, true);
    assert.deepEqual(result.pagesReplaced, ["overview"]);
    assert.deepEqual(result.counts, { supported: 2 });

    const written = JSON.parse(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"));
    assert.deepEqual(
      written.map((e) => e.page),
      ["details", "overview"]
    );
    assert.equal(fs.existsSync(path.join(dir, "dist", "fact-check.recheck.json")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("mergeFactCheckFiles leaves fact-check.json untouched when the recheck file is missing", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    const original = JSON.stringify([entry("overview", "Claim A")]);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.json"), original);

    const result = mergeFactCheckFiles({ dir });

    assert.equal(result.ok, false);
    assert.match(result.error, /fact-check\.recheck\.json/);
    assert.equal(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("mergeFactCheckFiles leaves fact-check.json untouched when the base file is missing", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    fs.writeFileSync(path.join(dir, "dist", "fact-check.recheck.json"), JSON.stringify([entry("overview", "Claim A")]));

    const result = mergeFactCheckFiles({ dir });

    assert.equal(result.ok, false);
    assert.match(result.error, /fact-check\.json/);
    assert.equal(fs.existsSync(path.join(dir, "dist", "fact-check.json")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("mergeFactCheckFiles leaves fact-check.json untouched when the recheck file is invalid JSON", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    const original = JSON.stringify([entry("overview", "Claim A")]);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.json"), original);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.recheck.json"), "{not valid json");

    const result = mergeFactCheckFiles({ dir });

    assert.equal(result.ok, false);
    assert.match(result.error, /invalid JSON/);
    assert.equal(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("mergeFactCheckFiles leaves fact-check.json untouched when the base file is not an array", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    const original = JSON.stringify({ not: "an array" });
    fs.writeFileSync(path.join(dir, "dist", "fact-check.json"), original);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.recheck.json"), JSON.stringify([entry("overview", "Claim A")]));

    const result = mergeFactCheckFiles({ dir });

    assert.equal(result.ok, false);
    assert.match(result.error, /must be a JSON array/);
    assert.equal(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- CLI ----------------------------------------------------------------------

test("fact-merge with no --dir prints usage and exits 2", () => {
  const result = run(["fact-merge"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: explainer\.mjs fact-merge --dir/);
});

test("fact-merge CLI happy path writes the merged file, deletes the recheck file, and prints the summary", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    fs.writeFileSync(
      path.join(dir, "dist", "fact-check.json"),
      JSON.stringify([
        entry("overview", "Claim A", "wrong", { note: "stale" }),
        entry("details", "Claim C", "supported"),
      ])
    );
    fs.writeFileSync(
      path.join(dir, "dist", "fact-check.recheck.json"),
      JSON.stringify([entry("overview", "Claim A fixed", "supported")])
    );

    const result = run(["fact-merge", "--dir", dir]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /fact-merge: replaced 1 page\(s\) \(overview\)/);
    assert.match(result.stdout, /supported: 2/);

    const written = JSON.parse(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"));
    assert.equal(written.length, 2);
    assert.ok(written.every((e) => e.status === "supported"));
    assert.equal(fs.existsSync(path.join(dir, "dist", "fact-check.recheck.json")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("fact-merge CLI exits 2 and leaves fact-check.json untouched when the recheck file is missing", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    const original = JSON.stringify([entry("overview", "Claim A")]);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.json"), original);

    const result = run(["fact-merge", "--dir", dir]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /fact-merge:/);
    assert.equal(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("fact-merge CLI exits 2 and leaves fact-check.json untouched when the base file is not valid JSON", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    const original = "{not valid json";
    fs.writeFileSync(path.join(dir, "dist", "fact-check.json"), original);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.recheck.json"), JSON.stringify([entry("overview", "Claim A")]));

    const result = run(["fact-merge", "--dir", dir]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /invalid JSON/);
    assert.equal(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("fact-merge CLI exits 2 and leaves fact-check.json untouched when the recheck file is not an array", () => {
  const dir = tmpDir();
  try {
    fs.mkdirSync(path.join(dir, "dist"));
    const original = JSON.stringify([entry("overview", "Claim A")]);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.json"), original);
    fs.writeFileSync(path.join(dir, "dist", "fact-check.recheck.json"), JSON.stringify({ not: "an array" }));

    const result = run(["fact-merge", "--dir", dir]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /must be a JSON array/);
    assert.equal(fs.readFileSync(path.join(dir, "dist", "fact-check.json"), "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
