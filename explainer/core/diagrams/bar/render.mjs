// Bar chart generator (: "bar always
// emits a data table next to the chart" — a bar chart's exact values are
// never readable from bar *length* alone, so this generator always returns
// an `html` field alongside `svg` — a real `<table>` of the same label/value
// pairs, rendered immediately after the svg inside the shared `.ex-diagram`
// wrapper (lib/includes.mjs's handleDiagram; see core/diagrams/README.md for
// the contract this extends). There is no way to opt out of the table — if a
// page doesn't want one, it shouldn't use `bar`.

import { measure, wrapToBudget as wrap } from "../_shared/text.mjs";
import { escapeText as esc, nodeGroup, rect, svg, text, textLines } from "../_shared/svg.mjs";

const TEXT_SIZE = 13;
const LINE_HEIGHT = 16;
const MAX_LABEL_LINES = 2;
const SIDE_PAD = 16;
const TOP_MARGIN = 14;
const BOTTOM_MARGIN = 14;

// ---------------------------------------------------------------- horizontal
const H_LABEL_COL_WIDTH = 150;
const H_LABEL_PAD = 16;
const H_BAR_AREA_WIDTH = 320;
const H_BAR_HEIGHT = 26;
const H_ROW_GAP = 14;
const H_VALUE_PAD = 10;
const H_VALUE_COL_WIDTH = 70;

// ------------------------------------------------------------------ vertical
const V_COL_WIDTH = 150;
const V_LABEL_PAD = 20;
const V_BAR_WIDTH = 46;
const V_BAR_AREA_HEIGHT = 220;
const V_TOP_LABEL_PAD = 22;
const V_LABEL_GAP = 10;

function formatValue(value, unit) {
  return `${value}${unit ? unit : ""}`;
}

function renderHorizontal(data, classes, unit) {
  const bars = data.bars;

  const rows = bars.map((bar, i) => {
    const labelLines = wrap(bar.label, {
      maxWidth: H_LABEL_COL_WIDTH - H_LABEL_PAD,
      fontSize: TEXT_SIZE,
      maxLines: MAX_LABEL_LINES,
      label: `bar ${i + 1} ("${bar.label}") label`,
    });
    const rowHeight = Math.max(H_BAR_HEIGHT, labelLines.length * LINE_HEIGHT);
    return { bar, labelLines, rowHeight };
  });

  const maxValue = Math.max(0, ...bars.map((b) => b.value));
  const barAreaX = SIDE_PAD + H_LABEL_COL_WIDTH;

  // Edge-label overhang guard: the value label isn't
  // wrapToBudget-bounded like every other label in these generators (a
  // value string is never user-wrapped), so H_VALUE_COL_WIDTH is only a
  // nominal guess — grow the canvas (never shrink it) to whatever each
  // bar's own rendered value label actually needs, computed per bar since
  // a shorter value can still carry a longer unit string.
  const requiredWidths = bars.map((bar) => {
    const barWidth = maxValue > 0 ? (bar.value / maxValue) * H_BAR_AREA_WIDTH : 0;
    const valueLabelWidth = measure(formatValue(bar.value, unit), TEXT_SIZE);
    return barAreaX + Math.max(0, barWidth) + H_VALUE_PAD + valueLabelWidth + SIDE_PAD;
  });
  const width = Math.max(barAreaX + H_BAR_AREA_WIDTH + H_VALUE_PAD + H_VALUE_COL_WIDTH + SIDE_PAD, ...requiredWidths);

  const parts = [];
  let y = TOP_MARGIN;
  for (const row of rows) {
    const barY = y + (row.rowHeight - H_BAR_HEIGHT) / 2;
    const barWidth = maxValue > 0 ? (row.bar.value / maxValue) * H_BAR_AREA_WIDTH : 0;
    const barRect = rect({
      x: barAreaX,
      y: barY,
      width: Math.max(0, barWidth),
      height: H_BAR_HEIGHT,
      rx: 4,
      class: row.bar.new ? classes.boxNew : classes.box,
    });
    const valueLabel = text(
      {
        x: barAreaX + Math.max(0, barWidth) + H_VALUE_PAD,
        y: barY + H_BAR_HEIGHT / 2 + 4,
        class: classes.text,
      },
      formatValue(row.bar.value, unit)
    );
    const rowLabelTop = y + (row.rowHeight - row.labelLines.length * LINE_HEIGHT) / 2 + LINE_HEIGHT - 4;
    const rowLabel = textLines(row.labelLines, {
      x: barAreaX - H_LABEL_PAD,
      y: rowLabelTop,
      lineHeight: LINE_HEIGHT,
      class: classes.text,
      textAnchor: "end",
    });
    parts.push(nodeGroup(row.bar.panel, [rowLabel, barRect, valueLabel]));
    y += row.rowHeight + H_ROW_GAP;
  }
  const height = y - H_ROW_GAP + BOTTOM_MARGIN;

  return { svgMarkup: svg({ width, height, title: data.title || "Bar chart", children: parts }), width };
}

