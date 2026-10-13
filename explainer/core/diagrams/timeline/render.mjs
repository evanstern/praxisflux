// Timeline diagram generator: a
// horizontal axis with one node per `data.entries[]`, labels alternating
// above/below the axis (even index above, odd below) so neighbouring
// entries' text never collides. Typical use: the "plan / timeline" page
// type for a decision-briefing-kind artifact.

import { measure, wrapToBudget } from "../_shared/text.mjs";
import { line, nodeGroup, rect, svg, textLines } from "../_shared/svg.mjs";

const TEXT_SIZE = 13;
const MUTED_SIZE = 11;
const LINE_HEIGHT = 16;
const MUTED_LINE_HEIGHT = 14;
const SIDE_PAD = 60;
const COL_GAP = 170;
const COL_BUDGET_PAD = 24;
const GAP_FROM_AXIS = 14;
const GROUP_GAP = 4;
const TOP_MARGIN = 10;
const BOTTOM_MARGIN = 10;
const NODE_SIZE = 14;
const MAX_LABEL_LINES = 2;
const MAX_DATE_LINES = 1;
const MAX_DETAIL_LINES = 2;

// Wraps one entry's label/date/detail to the per-column budget, nearest-
// axis group first (label, then date, then detail). Skips empty fields.
function layoutEntry(entry, index, budget) {
  const groups = [];
  const labelLines = wrapToBudget(entry.label, {
    maxWidth: budget,
    fontSize: TEXT_SIZE,
    maxLines: MAX_LABEL_LINES,
    label: `timeline entry ${index + 1} ("${entry.label}")`,
  });
  groups.push({ lines: labelLines, cls: "text", lineHeight: LINE_HEIGHT, fontSize: TEXT_SIZE });

  if (entry.date) {
    const dateLines = wrapToBudget(entry.date, {
      maxWidth: budget,
      fontSize: MUTED_SIZE,
      maxLines: MAX_DATE_LINES,
      label: `timeline entry ${index + 1} date`,
    });
    groups.push({ lines: dateLines, cls: "textMuted", lineHeight: MUTED_LINE_HEIGHT, fontSize: MUTED_SIZE });
  }
  if (entry.detail) {
    const detailLines = wrapToBudget(entry.detail, {
      maxWidth: budget,
      fontSize: MUTED_SIZE,
      maxLines: MAX_DETAIL_LINES,
      label: `timeline entry ${index + 1} detail`,
    });
    groups.push({ lines: detailLines, cls: "textMuted", lineHeight: MUTED_LINE_HEIGHT, fontSize: MUTED_SIZE });
  }

  const total =
    groups.reduce((sum, grp) => sum + grp.lines.length * grp.lineHeight, 0) + GROUP_GAP * Math.max(0, groups.length - 1);
  // Each group's widest *rendered* line, in px (: every group
  // is drawn text-anchor=middle on the entry's own marker x, so this is
  // exactly the half-width that can overhang the canvas edge).
  const halfWidth = Math.max(0, ...groups.flatMap((grp) => grp.lines.map((ln) => measure(ln, grp.fontSize) / 2)));
  return { groups, total, halfWidth };
}

// Renders `groups` (nearest-axis first) stacked outward from the axis.
// `direction` is -1 for "above" (farthest group drawn first/topmost,
// nearest group's baseline ends just above the axis) or +1 for "below".
function renderStack(mid, groups, classes, axisY, direction) {
  const total =
    groups.reduce((sum, grp) => sum + grp.lines.length * grp.lineHeight, 0) + GROUP_GAP * Math.max(0, groups.length - 1);
  const ordered = direction === -1 ? [...groups].reverse() : groups;
  const topEdge = direction === -1 ? axisY - GAP_FROM_AXIS - total : axisY + GAP_FROM_AXIS;

  let cursor = topEdge;
  const parts = [];
  for (const grp of ordered) {
    const baselineY = cursor + grp.lineHeight;
    parts.push(
      textLines(grp.lines, { x: mid, y: baselineY, lineHeight: grp.lineHeight, class: classes[grp.cls], textAnchor: "middle" })
    );
    cursor += grp.lines.length * grp.lineHeight + GROUP_GAP;
  }
  return parts.join("");
}

export function render(data, ctx) {
  const { classes } = ctx;
  const entries = data.entries;

  const budget = COL_GAP - COL_BUDGET_PAD;

  // Two passes: first measure every entry's wrapped block (so a throw
  // names the entry before any svg is emitted), then size the axis's
  // vertical position from the tallest "above" and "below" blocks.
  const laidOut = entries.map((entry, i) => layoutEntry(entry, i, budget));
  const maxAbove = Math.max(0, ...laidOut.filter((_, i) => i % 2 === 0).map((l) => l.total));
  const maxBelow = Math.max(0, ...laidOut.filter((_, i) => i % 2 === 1).map((l) => l.total));

  // Edge-label overhang guard: every group is drawn
  // text-anchor=middle on its entry's own marker x, so a wide line can
  // extend past SIDE_PAD even though every *interior* entry is already
  // safe (COL_GAP is wider than the wrap budget, so neighbours never
  // collide) — only the first and last entries have no neighbour on the
  // outward side to have already proven that. Grows the left/right inset
  // (never shrinks it below SIDE_PAD) so every entry's own measured
  // half-width fits before the canvas edge.
  const n = entries.length;
  let leftInset = SIDE_PAD;
  let rightInset = SIDE_PAD;
  laidOut.forEach((l, i) => {
    leftInset = Math.max(leftInset, SIDE_PAD + l.halfWidth - i * COL_GAP);
    rightInset = Math.max(rightInset, SIDE_PAD + l.halfWidth - (n - 1 - i) * COL_GAP);
  });

  const colX = entries.map((_, i) => leftInset + i * COL_GAP);
  const width = leftInset + rightInset + Math.max(0, n - 1) * COL_GAP;

  const axisY = TOP_MARGIN + GAP_FROM_AXIS + maxAbove;
  const height = axisY + GAP_FROM_AXIS + maxBelow + BOTTOM_MARGIN;

  const axisLine =
    entries.length > 1 ? line({ x1: colX[0], y1: axisY, x2: colX[colX.length - 1], y2: axisY, class: classes.line }) : "";

  const nodeParts = entries.map((entry, i) => {
    const cx = colX[i];
    const marker = rect({
      x: cx - NODE_SIZE / 2,
      y: axisY - NODE_SIZE / 2,
      width: NODE_SIZE,
      height: NODE_SIZE,
      rx: 3,
      class: entry.new ? classes.boxNew : entry.changed ? classes.boxChanged : classes.box,
    });
    const direction = i % 2 === 0 ? -1 : 1;
    const textBlock = renderStack(cx, laidOut[i].groups, classes, axisY, direction);
    return nodeGroup(entry.panel, [marker, textBlock]);
  });

  const svgMarkup = svg({
    width,
    height,
    title: data.title || "Timeline",
    children: [axisLine, ...nodeParts],
  });

  return { svg: svgMarkup, minWidth: Math.round(width) };
}
