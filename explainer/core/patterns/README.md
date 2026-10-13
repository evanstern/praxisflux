# core/patterns

The explainer pattern library. One folder per pattern; the build (`lib/shell.mjs`) inlines
only the CSS/JS of patterns a page's markup actually uses
(`collectPatternNames`/`resolvePatterns`) — never the whole library.

## Folder contract

Every `core/patterns/<name>/` folder has exactly:

| File | Required | Notes |
|---|---|---|
| `<name>.css` | yes | Only `--ex-*` custom properties (`core/brand/tokens.json`) — no literal colours, no `var()` inside an SVG attribute. |
| `<name>.js` | optional | Vanilla, no dependencies, idempotent `init`, a no-op if the pattern's markup is absent from the page. Ship it only if the pattern needs real interactivity beyond what plain CSS/native HTML (e.g. `<details>`) already gives. |
| `example.html` | yes | A *page middle* (authoring markup — a fragment, not a full HTML document) demonstrating the pattern. Must build cleanly through the real build when used as a page body. |
| `README.md` | yes | When to use / when not / markup contract / tokens used. |

**Root class** is `ex-<name>` (e.g. `ex-callout`, `ex-table`, `ex-matrix`). It
goes on the pattern's outermost element and is both (a) this pattern's styling
hook and (b) the trigger the build's pattern collector looks for — a page using
no `ex-<name>` class anywhere never pulls that pattern's CSS/JS into the
build. **Modifiers** are `ex-<name>--<mod>` (e.g. `ex-callout--caution`,
`ex-grade--good`). A few patterns also use plain `ex-<name>-<part>` classes for
internal structure (e.g. `ex-callout-tag`, `ex-card-title`) — not pattern
triggers themselves, just styling hooks scoped under the root class.

**Build-owned markup still implies its pattern.** Several patterns'
real trigger markup is emitted by the build itself, never hand-written by a
page-writer, so it can't be found by the plain "strip the `ex-` prefix off
a literal class" rule above — `scripts/lib/shell.mjs`'s
`BUILD_OWNED_EX_CLASSES` keeps those classes (`ex-code*`, `a.ex-term`,
the diagram/info classes) out of that generic mapping. Instead,
`collectPatternNames` carries a small, explicit **implication map**
(`BUILD_OWNED_IMPLIES` plus three attribute checks): any element with the
`ex-code` class implies `code`; any `a.ex-term`/`data-term="…"` implies
**both** `term` and `info`; any `[data-panel]` anywhere on the page implies
**both** `panel` and `info`; and the `data-info-target` attribute every
`info` trigger shape carries (`<x-info>`, a hand-authored `data-info`, and
the `data-panel` alias — lib/includes.mjs normalizes all three to it)
implies `info` directly. A page using `<x-example>`/`<x-include>`
(→ `.ex-code`), `<x-term>` (→ `a.ex-term`), `<x-info>`/`data-info`, or a
diagram node/`scenario`/`steps` item (→ `[data-panel]`) ships exactly the
matching pattern's CSS/JS, the same as any other pattern — and a page using
none of them ships none of these. Extend the map (not the exclusion set) if
a future build-owned emitter clearly maps to a pattern.

Tests live in `scripts/test/patterns-content.test.mjs` (this phase) and
`scripts/test/patterns.test.mjs` (Phase 2b, — the cross-pattern contract
tests covering every folder: the 4-file contract, token-only CSS, no stray
`var()`/colours in SVG attributes, build-inlines-only-used-patterns).

## Patterns (18 folders; the spec lists `cards`/`stats` as one row — shipped as two
folders per )

| Pattern | Phase | Status |
|---|---|---|
| `callout` | 2a | done |
| `table` | 2a | done |
| `matrix` | 2a | done |
| `details` | 2a | done |
| `legend` | 2a | done |
| `cards` | 2a | done |
| `stats` | 2a | done |
| `verdict-list` | 2a | done |
| `code` | 2b | done |
| `annotated-json` | 2b | done |
| `file-map` | 2b | done |
| `scenario` | 2b | done |
| `steps` | 2b | done |
| `term` | 2b | done |
| `panel` | 2b | done |
| `presenter` | 2b | done |
| `ask` | 2b | done |
| `info` | | done |

`term`/`panel` style/extend content *inside* an `info` body (`ex-term-eg`/
`ex-panel-section` etc.) — `info` itself owns the
trigger, the dialog, and every mode (popover/panel/phone sheet); it replaced
the earlier `.ex-info*` CSS that briefly lived in `core/shell/shell.css`.
`presenter`/`ask` ship CSS + markup + inert JS hooks only in 2b — their live
wiring (the `db`/`comments` Artifact capabilities) is a later task
and they must degrade to no-ops when `window.claude` is absent.
`code`/`term`/`panel`/`info` are inlined via the implication map documented
above, not the generic `ex-<name>` class scan — see each folder's README "How
this folder gets inlined" section.

## Extending this library (for 2b, or a later pack)

1. Copy an existing folder's shape (e.g. `table/` or `details/`, whichever is
   closer in kind) rather than starting blank.
2. If the pattern needs a colour this library doesn't already have a token
   for, add it to `core/brand/tokens.json` (and every brand file —
   `core/brand/neutral.css` plus any project brand) before writing CSS that references it.
   Reuse an existing token/vocabulary (`--ex-status-*`, `--ex-diagram-*`) over
   adding a near-duplicate when the read is the same.
3. `example.html` is a fragment (no `<html>`/`<head>`) using only the markup a
   real page-writer would write — plain classes, no x-* elements needed unless
   the pattern specifically interacts with one.
4. A project or pack can override any pattern by name without touching this
   folder — the lookup (`scripts/lib/lookup.mjs`) resolves `patterns/<name>`
   from the artifact, then the repo's `.claude/explainer/`, then each pack, and
   only then `core/`.
