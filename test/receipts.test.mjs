// receipts.test.mjs — spec 073 R3: byte-deterministic receipt path/serialize/write/read/check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { receiptPath, serializeReceipt, writeReceipt, readReceipt, checkReceipt } from "../lib/receipts.mjs";

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "receipts-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("receiptPath: joins root, receiptDir, and <noun>.json", () => {
  assert.equal(receiptPath("/r", ".forge", "changes"), join("/r", ".forge", "changes.json"));
});

test("serializeReceipt: sorts object keys recursively, keeps array element order, trailing newline", () => {
  const out = serializeReceipt({ b: 1, a: { d: 2, c: 3 }, list: [{ z: 1, y: 2 }, "x"] });
  assert.equal(out, JSON.stringify({ a: { c: 3, d: 2 }, b: 1, list: [{ y: 2, z: 1 }, "x"] }, null, 2) + "\n");
  assert.ok(out.endsWith("\n"));
});

test("serializeReceipt: byte-identical regardless of input key order", () => {
  assert.equal(serializeReceipt({ a: 1, b: 2 }), serializeReceipt({ b: 2, a: 1 }));
});

test("writeReceipt + readReceipt: round-trips a value and creates the receipt dir", () => {
  const { root, done } = scratch();
  try {
    const path = writeReceipt(root, ".demo", "things", { b: 1, a: 2 });
    assert.equal(path, receiptPath(root, ".demo", "things"));
    assert.deepEqual(readReceipt(root, ".demo", "things"), { b: 1, a: 2 });
    assert.equal(readFileSync(path, "utf8"), serializeReceipt({ b: 1, a: 2 }));
  } finally { done(); }
});

test("readReceipt: null when absent", () => {
  const { root, done } = scratch();
  try {
    assert.equal(readReceipt(root, ".demo", "things"), null);
  } finally { done(); }
});

test("readReceipt: throws on malformed JSON", () => {
  const { root, done } = scratch();
  try {
    mkdirSync(join(root, ".demo"), { recursive: true });
    writeFileSync(join(root, ".demo", "things.json"), "{not json");
    assert.throws(() => readReceipt(root, ".demo", "things"), /malformed JSON/);
  } finally { done(); }
});

test("checkReceipt: absent receipt is ok with reason 'absent'", () => {
  const { root, done } = scratch();
  try {
    assert.deepEqual(checkReceipt(root, ".demo", "things"), { ok: true, reason: "absent" });
  } finally { done(); }
});

test("checkReceipt: a freshly written receipt is ok", () => {
  const { root, done } = scratch();
  try {
    writeReceipt(root, ".demo", "things", { a: 1, b: 2 });
    assert.deepEqual(checkReceipt(root, ".demo", "things"), { ok: true });
  } finally { done(); }
});

test("checkReceipt: a hand-reformatted receipt (different key order, compact) is not ok", () => {
  const { root, done } = scratch();
  try {
    const path = writeReceipt(root, ".demo", "things", { a: 1, b: 2 });
    writeFileSync(path, JSON.stringify({ b: 2, a: 1 }) + "\n");
    const result = checkReceipt(root, ".demo", "things");
    assert.equal(result.ok, false);
    assert.ok(result.reason);
  } finally { done(); }
});

test("checkReceipt: a receipt missing its trailing newline is not ok", () => {
  const { root, done } = scratch();
  try {
    const path = writeReceipt(root, ".demo", "things", { a: 1 });
    writeFileSync(path, readFileSync(path, "utf8").replace(/\n$/, ""));
    assert.equal(checkReceipt(root, ".demo", "things").ok, false);
  } finally { done(); }
});

test("checkReceipt: malformed JSON is not ok, naming the problem", () => {
  const { root, done } = scratch();
  try {
    mkdirSync(join(root, ".demo"), { recursive: true });
    writeFileSync(join(root, ".demo", "things.json"), "{not json");
    const result = checkReceipt(root, ".demo", "things");
    assert.equal(result.ok, false);
    assert.match(result.reason, /malformed JSON/);
  } finally { done(); }
});
