---
name: selfcontained-verifier
description: The chassis HTML self-containment checker — checkHtml flags external scripts, styles, images, fonts, and runtime fetches that the Artifact CSP would block; externalLoads lists each occurrence
kind: component
sources:
  - lib/selfcontained.mjs
verified_against: 617c27cb8a6578af4d6541f51c2d5c7522cfacf0
---

# Self-contained HTML verifier

`lib/selfcontained.mjs` verifies that a rendered HTML page is self-contained and CSP-safe.
It exists because the Artifact host enforces a strict Content-Security-Policy that blocks
every external host, so a page that loads a remote script, font, stylesheet, or image
silently breaks. The module was ported from research's earlier `verify_artifact.py` and is
now the single checker shared by every plugin that emits HTML.

## How it works

The module exports two functions. Neither exits the process; callers decide what to do
with the result.

- `checkHtml(html, { substantialBytes = 6000 } = {})` returns `{ ok, fails, warns }` —
  `ok` is true exactly when `fails` is empty. It emits one fail per *kind* of external
  load, however many times that kind occurs.
- `externalLoads(html)` returns every external load as `{ label, url, index }`, in source
  order. Callers that report `file:line` locations use it; `checkHtml` is built on it.

A private `CHECKS` table pairs case-insensitive regex sources with labels. Each regex
captures the URL, which matches either an absolute `http(s)://` URL or a protocol-relative
`//host` URL (held in the `URL` constant) — both leave the page. Any match is a **fail**:

- external `<script src>`
- external `<link href>` (stylesheet/font)
- external image `src` on `<img>`, `<source>`, or `<image>`
- external URL inside a `srcset` attribute
- external CSS `url(...)`
- external `@import`
- runtime `fetch()` to an external host
- XHR `.open("METHOD", "http...")` to an external host

Each hit produces a fail message ending with the remedy: "the Artifact CSP blocks this;
inline it or embed as a data: URI". One additional structural fail: a missing or empty
`<title>` ("the artifact needs a name").

Two heuristics only **warn**, never fail:

- no `prefers-color-scheme` anywhere — the page may not adapt to dark/light themes;
- the page exceeds `substantialBytes` (default 6000) but contains no `<table>` — a data
  table is suggested so figures are auditable.

There is no allowlist inside the module itself. Callers that permit an exception do so by
neutralizing the URL before calling — e.g. the codebase-to-course course gate replaces
Google Fonts URLs with a placeholder string before passing the HTML to `checkHtml`. The
module does not read `lib/html/base.html` or any other file; it operates purely on the
string it is given.

## Connections

- Part of the shared [[chassis]]; vendored into each plugin's `dist/` by
  [[build-and-release]].
- Backs the HTML leg of [[gates-convention]]: the [[educate-plugin]] DoD gate runs it on
  `deck.html`, the [[research-plugin]] artifact gate runs it on rendered
  `*-briefing.html`, and the [[codebase-to-course-plugin]] course gate runs it on the
  generated course page. The [[explainer-plugin]] runs `externalLoads` in both its
  `self.contained` check and its Stop hook over built `dist/` pages.
- Exercised by the [[test-suite]].

## Operational notes

- No environment variables, no I/O, no dependencies — a pure function over an HTML string.
- Failure behavior: returns structured results only; wrapping gates map `fails` to a
  blocking exit, `warns` to advisory output.
- The `substantialBytes` option is the only tunable; everything else is fixed regexes.
- Detection is regex-based, so external references built dynamically at runtime (string
  concatenation, template literals) are not caught.
