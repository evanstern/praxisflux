# ask

A per-section "Ask about this" button. `ask.js` is CSS + markup + an inert
JS hook; `ask.live.js` is the runtime wiring that opens the
shell's `comments` composer, anchored to the section — it ships alongside
`ask.js` only when `contents.live.comments` is `true` (lib/shell.mjs's
`resolvePatterns`), never merely because a page uses this pattern.

**The build emits the button itself** when `contents.live.comments` is on
(lib/shell.mjs's `injectAskButtons`, /) — page-writers
don't have to. It adds one button right after every heading the page gives
an `id` (`<h2>`–`<h4>`); a page with no such addressable sub-section gets
one button for the whole page instead, anchored to the page's own id. A
page that already hand-authors its own `.ex-ask` button (below) is left
exactly as written — the build never adds a second one. Hand-author one
yourself only when you need it anchored somewhere the build can't infer
(not simply "after the nearest heading").

## When to use

- After any section a reader is likely to have questions about — the build
  adds one automatically per heading-with-id when `live.comments` is on;
  hand-author one only for a placement the build can't infer.

## When not

- Anything requiring the button to actually do something today — until
  `ask.live.js` calls `enable()` (only when `contents.live.comments` is
  on and the `comments` capability resolves), every `.ex-ask` button stays
  `hidden` by design.

## Markup contract

```html
<h2 id="SECTION-ID">Section title</h2>
<p>…</p>
<button type="button" class="ex-ask" data-ask-section="SECTION-ID" hidden>Ask about this</button>
```

- Root class `ex-ask` on a `<button type="button">`, placed after the
  section it's about.
- `data-ask-section` names the section (usually the nearest heading's `id`)
  the composer should anchor to — `ask.js` passes it straight through to the
  `onAsk` hook, unvalidated.
- `hidden` is required in the markup: the button renders nothing until
  `ExplainerAsk.enable(onAsk)` is called.

## The `enable()` contract

```js
ExplainerAsk.enable(function (sectionId, buttonEl) {
  // open the shell's comments composer, anchored to sectionId
  // (the `comments: {composer_only: true}` Artifact capability)
});
```

`enable()` un-hides and wires every `.ex-ask[hidden]` button on the page (or
under a given scope element); a button it has already wired (no longer
`hidden`) is left alone. Before `enable()` is ever called — including on a
page with no `window.claude` at all, where nothing calls it — every button
stays hidden (: no-op without the live capability).

## The live wiring (`ask.live.js`)

Resolves the capability and calls `enable()` with an `onAsk` that opens the
composer anchored at the clicked section (its heading element when
`data-ask-section` resolves to one on the page, else the button itself):

```js
window.claude.use("comments").then(function (comments) {
  if (!comments) return; // not served/granted for this view — stay inert
  ExplainerAsk.enable(function (sectionId, btnEl) {
    var target = (sectionId && document.getElementById(sectionId)) || btnEl;
    comments.openComposer({ element: target }).catch(function () {});
  });
});
```

Declared capability: `comments: {composer_only: true}` — grants exactly
`openComposer`/`anchorFor` with **no consent prompt** (the `comments.d.ts`
contract in the `artifact-capabilities` skill); the page posts nothing
itself, the shell's own composer does. `claude.use("comments")` resolving
`null` (not served/granted/no `window.claude`) leaves every button hidden —
no error, no visible control.

## Tokens used

`--ex-border`, `--ex-bg-elevated`, `--ex-ink-muted`, `--ex-accent`,
`--ex-focus`.
