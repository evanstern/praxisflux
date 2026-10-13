# `ladder` diagram generator

A vertical stage ladder with optional decision-gate diamonds between rungs —
the SDLC "triage → repo-route → design → plan → execute → validate →
pr-review → merge → deploy" shape, drawn generically from any ordered list
of stages. One of the five mechanical layouts.

## Data shape (`schema.json`, `example.json`)

```json
{
  "title": "SDLC pipeline stage ladder",
  "stages": [
    { "id": "triage", "label": "Triage", "panel": "triage" },
    { "id": "design", "label": "Design" },
    { "id": "execute", "label": "Execute", "state": "changed" },
    { "id": "merge", "label": "Merge", "state": "new" }
  ],
  "gates": [{ "after": "triage", "label": "A or B grade?" }]
}
```

- `stages[]` — at least two, top to bottom in array order:
  - `label` (required) — wraps to the rung's width budget.
  - `state` — `"same"` (default), `"changed"`, or `"new"`. See "new vs. changed" below.
  - `panel` — a `contents.json` page's `panels[].key`; makes the rung a clickable node.
- `gates[]` — optional decision diamonds, each placed on the connector right after
  one stage:
  - `after` (required) — a `stages[].id`; must not be the *last* stage (a gate needs
    a stage to lead into), and at most one gate per stage (one diamond per connector).
  - `label` (required) — wraps beside the diamond, e.g. `"A or B grade?"`.
  - `panel` — makes the gate a clickable node.

## "new" vs. "changed"

The shared diagram CSS (`core/shell/shell.css`, ) gives a box three
visual states: `.ex-box` ("same"), `.ex-box-changed` ("changed" — amber,
dashed), and `.ex-box-new` ("new" — blue, dashed), each pulling its colour
from the matching brand token pair (`--ex-diagram-changed`/`-changed-bg`,
`--ex-diagram-new`/`-new-bg` — `core/brand/tokens.json`). A rung's
`state` maps straight to the matching class (`ctx.classes.box`/`boxChanged`/
`boxNew`) — the same way `timeline`/`swimlanes`'s `new` flag already worked,
and no per-rung legend is needed: the state is self-evident from the rung's
own fill/stroke, exactly like every other shared box class.

(An earlier version of this generator shipped before `.ex-box-changed`
existed, and worked around the gap with a textual per-rung legend using the
shared `.ex-legend-*` classes. That workaround is gone now that the real
class exists — see `the original design notes`'s deviation 3 for
the history, if you're wondering why an older diff looked different.)

## Layout notes

- Each stage's label wraps to a fixed width budget; a label that still can't
  fit — one word alone wider than the budget, or more lines than its limit —
  throws a build error naming the stage (`core/diagrams/_shared/text.mjs`'s
  `wrapToBudget`), never silent overflow. Gate labels wrap the same way.
- A gate is drawn as an `<polygon>` diamond (`core/shell/shell.css` already
  styles `.ex-node > polygon`, not just `rect`, for exactly this), with its
  label beside it rather than inside — a diamond this size can't hold more
  than a couple of characters of wrapped text.
- `gates[].after` naming an unknown stage, the last stage, or a stage that
  already has a gate throws a build error naming the gate's index — these
  are cross-references the JSON schema can't express, so `render.mjs` checks
  them itself, the same way `sequence` checks `steps[].from`/`to`.
