# Rendering a vault analysis as a visual artifact

The artifact visualizes an **analysis's argument** — it is not a fresh analysis and not a fresh
research pass. Its numbers come from the branch; its conclusion is the analysis's verdict. Your job
is to make that argument *seen*.

## When it's worth building
- **Build** for: option comparisons, budgets/pricing, benchmarks, "which should I pick" decisions,
  timelines — anything where the verdict is easier to see than to read.
- **Skip** for: purely conceptual analyses where a chart would be decoration. Say so and stop.

## How to build it well
0. **Start from the shared base.** `${CLAUDE_PLUGIN_ROOT}/lib/html/base.html` is the canonical
   praxis foundation — design tokens, a light+dark theme contract (with an on-page toggle), a reset,
   and an auditable data-table component, all self-contained. Copy its `<style>`/toggle rather than
   re-deriving them; educate's deck template uses the same contract. Then layer the briefing on top.
1. **Load the design guidance first.** Invoke the `artifact-design` skill before writing the page,
   and the `dataviz` skill before writing any chart. They calibrate treatment and give you an
   accessible, theme-aware chart system. Don't freehand a design when those exist.
2. **Lead with the verdict.** The analysis already reached a conclusion — put it up front, then let
   the charts justify it. Don't make the reader reverse-engineer the answer. (This is the briefing
   form of the shared praxis pedagogy — `${CLAUDE_PLUGIN_ROOT}/lib/toolkit/pedagogy.md`: one idea
   per screen; show, don't tell; split, don't shrink.)
3. **Every number traces to the branch.** Pull figures from the analysis's Basis and `_grounding.md`
   — never invent data to make a chart look full. Include a small data table so the figures are
   auditable; the artifact gate warns if a substantial page has none.
4. **Self-contained — hard requirement.** The Artifact CSP blocks all external hosts: no CDN
   scripts, webfonts, or remote images. Inline all CSS/JS; draw charts with inline SVG or Canvas;
   embed images as data URIs; use system/mono font stacks (a linked webfont fails silently). The
   artifact gate checks this.
5. **Theme-aware.** Palette as CSS custom properties; redefine tokens under
   `@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"|"light"]` so the viewer's
   toggle wins in both directions. Give both themes real care.
6. **Charts get the same craft as type.** Faint gridlines, `tabular-nums` on aligned figures,
   emphasized endpoints/reference lines, a legend, axis titles. Wide content scrolls inside its own
   `overflow-x:auto` container so the page body never scrolls sideways.

## Filing and publishing
- Save the `.html` in the branch folder, named for the analysis (e.g. `<slug>-briefing.html`).
- Run the artifact gate (see SKILL.md), then publish with the `Artifact` tool.
- Put the returned URL **and** the filename in the MOC (under the analysis it renders), so the
  branch points at both the source file and the live page.
- The page is branch-local: it may cite `[[_grounding]]` and external URLs, but like every file in
  the branch it must not reference another topic's branch.
