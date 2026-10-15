# presenter

Owner toggle, a "Presenting" badge, and a follower's follow/unfollow toggle.
`presenter.js` is CSS + markup + inert JS hooks; `presenter.live.js`
 is the runtime wiring — resolves `db`/`user`, decides
ownership, writes/reads `live/state`, moves a follower's view — and ships
alongside `presenter.js` only when `contents.live.presenter` is `true`
(lib/shell.mjs's `resolvePatterns`), never merely because a page uses this
pattern.

**The build emits the control cluster itself** when `contents.live.presenter`
is on (lib/shell.mjs's `presenterTopbarHtml`, same approach as `ask`'s
`injectAskButtons`): unlike `ask`, which anchors to a page's own section,
`presenter` attaches to the whole artifact via the flag alone (there's no
page-level "where" to infer a presenter widget belongs) — so the build adds
the markup contract below once, in the shell's own top bar, shared by every
page in both the single and `--multi` shapes. A page may still hand-author
its own `.ex-presenter` block too (e.g. a dedicated "Start here" page); both
ship side by side and `enable()` wires every not-yet-wired one wherever it
came from.

## When to use

- A meeting-deck-mode artifact (a "Start here" page + this pattern,
  attachable to any kind — any profile) where the host
  wants to drive which page everyone else sees.

## When not

- Anything requiring the UI to actually do something today — until
  `presenter.live.js` calls `enable()` (only when `contents.live.presenter`
  is on and both the `db` and `user` capabilities resolve), every control
  stays `hidden` by design (see below); don't wire a click handler of your
  own against these classes.

## Markup contract

```html
<div class="ex-presenter">
  <button type="button" class="ex-presenter-toggle" aria-pressed="false" hidden>Start presenting</button>
  <span class="ex-presenter-badge" hidden>Presenting</span>
  <button type="button" class="ex-presenter-follow" aria-pressed="true" hidden>Following presenter</button>
</div>
```

- Root class `ex-presenter`. All three children start `hidden` — copy this
  markup exactly; `presenter.js` only ever un-hides, it never creates these
  elements.
- `ex-presenter-toggle`: the owner's start/stop button.
- `ex-presenter-badge`: visible to the owner only, while presenting.
- `ex-presenter-follow`: visible to a non-owner only, while someone else is
  presenting.

## The `enable()` contract

```js
var controllers = ExplainerPresenter.enable({
  isOwner: Boolean,            // from user.isOwner()
  followingDefault: Boolean,   // from localStorage, same convention as shell.js's theme toggle
  onToggle: function (presenting) { /* db.doc('live/state').set({presenting, page}) */ },
  onFollowToggle: function (following) { /* persist + maybe navigate */ },
  onRemotePresenting: function (presenting, page) { /* reflect a remote db change back into the UI */ },
});
// controllers[i].setPresenting(bool, page) / .setFollowing(bool) — call from
// db.doc('live/state').onSnapshot(...) to reflect remote state.
```

`enable()` wires every not-yet-wired `.ex-presenter` on the page (or under a
given scope element) and is idempotent (`data-ex-presenter-ready` guards
against double-wiring). Before `enable()` is ever called — including on a
page with no `window.claude` at all, where nothing calls it — every control
stays hidden (: no-op without the live capability).

## The live wiring (`presenter.live.js`)

Resolves `db` + `user` (`capabilities: {db: {rules: [...]}, user: {}}` —
`user` needs no scope beyond the bare declaration for `isOwner()`), decides
ownership, and drives `enable()`:

- **Data model** — one document, `live/state`:
  `{ presenting: boolean, page: string|null, section: string|null,
  updatedAt: string (ISO) }`.
- **Access rule** (`live-state.rules.js`, same folder —
  `LIVE_STATE_DB_RULES`, a plain array the coordinator's publish step
  passes straight into `capabilities.db.rules`):
  `{ path: "live/state", read: "view", write: "owner" }` — every admitted
  viewer can read who's presenting; only the artifact's actual owner
  (`user.isOwner()`, not merely an Editor) may write it.
- **Owner**: `onToggle` writes `live/state`; while presenting, this
  viewer's own in-document navigation (hash links, menu, pager — via
  `core/shell/shell.js`'s `window.ExShell.onPageChange`
  additive hook) re-writes it with the new page/section. In `--multi`
  (no same-document navigation to hook), an owner who is already
  presenting re-announces their position once on each fresh page load
  instead.
- **Follower**: subscribes to `live/state` once
  (`db.doc('live/state').onSnapshot(...)`); when it's presenting and this
  viewer's own follow toggle (persisted in `localStorage`, try/catch) is
  on, navigates via `window.ExShell.navigateTo(page, section)`.
- Either `db` or `user` resolving `null` (not served, not granted, or no
  `window.claude` at all) leaves every control hidden — read-only, no
  error.

## Tokens used

`--ex-border`, `--ex-border-strong`, `--ex-bg-elevated`, `--ex-ink`,
`--ex-focus`, `--ex-status-good(-bg)`.
