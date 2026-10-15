# annotated-json

JSON with numbered annotation markers mapped to a schema/notes table below it
(from the reference site's `envelope-by-example.html`).

## When to use

- A real request or response (ideally **Real**, generator-produced — see the
  `code` pattern) where specific fields need a sentence of explanation each,
  tied to a schema.
- Field-level detail that reads better as a scannable table under the JSON
  than as a popover per field.

## When not

- A diagram node, a scenario step, or a stepper item wanting a popover/side
  panel instead of a table row — use `panel`/`[data-panel]` (the shell's
  existing info component), which `scenario` and `steps` already reuse.
- A plain code block with nothing to annotate — use `code`.

## Markup contract

```html
<div class="ex-annotated-json">
  <pre class="ex-annotated-json-pre"><code>{
  "field": "value"<a class="ex-ann-marker" id="ann-NAME-src" href="#ann-NAME">N</a>
}</code></pre>

  <table class="ex-table ex-annotated-json-table">
    <thead><tr><th>#</th><th>Field</th><th>Note</th></tr></thead>
    <tbody>
      <tr id="ann-NAME">
        <td>N</td>
        <td><code>field</code></td>
        <td>What it means.<a class="ex-ann-back" href="#ann-NAME-src">&#8617; back</a></td>
      </tr>
    </tbody>
  </table>
</div>
```

- Root class `ex-annotated-json` goes on the wrapper `<div>`.
- `ex-annotated-json-pre` holds the raw JSON text (already HTML-entity-escaped,
  same convention as `code`'s `<pre>`) plus one `a.ex-ann-marker` per
  annotated field, numbered in the order they appear.
- Each marker's `href` points at its table row's `id` (`#ann-NAME`); each row
  carries a back-link (`.ex-ann-back`) to the marker's own `id`
  (`#ann-NAME-src`) so a reader can jump either direction.
- The notes table is a real `<table>` — add the `table` pattern's `ex-table`
  class alongside `ex-annotated-json-table` for borders/sticky header/scroll
  wrapper; this pattern only adds the row-highlight-on-jump rule
  (`tbody tr:target`).
- No JS. The jump-and-highlight behaviour is plain anchor navigation plus
  `:target` — no `data-panel`, no contents.json declaration needed.

## Tokens used

`--ex-border`, `--ex-bg-sunken`, `--ex-ink`, `--ex-ink-muted`, `--ex-accent`,
`--ex-accent-soft`, `--ex-focus`.
