# Diagram generators (`core/diagrams/<kind>/`)

Generators behind `<x-diagram>`. Five mechanical
layouts ship in core — `sequence`, `timeline`, `swimlanes`, `bar`, `ladder`
— plus `_shared/`, which is helpers, not a kind (the lookup must never
resolve `kind="_shared"` to a real generator).

## Folder contract

Every `diagrams/<kind>/` folder — in core, in a repo's `.claude/explainer/`,
in an installed pack, or in the artifact folder itself (the 4-layer lookup) — has exactly four files:

```
diagrams/<kind>/
  render.mjs    # export function render(data, ctx) -> { svg, minWidth, html? }
  schema.json   # JSON Schema for `data`, in lib/schema.mjs's built-ins-only subset
  example.json  # one valid `data` document; also this kind's own test fixture
  README.md     # data shape + layout notes, in this repo's house style
```

A page invokes one with `<x-diagram kind="<kind>" data="<path>.json"/>` (the
`data` path resolves relative to the **artifact folder**, not the page
file). `lib/includes.mjs`'s `handleDiagram` is the one thing every kind
goes through, wherever it lives:

1. Resolve `diagrams/<kind>/` through the build's lookup (`ctx.lookup`).
2. Require `render.mjs` to exist (a build error naming the kind otherwise).
3. Require `schema.json` to exist in that **same resolved folder** (a build
   error naming the kind otherwise) and parse it.
4. Resolve and parse `data` (a build error naming the path otherwise).
5. Validate `data` against that `schema.json` with `lib/schema.mjs`'s
   `validate()` — a path-qualified build error (e.g. `actors[1].label:
   required property missing`), carrying the page's `file:line`, otherwise.
6. Dynamically `import()` `render.mjs` (cached per build) and call
   `render(data, { classes: DIAGRAM_BASE_CLASSES })`.
7. Wrap the result in `<div class="ex-diagram" style="min-width:...">`.

Step 3 is why **validation lives in `handleDiagram`, not in each
`render.mjs`** (a correction over phase 1's first draft,
which had `sequence`/`timeline` load and validate their own `schema.json`
via a relative import into `scripts/lib/`): a pack or an artifact
folder can ship a `diagrams/<kind>/` with no relative path back to this
plugin's `scripts/lib/` at all. The build — this file — is the one place
every kind, wherever it lives, is guaranteed to reach.

## `render(data, ctx)` contract

- `data` — already schema-valid JSON by the time `render()` sees it. A
  generator still checks any **cross-reference** the schema can't express
  (e.g. `sequence`'s `steps[].from`/`to` naming a real `actors[].id`) and
  throws a plain `Error` naming the offending node — `handleDiagram` wraps
  that in the same `file:line`-qualified build error as everything else.
- `ctx.classes` — `lib/shell.mjs`'s `DIAGRAM_BASE_CLASSES`: `box`, `boxChanged`,
  `boxNew`, `line`, `text`, `textMuted`, `legendSame`, `legendChanged`,
  `legendNew`. **Only** these class names (plus the build-added `ex-node` on
  a panel wrapper) may appear on generated SVG — no literal colour, no
  `var()`, on any SVG attribute. `core/diagrams/_shared/svg.mjs`'s
  element builders never accept a `fill`/`stroke` colour argument, by
  construction. `box`/`boxChanged`/`boxNew` are the three same/changed/new
  states a node can be in — a generator maps its own "is this changed/new"
  data straight to the matching class (`timeline`, `swimlanes`, `ladder` all
  do this); no separate legend is needed since the state is self-evident
  from the node's own fill/stroke.
- Returns `{ svg, minWidth, html? }`:
  - `svg` (required, string) — one `<svg viewBox="0 0 W H" role="img">`,
    sized to its content (never a fixed/guessed size) — never `width`/
    `height` attributes in px.
  - `minWidth` (required, number) — becomes `.ex-diagram`'s
    `style="min-width:...px"`, so a wide diagram scrolls horizontally
    inside its border rather than squashing.
  - `html` (optional, string) — **the one sanctioned contract extension**,
    added for `bar` (which always needs a sibling data table, decision
    ). Already-built markup, rendered immediately after `svg`
    inside the same `.ex-diagram` wrapper. A generator that never sets it
    (every other core kind, currently) is unaffected — `handleDiagram`
    treats a missing `html` as `""`. Use real semantic HTML here (e.g.
    `bar`'s `<table>`), not more SVG — if you need more SVG, put it in `svg`
    instead.
- Over-budget text (a label that needs more lines than its node's limit
  allows, or a single word wider than its budget even alone) must throw,
  naming the node — never render silent overflow. Every core
  generator does this via `core/diagrams/_shared/text.mjs`'s
  `wrapToBudget`, which already throws with the right shape; a generator
  just has to pass it a sensible `label` for the error message. A single
  word wider than its budget gets one more chance before that throw:
`wrapToBudget` tries breaking it at identifier boundaries
  — immediately after `_`/`-`/`.`/`/`, or at a camelCase hump — the same way
  a long snake_case/camelCase/path token wraps in a code editor, with no
  space or added character between the pieces. Only a word with no such
  boundary, or a boundary chunk that's *still* too wide alone, actually
  throws.
- Nodes may carry a `panel` key: wrap that node's SVG in
  `core/diagrams/_shared/svg.mjs`'s `nodeGroup(panelKey, children)` →
  `<g class="ex-node" data-panel="...">`. `lib/includes.mjs`'s
  `handleDiagram` walks the rendered fragment back through the exact same
  `checkDataInfo` every hand-authored `data-info`/`data-panel` element goes
  through — so a `panel` key resolves against the page's full
  merged info registry (`lib/info.mjs`): this page's own `<x-info-body k="...">`
  entries first, then any `scope="global"` body, then contents.json's legacy
  `pages[].panels[]` (folded into the same registry by `collectInfoBodies`).
  A key found in none of those is a build error naming the page, the same
  "unknown info key" a hand-authored trigger would get — a generator never
  has to know or care which of the three sources its `panel` key actually
  came from.

## `core/diagrams/_shared/`

- `text.mjs` — `wrapToBudget`/`measure`/`charWidth`: a fixed per-character
  width table for the shell's system font stack, with a safety margin (there's no browser at build time to measure text for real).
- `svg.mjs` — XML escaping, element builders (`rect`/`line`/`circle`/
  `polyline`/`polygon`/`text`/`textLines`/`g`/`svg`), `nodeGroup`, and
  `connector` (a general any-direction line+chevron, for a generator like
  `swimlanes` whose connections aren't all on one axis — contrast
  `sequence`'s own horizontal-only `arrow()`).
