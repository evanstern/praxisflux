// Fixture diagram generator for tests ('s real five kinds
// land in). Draws one box per `data.boxes[]` entry in a single
// row, using only the shared base classes passed via `ctx.classes` — never
// `var()` or literal colours in attributes.
export function render(data, ctx) {
  const boxes = Array.isArray(data.boxes) ? data.boxes : [];
  const width = Math.max(200, boxes.length * 140);
  const rects = boxes
    .map((b, i) => {
      const x = 10 + i * 140;
      const cls = b.new ? ctx.classes.boxNew : ctx.classes.box;
      return (
        `<rect x="${x}" y="10" width="120" height="60" rx="8" class="${cls}"></rect>` +
        `<text x="${x + 60}" y="45" text-anchor="middle" class="${ctx.classes.text}">${b.label}</text>`
      );
    })
    .join("");
  const svg = `<svg viewBox="0 0 ${width} 80" role="img"><title>${data.title || "fixture diagram"}</title>${rects}</svg>`;
  return { svg, minWidth: width };
}
