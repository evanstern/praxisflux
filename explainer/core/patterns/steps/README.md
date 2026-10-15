# steps

A numbered stepper whose items open detail panels via the shell's existing
`[data-panel]` wiring (from the reference site's
`flow-stage-call.html` stepper fallback).

## When to use

- A sequence traced through several real functions/hosts in order, where
  each step has more detail than fits inline — a sequence diagram's
  narrow-screen fallback, or a stand-alone numbered walkthrough.
- Onboarding's "guided tour of the code" page type.

## When not

- "Call → result → who handles it → why" framed as one scenario, not a
  numbered sequence — use `scenario`.
- A collapsed/expand toggle with no click-for-more-detail panel — use
  `details`.

## Markup contract

```html
<ol class="ex-steps" aria-label="Sequence, click any step for detail">
  <li class="ex-steps-item" data-panel="KEY" tabindex="0">
    <span class="ex-steps-who">who → who</span>
    <div class="ex-steps-what">What happens in this step.</div>
  </li>
</ol>
```

- Root class `ex-steps` on the `<ol>` (a normal, build-collected pattern
  trigger).
- Each `ex-steps-item` is a `[data-panel]` trigger — **the shell's existing
  info-component wiring** (`core/shell/shell.js` `initPanels`)
  opens its detail; this pattern ships no JS of its own. The page **must**
  declare a matching entry in `contents.json` `pages[].panels[]`
  (`{key, title, body}`) for every `data-panel` key used, or the build fails
  (`lib/includes.mjs`'s `checkDataPanel`).
- `ex-steps-who` is an optional eyebrow line (caller → callee); `ex-steps-what`
  is the step's one-line summary.
- Numbering is pure CSS (`counter-reset`/`counter-increment`) — reordering
  `<li>` elements renumbers them automatically; no JS, no manual numbers.

## Tokens used

`--ex-border`, `--ex-border-strong`, `--ex-bg-elevated`, `--ex-ink-muted`,
`--ex-accent`, `--ex-accent-ink`, `--ex-focus`.
