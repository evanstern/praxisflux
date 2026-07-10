---
name: toolkit
description: lib/toolkit — shared educational content modules (tooltips, pedagogy, diagrams, code translation, quizzes) skills read while authoring, distinct from lib/'s importable plumbing.
kind: component
sources:
  - lib/toolkit/README.md
  - lib/toolkit/tooltip.md
  - lib/toolkit/pedagogy.md
  - lib/toolkit/svg-diagrams.md
  - lib/toolkit/code-translation.md
  - lib/toolkit/quiz-patterns.md
  - lib/toolkit/diagrams.md
verified_against: ada5f4cefad955d3444d4fc8fccb3c114adc4bf2
---

# Toolkit

`lib/toolkit/` holds the shared *content* modules of the chassis: authoring guidance and
copy-paste CSS/JS snippets that a skill reads while producing a deck, course, or briefing.
Where the rest of `lib/` is shared *plumbing* (code that gates and scripts import), toolkit
modules are Markdown teaching material — gate code never imports from `toolkit/`. All six
modules are shipped, per the status table in `lib/toolkit/README.md`. The README additionally
indexes **plugin-owned versioned chrome** — shared visual machinery too heavy and
domain-specific to vendor everywhere, which stays with its owning plugin but is registered
here so "where does shared visual machinery live" has a single answer.

## How it works

Skills reference a module as `${CLAUDE_PLUGIN_ROOT}/lib/toolkit/<module>.md`; the build copies
`lib/` wholesale into every packaged plugin, so each install carries its own vendored copy with
no runtime cross-plugin dependency. Two conventions bind every module:

- **Graceful degradation** — modules are always optional. A skill that uses one must state a
  one-line inline fallback and still function when the module is absent. Each module opens with
  its own fallback (e.g. pedagogy's is "one idea per screen; show, don't tell; lead with the
  point; split, don't shrink").
- **Shared token schema** — snippets are written against the shared CSS custom-property names
  (`--ink`, `--bg`, `--accent2`, …) from `lib/html/base.html`, so they inherit whichever
  palette the consuming plugin defines.

The modules:

- `tooltip.md` — jargon-glossary popover: any HTML or SVG element carries a `data-tip`
  attribute; one shared `.tip-pop` element is appended to `document.body` with
  `position: fixed` (never clipped by ancestor `overflow: hidden`), follows the cursor on
  hover, toggles on tap, clamps to the viewport, hides in print. The CSS/JS live between
  `praxisflux:tooltip-css/js:start|end` markers and are re-stamped into consumers by
  `scripts/sync-shared.mjs`; drift fails the test suite.
- `pedagogy.md` — the five visual-teaching principles shared by every teaching surface: one
  idea per screen; show, don't tell; lead with the point; split, don't shrink; let visuals
  breathe — plus how course screens, deck slides, and briefing pages each apply them.
- `svg-diagrams.md` — inline-SVG authoring rules: `<tspan>` not `<b>`/`<i>` inside `<text>`;
  CSS `var(--token)` does not resolve in SVG presentation attributes (use literal colors that
  read on both themes); size with `viewBox` + `width:100%; height:auto`; `role="img"` and an
  `aria-label`.
- `code-translation.md` — code-to-plain-English rules (real code verbatim, `pre-wrap` so no
  horizontal scrollbars, one note per line that matters) plus a zero-JS comments-on-top
  `.translate` panel for decks and briefings.
- `quiz-patterns.md` — quiz doctrine (the coverage rule: questions may only lean on concepts
  already taught; quiz application, never definitions) plus a zero-JS `<details>`/`<summary>`
  reveal quiz.
- `diagrams.md` — plain HTML/CSS diagram idioms: a `.flow` of boxes with arrow separators and
  an annotated `.tree` file listing, both token-styled and responsive.

The one registered chrome entry is codebase-to-course's course chrome (`styles.css`,
`main.js`, `_footer.html`, `build.sh`, `validate.mjs`), canonical in that plugin's
`references/`, currently `chrome v2 — inline translation engine (comments-on-top)`. Rendering
files carry the version stamp (no stamp = the retired v1), `validate.mjs` carries
`CHROME_VERSION`, both `build.sh` and the course gate fail unstamped or version-mixed copies,
and `build.sh` refreshes vendored copies from the canonical source whenever
`CLAUDE_PLUGIN_ROOT`/`C2C_REFERENCES` resolves — vendored course copies are build artifacts,
never templates. The full convention lives in `docs/skill-patterns.md` ("Versioned course
chrome").

## Connections

Part of the [[chassis]], vendored into each plugin by [[build-and-release]]; the referencing
and degradation conventions are defined in [[skill-patterns]]. Consumed by [[educate-plugin]]
decks, [[research-plugin]] briefings (via the vault-artifact reference layer), and
[[codebase-to-course-plugin]] — though courses replace the portable tooltip/translation/quiz
snippets with their own prebuilt asset engines. Tooltip-region stamping is enforced by the
[[test-suite]]. Gate plumbing ([[gate-runner]], [[markdown-module]]) never touches toolkit.

## Operational notes

No runtime surface: modules are prose read at authoring time, so there are no env vars or
failure modes beyond absence — and absence is by design non-fatal (the inline fallback rule).
The tooltip popover's text size follows `--tip-size` (default `1rem`). The only automated
check is `scripts/sync-shared.mjs` keeping stamped tooltip regions identical in consumers.
