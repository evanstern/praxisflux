# scenario

Call → result → who handles it next → why (from the reference site's `scenarios.html`).

## When to use

- Walking through one concrete end-to-end case: what was called, what came
  back, who acts on it next, and why that's the right behaviour.
- A PR explainer's "scenario walkthroughs" page type (  kind-to-page-type table).

## When not

- A multi-step sequence traced through several real functions/hosts in
  order (a diagram, or a numbered list of steps) — use `steps`.
- A single annotated payload with no "who handles it next" framing — use
  `annotated-json` or plain `code`.

## Markup contract

```html
<section class="ex-scenario">
  <h3>Title</h3>
  <div class="ex-scenario-chain" role="list">
    <span class="ex-scenario-step" data-panel="KEY-1" tabindex="0" role="listitem">…</span>
    <span class="ex-scenario-arrow" aria-hidden="true">&rarr;</span>
    <span class="ex-scenario-step" data-panel="KEY-2" tabindex="0" role="listitem">
      envelope: <span class="ex-scenario-verdict ex-scenario-verdict--good">proceed</span>
    </span>
    <span class="ex-scenario-arrow" aria-hidden="true">&rarr;</span>
    <span class="ex-scenario-step" data-panel="KEY-3" tabindex="0" role="listitem">…</span>
  </div>
  <p><span class="ex-scenario-why">One-line verdict.</span> Why, in full.</p>
</section>
```

- Root class `ex-scenario` on a `<section>` (or any block) — a normal,
  build-collected pattern trigger (unlike `code`/`term`/`panel`).
- `ex-scenario-chain` holds any number of `ex-scenario-step` spans separated
  by `ex-scenario-arrow`.
- Each `ex-scenario-step` is a `[data-panel]` trigger — **the shell's
  existing info-component wiring** (`core/shell/shell.js` `initPanels`) opens its detail, not any JS of this pattern's own. The page
  **must** declare a matching entry in its `contents.json` `pages[].panels[]`
  (`{key, title, body}`) for every `data-panel` key used, or the build fails
  (`lib/includes.mjs`'s `checkDataPanel`).
- `ex-scenario-verdict` (optional, usually inside a step) takes a modifier —
  `--good` (proceed), `--caution` (hold), `--bad` (stop) — matching the
  shared status vocabulary (`table`'s ● ◐ ○ grades, `matrix`'s verdict
  cells).
- `ex-scenario-why` marks the one-line verdict sentence; the rest of the
  `<p>` is the full explanation.
- No JS of this pattern's own.

## Tokens used

`--ex-border`, `--ex-border-strong`, `--ex-bg-elevated`, `--ex-bg-sunken`,
`--ex-ink-faint`, `--ex-shadow`, `--ex-accent`, `--ex-focus`,
`--ex-status-good(-bg)`, `--ex-status-caution(-bg)`, `--ex-status-bad(-bg)`.
