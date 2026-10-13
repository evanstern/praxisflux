// Ladder diagram generator: a
// vertical stack of stage rungs connected by straight lines, with an
// optional decision-gate diamond on any connector — the SDLC
// "triage -> repo-route -> design -> plan -> execute -> validate ->
// pr-review -> merge -> deploy" shape, drawn generically.
//
// Each rung's `state` ("same"/"changed"/"new") draws with the matching
// shared box class — `.ex-box`/`.ex-box-changed`/`.ex-box-new`
// (`ctx.classes.box`/`boxChanged`/`boxNew`) — exactly the same way `new`
// already worked on `timeline`/`swimlanes`: the state is self-evident from
// the rung's own fill/stroke, with no separate legend needed (a prior
// version of this generator worked around a missing `.ex-box-changed`
// class with a textual per-rung legend; that's gone now that the class
// exists — a judgment call).

import { wrapToBudget } from "../_shared/text.mjs";
import { line, nodeGroup, polygon, rect, svg, textLines } from "../_shared/svg.mjs";

const TEXT_SIZE = 13;
const LINE_HEIGHT = 16;
const MAX_STAGE_LINES = 2;
const MAX_GATE_LINES = 2;

const STAGE_WIDTH = 190;
const STAGE_PAD_X = 16;
const STAGE_MIN_HEIGHT = 50;
const GATE_SIZE = 46;
const GATE_LABEL_GAP = 16;
const GATE_LABEL_BUDGET = 150;
const V_GAP_PLAIN = 36;
const V_GAP_TO_GATE = 22;
const V_GAP_FROM_GATE = 22;
const SIDE_PAD = 20;
const TOP_MARGIN = 16;
const BOTTOM_MARGIN = 16;

function boxClassFor(classes, state) {
  if (state === "new") return classes.boxNew;
  if (state === "changed") return classes.boxChanged;
  return classes.box;
}

function diamondPoints(cx, cy, size) {
  const half = size / 2;
  return `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;
}

export function render(data, ctx) {
  const { classes } = ctx;
  const stages = data.stages;
  const gates = data.gates || [];

  const stageIds = new Set(stages.map((s) => s.id));
  const lastStageId = stages[stages.length - 1].id;
  const gateByAfter = new Map();
  gates.forEach((gate, i) => {
    if (!stageIds.has(gate.after)) {
      throw new Error(`ladder gate ${i + 1}: "after" ("${gate.after}") is not a known stage (not in data.stages)`);
    }
    if (gate.after === lastStageId) {
      throw new Error(`ladder gate ${i + 1}: "after" ("${gate.after}") is the last stage — a gate needs a stage after it`);
    }
    if (gateByAfter.has(gate.after)) {
      throw new Error(`ladder gate ${i + 1}: a gate already follows stage "${gate.after}" (only one gate per connector)`);
    }
    gateByAfter.set(gate.after, gate);
  });

  const hasGates = gates.length > 0;
  const cx = SIDE_PAD + STAGE_WIDTH / 2;
  const width = SIDE_PAD * 2 + STAGE_WIDTH + (hasGates ? GATE_LABEL_GAP + GATE_LABEL_BUDGET : 0);

  // Pass 1: measure every stage/gate label (throws before any svg is emitted).
  const stageLayouts = stages.map((stage) => {
    const lines = wrapToBudget(stage.label, {
      maxWidth: STAGE_WIDTH - 2 * STAGE_PAD_X,
      fontSize: TEXT_SIZE,
      maxLines: MAX_STAGE_LINES,
      label: `ladder stage "${stage.id}"`,
    });
    const boxHeight = Math.max(STAGE_MIN_HEIGHT, lines.length * LINE_HEIGHT + 20);
    return { stage, lines, boxHeight };
  });
  const gateLayouts = new Map(
    [...gateByAfter.entries()].map(([after, gate]) => [
      after,
      wrapToBudget(gate.label, {
        maxWidth: GATE_LABEL_BUDGET,
        fontSize: TEXT_SIZE,
        maxLines: MAX_GATE_LINES,
        label: `ladder gate after "${after}"`,
      }),
    ])
  );

  // Pass 2: lay out top to bottom.
  const parts = [];
  let y = TOP_MARGIN;

  stageLayouts.forEach((layout, i) => {
    const { stage, lines, boxHeight } = layout;
    const boxTop = y;
    const boxRect = rect({
      x: cx - STAGE_WIDTH / 2,
      y: boxTop,
      width: STAGE_WIDTH,
      height: boxHeight,
      rx: 8,
      class: boxClassFor(classes, stage.state),
    });
    const textTop = boxTop + (boxHeight - lines.length * LINE_HEIGHT) / 2 + LINE_HEIGHT - 4;
    const label = textLines(lines, {
      x: cx,
      y: textTop,
      lineHeight: LINE_HEIGHT,
      class: classes.text,
      textAnchor: "middle",
    });
    parts.push(nodeGroup(stage.panel, [boxRect, label]));

    y = boxTop + boxHeight;
    const isLast = i === stageLayouts.length - 1;
    if (isLast) return;

    const gate = gateByAfter.get(stage.id);
    if (!gate) {
      parts.push(line({ x1: cx, y1: y, x2: cx, y2: y + V_GAP_PLAIN, class: classes.line }));
      y += V_GAP_PLAIN;
      return;
    }

    parts.push(line({ x1: cx, y1: y, x2: cx, y2: y + V_GAP_TO_GATE, class: classes.line }));
    y += V_GAP_TO_GATE;
    const gateCenterY = y + GATE_SIZE / 2;
    const diamond = polygon({ points: diamondPoints(cx, gateCenterY, GATE_SIZE), class: classes.box });
    const gateLines = gateLayouts.get(stage.id);
    const gateTextTop = gateCenterY - (gateLines.length * LINE_HEIGHT) / 2 + LINE_HEIGHT - 4;
    const gateLabel = textLines(gateLines, {
      x: cx + GATE_SIZE / 2 + GATE_LABEL_GAP,
      y: gateTextTop,
      lineHeight: LINE_HEIGHT,
      class: classes.text,
      textAnchor: "start",
    });
    parts.push(nodeGroup(gate.panel, [diamond, gateLabel]));
    y = gateCenterY + GATE_SIZE / 2;
    parts.push(line({ x1: cx, y1: y, x2: cx, y2: y + V_GAP_FROM_GATE, class: classes.line }));
    y += V_GAP_FROM_GATE;
  });

  const height = y + BOTTOM_MARGIN;

  const svgMarkup = svg({ width, height, title: data.title || "Ladder", children: parts });

  return { svg: svgMarkup, minWidth: Math.round(width) };
}
