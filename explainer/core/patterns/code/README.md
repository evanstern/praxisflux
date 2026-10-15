# code

Highlighted, unwrapped, horizontally scrollable, keyboard-focusable code blocks.
A built-in tokenizer (`code.js`)
highlights `ts`, `js`, `json`, `yaml`, `py`, `sh`, `dockerfile`, `md`, and
`tree` — no external library, no network.

## When to use

- Every code block an artifact shows: both **Real** examples (`x-include`,
  generator output) and **Illustrative** ones (`x-example`) render into this
  pattern's exact markup — page-writers never write `.ex-code` by hand, they
  write `<x-example>`/`<x-include>` and the build expands it.
- A set of changed files shown one-at-a-time, collapsed by default — wrap
  each file's block in `<details class="ex-details">` (the `details`
  pattern); see `example.html`'s second example.

## When not

- A field-by-field annotated JSON response (numbered markers mapped to a
  notes table) — use `annotated-json` instead, which has its own block
  styling.
- A large, filterable set of changed files (bucket chips, search, status
  filter) — use `file-map`; it can link to the same paths this pattern
  shows in full.

## Markup contract

```html
<div class="ex-code" data-tag="Real">
  <div class="ex-code-head">
    <span class="ex-code-tag">Real</span>
    <span class="ex-code-file">path/to/file.ts</span>
  </div>
  <pre class="ex-code-pre" tabindex="0"><code class="ex-code-lang-ts">already-escaped source text</code></pre>
</div>
```

- This is **exactly** what `scripts/lib/includes.mjs`'s `renderCodeBlock`
  emits for both `x-example` (`data-tag="Illustrative"`) and `x-include`
  (`data-tag="Real"`) — never hand-write it for those cases; write the `x-*`
  tag instead. Write it directly (as this folder's `example.html` does) only
  when demonstrating the pattern itself, outside a real build.
- `data-tag` on the root is `"Real"` or `"Illustrative"` — it colours
  `.ex-code-tag` (`--ex-status-good` vs `--ex-ink-faint`) and carries no
  other meaning.
- `ex-code-file` is optional (`x-example`'s `file` attribute is optional too).
- The `<code>` class is `ex-code-lang-<lang>` — `code.js` reads `<lang>` off
  that class name to pick a tokenizer; an unrecognized `<lang>` (including
  `text`, from `x-include as="text"`) is escaped but not highlighted.
- The code text inside `<code>` must already be HTML-entity-escaped (`&lt;`,
  `&amp;`, …) — it is read back via `textContent` (which un-escapes it) and
  re-escaped by the highlighter, never passed through twice.
- For a multi-file listing, wrap each `.ex-code` block in a `details`
  pattern `<details class="ex-details"><summary>path</summary>…</details>`
  — no new markup or class of this pattern's own for "collapsible."

## Tokens used

`--ex-border`, `--ex-bg-sunken`, `--ex-ink`, `--ex-ink-muted`,
`--ex-ink-faint`, `--ex-focus`, `--ex-status-good`,
`--ex-code-keyword`, `--ex-code-string`, `--ex-code-comment`,
`--ex-code-number`, `--ex-code-function`, `--ex-code-punct`.

## How this folder gets inlined

`ex-code*` is shell-emitted (`renderCodeBlock`), not a page-writer's own
literal class — `scripts/lib/shell.mjs`'s `BUILD_OWNED_EX_CLASSES` still
excludes it from the generic `ex-<name>` → pattern mapping, same as every
other shell/diagram class, so `ex-code` never becomes a pattern name by the
plain "strip the `ex-` prefix" rule. `collectPatternNames` instead carries
an explicit **implication map**: any element with the `ex-code` class
implies the `code` pattern (and `a.ex-term`/`data-term` implies `term`,
`[data-panel]` implies `panel`) — so this folder's CSS/JS ship exactly on a
page that actually has a code block (from `<x-example>`/`<x-include>`, or
hand-written in the same shape, as this folder's own `example.html` does),
and never on one that doesn't.
