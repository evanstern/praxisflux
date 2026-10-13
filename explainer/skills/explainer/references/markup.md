# Authoring markup

What a page-writer actually writes: a *page middle* — the HTML body for one
page, not a full document. It is plain HTML using pattern
classes (`ex-<pattern>`), plus a small set of build-time `x-*` elements the
build expands. A page-writer never writes `<html>`, `<head>`, or `<body>`.

## Well-formedness

Every opened tag must be explicitly closed — this dialect does nothing like
HTML5's implicit-close inference. The only exceptions are the real HTML void
elements (`br`, `hr`, `img`, `meta`, …) and any element self-closed with
`/>`. A leftover unexpanded `x-*` element, or a tag that never closes, fails
the build with a `file:line` naming exactly where.

Self-closing `x-*` elements (no children): `x-cite`, `x-file`, `x-diagram`,
`x-include`. Elements that wrap content and so close normally:
`x-term`, `x-page`, `x-example`.

## The `x-*` elements

### `x-term` — define or reference a term

```html
<p>Requests cross <x-term k="port">ports</x-term> before they reach a handler.</p>
```

Expands to a link that opens the term's definition in a popover (desktop) or
a slide-up panel (phone) — never a modal. `k` must match a `key` already
declared in `contents.json` `terms[]`; an unknown key fails the build.

### `x-cite` — cite a source

```html
<p>The retry budget is fixed at three attempts. <x-cite s="s-retry-doc"/></p>
```

Expands to `<a class="ex-cite">[n]</a>`, numbered in first-use order across
the whole artifact. `s` must match an id in `contents.json` `sources[]`.
Never cite an internal ticket, task, or decision-record id this way — see
`no-internal-codes` in `house-style.md`; cite a file path or a plain
description instead.

### `x-file` — link to a file in the repo

```html
<p>The retry loop lives in <x-file p="src/retry/runner.py" l="42"/>.</p>
```

Expands to a link to that path on GitHub, at the ref and repo named in
`contents.json` `repo`, opening in a new tab. `l` (a line number) is
optional.

Every link this plugin opens in a new tab (`x-cite`, `x-file`, the info
component's `files=` footer, the generated Sources page, `file-map`'s path
rows) carries its own "↗" icon and a real, visually-hidden "(opens in new
tab)" automatically — never hand-add either; `check`'s `ui.affordance`
fails the build on a `target="_blank"` link missing them.

### `x-include` — a real, generator-fed example

```html
<x-include g="envelopes" at="e.envelope" as="json"/>
<x-include g="envelopes" at="e.summaryLine" as="text"/>
<x-include g="file-inventory" as="data"/>
```

`g` names a generator declared in `contents.json` `generators`; `at` is a
dotted/indexed path into its output (`"rows[0].id"`), omitted only when
`as="data"` and the whole output is wanted. `as` is required and is one of:

- `as="json"` — renders the value at `at` as a formatted JSON code block,
  tagged **Real**.
- `as="text"` — renders a JSON *scalar* value at `at` (string, number,
  boolean, or null) as a plain-text code block, tagged **Real**. A string
  renders literally/unquoted; a number/boolean/null renders in its JSON text
  form (e.g. `20`, `true`, `null`). An object or array has no single-line
  scalar form and is a build error naming `as="json"` instead.
- `as="data"` — emits the value verbatim as an embedded JSON data block (no
  code-block chrome) for a pattern that renders the data itself client-side,
  e.g. `file-map`.

`explainer.mjs check`'s `fact.real-fresh` re-runs every generator and fails
the build if a rendered `x-include` no longer matches a fresh run — never
hand-edit what a generator produced.

### `x-example` — an illustrative (hand-written) example

```html
<x-example kind="illustrative" lang="ts" file="runner.ts">
async function retry(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (err) { if (i === attempts - 1) throw err; }
  }
}
</x-example>
```

`kind` must be `"illustrative"` — a "Real" example is always `x-include`,
never a hand-written one wearing the Real tag. `lang` is required; `file` is
an optional label. Keep toy code like this to at most 50 lines per file (see
`concrete-toy-code` in `house-style.md`).

