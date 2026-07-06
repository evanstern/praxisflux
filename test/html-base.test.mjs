// The shared HTML base and the deck template must both pass the self-contained verifier.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkHtml } from "../lib/selfcontained.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, "..", rel), "utf8");

test("lib/html/base.html: self-contained, theme-aware, has a data table (zero warnings)", () => {
  const html = read("lib/html/base.html");
  const r = checkHtml(html);
  assert.equal(r.ok, true, r.fails.join("; "));
  assert.deepEqual(r.warns, []); // has <title>, prefers-color-scheme, and a <table>
  assert.match(html, /:root\[data-theme="dark"\]/);
  assert.match(html, /:root\[data-theme="light"\]/);
});

test("educate deck template: derives the theme contract and stays self-contained", () => {
  const html = read("educate/templates/.template/deck.html");
  const r = checkHtml(html);
  assert.equal(r.ok, true, r.fails.join("; "));       // no external loads, has <title>
  assert.match(html, /prefers-color-scheme: dark/);   // now theme-aware
  assert.match(html, /--callout-bg/);                 // literal backgrounds moved to tokens
});
