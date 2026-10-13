# term

Optional refinements for content *inside* a term's `def` HTML. The popover/bottom-sheet, the dotted-underline
trigger (`a.ex-term`), and the generated Terms page are all the `info`
component's own (`core/patterns/info/`, /— previously a
small slice of `core/shell/shell.css`/`shell.js`) — this pattern
never re-implements any of it, only styles two optional spans a term's
definition text can use.

## When to use

- A term's `def` (in `contents.json` `terms[]`) wants a short inline example
  (`ex-term-eg`) or an explicit "see also" line (`ex-term-also`) beyond plain
  prose.

## When not

- Defining a new term, or changing how/where it pops up — that's
  `contents.json` `terms[]` plus the shell, not this folder.
- A diagram node's or step's detail panel — use `panel`.

## Markup contract

Written inside a term's `def` HTML string (never as a standalone page
fragment, since `a.ex-term`/the popover only exist once the build expands an
`<x-term>` tag and injects this HTML):

```html
A short definition sentence.
<span class="ex-term-eg">e.g. "a concrete example"</span>
<p class="ex-term-also">See also <a href="#terms--other" class="ex-term-see">other</a>.</p>
```

- `ex-term-eg`: a short inline example, muted and italic.
- `ex-term-also`: a cross-reference line; pair with the shell's own
  `ex-term-see` class on the link (already styled in `core/shell/shell.css`).
- No JS.

## How this folder gets inlined

`a.ex-term`/`data-term` are shell-emitted, not a page-writer's own literal
class (`scripts/lib/shell.mjs`'s `BUILD_OWNED_EX_CLASSES` excludes them from
the generic `ex-<name>` → pattern mapping, same as every other shell/diagram
class). `collectPatternNames` instead carries an explicit **implication
map**: any `a.ex-term`/`data-term="…"` on a page implies **both** the `term`
pattern and `info` (the engine a term's popover now
runs on) — so this folder's CSS ships exactly on a page that actually uses
`<x-term>`, and never on one that doesn't. `example.html`'s final snippet is
the trigger markup itself (hand-written, the same shape `<x-term>` expands
to) so this folder's own example proves the implication.

## Tokens used

`--ex-ink-muted`.