An `x-example` body may also carry info-component triggers — a hand-authored
`<span data-info="key">…</span>` (or `data-panel="key"`) around a field or
value, or an inline `<x-info k="key">…</x-info>` — the reference site's own
most-used annotation shape (research.md's "field/value annotation" category:
a clickable marker on a value inside a JSON envelope). Nothing else x-* is
expanded inside an example; everything but those two trigger shapes is kept
as literal code text, exactly as typed. The client-side syntax highlighter
(`core/patterns/code/code.js`) tokenizes only the surrounding text — a marker
element you nest inside survives untouched, same object, same attributes,
with its own inner text tokenized too. `x-include`'s **Real** blocks do not
support this: their code comes straight from a generator's JSON/text output
(never parsed page markup), so there is no node tree for a marker to live
in — a Real payload that needs clickable fields goes through an
`<x-info-body>`'s own `<x-example>` copy instead (tagged Illustrative), not
through `x-include`.

### `x-diagram` — a generated SVG diagram

```html
<x-diagram kind="sequence" data="diagrams/retry-flow.json"/>
```

`kind` names a diagram generator resolved through the same four-layer lookup
as everything else (artifact → repo → installed packs → this plugin's
`core/`); `data` is a path to a JSON data file, resolved relative to the
artifact folder, validated against that kind's own `schema.json` before
rendering. Five kinds ship in `${CLAUDE_PLUGIN_ROOT}/core/diagrams/`:

| Kind | Use it for | Reference |
|---|---|---|
| `sequence` | Who calls whom, in what order | `${CLAUDE_PLUGIN_ROOT}/core/diagrams/sequence/README.md` |
| `timeline` | What happened, in order, and when | `${CLAUDE_PLUGIN_ROOT}/core/diagrams/timeline/README.md` |
| `swimlanes` | Who does what, in which phase | `${CLAUDE_PLUGIN_ROOT}/core/diagrams/swimlanes/README.md` |
| `bar` | A bar chart — always pair it with a real data table (`charts-have-data-tables`) | `${CLAUDE_PLUGIN_ROOT}/core/diagrams/bar/README.md` |
| `ladder` | A vertical stage ladder, with optional decision gates | `${CLAUDE_PLUGIN_ROOT}/core/diagrams/ladder/README.md` |

Read a kind's own `README.md` for its `data` shape before writing one by
hand; `example.json` in the same folder is a valid starting point.
Hand-written SVG (inside a pattern's own markup, not through `x-diagram`)
uses only the pattern's own classes (`.ex-box`, `.ex-box-new`, `.ex-ln`,
`.ex-t-muted`, …) — never `var()` or a literal colour in an SVG attribute.

### `x-page` — link to another page

```html
<p>See <x-page p="merge-control">Merge control</x-page> for the full gate.</p>
```

`p` must match a page `id` in `contents.json` `pages[]`. The build resolves
the right href for the single-file (`#id`) or `--multi` (`id.html`) shape —
never hand-write either form yourself.

`<x-page p="id"/>` (self-closing, no text) renders the target page's own
`title` as the link text; `<x-page p="id">text</x-page>` renders the given
text instead. A self-closing `<x-page>` is never an empty, invisible link —
`check`'s `ref.anchor` fails the build on any `<a href>` with no visible text
regardless of how it got there.

### `x-info` / `x-info-body` / `data-info` — the info component

The shared "more info" popover/slide-out-panel/bottom-sheet component (spec
). One engine covers every
usage category: term definitions, detail behind a diagram node, detail
behind a flow/decision/sequence step, a field/value annotation, an
evidence payload too large inline, and a narrative "who handles it next"
link. Read `${CLAUDE_PLUGIN_ROOT}/core/patterns/info/README.md` before using
it for the first time; the house-style rules for *when* (and when not) to
reach for it are the `info-for-*`/`info-never-hides-the-point`/
`info-caption-matches-triggers`/`info-one-level` ids in `house-style.md`.

```html
<p>See <x-info k="adapter-detail">the adapter</x-info> for the concrete
wiring.</p>

<div class="ex-diagram">
  <svg><g class="ex-node" data-info="dispatcher" tabindex="0"
    aria-label="core.py dispatcher">...</g></svg>
</div>

<x-info-body k="adapter-detail" title="Adapter" mode="panel" seq="walkthrough"
  order="1" files="src/adapter.py:42" see="overview">
  <p>Rich HTML: <code>code</code>, lists, <x-term k="port">nested
  terms</x-term> all expand inside a body.</p>
</x-info-body>
```

