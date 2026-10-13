# info

The shared "more info" component () — one popover/slide-out-panel/bottom-sheet
engine covering every usage category the VCS Port Architecture reference
site used across six different ad-hoc mechanisms: term definitions,
detail behind a diagram node, detail behind a flow/decision/sequence step,
annotation of a field/value, evidence/payload too large inline, and
narrative "who handles it next" links. `term`/`panel` (this library's
older, narrower patterns) are now thin aliases over content *inside* a
body — this folder owns the trigger, the dialog, and every mode.

## When to use

- Defining a term inline on first mention (`<x-term>`, unchanged) — opens a
  small popover by default.
- There's more to say than a tight space allows (a table cell, a caption,
  a long parenthetical): put the extra in a panel, keep one plain sentence
  inline (`info-for-detail-in-tight-space` house-style rule).
- A diagram node, a flow/decision/sequence step, a field/value annotation,
  an evidence payload, or a "see also"/narrative-continuation link needs
  clickable detail — any element can be a trigger (`data-info`), or use an
  inline `<x-info>` for prose.
- A detail chain needs prev/next (a scenario's steps, a stepper) — `seq`.

## When not

- The page's main claim, or anything a reader must know to follow along —
  that belongs on the page itself, never only in a panel
  (`info-never-hides-the-point`).
- A caption that says "click" on something that isn't a trigger
  (`info-caption-matches-triggers`).
- Chaining a body into another body more than one level deep
  (`info-one-level`) — link a term or a page instead.

## Markup contract

Three trigger shapes, one body shape:

```html
<p>A <x-term k="port">port</x-term> is a fixed plug shape. See the
<x-info k="adapter-detail">adapter</x-info> for the concrete wiring.</p>

<div class="ex-diagram">
  <svg><g class="ex-node" data-info="core-dispatcher">...</g></svg>
</div>
<table><tr><td data-info="exit-code">0</td></tr></table>

<x-info-body k="adapter-detail" title="Adapter" seq="flow" order="1" files="plugins/vcs/adapter.py:42" see="overview">
  <p>Rich HTML: <code>code</code>, lists, <x-term k="port">nested terms</x-term>.</p>
</x-info-body>
```

- `<x-info k="key">label</x-info>` — an inline trigger; a real
  `href="#info--…"` link for no-JS.
- `data-info="key"` (or the legacy `data-panel="key"` alias) on any element
  — an SVG `<g>`, `<li>`, `<span>` inside `<pre>`, `<div>`, `<td>`, `<tr>`.
  Several triggers may share one key.
- `<x-info-body k="key" title="…" [mode=popover|panel] [scope=global]
  [seq="name"] [order="n"] [files="path:line,…"] [see="page-id,…"]>` —
  authored in the page middle, removed from flow at build time; mode
  defaults to `panel` (a term's definition is the one exception, always
  `popover`); page-scoped by default, `scope="global"` makes a key usable
  from any page's trigger. A panel-mode body needs a `title`; a
  popover-mode one doesn't (shown in the phone sheet either way).
  `contents.json` `pages[].panels[]` still works (read as info bodies).

## Worked examples

`example.html` carries one worked example per usage category, in order:

1. **Definition** — `<x-info>` in prose, `mode="popover"`.
2. **Diagram node** — an SVG `<g data-info>` with a `files=` footer.
3. **Step sequence** — three `<li data-info>` items sharing one `seq`, with
   previous/next inside the panel.
4. **Field annotation** — `data-info` markers on values inside an
   `<x-example>` JSON block (the reference site's own most-used shape — a
   `<table>` with `data-info` on a `<td>` closes the section out as a second,
   secondary form for when the detail is a label rather than a code value).
5. **Evidence** — a payload too large to show inline, tagged Illustrative.
6. **Narrative continuation** — a `see=` footer pointing at another page.

A legacy `data-panel` trigger closes the file out, proving the alias still
works unchanged.

## Nested triggers inside an open panel

`info-one-level` discourages *authoring* a body that chains into another
one, but the engine itself must never misbehave when a reader does it
anyway — an operator bug report (2026-10-08) found a trigger clicked
*inside* an already-open panel reused the same single dialog instance,
replacing the panel's own body and destroying the very element a nested
popover needed to anchor against (it rendered pinned at the main window's
top-left corner instead). Fixed by giving the two nested shapes different
treatment, neither of which ever misplaces or closes the dialog underneath:

- A **popover**-mode trigger (a term, usually) clicked inside an open panel
  opens as a second, independent dialog layered above it — anchored to the
  clicked text, repositioning as the panel's own body scrolls or the window
  resizes. The panel stays open and visible underneath (nothing extra is
  dimmed). Esc, an outside click (inside the panel but outside the popover
  counts as outside), and the popover's own close button dismiss only the
  popover and return focus to the trigger that opened it; a *second* Esc
  then closes the panel. On a phone (<640px) it's a second, smaller sheet
  stacked above the panel's own sheet.
- A **panel**-mode trigger clicked inside an open panel replaces the
  panel's own content and shows a "← Back" control that restores exactly
  what was there before — a small stack, so nesting more than once works
  too (`info-one-level` only discourages authoring it). `seq` prev/next
  keeps working on whichever body is currently shown, at whatever depth.
- A popover is never rendered unanchored: if its trigger is
  detached or zero-size at the moment it would open, or becomes so later
  (a reposition on scroll/resize), it falls back to a panel at the top
  level, or — for the nested layer, which has nothing sensible to fall back
  to — simply never opens (or closes itself if it already had).

## Visible cues (automatic — never hand-style a trigger)

Operator review of the demo (2026-10-08): "Clickable JSON fields should be
underlined or dotted-underlined to indicate clickability... it should be
clear that it opens a popup, slideout, or new window." Every trigger above
gets its cue from the `data-info-mode` the build stamps on it
(`lib/includes.mjs`'s `handleTerm`/`handleInfoTrigger`/`checkDataInfo`) —
a page-writer never adds a class or style for this:

- `mode="popover"` (and every term) — dotted underline + a small info icon.
- `mode="panel"` — solid underline + a small side-panel icon.
- Inside a code block (`<x-example>`'s `data-info` markers) — dotted
  underline only, no icon, so the code pattern's columns never shift.
- An SVG diagram node — a small corner badge (`info.js`'s
  `addDiagramBadges`, from the node's own bbox), not an underline; the
  existing hover/focus highlight is unchanged.
- Every trigger also gets a `title` tooltip and an `aria-description`
  ("Opens a definition"/"Opens a side panel"), applied at runtime, never
  overwriting an author-supplied one.

House style `clickable-has-cue`; enforced by `check`'s `ui.affordance`
(error: a trigger in the built dist with no `data-info-mode`).

## Tokens used

`--ex-bg-elevated`, `--ex-ink`, `--ex-ink-muted`, `--ex-border`,
`--ex-border-strong`, `--ex-bg-sunken`, `--ex-accent`, `--ex-accent-ink`,
`--ex-accent-soft`, `--ex-focus`, `--ex-shadow`.

## How this folder gets inlined

`a.ex-term`/`data-term`, `[data-panel]`, and `<x-info>`/`data-info` are all
shell-dialect, not a page-writer's own `ex-<name>` class
(`scripts/lib/shell.mjs`'s `BUILD_OWNED_EX_CLASSES`). `collectPatternNames`'s
implication map (`BUILD_OWNED_IMPLIES`) now maps `a.ex-term`/`data-term` to
**both** `term` and `info`, `data-panel` to **both** `panel` and `info`,
and the normalized `data-info-target` attribute every trigger shape carries
(lib/includes.mjs stamps it onto every one, regardless of authoring form)
directly to `info` — so this folder ships on exactly the pages that have a
real trigger of any kind, never unconditionally.
