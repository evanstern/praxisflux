// Tests for the core diagram generators (/
// ): the shared text-layout/svg helpers, and the
// `sequence` and `timeline` generators, each exercised through the real
// x-diagram path (lib/includes.mjs's handleDiagram, via the real lookup
// against this plugin's own `core/`) as well as directly.

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { createCiteRegistry } from "../../explainer/scripts/lib/cites.mjs";
import { expandPage } from "../../explainer/scripts/lib/includes.mjs";
import { collectInfoBodies } from "../../explainer/scripts/lib/info.mjs";
import { createLookup } from "../../explainer/scripts/lib/lookup.mjs";
import { parse, serialize } from "../../explainer/scripts/lib/markup.mjs";
import { DIAGRAM_BASE_CLASSES } from "../../explainer/scripts/lib/shell.mjs";

import { DiagramTextError, measure, splitIdentifierChunks, wrapToBudget } from "../../explainer/core/diagrams/_shared/text.mjs";
import { render as renderSequence } from "../../explainer/core/diagrams/sequence/render.mjs";
import { render as renderTimeline } from "../../explainer/core/diagrams/timeline/render.mjs";
import { render as renderSwimlanes } from "../../explainer/core/diagrams/swimlanes/render.mjs";
import { render as renderBar } from "../../explainer/core/diagrams/bar/render.mjs";
import { render as renderLadder } from "../../explainer/core/diagrams/ladder/render.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const SEQUENCE_DIR = path.join(REAL_PLUGIN_ROOT, "core", "diagrams", "sequence");
const TIMELINE_DIR = path.join(REAL_PLUGIN_ROOT, "core", "diagrams", "timeline");
const SWIMLANES_DIR = path.join(REAL_PLUGIN_ROOT, "core", "diagrams", "swimlanes");
const BAR_DIR = path.join(REAL_PLUGIN_ROOT, "core", "diagrams", "bar");
const LADDER_DIR = path.join(REAL_PLUGIN_ROOT, "core", "diagrams", "ladder");
const OVERLAY_ARTIFACT = path.join(__dirname, "fixtures", "diagrams-overlay");

const ALLOWED_CLASSES = new Set([...Object.values(DIAGRAM_BASE_CLASSES), "ex-node"]);

function classTokens(svg) {
  const out = [];
  const re = /class="([^"]*)"/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(svg))) {
    for (const token of m[1].split(/\s+/)) if (token) out.push(token);
  }
  return out;
}

// Only the generator's own svg body is checked against the shared-class
// whitelist — the `.ex-diagram` wrapper div is lib/includes.mjs's own
// (build-owned) markup, not something a generator emits.
function svgBody(html) {
  const match = html.match(/<svg[^>]*>[\s\S]*<\/svg>/);
  return match ? match[0] : html;
}

function assertOnlySharedClasses(html) {
  for (const token of classTokens(svgBody(html))) {
    assert.ok(ALLOWED_CLASSES.has(token), `unexpected class "${token}" not in the shared diagram classes`);
  }
}

