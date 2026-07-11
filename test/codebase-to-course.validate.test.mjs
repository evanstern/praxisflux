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

// TASK-19 repros — orphan .translation-code panels outside any block. The old
// findBlocks bounded each chunk at the NEXT block's open tag, so every one of
// these passed or blamed the wrong block against the shipped validator.
const orphanPanel = (code) =>
  `<div class="translation-code"><pre><code><span class="code-line">${code}</span></code></pre></div>`;

test("orphans: a panel between two healthy blocks fails as orphan, not as the neighbor's pairing bug", () => {
  const html =
    block({ codeLines: ["a();"], notes: ["A."] }) +
    orphanPanel("stray();") +
    block({ codeLines: ["b();"], notes: ["B."] });
  const { fails } = checkTranslationBlocks(html, "t");
  // old logic: the orphan's .code-line landed in block 1's chunk -> "2 .code-line vs 1 .tl"
  assert.ok(!fails.some((f) => f.includes(".code-line vs")), `healthy blocks must not take the blame: ${fails}`);
  const orphanFails = fails.filter((f) => f.includes("orphan"));
  assert.ok(orphanFails.length >= 1, `expected orphan failures, got: ${fails}`);
  assert.match(orphanFails[0], /line \d+/);
  assert.match(orphanFails[0], /Wrap it in a \.translation-block or delete it/);
});

test("orphans: a stray .tl after a genuinely broken block must not cancel the real pairing bug", () => {
  const html =
    block({ codeLines: ["a();", "b();"], notes: ["Only one note."] }) + // REAL bug: 2 code vs 1 tl
    '<p class="tl">orphan note</p>';
  const { fails } = checkTranslationBlocks(html, "t");
  // old logic: the orphan .tl fell into block 1's chunk, 2v2, false green
  assert.ok(fails.some((f) => f.includes("2 .code-line vs 1 .tl")), `the real bug must surface: ${fails}`);
  assert.ok(fails.some((f) => f.includes("orphan .tl note")), `the orphan must surface too: ${fails}`);
});

test("orphans: panels before the first block and in block-free files are no longer invisible", () => {
  const before = orphanPanel("unbalanced((") + block({ codeLines: ["a();"], notes: ["A."] });
  assert.ok(checkTranslationBlocks(before, "t").fails.some((f) => f.includes("orphan")));
  const blockFree = orphanPanel("dangling(");
  const r = checkTranslationBlocks(blockFree, "t");
  assert.equal(r.blocks, 0);
  assert.ok(r.fails.some((f) => f.includes("orphan")), `block-free file must still fail: ${r.fails}`);
});

test("orphans: an unclosed .translation-block open tag fails loudly instead of vanishing", () => {
  const unclosed = '<div class="translation-block"><div class="translation-code"><pre><code><span class="code-line">a();</span></code></pre></div>';
  const { fails } = checkTranslationBlocks(unclosed, "t");
  assert.ok(fails.some((f) => f.includes("no matching closing")), `unclosed block must be named: ${fails}`);
});

test("orphans: --fix inserts at correct offsets with an orphan panel sitting after the block", () => {
  const truncated = block({
    codeLines: ["register(handlers, {", "  onReady: start,"],
    notes: ["Wire up…", "…when ready."],
  });
  const html = truncated + orphanPanel("noise();");
  const r = fixTranslationBlocks(html, "t");
  assert.equal(r.fixed, 1);
  assert.deepEqual(r.unfixable, []);
  const after = checkTranslationBlocks(r.html, "t");
  // the block itself is healed; only the orphan remains, still at its own line
  assert.ok(after.fails.every((f) => f.includes("orphan")), `only orphan failures should remain: ${after.fails}`);
  assert.ok(r.html.includes("})"), "closers must land inside the block, not in the orphan");
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