- **Triggers — three shapes, any number sharing one key:**
  - `<x-info k="key">label</x-info>` — an inline trigger for prose; expands
    to a real `href="#info--…"` anchor so the no-JS fallback works.
  - `data-info="key"` on any element — an SVG `<g>`, `<li>`, `<span>` inside
    `<pre>`, `<div>`, `<td>`, `<tr>` — makes that element itself a trigger
    (a diagram node, a table cell, a stepper item). Give a non-text trigger
    (an SVG `<g>`) its own `aria-label`; the build never infers one.
  - `data-panel="key"` — the older `panel` pattern's own trigger attribute,
    kept as an alias over the same mechanism; `contents.json`
    `pages[].panels[]` is read the same way for backward compatibility.
- **Body:** `<x-info-body k="key" title="…" mode="popover"|"panel"
  scope="global" seq="name" order="n" files="path:line,…" see="page-id,…">`
  — authored in the page middle, removed from the flow at build time. `mode`
  defaults to `panel` (a term's own definition is the one exception, always
  `popover`); a panel-mode body needs a `title`, a popover-mode one doesn't.
  Bodies are page-scoped by default (key unique per page); `scope="global"`
  makes a key resolvable from any page's trigger. `files=`/`see=` render a
  consistent footer instead of hand-rolled `dl` rows — real files link to
  GitHub (same rule as `x-file`), `see` names page ids.
- **Sequences:** give two or more bodies the same `seq="name"` (and an
  `order="n"`, or rely on document order) to get prev/next navigation
  between them inside the panel — a stepper, a scenario's call → envelope →
  next chain.
- **Deep links:** `#info=<key>` (or `#<page>/info=<key>`) opens that body (or
  term) on page load and on hashchange; the panel itself offers "copy link".
- **No-JS fallback:** every body also renders into a collapsed "More detail"
  section (`<details class="ex-info-fallback">`) at the end of the page,
  with a real anchor id per entry (`id="info--<key>"` global,
  `id="info--<page>--<key>"` page-scoped) — the page works and is
  searchable with JS disabled.
- **Cue:** every trigger above gets its underline style and icon
  automatically, from the `data-info-mode` the build stamps on it — dotted
  underline + a small popover icon for `mode="popover"` (and every term),
  solid underline + a small side-panel icon for `mode="panel"`, dotted with
  no icon inside a code block so the columns never shift, and a corner
  badge (not an underline) on an SVG diagram node. A page-writer never
  hand-styles a trigger — `check`'s `ui.affordance` fails the build on one
  missing its cue marker (house style `clickable-has-cue`).

`term`/`panel` (this plugin's older, narrower patterns) are now thin aliases
over the same engine — a term's definition is always a popover, and
`data-panel`/`pages[].panels[]` still work exactly as before.

## Pattern vocabulary

Everything else a page-writer reaches for — callouts, tables, matrices,
cards, steps, scenarios, stats, legends, the `details` disclosure, the
`code` block chrome, `annotated-json`, `verdict-list`, `ask`, `presenter` —
is a pattern: a reusable component with its own CSS (and sometimes JS),
triggered purely by using its `ex-<name>` root class in the page's markup.
The full inventory, the folder contract, and each pattern's own markup
contract are in
`${CLAUDE_PLUGIN_ROOT}/core/patterns/README.md`; read a pattern's own
`README.md` before using it for the first time.

Several patterns' real trigger markup is emitted by the build itself —
`x-example`/`x-include`'s code-block chrome, `x-term`'s popover anchor, and
`x-info`/`x-info-body`'s trigger and entry markup — a page-writer never
hand-writes that markup directly; using the `x-*` element above is what
pulls the pattern in.

## What a page-writer never writes

The shell owns all of the following, and a page middle never contains them:

- `<title>` — the document title.
- The menu (grouped on wide screens, a "Pages" menu on phones).
- Eyebrow page numbers ("15 · Title") and the pager — both are generated
  from `contents.json` `pages[]` order, never typed by hand
  (`generated-numbering`).
- The Terms page and the Sources page — both are generated from
  `contents.json` `terms[]` and `sources[]`.
- The top bar, theme toggle, and the info component's own dialog chrome
  (`core/patterns/info/info.js`) that every term popover and panel/sheet
  trigger reuses.

If a page middle contains any of these, that's a sign the content belongs in
`contents.json` instead of hand-written HTML.