function assertNoColourOrVar(svg) {
  assert.doesNotMatch(svg, /var\(/, "svg attribute uses var() instead of a shared class");
  assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}\b/, "svg attribute uses a literal hex colour");
  assert.doesNotMatch(svg, /\sfill="/, 'svg sets a "fill" attribute directly instead of relying on a class');
  assert.doesNotMatch(svg, /\sstroke="/, 'svg sets a "stroke" attribute directly instead of relying on a class');
}

// --------------------------------------------------- edge-caption overhang
// A text-anchor=middle/end label centers or right-aligns on its own anchor
// point, so it can extend past the canvas edge even though its *anchor* sits
// comfortably inside the viewBox (the bug a planted-overflow browser.svg-
// overflow run on the real diag-check artifact found in `timeline`: the
// last entry's caption, anchored at x=740 inside a 0..800 viewBox, rendered
// wide enough with text-anchor="middle" to spill past x=800). This reuses
// _shared/text.mjs's own `measure()` — the exact table every generator lays
// text out against — to recompute each rendered text run's horizontal
// extent independently of the generator's own layout math, and checks it
// against the svg's viewBox. Generator-agnostic: driven entirely by what's
// actually in the rendered markup (class -> font-size, text-anchor,
// x, and the run's own text), not by assumptions about any one generator's
// column/inset constants.

const FONT_SIZE_BY_CLASS = { "ex-t": 13, "ex-t-muted": 11 };

function unescapeXmlText(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function textAnchorExtent(x, width, anchor) {
  if (anchor === "middle") return [x - width / 2, x + width / 2];
  if (anchor === "end") return [x - width, x];
  return [x, x + width]; // "start", or unspecified (the SVG default)
}

/** Asserts every rendered <text>/<tspan> run's measured horizontal extent lies within `svgMarkup`'s own viewBox. */
function assertTextExtentsWithinViewBox(svgMarkup, label) {
  const vb = /<svg\s+viewBox="0 0 (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)"/.exec(svgMarkup);
  assert.ok(vb, `${label}: svg has no viewBox to check against`);
  const viewBoxWidth = Number(vb[1]);

  const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = textRe.exec(svgMarkup))) {
    const attrs = m[1];
    const body = m[2];
    const classMatch = /\sclass="([^"]*)"/.exec(attrs);
    const clsToken = classMatch ? classMatch[1].split(/\s+/).find((c) => c in FONT_SIZE_BY_CLASS) : undefined;
    const fontSize = clsToken ? FONT_SIZE_BY_CLASS[clsToken] : 13;
    const anchorMatch = /\stext-anchor="([^"]*)"/.exec(attrs);
    const anchor = anchorMatch ? anchorMatch[1] : "start";

    const tspanRe = /<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/g;
    const tspans = [];
    let tm;
    // eslint-disable-next-line no-cond-assign
    while ((tm = tspanRe.exec(body))) tspans.push({ attrs: tm[1], content: tm[2] });
    const runs = tspans.length > 0 ? tspans : [{ attrs, content: body }];

    for (const run of runs) {
      const xMatch = /\sx="(-?\d+(?:\.\d+)?)"/.exec(run.attrs);
      assert.ok(xMatch, `${label}: a <text>/<tspan> has no x attribute to measure from`);
      const x = Number(xMatch[1]);
      const content = unescapeXmlText(run.content);
      const width = measure(content, fontSize);
      const [left, right] = textAnchorExtent(x, width, anchor);
      assert.ok(
        left >= -0.5,
        `${label}: text "${content}" (anchor=${anchor}, font-size=${fontSize}) extends to x=${left.toFixed(1)}, left of the viewBox's 0 edge`
      );
      assert.ok(
        right <= viewBoxWidth + 0.5,
        `${label}: text "${content}" (anchor=${anchor}, font-size=${fontSize}) extends to x=${right.toFixed(1)}, past the viewBox width ${viewBoxWidth}`
      );
    }
  }
}

// Minimal info-registry meta for a page-scoped key — enough for
// resolveInfoKey/domIdFor/checkDataInfo (lib/info.mjs, lib/includes.mjs) to
// resolve it, same shape lib/info.mjs's collectInfoBodies would produce for
// either an <x-info-body> or a legacy contents.json panels[] entry (TASK-
// 12.8 #3: a diagram node's `panel` key now goes through that same
// resolution, so every "renders through the real x-diagram path" fixture
// below needs its example.json's panel keys declared, or the build now
// correctly refuses the unknown key instead of rendering it inert).
function infoLocalForKeys(keys, pageId = "overview") {
  return new Map(keys.map((key) => [key, { key, scope: "page", pageId, mode: "panel", title: key }]));
}

// Expands one <x-diagram> through the real lib/includes.mjs path, with the
// lookup rooted at this plugin's own (real, non-fixture) core/ — so
// `kind="sequence"`/`"timeline"` resolve to the generators this task adds,
// exactly as a real build would find them.
async function expandDiagram(html, { artifactDir, panelKeys = [] }) {
  const ctx = {
    file: "pages/overview.html",
    page: { id: "overview", panels: [] },
    multi: false,
    termKeys: new Set(),
    sourcesById: new Map(),
    pageIds: new Map([["overview", "Overview"]]),
    repo: undefined,
    citeRegistry: createCiteRegistry(),
    lookup: createLookup({ artifactDir, pluginRoot: REAL_PLUGIN_ROOT }),
    artifactDir,
    diagramModuleCache: new Map(),
    generatorOutputs: new Map(),
    infoLocal: infoLocalForKeys(panelKeys),
    infoGlobal: new Map(),
    infoUsed: new Set(),
  };
  const nodes = parse(html, { file: ctx.file });
  const expanded = await expandPage(nodes, ctx);
  return serialize(expanded);
}

