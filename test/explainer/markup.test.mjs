import assert from "node:assert/strict";
import { test } from "node:test";

import { MarkupError, parse, serialize } from "../../explainer/scripts/lib/markup.mjs";

test("parses nested elements, attributes (quoted, unquoted, boolean) and text", () => {
  const nodes = parse('<p class="a" hidden data-x=1>Hello <b>world</b></p>', { file: "f.html" });
  assert.equal(nodes.length, 1);
  const p = nodes[0];
  assert.equal(p.type, "element");
  assert.equal(p.tag, "p");
  assert.equal(p.attrs.class, "a");
  assert.equal(p.attrs.hidden, "");
  assert.equal(p.attrs["data-x"], "1");
  assert.equal(p.children.length, 2);
  assert.equal(p.children[0].type, "text");
  assert.equal(p.children[0].value, "Hello ");
  assert.equal(p.children[1].tag, "b");
});

test("round-trips through serialize()", () => {
  const html = '<div class="ex-callout"><p>Note &amp; detail</p></div>';
  const nodes = parse(html, { file: "f.html" });
  assert.equal(serialize(nodes), html);
});

test("self-closing elements (x-* style) have no children", () => {
  const nodes = parse('<x-cite s="s-core"/>', { file: "f.html" });
  assert.equal(nodes[0].selfClosing, true);
  assert.deepEqual(nodes[0].children, []);
});

test("real HTML void elements don't require a closing tag", () => {
  const nodes = parse("<p>line one<br>line two</p>", { file: "f.html" });
  const br = nodes[0].children.find((n) => n.type === "element" && n.tag === "br");
  assert.ok(br);
  assert.equal(br.selfClosing, true);
});

test("comments are preserved and don't break parsing", () => {
  const nodes = parse("<!-- a note --><p>ok</p>", { file: "f.html" });
  assert.equal(nodes[0].type, "comment");
  assert.equal(nodes[0].value, " a note ");
  assert.equal(nodes[1].tag, "p");
});

test("svg-shaped markup: explicit close tags on shape elements, not self-closing", () => {
  const html =
    '<svg viewBox="0 0 10 10"><g class="node" data-panel="core">' +
    '<rect x="1" y="2" width="3" height="4" rx="1"></rect>' +
    '<text x="1" y="2">core</text></g></svg>';
  const nodes = parse(html, { file: "f.html" });
  const svg = nodes[0];
  assert.equal(svg.tag, "svg");
  const g = svg.children[0];
  assert.equal(g.attrs["data-panel"], "core");
  const rect = g.children.find((n) => n.tag === "rect");
  assert.equal(rect.selfClosing, false);
  assert.equal(serialize([rect]), '<rect x="1" y="2" width="3" height="4" rx="1"></rect>');
});

test("an unclosed tag throws a MarkupError with file:line", () => {
  assert.throws(
    () => parse("<p>one\n<b>two", { file: "pages/x.html" }),
    (err) => {
      assert.ok(err instanceof MarkupError);
      assert.match(err.message, /^pages\/x\.html:2: <b> opened here is never closed/);
      return true;
    }
  );
});

test("a mismatched closing tag throws with the opening tag's line", () => {
  assert.throws(
    () => parse("<p>\n<b>bold</i>\n</p>", { file: "pages/x.html" }),
    (err) => {
      assert.ok(err instanceof MarkupError);
      assert.match(err.message, /^pages\/x\.html:2: expected <\/b>/);
      return true;
    }
  );
});

test("a stray closing tag with nothing open throws", () => {
  assert.throws(() => parse("<p>hi</p></p>", { file: "f.html" }), /unexpected closing tag/);
});

test("an unterminated attribute value throws", () => {
  assert.throws(() => parse('<p class="unterminated>hi</p>', { file: "f.html" }), /unterminated value/);
});
