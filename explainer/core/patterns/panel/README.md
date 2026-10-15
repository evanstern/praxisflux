# panel

Optional refinements for content *inside* a panel's `body` HTML. The side panel / bottom sheet, the
`[data-panel]` trigger wiring, and the "click or Enter/Space to open" keyboard
handling are all the `info` component's own (`core/patterns/info/`, spec
017/— `data-panel` is now a thin alias for `data-info`, read as
an info body for backwards compatibility; previously a small slice of
`core/shell/shell.css`/`shell.js`'s `ExInfo`) — this pattern
never re-implements any of it, only styles content a panel's `body` can use
for richer formatting than plain paragraphs.

## When to use

- A `data-panel` body (declared in `contents.json` `pages[].panels[]`) that
  benefits from labeled sections, a compact meta line, or a prominent
  in-panel link, rather than one undifferentiated block of prose.
- Pairs naturally with `scenario` and `steps`, both of which trigger panels
  via `[data-panel]`.

## When not

- Defining the trigger itself (which element opens a panel, and with what
  key) — that's `[data-panel]` plus `contents.json` `panels[]`, not this
  folder.
- A term's popover content — use `term`.

## Markup contract

Written inside a panel's `body` HTML string (never as a standalone page
fragment, since the side panel / bottom sheet only exists once the shell
injects this HTML on open):

```html
<div class="ex-panel-section">
  <h4>Section label</h4>
  <p class="ex-panel-meta">key: value &middot; key: value</p>
  <p>Explanatory prose.</p>
  <a class="ex-panel-cta" href="#somewhere">Call to action &rarr;</a>
</div>
```

- `ex-panel-section`: one labeled block; stack several with a `<h4>` each.
- `ex-panel-meta`: a compact, muted key/value summary line.
- `ex-panel-cta`: a small pill-styled link for "go read more."
- No JS.

## How this folder gets inlined

`[data-panel]` is shell-wired, not a page-writer's own `ex-<name>` class
(`scripts/lib/shell.mjs`'s `BUILD_OWNED_EX_CLASSES` excludes it from the
generic mapping, same as every other shell/diagram class). `collectPatternNames`
instead carries an explicit **implication map**: any `[data-panel]` anywhere
on a page implies **both** the `panel` pattern and `info` (the engine a panel now runs on) — so this folder's CSS ships
exactly on a page that actually has a panel trigger, and never on one that
doesn't. `example.html`'s final snippet is a bare `[data-panel]` trigger
(the same shape `scenario`/`steps` use) so this folder's own example proves
the implication.

## Tokens used

`--ex-ink-muted`, `--ex-accent`, `--ex-accent-soft`, `--ex-focus`.