test("sequence example renders through the real x-diagram path, using only shared classes", async () => {
  const html = await expandDiagram('<x-diagram kind="sequence" data="example.json"/>', {
    artifactDir: SEQUENCE_DIR,
    panelKeys: ["step1", "step2", "step3", "step4"],
  });
  assert.match(html, /^<div class="ex-diagram"[^>]*><svg viewBox="0 0 \d+ \d+" role="img"( style="min-width:\d+px")?>/);
  assertOnlySharedClasses(html);
  assertNoColourOrVar(html);
  assertTextExtentsWithinViewBox(svgBody(html), "sequence example");
  // every panel key resolved against the page's info registry
  // and got stamped with data-info-target, the same as any other trigger.
  assert.match(html, /data-panel="step1" data-info-target="info--overview--step1" data-info-mode="panel"/);
});

test("sequence example: an x-diagram panel key with no matching registry entry is a build error, naming the page", async () => {
  await assert.rejects(
    () => expandDiagram('<x-diagram kind="sequence" data="example.json"/>', { artifactDir: SEQUENCE_DIR, panelKeys: [] }),
    /unknown info key "step1" on page "overview"/
  );
});

test("timeline example renders through the real x-diagram path, using only shared classes", async () => {
  const html = await expandDiagram('<x-diagram kind="timeline" data="example.json"/>', {
    artifactDir: TIMELINE_DIR,
    panelKeys: ["poc", "mirror"],
  });
  assert.match(html, /^<div class="ex-diagram"[^>]*><svg viewBox="0 0 \d+ \d+" role="img"( style="min-width:\d+px")?>/);
  assertOnlySharedClasses(html);
  assertNoColourOrVar(html);
  assertTextExtentsWithinViewBox(svgBody(html), "timeline example");
  assert.match(html, /data-panel="poc" data-info-target="info--overview--poc" data-info-mode="panel"/);
});

test("_shared is not a diagram kind: the lookup finds the folder, but it has no render.mjs", async () => {
  await assert.rejects(
    () => expandDiagram('<x-diagram kind="_shared" data="example.json"/>', { artifactDir: SEQUENCE_DIR }),
    /_shared[\\/]render\.mjs does not exist/
  );
});

test("x-diagram still fails cleanly for a kind with no folder at all", async () => {
  await assert.rejects(
    () => expandDiagram('<x-diagram kind="does-not-exist" data="example.json"/>', { artifactDir: SEQUENCE_DIR }),
    /no diagrams\/does-not-exist\/render\.mjs found/
  );
});

// --------------------------------------------------------- _shared/text.mjs

test("wrapToBudget wraps over-budget text onto more lines instead of overflowing", () => {
  const lines = wrapToBudget("one two three four five six seven eight nine ten eleven twelve", {
    maxWidth: 120,
    fontSize: 13,
    maxLines: 6,
    label: "test node",
  });
  assert.ok(lines.length > 1, "expected the text to wrap onto more than one line");
  assert.equal(lines.join(" "), "one two three four five six seven eight nine ten eleven twelve");
});

test("wrapToBudget throws, naming the node, when a single word cannot fit even alone", () => {
  assert.throws(
    () => wrapToBudget("a supercalifragilisticexpialidocious word", { maxWidth: 40, fontSize: 13, label: "my-node" }),
    (err) => {
      assert.ok(err instanceof DiagramTextError);
      assert.match(err.message, /^my-node: /);
      assert.match(err.message, /does not fit in a 40px width budget/);
      return true;
    }
  );
});

test("wrapToBudget throws, naming the node, when wrapping needs more lines than maxLines allows", () => {
  assert.throws(
    () =>
      wrapToBudget("one two three four five six seven eight nine ten", {
        maxWidth: 60,
        fontSize: 13,
        maxLines: 2,
        label: "over-budget-node",
      }),
    (err) => {
      assert.ok(err instanceof DiagramTextError);
      assert.match(err.message, /^over-budget-node: /);
      assert.match(err.message, /exceeding the max of 2/);
      return true;
    }
  );
});

// a single word wider than its budget breaks at identifier
// boundaries (after `_`/`-`/`.`/`/`, or at a camelCase hump) before
// wrapToBudget gives up — the real failure found by the vcs-port
// acceptance build (bar 1 ("test_jira_status_map") label, a 134px budget).

test("splitIdentifierChunks breaks on snake_case, kebab-case, dotted, and path separators", () => {
  assert.deepEqual(splitIdentifierChunks("test_jira_status_map"), ["test_", "jira_", "status_", "map"]);
  assert.deepEqual(splitIdentifierChunks("foo-bar-baz"), ["foo-", "bar-", "baz"]);
  assert.deepEqual(splitIdentifierChunks("a.b.c"), ["a.", "b.", "c"]);
  assert.deepEqual(splitIdentifierChunks("core/diagrams/bar"), ["core/", "diagrams/", "bar"]);
});

