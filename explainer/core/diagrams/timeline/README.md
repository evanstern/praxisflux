# `timeline` diagram generator

A horizontal axis with one node per milestone — "what happened, in order, and
when." Use it for a plan, a rollout schedule, or a "same direction, N
refinements" history. One of the five mechanical layouts;
typical page type for a decision-briefing-kind
artifact's "plan / timeline" page .

## Data shape (`schema.json`, `example.json`)

```json
{
  "title": "VCS port rollout plan",
  "entries": [
    { "label": "PoC branch", "date": "Sep 2026", "detail": "one remote branch, no PRs", "panel": "poc" }
  ]
}
```

- `entries[]` — at least one, drawn left to right in array order:
  - `label` (required) — the milestone name.
  - `date` — a short muted annotation (shown closer to the label than `detail`).
  - `detail` — a longer muted annotation (shown farthest from the axis).
  - `new` — draws the node with the shared "new" class instead of "same" (blue, dashed;
    takes precedence over `changed` if both are set).
  - `changed` — draws the node with the shared "changed" class instead of "same" (amber,
    dashed).
  - `panel` — a `contents.json` page's `panels[].key`; makes the entry a clickable node
    (`<g class="ex-node" data-panel="...">`).

## Layout notes

- Labels alternate above (even index) and below (odd index) the axis so neighbouring
  entries' text never collides, regardless of label length.
- Each column has a fixed width budget; `label`/`date`/`detail` each wrap independently to
  it. A field that still can't fit — one word alone wider than the budget, or more lines
  than its limit — throws a build error naming the entry (`core/diagrams/_shared/
  text.mjs`'s `wrapToBudget`), never silent overflow.
- The vertical size of the whole diagram is computed from the tallest "above" block and
  the tallest "below" block, in a first measurement pass, before any SVG is emitted.
