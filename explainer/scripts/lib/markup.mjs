// A small, built-ins-only well-formed-HTML tag scanner for page middles.
//The authoring dialect is deliberately
// restricted so this can be a small hand-rolled recursive-descent parser
// rather than "regex soup" over the whole document: every opened tag must be
// explicitly closed — no HTML5 implicit-close inference — except a fixed
// list of real HTML void elements and any tag the author self-closes with
// "/>" (every x-* element that has no children: x-cite, x-file, x-diagram,
// x-include all self-close; x-term, x-page, x-example wrap content and so
// are closed normally). Both reference artifacts already write this way
// (the reference site's SVGs close every <rect>/<line>/<path> explicitly rather than
// self-closing them), so restricting authors to it costs nothing in
// practice while making "leftover x-*" and "unterminated tag" failures
// precise: every error carries file:line.

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export class MarkupError extends Error {
  constructor(message, { file, line } = {}) {
    super(`${file ?? "<input>"}:${line ?? "?"}: ${message}`);
    this.name = "MarkupError";
    this.file = file;
    this.line = line;
  }
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Parses `html` (one page middle, or a small generated fragment) into an
 * array of top-level nodes:
 *   { type: "text", value, line }
 *   { type: "comment", value, line }
 *   { type: "element", tag, attrs, children, selfClosing, line }
 * `attrs` is a plain object; a boolean attribute (no "=") maps to "".
 * Throws MarkupError — message prefixed "<file>:<line>: " — on any
 * well-formedness problem: an unterminated start tag, a tag that is never
 * closed, a mismatched closing tag, or a stray closing tag with nothing
 * open.
 */
export function parse(html, { file } = {}) {
  const len = html.length;
  let pos = 0;
  const lineCache = { at: 0, line: 1 };

  function currentLine() {
    if (pos < lineCache.at) {
      lineCache.at = 0;
      lineCache.line = 1;
    }
    for (let i = lineCache.at; i < pos; i += 1) {
      if (html[i] === "\n") lineCache.line += 1;
    }
    lineCache.at = pos;
    return lineCache.line;
  }

  function fail(message, line = currentLine()) {
    throw new MarkupError(message, { file, line });
  }

  function skipWs() {
    while (pos < len && /\s/.test(html[pos])) pos += 1;
  }

  function parseAttrs() {
    const attrs = {};
    for (;;) {
      skipWs();
      if (pos >= len || html[pos] === ">" || html.startsWith("/>", pos)) break;
      const nameMatch = /^[^\s=/>]+/.exec(html.slice(pos));
      if (!nameMatch) fail("expected an attribute name");
      const name = nameMatch[0];
      pos += name.length;
      skipWs();
      if (html[pos] === "=") {
        pos += 1;
        skipWs();
        const quote = html[pos];
        if (quote === '"' || quote === "'") {
          const end = html.indexOf(quote, pos + 1);
          if (end === -1) fail(`unterminated value for attribute "${name}"`);
          attrs[name] = html.slice(pos + 1, end);
          pos = end + 1;
        } else {
          const valueMatch = /^[^\s>]+/.exec(html.slice(pos));
          const value = valueMatch ? valueMatch[0] : "";
          attrs[name] = value;
          pos += value.length;
        }
      } else {
        attrs[name] = "";
      }
    }
    return attrs;
  }

  function parseElement() {
    const startLine = currentLine();
    const tagMatch = /^<([a-zA-Z][a-zA-Z0-9:-]*)/.exec(html.slice(pos));
    if (!tagMatch) fail('expected a tag name after "<"');
    const tag = tagMatch[1];
    pos += tagMatch[0].length;
    const attrs = parseAttrs();
    skipWs();

    let selfClosing = false;
    if (html.startsWith("/>", pos)) {
      selfClosing = true;
      pos += 2;
    } else if (html[pos] === ">") {
      pos += 1;
    } else {
      fail(`unterminated start tag <${tag}>`, startLine);
    }

    const lowerTag = tag.toLowerCase();
    if (selfClosing || VOID_ELEMENTS.has(lowerTag)) {
      return { type: "element", tag, attrs, children: [], selfClosing: true, line: startLine };
    }

    const children = parseNodes();
    if (!html.startsWith("</", pos)) {
      fail(`<${tag}> opened here is never closed`, startLine);
    }
    const closeMatch = /^<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>/.exec(html.slice(pos));
    if (!closeMatch) fail("malformed closing tag");
    if (closeMatch[1].toLowerCase() !== lowerTag) {
      fail(`expected </${tag}> (opened here) but found </${closeMatch[1]}>`, startLine);
    }
    pos += closeMatch[0].length;
    return { type: "element", tag, attrs, children, selfClosing: false, line: startLine };
  }

  function parseNodes() {
    const nodes = [];
    for (;;) {
      if (pos >= len) break;
      if (html.startsWith("<!--", pos)) {
        const end = html.indexOf("-->", pos + 4);
        if (end === -1) fail("unterminated comment");
        nodes.push({ type: "comment", value: html.slice(pos + 4, end), line: currentLine() });
        pos = end + 3;
        continue;
      }
      if (html[pos] === "<") {
        if (html[pos + 1] === "/") break; // closing tag: belongs to the caller
        nodes.push(parseElement());
        continue;
      }
      const next = html.indexOf("<", pos);
      const textEnd = next === -1 ? len : next;
      nodes.push({ type: "text", value: html.slice(pos, textEnd), line: currentLine() });
      pos = textEnd;
    }
    return nodes;
  }

  const nodes = parseNodes();
  if (pos < len) {
    const closeMatch = /^<\/([a-zA-Z][a-zA-Z0-9:-]*)/.exec(html.slice(pos));
    fail(`unexpected closing tag </${closeMatch ? closeMatch[1] : "?"}> with no matching open tag`);
  }
  return nodes;
}

function serializeAttrs(attrs) {
  return Object.entries(attrs)
    .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${escapeAttr(v)}"`))
    .join("");
}

function serializeNode(node) {
  if (node.type === "text") return node.value;
  if (node.type === "comment") return `<!--${node.value}-->`;
  const attrStr = serializeAttrs(node.attrs);
  if (node.selfClosing) return `<${node.tag}${attrStr} />`;
  return `<${node.tag}${attrStr}>${serialize(node.children)}</${node.tag}>`;
}

/** Re-renders a node array (from `parse`) back into an HTML string. */
export function serialize(nodes) {
  return nodes.map(serializeNode).join("");
}