test("splitIdentifierChunks breaks at camelCase humps, before the uppercase letter", () => {
  assert.deepEqual(splitIdentifierChunks("someLongIdentifierName"), ["some", "Long", "Identifier", "Name"]);
});

test("splitIdentifierChunks returns the word unchanged when there is no boundary", () => {
  assert.deepEqual(splitIdentifierChunks("supercalifragilisticexpialidocious"), [
    "supercalifragilisticexpialidocious",
  ]);
});

test("wrapToBudget wraps a single over-budget word at its identifier boundaries, within budget, instead of throwing", () => {
  // The real bar-label failure: "test_jira_status_map" at ~134px/13px font
  // doesn't fit on one line (~152-155px by this module's own estimate), but
  // it has three "_" break points to try before giving up.
  const maxWidth = 134;
  const fontSize = 13;
  const lines = wrapToBudget("test_jira_status_map", { maxWidth, fontSize, maxLines: 2, label: "bar 1" });
  assert.ok(lines.length > 1, "expected the identifier to wrap onto more than one line");
  // No separator was invented: concatenating the lines reproduces the
  // original word exactly.
  assert.equal(lines.join(""), "test_jira_status_map");
  for (const line of lines) {
    assert.ok(measure(line, fontSize) <= maxWidth, `line "${line}" (~${measure(line, fontSize).toFixed(1)}px) exceeds the ${maxWidth}px budget`);
  }
});

test("wrapToBudget still throws when an over-budget word has no break point at all", () => {
  assert.throws(
    () => wrapToBudget("supercalifragilisticexpialidocious", { maxWidth: 40, fontSize: 13, label: "unbreakable" }),
    (err) => {
      assert.ok(err instanceof DiagramTextError);
      assert.match(err.message, /^unbreakable: /);
      assert.match(err.message, /does not fit in a 40px width budget/);
      return true;
    }
  );
});

test("wrapToBudget still throws when an identifier has break points, but a chunk between them is still too wide alone", () => {
  assert.throws(
    () => wrapToBudget("a_supercalifragilisticexpialidocious_word", { maxWidth: 40, fontSize: 13, label: "still-too-wide" }),
    (err) => {
      assert.ok(err instanceof DiagramTextError);
      assert.match(err.message, /^still-too-wide: /);
      assert.match(err.message, /no break point that fits either/);
      return true;
    }
  );
});

test("wrapToBudget: a short multi-word text with one over-budget identifier still wraps the rest normally", () => {
  const text = "see the test_jira_status_map case";
  const lines = wrapToBudget(text, { maxWidth: 134, fontSize: 13, maxLines: 4, label: "mixed" });
  assert.ok(lines.length > 1, "expected this text to need more than one line at a 134px budget");
  // No character is ever added and none but a word-separating space is
  // ever dropped (a break inside the one over-budget identifier is a
  // zero-width cut, no space to lose there) — concatenating every line
  // reproduces the original text once both sides' whitespace is stripped.
  assert.equal(lines.join("").replace(/\s+/g, ""), text.replace(/\s+/g, ""));
  for (const line of lines) assert.ok(measure(line, 13) <= 134);
});

// ------------------------------------------------------------------ sequence

