# House style

The writing and layout rules every page-writer follows. This file renders the
same rules as `core/rules/house-style.json` — each rule here carries its
stable id in backticks so the two stay checkable against each other. A rule
whose id appears in `contents.json` `rules.off` is disabled project-wide; one
with a `check` id in the JSON is also enforced mechanically by
`explainer.mjs check` (a build can still pass with a rule violation flagged
only as a warning — see the check's own level).

Project or pack overrides replace this file entirely through the same
four-layer lookup every other core asset uses (artifact → repo →
installed packs → this plugin's core) — read the live `rules/house-style.json`
for the rules actually in force on a given build, not this file, when the two
might differ.

## Readability and layout

- `negative-space` — Use generous negative space. Readability comes before
  density — a page that looks busy gets skimmed, not read.
- `reader-level-depth` — Write for a reader at the team's own technical
  level: keep most explanations brief, and never talk down or over-explain.
  Push real depth into sub-pages or expandable/collapsible panels instead of
  lengthening the main text.
- `define-before-use` — Never use a term before it is defined. Define it on
  first use, or link to where it is defined, before relying on it elsewhere.
- `big-type` — Use large, easy-to-read fonts everywhere. No rendered text may
  fall below the house-style minimum size.
- `svg-diagrams-not-ascii` — Illustrate processes and concepts with real SVG
  diagrams — never ASCII art, and never a screenshot standing in for a
  diagram.
- `tables-over-prose-lists` — Use a table for any apples-to-apples
  comparison instead of describing it in prose.
- `sub-pages-not-scroll` — Split content into new sections or sub-pages
  rather than cramming it all onto one page. A reader who bores easily should
  never face one long scroll.
- `short-paragraphs` — Keep paragraphs short. A reader disengages from long
  text runs; break up anything past the house-style word limit for a
  paragraph.
- `prose-as-last-resort` — Reach for a diagram, table, callout, or bullet
  list first. Write a prose paragraph only when none of those fit the
  content, and keep it short even then.
- `vertical-rhythm` — Leave generous vertical space between sections. Never
  shrink text to make it fit — route an aside into a callout or an on-demand
  panel instead of cramming it in at a smaller size.
- `full-width-callouts` — A callout's background spans the full column width
  even when its text is narrower than the column.
- `legible-inline-code` — Prefer a list or table with inline code over prose
  cluttered with inline code. Inline code must stay legible — never use a
  striped or alternating background behind it.
- `real-tables-not-faux` — Use a real table element for tabular data — never
  a div-based layout that merely looks like a table.

## Emphasis and structure

- `callouts-for-asides` — Put caveats, notes, and asides in a callout
  component, never inline as a parenthetical or a footnote-like aside in
  body prose.
- `bold-key-topics` — Use bold text to highlight the handful of most
  important topics on a page — not as routine emphasis sprinkled throughout.
- `single-sentence-bullets` — Prefer a single sentence per bullet. A bullet
  that needs two or more sentences is usually better as its own short
  paragraph or broken into separate bullets.
- `hide-depth-behind-interaction` — Hide deep detail behind an interaction —
  an accordion, or a clickable diagram region that opens a side or bottom
  panel — instead of showing it by default.
- `term-popover-not-modal` — A defined term shows its definition in a
  popover or a slide-out/slide-up panel on hover or click. Never use a modal
  dialog for this — modals behave badly on mobile.

## Facts, citations, and examples

- `cite-every-claim` — Cite every factual claim back to its original
  source — a file path, a document, or another durable reference — so a
  reader can verify it independently.
- `real-vs-illustrative` — Tag every code or data example as Real (generated
  fresh from the code — for example an actual JSON payload mapped to its
  schema) or Illustrative (hand-written to explain a concept). Never leave an
  example untagged, and prefer a real, end-to-end scenario walkthrough (call,
  then result, then who handles it next and why) over an abstract
  description.
- `mapped-matrices` — Prefer an "X mapped to Y" matrix over prose whenever
  the content describes a mapping between two sets (for example, callers
  mapped to the actions each one takes).
- `no-internal-codes` — Never cite an internal ticket, task, or
  decision-record code as a reference — a reader outside the project cannot
  look it up. Cite a file path or a plain description instead.
- `github-file-links` — A file-path reference links to the real file on its
  branch on GitHub, opening in a new tab.

## Diagrams

- `no-svg-text-overflow` — Diagram text must never overflow its box — wrap
  or resize it rather than letting it spill past its boundary.
- `diagram-text-budget` — Keep diagram node text short and at a consistent
  font size. Put further detail on demand, in a click-to-open panel, rather
  than packing it into the node itself.
- `diagrams-use-horizontal-space` — Let a diagram use the available
  horizontal space and degrade gracefully at narrow widths, rather than
  shrinking its text illegibly to fit.
- `charts-have-data-tables` — Every bar chart ships a real data table next
  to it, so the same information reaches a reader who skims and a reader who
  needs the exact values.
- `one-color-coded-diagram` — When showing what changed, use one large,
  color-coded diagram with a consistent legend for a three-way distinction
  such as identical, refactored, and new.

## The info component

- `info-for-definitions` — Define a term with a popover on its first mention
  per page, and keep the full glossary on the generated Terms page.
- `info-for-detail-in-tight-space` — When there is more to say than a tight
  space allows — a table cell, a caption, a long parenthetical — put the
  extra detail in a panel and keep one plain sentence inline.
- `info-for-diagram-context` — Make a diagram element clickable whenever
  there is real detail behind it — what it is, the files that implement it,
  the functions involved — and say so in the caption.
- `info-for-steps` — Give a flow, decision, or sequence step a clickable
  detail panel, and chain a multi-step sequence together so a reader can
  move to the next or previous step from inside it.
- `info-for-field-annotation` — Annotate a field or value inside a data
  structure — a JSON payload, a table row, a code sample — with a clickable
  marker rather than a parenthetical.
- `info-for-evidence` — Put a payload, a log, or a full example too large to
  show inline into a panel, and label it Real or Illustrative the same as
  any other example.
- `info-never-hides-the-point` — Never put the page's main claim, or
  anything a reader must know to follow along, only inside a panel — state
  it on the page itself, and use a panel only for supporting detail.
- `info-caption-matches-triggers` — Never tell a reader to click, tap, or
  select something that isn't actually clickable — a caption that names an
  interaction only works when the element it describes is a real trigger.
- `info-one-level` — Keep a panel's own content to one level — link out to a
  term or another page from inside it rather than chaining it into a second
  panel.
- `clickable-has-cue` — Every clickable trigger and every link that opens in
  a new tab carries a visible cue — an underline style and a small icon
  matched to what it does — so a reader can tell it's interactive, and what
  clicking it will do, before they click it.

## Navigation and meetings

- `nav-lands-at-top` — Navigating to a page lands the reader at its top, not
  wherever a previous page happened to be scrolled to.
- `generated-numbering` — Generate page numbering, navigation, and the pager
  from the artifact's own structure — never hand-number a page.
- `kickoff-page` — Offer a "Start here" kickoff page suited to presenting
  the artifact live in a meeting, alongside its regular pages.
- `same-direction-n-refinements` — When proposing a change to an existing
  plan, frame it as "same direction, N refinements": show what stays the
  same, and justify each individual change in detail.
- `on-demand-qa` — An optional live Q&A board is answered on demand — never
  by an always-on background loop.

## Code

- `concrete-toy-code` — Illustrate an abstract concept with concrete toy
  code, kept to at most 50 lines per file.
- `code-font-scroll` — Render code with syntax highlighting, unwrapped and
  horizontally scrollable, at a slightly smaller font than body text.

## Tone

If `contents.json` names a `voice` skill the current session has installed,
apply its guidance to every page's wording. If the session doesn't have it,
say so in the build/coordination report — never imitate a voice from
description alone.
