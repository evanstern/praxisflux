# `swimlanes` diagram generator

A lanes x columns grid — "who does what, in which phase." Use it for a
team-by-stage or component-by-environment breakdown: one row per actor
(a repo, a team, a component), one column per phase, a box wherever that
actor has work in that phase. One of the five mechanical layouts.

## Data shape (`schema.json`, `example.json`)

```json
{
  "title": "VCS port: who implements what, by phase",
  "columns": [{ "id": "design", "label": "Design" }],
  "lanes": [
    {
      "id": "core",
      "label": "core.py",
      "cells": {
        "design": { "label": "vcs.v1 contract", "panel": "core-design" }
      }
    }
  ],
  "arrows": [{ "from": "core:design", "to": "core:build" }]
}
```

- `columns[]` — at least one, left to right in array order; `id` is referenced by
  `lanes[].cells` keys and `arrows[].from`/`to`, `label` is the column header.
- `lanes[]` — at least one, top to bottom in array order:
  - `label` — the row header.
  - `cells` — keyed by a `columns[].id`; a column with no key here is an empty cell
    (no box drawn). Each present cell:
    - `label` (required) — wraps to the cell's width budget.
    - `new` — draws the cell's box with the shared "new" class instead of "same"
      (takes precedence over `changed` if both are set).
    - `changed` — draws the cell's box with the shared "changed" class instead of "same".
    - `panel` — a `contents.json` page's `panels[].key`; makes the cell a clickable
      node (`<g class="ex-node" data-panel="...">`).
- `arrows[]` — optional connectors drawn after every cell, each between two cells
  named `"laneId:columnId"`. Either endpoint can be in a different lane *and* a
  different column — a swimlane commonly hands work across lanes, not just
  down a single column — so arrows use a general any-direction connector
  (`core/diagrams/_shared/svg.mjs`'s `connector()`), not the horizontal-only
  arrow `sequence` uses.
  - `dashed` — draws the connector dashed.

## Layout notes

- Column width and the row-header width are both fixed budgets (not sized from
  content, unlike `sequence`'s widest-actor column spacing) — every column header,
  lane header, and cell label wraps independently to its own fixed budget; a label
  that still can't fit — one word alone wider than the budget, or more lines than
  its limit — throws a build error naming the column/lane/cell
  (`core/diagrams/_shared/text.mjs`'s `wrapToBudget`), never silent overflow.
- A lane's row height is the tallest of: its own (wrapped) row header, and every
  cell's (wrapped) box in that row — computed in a measurement pass before any
  svg is emitted, same two-pass approach as `timeline`.
- An `arrows[]` entry naming a `"laneId:columnId"` with no cell there (or an
  unknown lane/column) throws a build error naming the arrow's index — this is a
  cross-reference the JSON schema can't express, so `render.mjs` checks it itself,
  the same way `sequence` checks `steps[].from`/`to` against `actors[].id`.
