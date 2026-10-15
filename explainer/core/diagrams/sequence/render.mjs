// Sequence/lifeline diagram generator. Draws one vertical lifeline per `data.actors[]`, with each
// `data.steps[]` entry as a horizontal message arrow between two of them,
// an optional wrapped label above the arrow, and an optional muted note
// below it. Reference look: the reference site's `flow-stage-call.html` sequence
// diagram (lifelines + numbered message arrows + clickable step panels),
// rebuilt on the shared base classes instead of that reference's
// `var(--c-*)` colours on raw attributes (the spec forbids both literal colours
// and `var()` in SVG attributes — only the shared classes may carry colour).

import { measure, wrapToBudget } from "../_shared/text.mjs";
import { line, nodeGroup, svg, textLines } from "../_shared/svg.mjs";

const TEXT_SIZE = 13;
const MUTED_SIZE = 11;
const LINE_HEIGHT = 16;
const MUTED_LINE_HEIGHT = 14;
const SIDE_PAD = 50;
const MIN_COL_GAP = 160;
const COL_LABEL_PAD = 40; // extra room around the widest actor label
const LABEL_TOP = 20;
const LIFELINE_TOP = 34;
const STEP_TOP_PAD = 30;
const STEP_GAP = 22;
const BOTTOM_PAD = 20;
const ARROW_HEAD = 7;
const MAX_LABEL_LINES = 2;
const MAX_NOTE_LINES = 2;
const MAX_ACTOR_LINES = 1;

// A horizontal arrow drawn as a plain stroked line plus a two-segment
// chevron (never a filled <marker>, which would need a colour attribute
// of its own). `cls` is always `ctx.classes.line` (.ex-ln).
function arrow(x1, x2, y, cls, dashed) {
  const dir = x1 > x2 ? 1 : -1; // chevron points back toward the origin column
  const backX = x2 + dir * ARROW_HEAD;
  return [
    line({ x1, y1: y, x2, y2: y, class: cls, "stroke-dasharray": dashed ? "4,3" : undefined }),
    line({ x1: x2, y1: y, x2: backX, y2: y - ARROW_HEAD * 0.6, class: cls }),
    line({ x1: x2, y1: y, x2: backX, y2: y + ARROW_HEAD * 0.6, class: cls }),
  ].join("");
}

export function render(data, ctx) {
  const { classes } = ctx;
  const actors = data.actors;
  const steps = data.steps;

  const actorIndex = new Map(actors.map((a, i) => [a.id, i]));
  steps.forEach((step, i) => {
    if (!actorIndex.has(step.from)) {
      throw new Error(`sequence step ${i + 1}: unknown actor "${step.from}" in "from" (not in data.actors)`);
    }
    if (!actorIndex.has(step.to)) {
      throw new Error(`sequence step ${i + 1}: unknown actor "${step.to}" in "to" (not in data.actors)`);
    }
  });

  // Column spacing is sized from the widest actor label, not a fixed
  // guess — a long actor name pushes its neighbours apart rather than
  // overlapping them.
  const widestActor = Math.max(...actors.map((a) => measure(a.label, TEXT_SIZE)));
  const colGap = Math.max(MIN_COL_GAP, widestActor + COL_LABEL_PAD);

  // Edge-label overhang guard (same class of bug as
  // timeline's): an actor header is text-anchor=middle at its own column's
  // x and, since colGap already grows to fit the widest actor label, it
  // never wraps — but SIDE_PAD alone doesn't grow with it, so a long first
  // or last actor name can render past the canvas edge even though its own
  // anchor sits well inside it. Grows the left/right inset (never shrinks
  // it below SIDE_PAD) so every actor's own rendered half-width fits before
  // the edge; interior actors are already protected by colGap itself
  // (always >= widestActor + COL_LABEL_PAD, wider than any single label).
  const n = actors.length;
  const halfWidths = actors.map((a) => measure(a.label, TEXT_SIZE) / 2);
  let leftInset = SIDE_PAD;
  let rightInset = SIDE_PAD;
  actors.forEach((_, i) => {
    leftInset = Math.max(leftInset, SIDE_PAD + halfWidths[i] - i * colGap);
    rightInset = Math.max(rightInset, SIDE_PAD + halfWidths[i] - (n - 1 - i) * colGap);
  });

  const colX = actors.map((_, i) => leftInset + i * colGap);
  const width = leftInset + rightInset + Math.max(0, n - 1) * colGap;

  const headerParts = actors.map((a, i) => {
    const lines = wrapToBudget(a.label, {
      maxWidth: colGap - 20,
      fontSize: TEXT_SIZE,
      maxLines: MAX_ACTOR_LINES,
      label: `sequence actor "${a.id}"`,
    });
    return textLines(lines, {
      x: colX[i],
      y: LABEL_TOP,
      lineHeight: LINE_HEIGHT,
      class: classes.text,
      textAnchor: "middle",
      fontWeight: 700,
    });
  });

  const stepGroups = [];
  let y = LIFELINE_TOP + STEP_TOP_PAD;
  let bottom = y;

  steps.forEach((step, i) => {
    const x1 = colX[actorIndex.get(step.from)];
    const x2 = colX[actorIndex.get(step.to)];
    const span = Math.max(Math.abs(x2 - x1) - 20, 40);
    const mid = (x1 + x2) / 2;

    const labelLines = wrapToBudget(step.label, {
      maxWidth: span,
      fontSize: TEXT_SIZE,
      maxLines: MAX_LABEL_LINES,
      label: `sequence step ${i + 1} ("${step.from}" -> "${step.to}")`,
    });
    const arrowY = y + labelLines.length * LINE_HEIGHT;
    const labelStartY = arrowY - 6 - (labelLines.length - 1) * LINE_HEIGHT;

    const parts = [
      textLines(labelLines, { x: mid, y: labelStartY, lineHeight: LINE_HEIGHT, class: classes.text, textAnchor: "middle" }),
      arrow(x1, x2, arrowY, classes.line, Boolean(step.dashed)),
    ];

    let stepBottom = arrowY;
    if (step.note) {
      const noteLines = wrapToBudget(step.note, {
        maxWidth: span,
        fontSize: MUTED_SIZE,
        maxLines: MAX_NOTE_LINES,
        label: `sequence step ${i + 1} note`,
      });
      const noteStartY = arrowY + 16;
      parts.push(
        textLines(noteLines, {
          x: mid,
          y: noteStartY,
          lineHeight: MUTED_LINE_HEIGHT,
          class: classes.textMuted,
          textAnchor: "middle",
        })
      );
      stepBottom = noteStartY + (noteLines.length - 1) * MUTED_LINE_HEIGHT;
    }

    stepGroups.push(nodeGroup(step.panel, parts));
    bottom = Math.max(bottom, stepBottom);
    y = stepBottom + STEP_GAP;
  });

  const lifelineBottom = bottom + BOTTOM_PAD;
  const lifelines = colX.map((x) =>
    line({ x1: x, y1: LIFELINE_TOP, x2: x, y2: lifelineBottom, class: classes.line, "stroke-dasharray": "3,3" })
  );
  const height = lifelineBottom + 10;

  const svgMarkup = svg({
    width,
    height,
    title: data.title || "Sequence diagram",
    children: [...headerParts, ...lifelines, ...stepGroups],
  });

  return { svg: svgMarkup, minWidth: Math.round(width) };
}
