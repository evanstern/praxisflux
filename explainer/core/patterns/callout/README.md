# callout

Full-width note / caution / key / aside banner.

## When to use

- A short aside that needs visual separation from the surrounding prose but isn't
  long enough to earn its own page section.
- One of the four canonical kinds: **note** (neutral context), **caution** (a risk
  or gotcha), **key** (the one thing a skimming reader must not miss), **aside**
  (tangential detail).

## When not

- Long reference content — use `details` (collapsed by default) instead of a
  permanently-open callout.
- A verdict or recommendation list — use `verdict-list`.
- Anything that needs to vary per-section interactivity (that's `ask`/`presenter`).

## Markup contract

```html
<div class="ex-callout ex-callout--<kind>">
  <p class="ex-callout-tag"><Kind label></p>
  <p>Body copy. Any block content is allowed after the tag line.</p>
</div>
```

- Root class `ex-callout` is required on the container; the build only inlines
  this pattern's CSS when some element on the page carries an `ex-callout*` class.
- Exactly one kind modifier — `ex-callout--note`, `ex-callout--caution`,
  `ex-callout--key`, or `ex-callout--aside` — chooses the colour pair. Omitting a
  modifier still renders (neutral border + `--ex-bg-elevated`), but a page-writer
  should always pick a kind.
- `.ex-callout-tag` holds the kind label as plain text (e.g. "Note"); the CSS
  uppercases it via `text-transform`, so authors write normal sentence case.
- No required JS; `callout.js` is not shipped.

## Tokens used

`--ex-border`, `--ex-bg-elevated`, `--ex-ink-muted`,
`--ex-callout-note` / `-note-bg`, `--ex-callout-caution` / `-caution-bg`,
`--ex-callout-key` / `-key-bg`, `--ex-callout-aside` / `-aside-bg`.
