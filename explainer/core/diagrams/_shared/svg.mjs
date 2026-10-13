// Shared XML escaping + element builders for core diagram generators.
//Output must use only the shared base classes passed
// in via `ctx.classes` (lib/shell.mjs's `DIAGRAM_BASE_CLASSES`) — never a
// literal colour or `var()` in an SVG attribute; these builders never
// accept a `fill`/`stroke` colour argument, by construction.

export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attrsToString(attrs = {}) {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${escapeAttr(v)}"`))
    .join(" ");
}

/** A paired element, e.g. `el("text", {x, y}, "hello")` -> `<text x="..." y="...">hello</text>`. */
export function el(tag, attrs = {}, children = "") {
  const a = attrsToString(attrs);
  const content = Array.isArray(children) ? children.join("") : children;
  return a ? `<${tag} ${a}>${content}</${tag}>` : `<${tag}>${content}</${tag}>`;
}

/** A self-closing element, e.g. `selfClosing("rect", {x, y, width, height})`. */
export function selfClosing(tag, attrs = {}) {
  const a = attrsToString(attrs);
  return a ? `<${tag} ${a}/>` : `<${tag}/>`;
}

export const rect = (attrs) => selfClosing("rect", attrs);
export const line = (attrs) => selfClosing("line", attrs);
export const circle = (attrs) => selfClosing("circle", attrs);
export const polyline = (attrs) => selfClosing("polyline", attrs);
export const polygon = (attrs) => selfClosing("polygon", attrs);

/**
 * A straight connector line from `(x1,y1)` to `(x2,y2)` plus a small
 * two-segment chevron pointing into the destination — the general
 * (any-direction) counterpart to `sequence/render.mjs`'s horizontal-only
 * local `arrow()` helper, for generators whose connections aren't all on
 * one axis (e.g. `swimlanes`, where two cells can sit in different lanes
 * *and* different columns). Never a filled `<marker>` (that would need
 * a colour attribute of its own) — the chevron is drawn as two more
 * stroked line segments, coloured only by `cls`.
 */
export function connector(x1, y1, x2, y2, cls, dashed) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = 7;
  const headSpread = 4.5;
  const px = -uy; // unit vector perpendicular to the line
  const py = ux;
  const backX = x2 - ux * headLen;
  const backY = y2 - uy * headLen;
  return [
    line({ x1, y1, x2, y2, class: cls, "stroke-dasharray": dashed ? "4,3" : undefined }),
    line({ x1: x2, y1: y2, x2: backX + px * headSpread, y2: backY + py * headSpread, class: cls }),
    line({ x1: x2, y1: y2, x2: backX - px * headSpread, y2: backY - py * headSpread, class: cls }),
  ].join("");
}

/** A single-line `<text>`, content escaped. */
export function text(attrs, content) {
  return el("text", attrs, escapeText(content));
}

/**
 * Multi-line text as a stack of `<tspan>`s anchored at one `(x, y)`, for
 * `_shared/text.mjs`'s `wrapToBudget` output. `y` is the baseline of the
 * *first* line; each later line steps down by `lineHeight`.
 */
export function textLines(lines, { x, y, lineHeight, class: cls, textAnchor, fontWeight } = {}) {
  const tspans = lines
    .map((ln, i) => `<tspan x="${escapeAttr(x)}"${i === 0 ? "" : ` dy="${lineHeight}"`}>${escapeText(ln)}</tspan>`)
    .join("");
  return el(
    "text",
    { x, y, class: cls, "text-anchor": textAnchor, "font-weight": fontWeight },
    tspans
  );
}

export function g(attrs, children) {
  return el("g", attrs, children);
}

/**
 * Wraps `children` in `<g class="ex-node" data-panel="key">` when `panel`
 * is set (: "panel keys on nodes" → a clickable node that
 * opens a side panel / bottom sheet). Without a `panel`, the node has
 * nothing to open, so it is returned unwrapped.
 */
export function nodeGroup(panel, children) {
  const inner = Array.isArray(children) ? children.join("") : children;
  if (!panel) return inner;
  return el("g", { class: "ex-node", "data-panel": panel }, inner);
}

/** The top-level `<svg>`: sets viewBox (never width/height in px) and an a11y title. */
export function svg({ width, height, title, children }) {
  const titleEl = title ? `<title>${escapeText(title)}</title>` : "";
  const body = Array.isArray(children) ? children.join("") : children;
  return `<svg viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" role="img">${titleEl}${body}</svg>`;
}