function renderVertical(data, classes, unit) {
  const bars = data.bars;
  const maxValue = Math.max(0, ...bars.map((b) => b.value));
  const axisY = TOP_MARGIN + V_TOP_LABEL_PAD + V_BAR_AREA_HEIGHT;

  // Pass 1: measure every category label (throws before any svg is emitted).
  const labelSets = bars.map((bar, i) =>
    wrap(bar.label, {
      maxWidth: V_COL_WIDTH - V_LABEL_PAD,
      fontSize: TEXT_SIZE,
      maxLines: MAX_LABEL_LINES,
      label: `bar ${i + 1} ("${bar.label}") label`,
    })
  );
  const labelBlockLines = Math.max(1, ...labelSets.map((l) => l.length));
  const height = axisY + V_LABEL_GAP + labelBlockLines * LINE_HEIGHT + BOTTOM_MARGIN;

  // Edge-label overhang guard: both the category label
  // (wrapToBudget-bounded, usually safe) and the value label (unbounded,
  // same latent risk as the horizontal orientation above) are
  // text-anchor=middle on the column's own cx — grows the left/right inset
  // (never below SIDE_PAD) so every bar's own worse-of-the-two half-width
  // fits before the canvas edge; interior bars are already protected by
  // V_COL_WIDTH itself the same way timeline/sequence's interior entries are.
  const n = bars.length;
  const trackWidth = n * V_COL_WIDTH;
  const relX = bars.map((_, i) => i * V_COL_WIDTH + V_COL_WIDTH / 2);
  const halfWidths = bars.map((bar, i) => {
    const catHalf = Math.max(0, ...labelSets[i].map((ln) => measure(ln, TEXT_SIZE) / 2));
    const valueHalf = measure(formatValue(bar.value, unit), TEXT_SIZE) / 2;
    return Math.max(catHalf, valueHalf);
  });
  let leftInset = SIDE_PAD;
  let rightInset = SIDE_PAD;
  bars.forEach((_, i) => {
    leftInset = Math.max(leftInset, SIDE_PAD + halfWidths[i] - relX[i]);
    rightInset = Math.max(rightInset, SIDE_PAD + halfWidths[i] - (trackWidth - relX[i]));
  });
  const width = leftInset + trackWidth + rightInset;

  const parts = bars.map((bar, i) => {
    const cx = leftInset + relX[i];
    const barHeight = maxValue > 0 ? (bar.value / maxValue) * V_BAR_AREA_HEIGHT : 0;
    const barRect = rect({
      x: cx - V_BAR_WIDTH / 2,
      y: axisY - Math.max(0, barHeight),
      width: V_BAR_WIDTH,
      height: Math.max(0, barHeight),
      rx: 4,
      class: bar.new ? classes.boxNew : classes.box,
    });
    const valueLabel = text(
      { x: cx, y: axisY - Math.max(0, barHeight) - 8, class: classes.text, "text-anchor": "middle" },
      formatValue(bar.value, unit)
    );
    const catLabel = textLines(labelSets[i], {
      x: cx,
      y: axisY + V_LABEL_GAP + LINE_HEIGHT - 4,
      lineHeight: LINE_HEIGHT,
      class: classes.text,
      textAnchor: "middle",
    });
    return nodeGroup(bar.panel, [barRect, valueLabel, catLabel]);
  });

  return { svgMarkup: svg({ width, height, title: data.title || "Bar chart", children: parts }), width };
}

function renderTable(data, unit) {
  const hasNew = data.bars.some((b) => b.new);
  const valueHeader = unit ? `Value (${esc(unit)})` : "Value";
  const headCells = [`<th scope="col">Label</th>`, `<th scope="col">${valueHeader}</th>`];
  if (hasNew) headCells.push(`<th scope="col">Status</th>`);

  const bodyRows = data.bars.map((bar) => {
    const cells = [`<th scope="row">${esc(bar.label)}</th>`, `<td>${esc(formatValue(bar.value, unit))}</td>`];
    if (hasNew) cells.push(`<td>${bar.new ? "New" : ""}</td>`);
    return `<tr>${cells.join("")}</tr>`;
  });

  const caption = data.title ? `<caption>${esc(data.title)} — data</caption>` : "";
  return (
    `<table>${caption}<thead><tr>${headCells.join("")}</tr></thead>` +
    `<tbody>${bodyRows.join("")}</tbody></table>`
  );
}

export function render(data, ctx) {
  const { classes } = ctx;
  const orientation = data.orientation || "horizontal";
  const unit = data.unit;

  const { svgMarkup, width } =
    orientation === "vertical" ? renderVertical(data, classes, unit) : renderHorizontal(data, classes, unit);

  return { svg: svgMarkup, minWidth: Math.round(width), html: renderTable(data, unit) };
}
