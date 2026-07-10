// codebase-to-course.validate.test.mjs — the translation-block validator (references/validate.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scanBalance,
  checkTranslationBlocks,
  fixTranslationBlocks,
} from "../codebase-to-course/skills/codebase-to-course/references/validate.mjs";

function block({ codeLines, notes, attrs = "" }) {
  return (
    `<div class="translation-block"${attrs}><div class="translation-code"><pre><code>\n` +
    codeLines.map((l) => `<span class="code-line">${l}</span>`).join("\n") +
    `\n</code></pre></div><div class="translation-english"><div class="translation-lines">` +
    notes.map((n) => `<p class="tl">${n}</p>`).join("") +
    `</div></div></div>`
  );
}

test("scanBalance: balanced code passes; brackets in strings and comments are ignored", () => {
  assert.equal(scanBalance("const x = { a: [1, (2)] };").errs.length, 0);
  assert.equal(scanBalance('log("close me not )") // } trailing\nconst s = \'([{\';').errs.length, 0);
  assert.equal(scanBalance("/* ( [ { */ done();").errs.length, 0);
});

test("scanBalance: template literals span lines and hide their contents", () => {
  const sql = "db.execute(sql`\n  WHERE id IN (${idList(ids)})\n`)";
  assert.equal(scanBalance(sql).errs.length, 0);
  const cut = "Promise.all([\n  db.execute(sql`\n  SELECT 1\n`),";
  const r = scanBalance(cut);
  assert.deepEqual(r.unclosed, ["(", "["]);
  assert.ok(r.fixable);
});

test("scanBalance: # comments only before whitespace — CSS hex and #include stay code", () => {
  assert.equal(scanBalance(".btn { color: #fff; }").errs.length, 0);
  assert.equal(scanBalance("#include <stdio.h>\nint main() { return 0; }").errs.length, 0);
  assert.equal(scanBalance("x = (1 + 2)  # totals (unclosed here").errs.length, 0);
});

test("scanBalance: stray and mismatched closers are hard (unfixable) errors", () => {
  const stray = scanBalance("} else if (x) {");
  assert.ok(stray.errs.some((e) => e.includes("stray '}'")));
  assert.ok(!stray.fixable);
  const crossed = scanBalance("f(a[)]");
  assert.ok(crossed.errs.some((e) => e.includes("closed by")));
});

test("checkTranslationBlocks: pairing mismatch and opt-out", () => {
  const bad = block({ codeLines: ["go();", "stop();"], notes: ["Go."] });
  assert.ok(checkTranslationBlocks(bad, "t").fails.some((f) => f.includes("2 .code-line vs 1 .tl")));
  const optedOut = block({ codeLines: ["fragment(("], notes: ["A shape.", "Extra."], attrs: ' data-validate="off"' });
  assert.equal(checkTranslationBlocks(optedOut, "t").fails.length, 0);
});

test("checkTranslationBlocks: entities decode before balancing; tl-inline is not tl", () => {
  const ok = block({ codeLines: ["if (a &lt; b &amp;&amp; c) { run(); }"], notes: ["Compare."] });
  assert.equal(checkTranslationBlocks(ok, "t").fails.length, 0);
  const withInline = block({ codeLines: ["go();"], notes: ["Go."] }).replace(
    "</code>",
    '<span class="tl-inline">runtime clone</span></code>'
  );
  assert.equal(checkTranslationBlocks(withInline, "t").fails.length, 0);
});

test("fixTranslationBlocks: auto-close round-trips to passing with pairing intact", () => {
  const truncated = block({
    codeLines: ["register(handlers, {", "  onReady: start,"],
    notes: ["Wire up the handlers…", "…starting when ready."],
  });
  assert.ok(checkTranslationBlocks(truncated, "t").fails.length > 0);
  const r = fixTranslationBlocks(truncated, "t");
  assert.equal(r.fixed, 1);
  assert.deepEqual(r.unfixable, []);
  assert.equal(checkTranslationBlocks(r.html, "t").fails.length, 0, JSON.stringify(checkTranslationBlocks(r.html, "t").fails));
  assert.ok(r.html.includes("})"), "closers should close { then (");
});

test("fixTranslationBlocks: hard errors are reported unfixable and left untouched", () => {
  const stray = block({ codeLines: ["} else {"], notes: ["The other branch."] });
  const r = fixTranslationBlocks(stray, "t");
  assert.equal(r.fixed, 0);
  assert.deepEqual(r.unfixable, [1]);
  assert.equal(r.html, stray);
});