test("sequence render() produces a valid svg with a scroll-friendly minWidth", () => {
  const data = {
    actors: [
      { id: "a", label: "Caller" },
      { id: "b", label: "Service" },
    ],
    steps: [{ from: "a", to: "b", label: "call it", panel: "p1" }],
  };
  const result = renderSequence(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.match(result.svg, /^<svg viewBox="0 0 \d+ \d+" role="img">/);
  assert.ok(result.minWidth > 0);
  assert.match(result.svg, /<g class="ex-node" data-panel="p1">/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);
});

test("sequence render() rejects a step referencing an unknown actor", () => {
  const data = {
    actors: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    steps: [{ from: "a", to: "nope", label: "x" }],
  };
  assert.throws(() => renderSequence(data, { classes: DIAGRAM_BASE_CLASSES }), /unknown actor "nope"/);
});

test("sequence render() throws naming the step when a message label can't fit even wrapped", () => {
  const data = {
    actors: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    steps: [{ from: "a", to: "b", label: "supercalifragilisticexpialidocioussupercalifragilisticexpialidocious" }],
  };
  assert.throws(() => renderSequence(data, { classes: DIAGRAM_BASE_CLASSES }), /sequence step 1 .*does not fit/);
});

test("sequence render(): a very long first actor name no longer overhangs the canvas edge", () => {
  // Actor headers never wrap (colGap auto-grows to fit the widest one), so a
  // long name at the first/last column used to render past the SIDE_PAD
  // inset even though it fits fine *within* its own auto-sized column.
  const data = {
    actors: [
      { id: "a", label: "ExtremelyLongFirstActorNameHereThatOverhangs" },
      { id: "b", label: "core.py" },
      { id: "c", label: "GitHubAdapter" },
    ],
    steps: [{ from: "a", to: "b", label: "x" }],
  };
  const result = renderSequence(data, { classes: DIAGRAM_BASE_CLASSES });
  assertTextExtentsWithinViewBox(result.svg, "sequence (long first actor)");
});

// ------------------------------------------------------------------- timeline

test("timeline render() produces a valid svg and marks new entries with the shared box-new class", () => {
  const data = {
    entries: [
      { label: "Kickoff", panel: "k" },
      { label: "Launch", new: true },
    ],
  };
  const result = renderTimeline(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.match(result.svg, /^<svg viewBox="0 0 \d+ \d+" role="img">/);
  assert.ok(result.minWidth > 0);
  assert.match(result.svg, /<g class="ex-node" data-panel="k">/);
  assert.match(result.svg, /class="ex-box-new"/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);
});

test("timeline render() marks a changed entry with the shared box-changed class", () => {
  const data = { entries: [{ label: "Kickoff" }, { label: "Revised plan", changed: true }] };
  const result = renderTimeline(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.match(result.svg, /class="ex-box-changed"/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);
});

test("timeline render() throws naming the entry when a label can't fit even wrapped", () => {
  const data = {
    entries: [{ label: "supercalifragilisticexpialidocioussupercalifragilisticexpialidocious" }],
  };
  assert.throws(() => renderTimeline(data, { classes: DIAGRAM_BASE_CLASSES }), /timeline entry 1 .*does not fit/);
});

test("timeline render(): a wide caption on the last entry no longer overhangs the canvas edge", () => {
  // This is the exact shape of the real bug found on the diag-check
  // artifact: a caption at the last entry, text-anchor=middle on its
  // marker x, rendering wider than the SIDE_PAD inset reserved for it
  // ("First real PR opened" — one line, well within the per-column wrap
  // budget, but still wider than the canvas's old fixed edge margin).
  const data = {
    entries: [
      { label: "Start", date: "Jan" },
      { label: "Middle", date: "Feb" },
      { label: "First real PR opened", date: "Nov 2026" },
    ],
  };
  const result = renderTimeline(data, { classes: DIAGRAM_BASE_CLASSES });
  assertTextExtentsWithinViewBox(result.svg, "timeline (wide last caption)");
});

// ----------------------------------------------------------------- swimlanes

test("swimlanes example renders through the real x-diagram path, using only shared classes", async () => {
  const html = await expandDiagram('<x-diagram kind="swimlanes" data="example.json"/>', {
    artifactDir: SWIMLANES_DIR,
    panelKeys: ["core-design", "core-build"],
  });
  assert.match(html, /^<div class="ex-diagram"[^>]*><svg viewBox="0 0 \d+ \d+" role="img"( style="min-width:\d+px")?>/);
  assertOnlySharedClasses(html);
  assertNoColourOrVar(html);
  assertTextExtentsWithinViewBox(svgBody(html), "swimlanes example");
  assert.match(html, /data-panel="core-design" data-info-target="info--overview--core-design" data-info-mode="panel"/);
});

// #3, the other half: a diagram node's panel key resolves through
// the *legacy* contents.json pages[].panels[] route too — not only a
// hand-rolled meta object, but the real lib/info.mjs collectInfoBodies
// pre-scan a real build runs, so this is the same registry a page's own
// panels[] entries actually produce.
test("swimlanes example: a panel key resolves through contents.json pages[].panels[] (the legacy route), via the real collectInfoBodies registry", async () => {
  const page = {
    id: "overview",
    panels: [
      { key: "core-design", title: "Core design" },
      { key: "core-build", title: "Core build" },
    ],
  };
  const file = "pages/overview.html";
  const nodes = parse('<x-diagram kind="swimlanes" data="example.json"/>', { file });

  const infoRegistry = collectInfoBodies({ pageDrafts: [{ page, file, nodes }] });
  assert.equal(infoRegistry.ok, true, JSON.stringify(infoRegistry.errors));

  const ctx = {
    file,
    page,
    multi: false,
    termKeys: new Set(),
    sourcesById: new Map(),
    pageIds: new Map([["overview", "Overview"]]),
    repo: undefined,
    citeRegistry: createCiteRegistry(),
    lookup: createLookup({ artifactDir: SWIMLANES_DIR, pluginRoot: REAL_PLUGIN_ROOT }),
    artifactDir: SWIMLANES_DIR,
    diagramModuleCache: new Map(),
    generatorOutputs: new Map(),
    infoLocal: infoRegistry.byPage.get("overview"),
    infoGlobal: infoRegistry.global,
    infoUsed: new Set(),
  };
  const html = serialize(await expandPage(nodes, ctx));
  assert.match(html, /data-panel="core-design" data-info-target="info--overview--core-design" data-info-mode="panel"/);
  assert.match(html, /data-panel="core-build" data-info-target="info--overview--core-build" data-info-mode="panel"/);
});

test("swimlanes render() draws a box per cell, marks new/changed cells, and wraps a panel in ex-node", () => {
  const data = {
    columns: [
      { id: "c1", label: "Design" },
      { id: "c2", label: "Build" },
    ],
    lanes: [
      {
        id: "core",
        label: "core.py",
        cells: {
          c1: { label: "contract", panel: "p1" },
          c2: { label: "adapter", new: true },
        },
      },
      {
        id: "pipeline",
        label: "pipeline",
        cells: { c1: { label: "reworked", changed: true } },
      },
    ],
  };
  const result = renderSwimlanes(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.match(result.svg, /^<svg viewBox="0 0 \d+ \d+" role="img">/);
  assert.ok(result.minWidth > 0);
  assert.match(result.svg, /<g class="ex-node" data-panel="p1">/);
  assert.match(result.svg, /class="ex-box-new"/);
  assert.match(result.svg, /class="ex-box-changed"/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);
});

test("swimlanes render() rejects a cells key naming an unknown column", () => {
  const data = {
    columns: [{ id: "c1", label: "Design" }],
    lanes: [{ id: "core", label: "core.py", cells: { nope: { label: "x" } } }],
  };
  assert.throws(() => renderSwimlanes(data, { classes: DIAGRAM_BASE_CLASSES }), /cells key "nope" is not a known column/);
});

test("swimlanes render() rejects an arrow referencing a lane:column with no cell", () => {
  const data = {
    columns: [{ id: "c1", label: "Design" }],
    lanes: [{ id: "core", label: "core.py", cells: { c1: { label: "x" } } }],
    arrows: [{ from: "core:c1", to: "core:nope" }],
  };
  assert.throws(() => renderSwimlanes(data, { classes: DIAGRAM_BASE_CLASSES }), /"to" \("core:nope"\) is not a lane:column with a cell/);
});

test("swimlanes render() throws naming the cell when a label can't fit even wrapped", () => {
  const data = {
    columns: [{ id: "c1", label: "Design" }],
    lanes: [
      {
        id: "core",
        label: "core.py",
        cells: { c1: { label: "supercalifragilisticexpialidocioussupercalifragilisticexpialidocious" } },
      },
    ],
  };
  assert.throws(() => renderSwimlanes(data, { classes: DIAGRAM_BASE_CLASSES }), /cell "core:c1".*does not fit/);
});

// ----------------------------------------------------------------------- bar

test("bar example renders through the real x-diagram path, with an svg using only shared classes plus a sibling table", async () => {
  const html = await expandDiagram('<x-diagram kind="bar" data="example.json"/>', {
    artifactDir: BAR_DIR,
    panelKeys: ["github"],
  });
  assert.match(html, /^<div class="ex-diagram"[^>]*><svg viewBox="0 0 \d+ \d+" role="img"( style="min-width:\d+px")?>/);
  assertOnlySharedClasses(html);
  assertNoColourOrVar(html);
  // The table is a sibling of the svg, inside the same .ex-diagram wrapper.
  assert.match(html, /<\/svg><table>/);
  assertTextExtentsWithinViewBox(svgBody(html), "bar example");
  assert.match(html, /data-panel="github" data-info-target="info--overview--github" data-info-mode="panel"/);
});

test("bar render() always returns an html table with the same label/value pairs as the svg", () => {
  const data = {
    title: "p50 latency",
    unit: "ms",
    bars: [
      { label: "GitHubAdapter", value: 420 },
      { label: "AdoAdapter", value: 610, new: true },
    ],
  };
  const result = renderBar(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.ok(result.minWidth > 0);
  assert.match(result.svg, /^<svg viewBox="0 0 \d+ \d+" role="img">/);
  assert.match(result.svg, /class="ex-box-new"/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);

  assert.equal(typeof result.html, "string");
  assert.match(result.html, /^<table>/);
  assert.match(result.html, /<th scope="row">GitHubAdapter<\/th><td>420ms<\/td>/);
  assert.match(result.html, /<th scope="row">AdoAdapter<\/th><td>610ms<\/td><td>New<\/td>/);
  assert.doesNotMatch(result.html, /\sfill="/);
  assert.doesNotMatch(result.html, /\sstyle="/);
  assert.doesNotMatch(result.html, /var\(/);
});

test("bar render() omits the table's Status column when no bar is new", () => {
  const result = renderBar({ bars: [{ label: "A", value: 1 }] }, { classes: DIAGRAM_BASE_CLASSES });
  assert.doesNotMatch(result.html, /Status/);
});

test("bar render() supports orientation: vertical", () => {
  const data = { bars: [{ label: "A", value: 10 }, { label: "B", value: 20 }], orientation: "vertical" };
  const result = renderBar(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.match(result.svg, /^<svg viewBox="0 0 \d+ \d+" role="img">/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);
  assert.match(result.html, /<th scope="row">A<\/th><td>10<\/td>/);
});

test("bar render() throws naming the bar when a label can't fit even wrapped", () => {
  const data = { bars: [{ label: "supercalifragilisticexpialidocioussupercalifragilisticexpialidocious", value: 1 }] };
  assert.throws(() => renderBar(data, { classes: DIAGRAM_BASE_CLASSES }), /bar 1 .*does not fit/);
});

test("bar render(): a long value/unit no longer overhangs the canvas edge, horizontal orientation", () => {
  // Unlike every other label in these generators, the value label was never
  // wrapToBudget-bounded — H_VALUE_COL_WIDTH was only ever a nominal guess,
  // not a real guarantee. A long unit string (or a value with many digits)
  // used to render straight past the canvas's right edge.
  const data = {
    unit: "ms-extremely-long-unit-string",
    bars: [
      { label: "GitHubAdapter", value: 123456789 },
      { label: "AdoAdapter", value: 1 },
    ],
  };
  const result = renderBar(data, { classes: DIAGRAM_BASE_CLASSES });
  assertTextExtentsWithinViewBox(result.svg, "bar (long value, horizontal)");
});

test("bar render(): a long value/unit no longer overhangs the canvas edge, vertical orientation", () => {
  // Same gap, worse shape: the vertical value label is text-anchor=middle,
  // so an unmeasured long value can overhang on *either* side of its column.
  const data = {
    orientation: "vertical",
    unit: "ms-extremely-long-unit-string",
    bars: [
      { label: "GitHubAdapter", value: 123456789 },
      { label: "AdoAdapter", value: 1 },
    ],
  };
  const result = renderBar(data, { classes: DIAGRAM_BASE_CLASSES });
  assertTextExtentsWithinViewBox(result.svg, "bar (long value, vertical)");
});

// -------------------------------------------------------------------- ladder

test("ladder example renders through the real x-diagram path, using only shared classes", async () => {
  const html = await expandDiagram('<x-diagram kind="ladder" data="example.json"/>', {
    artifactDir: LADDER_DIR,
    panelKeys: ["triage", "execute"],
  });
  assert.match(html, /^<div class="ex-diagram"[^>]*><svg viewBox="0 0 \d+ \d+" role="img"( style="min-width:\d+px")?>/);
  assertOnlySharedClasses(html);
  assertNoColourOrVar(html);
  // example.json has a "changed" ("execute") and a "new" ("merge") stage: both
  // draw with their own shared box class, no legend needed.
  assert.match(html, /class="ex-box-changed"/);
  assert.match(html, /class="ex-box-new"/);
  assertTextExtentsWithinViewBox(svgBody(html), "ladder example");
  assert.match(html, /data-panel="triage" data-info-target="info--overview--triage" data-info-mode="panel"/);
});

test("ladder render() draws a gate diamond between rungs and marks new/changed stages with their own box classes", () => {
  const data = {
    stages: [
      { id: "a", label: "A", panel: "pa" },
      { id: "b", label: "B", state: "changed" },
      { id: "c", label: "C", state: "new" },
    ],
    gates: [{ after: "a", label: "Ready?" }],
  };
  const result = renderLadder(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.match(result.svg, /^<svg viewBox="0 0 \d+ \d+" role="img">/);
  assert.ok(result.minWidth > 0);
  assert.match(result.svg, /<g class="ex-node" data-panel="pa">/);
  assert.match(result.svg, /<polygon points="[^"]+" class="ex-box"\/>/);
  assert.match(result.svg, /class="ex-box-changed"/);
  assert.match(result.svg, /class="ex-box-new"/);
  assertOnlySharedClasses(result.svg);
  assertNoColourOrVar(result.svg);
});

test("ladder render() returns no html field (no legend workaround needed now that ex-box-changed exists)", () => {
  const data = { stages: [{ id: "a", label: "A", state: "changed" }, { id: "b", label: "B", state: "new" }] };
  const result = renderLadder(data, { classes: DIAGRAM_BASE_CLASSES });
  assert.equal(result.html, undefined);
});

test("ladder render() rejects a gate naming an unknown stage, the last stage, or a duplicate connector", () => {
  const stages = [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }];
  assert.throws(
    () => renderLadder({ stages, gates: [{ after: "zzz", label: "g" }] }, { classes: DIAGRAM_BASE_CLASSES }),
    /"after" \("zzz"\) is not a known stage/
  );
  assert.throws(
    () => renderLadder({ stages, gates: [{ after: "c", label: "g" }] }, { classes: DIAGRAM_BASE_CLASSES }),
    /"after" \("c"\) is the last stage/
  );
  assert.throws(
    () =>
      renderLadder(
        { stages, gates: [{ after: "a", label: "g1" }, { after: "a", label: "g2" }] },
        { classes: DIAGRAM_BASE_CLASSES }
      ),
    /a gate already follows stage "a"/
  );
});

test("ladder render() throws naming the stage when a label can't fit even wrapped", () => {
  const data = {
    stages: [
      { id: "a", label: "supercalifragilisticexpialidocioussupercalifragilisticexpialidocious" },
      { id: "b", label: "B" },
    ],
  };
  assert.throws(() => renderLadder(data, { classes: DIAGRAM_BASE_CLASSES }), /ladder stage "a".*does not fit/);
});

// --------------------------------------------- : schema validation lives
// --------------------------------------------- in lib/includes.mjs, not render()

test("a schema violation surfaces from lib/includes.mjs (handleDiagram), path-qualified, with the page's file:line", async () => {
  // kind="sequence" resolves to the real core/diagrams/sequence/ (OVERLAY_ARTIFACT
  // has no diagrams/sequence of its own); only `data` comes from the fixture, so
  // the real sequence/ folder stays untouched by this test.
  await assert.rejects(
    () => expandDiagram('<x-diagram kind="sequence" data="bad-sequence.json"/>', { artifactDir: OVERLAY_ARTIFACT }),
    (err) => {
      assert.match(err.message, /^pages\/overview\.html:1: /);
      assert.match(err.message, /x-diagram kind="sequence" data="bad-sequence\.json": data invalid/);
      assert.match(err.message, /steps: required property missing/);
      return true;
    }
  );
});

// ------------------------------------------------- a kind living outside core/
// ------------------------------------------------- (packs/artifacts can
// ------------------------------------------------- ship their own generators)

test("a diagram kind resolved outside core/ is still schema-validated, using its own schema.json", async () => {
  const html = await expandDiagram('<x-diagram kind="overlay-kind" data="diagrams/overlay-kind/good.json"/>', {
    artifactDir: OVERLAY_ARTIFACT,
  });
  assert.match(html, /<title>hi<\/title>/);

  await assert.rejects(
    () =>
      expandDiagram('<x-diagram kind="overlay-kind" data="diagrams/overlay-kind/bad.json"/>', {
        artifactDir: OVERLAY_ARTIFACT,
      }),
    (err) => {
      assert.match(err.message, /^pages\/overview\.html:1: /);
      assert.match(err.message, /x-diagram kind="overlay-kind" data="diagrams\/overlay-kind\/bad\.json": data invalid/);
      assert.match(err.message, /value: required property missing/);
      return true;
    }
  );
});

test("a non-core diagram kind with no schema.json fails the build naming the kind", async () => {
  await assert.rejects(
    () =>
      expandDiagram('<x-diagram kind="no-schema-kind" data="diagrams/no-schema-kind/data.json"/>', {
        artifactDir: OVERLAY_ARTIFACT,
      }),
    /no-schema-kind[\\/]schema\.json does not exist/
  );
});
