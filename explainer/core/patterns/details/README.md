# details

Accordion styling for the native `<details>`/`<summary>` elements.

## When to use

- Secondary content a reader can choose to expand — a longer explanation, a
  reference block, an aside that would clutter the main reading path if always
  visible.
- Anywhere you'd reach for a native disclosure widget; this pattern only adds
  styling, never a custom widget.

## When not

- A side panel or bottom sheet tied to a diagram node, term, or step — that's
  `term`/`panel`, which extend the shell's info component instead of using
  `<details>`.
- A list of file-map bucket groups with filters/search — that's `file-map`
  (Phase 2b), which may build its own grouped-disclosure markup on top of this
  one.

## Markup contract

```html
<details class="ex-details">
  <summary>Summary line, always visible</summary>
  <p>Body content, hidden until the reader opens it.</p>
</details>
```

- Root class `ex-details` goes on the `<details>` element itself.
- No modifiers in v1.
- No JS; the browser's native toggle behaviour is unmodified. `details.js` is
  not shipped.

## Tokens used

`--ex-border`, `--ex-bg-elevated`, `--ex-accent`.
