# `sequence` diagram generator

Lifelines + message arrows — "who calls whom, in what order." Use it for
call/response flows: a stage calling a port, an adapter talking to a host,
a request/response chain. One of the five mechanical layouts;
reach for hand-written SVG instead when the
picture isn't "N actors, M ordered messages" (a branching flow, a hexagon,
a refactor map).

## Data shape (`schema.json`, `example.json`)

```json
{
  "title": "pr-review opens a PR through vcs.v1",
  "actors": [{ "id": "caller", "label": "pr-review" }],
  "steps": [
    { "from": "caller", "to": "core", "label": "push branch, then call open_pr", "panel": "step1" }
  ]
}
```

- `actors[]` — at least two; `id` is referenced by `steps[].from`/`to`, `label` is what's drawn.
- `steps[]` — at least one, drawn top to bottom in array order:
  - `label` (required) — the message, wrapped to the width between its two actor columns.
  - `note` — a muted annotation drawn below the arrow (e.g. the outcome of a check).
  - `dashed` — draws the arrow dashed (a return/async message, by convention).
  - `panel` — a `contents.json` page's `panels[].key`; makes the step a clickable node
    (`<g class="ex-node" data-panel="...">`) that opens the side panel / bottom sheet.

## Layout notes

- Column spacing is sized from the widest actor label, not a fixed guess — a long actor
  name pushes its neighbours apart instead of overlapping them.
- Each step's label (and its note, if present) wraps to the pixel distance between its
  two actor columns; a label or note that still can't fit — one word alone wider than the
  budget, or more lines than the node's limit — throws a build error naming the step
  (`core/diagrams/_shared/text.mjs`'s `wrapToBudget`), never silent overflow.
- Arrowheads are drawn as two short line segments (never a filled `<marker>`), so colour
  comes only from the shared `.ex-ln` class — no `var()` or literal colour in an attribute.
