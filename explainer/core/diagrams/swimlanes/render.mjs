// Swimlanes diagram generator: a
// lanes x columns grid, one optional box per cell, with optional arrows
// between any two cells (not just within a row/column — a swimlane commonly
// hands work across lanes). Typical use: "who does what, in which phase" —
// a team-by-stage or component-by-environment grid.

import { wrapToBudget } from "../_shared/text.mjs";
import { connector, nodeGroup, rect, svg, textLines } from "../_shared/svg.mjs";

const TEXT_SIZE = 13;
const LINE_HEIGHT = 16;
const ROW_HEADER_WIDTH = 160;
const ROW_HEADER_PAD = 20;
const COL_WIDTH = 170;
const COL_PAD = 24;
const BOX_MARGIN = 10; // gap between a column's edges and its box
const BOX_PAD_X = 12; // inner horizontal padding, box edge to text
const BOX_PAD_Y = 10; // inner vertical padding, box edge to text
const ROW_MIN_HEIGHT = 56;
const ROW_GAP = 16;
const SIDE_PAD = 16;
const TOP_MARGIN = 14;
const HEADER_BOTTOM_PAD = 16;
const BOTTOM_MARGIN = 16;
const MAX_HEADER_LINES = 2;
const MAX_LANE_LINES = 2;
const MAX_CELL_LINES = 3;

function cellRef(laneId, colId) {
  return `${laneId}:${colId}`;
}

export function render(data, ctx) {
  const { classes } = ctx;
  const columns = data.columns;
  const lanes = data.lanes;
  const arrows = data.arrows || [];

  const columnIndex = new Map(columns.map((c, i) => [c.id, i]));
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));

  // Referential checks the JSON schema can't express: a lane's cells keys
  // must name a real column.
  lanes.forEach((lane) => {
    for (const colId of Object.keys(lane.cells || {})) {
      if (!columnIndex.has(colId)) {
        throw new Error(`swimlanes lane "${lane.id}": cells key "${colId}" is not a known column (not in data.columns)`);
      }
    }
  });

  const colX = columns.map((_, i) => SIDE_PAD + ROW_HEADER_WIDTH + i * COL_WIDTH + COL_WIDTH / 2);
  const width = SIDE_PAD * 2 + ROW_HEADER_WIDTH + columns.length * COL_WIDTH;
  const rowHeaderX = SIDE_PAD + ROW_HEADER_WIDTH / 2;

  // Pass 1: column headers (throws before any svg is emitted if one can't fit).
  const headerLineSets = columns.map((col) =>
    wrapToBudget(col.label, {
      maxWidth: COL_WIDTH - COL_PAD,
      fontSize: TEXT_SIZE,
      maxLines: MAX_HEADER_LINES,
      label: `swimlanes column "${col.id}"`,
    })
  );
  const headerLines = Math.max(1, ...headerLineSets.map((l) => l.length));
  const headerTop = TOP_MARGIN;
  const headerBottom = headerTop + headerLines * LINE_HEIGHT + HEADER_BOTTOM_PAD;

  // Pass 2: every lane's row header + cells, measured before any row is
  // positioned, so a throw names the lane/cell before any svg is emitted.
  const boxWidth = COL_WIDTH - 2 * BOX_MARGIN;
  const cellTextBudget = boxWidth - 2 * BOX_PAD_X;
  const laneLayouts = lanes.map((lane) => {
    const laneLines = wrapToBudget(lane.label, {
      maxWidth: ROW_HEADER_WIDTH - ROW_HEADER_PAD,
      fontSize: TEXT_SIZE,
      maxLines: MAX_LANE_LINES,
      label: `swimlanes lane "${lane.id}"`,
    });
    const cells = {};
    let tallestCell = 0;
    for (const col of columns) {
      const cell = (lane.cells || {})[col.id];
      if (!cell) continue;
      const lines = wrapToBudget(cell.label, {
        maxWidth: cellTextBudget,
        fontSize: TEXT_SIZE,
        maxLines: MAX_CELL_LINES,
        label: `swimlanes cell "${lane.id}:${col.id}"`,
      });
      const boxHeight = Math.max(ROW_MIN_HEIGHT, lines.length * LINE_HEIGHT + 2 * BOX_PAD_Y);
      tallestCell = Math.max(tallestCell, boxHeight);
      cells[col.id] = { lines, boxHeight, cell };
    }
    const laneHeaderHeight = laneLines.length * LINE_HEIGHT + 2 * BOX_PAD_Y;
    const rowHeight = Math.max(ROW_MIN_HEIGHT, tallestCell, laneHeaderHeight);
    return { lane, laneLines, cells, rowHeight };
  });

  // Lay out rows top to bottom, recording each cell's box geometry (for
  // arrows) as we go.
  const cellCenters = new Map(); // "laneId:colId" -> {cx, cy}
  const parts = [];
  let y = headerBottom;
  for (const row of laneLayouts) {
    const rowTop = y;
    const rowCenterY = rowTop + row.rowHeight / 2;

    const laneTextTop = rowCenterY - (row.laneLines.length * LINE_HEIGHT) / 2 + LINE_HEIGHT - 4;
    parts.push(
      textLines(row.laneLines, {
        x: rowHeaderX,
        y: laneTextTop,
        lineHeight: LINE_HEIGHT,
        class: classes.text,
        textAnchor: "middle",
        fontWeight: 700,
      })
    );

    columns.forEach((col, i) => {
      const cellLayout = row.cells[col.id];
      if (!cellLayout) return;
      const cx = colX[i];
      const boxHeight = cellLayout.boxHeight;
      const boxTop = rowCenterY - boxHeight / 2;
      const boxLeft = cx - boxWidth / 2;
      const boxRect = rect({
        x: boxLeft,
        y: boxTop,
        width: boxWidth,
        height: boxHeight,
        rx: 8,
        class: cellLayout.cell.new ? classes.boxNew : cellLayout.cell.changed ? classes.boxChanged : classes.box,
      });
      const textTop = rowCenterY - (cellLayout.lines.length * LINE_HEIGHT) / 2 + LINE_HEIGHT - 4;
      const label = textLines(cellLayout.lines, {
        x: cx,
        y: textTop,
        lineHeight: LINE_HEIGHT,
        class: classes.text,
        textAnchor: "middle",
      });
      parts.push(nodeGroup(cellLayout.cell.panel, [boxRect, label]));
      cellCenters.set(cellRef(row.lane.id, col.id), { x: cx, y: rowCenterY });
    });

    y = rowTop + row.rowHeight + ROW_GAP;
  }
  const bottom = y - ROW_GAP + BOTTOM_MARGIN;

  const arrowParts = arrows.map((arrow, i) => {
    const from = cellCenters.get(arrow.from);
    if (!from) {
      throw new Error(`swimlanes arrow ${i + 1}: "from" ("${arrow.from}") is not a lane:column with a cell`);
    }
    const to = cellCenters.get(arrow.to);
    if (!to) {
      throw new Error(`swimlanes arrow ${i + 1}: "to" ("${arrow.to}") is not a lane:column with a cell`);
    }
    return connector(from.x, from.y, to.x, to.y, classes.line, Boolean(arrow.dashed));
  });

  const svgMarkup = svg({
    width,
    height: bottom,
    title: data.title || "Swimlanes",
    children: [...parts, ...arrowParts],
  });

  return { svg: svgMarkup, minWidth: Math.round(width) };
}
