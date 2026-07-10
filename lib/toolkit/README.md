# lib/toolkit — shared educational content modules

Reusable teaching and visual tools shared across the praxisflux plugins. Where the rest of `lib/`
is shared *plumbing* (code the gates and scripts import), `toolkit/` is shared *content*:
authoring guidance and copy-paste CSS/JS snippets a skill reads while producing a deck, course,
or briefing. The full convention lives in
[`docs/skill-patterns.md`](../../docs/skill-patterns.md) ("Shared content modules — the toolkit").

The convention in brief:

- **Vendored, not linked.** `scripts/build.mjs` copies `lib/` wholesale into every packaged
  plugin, so each installed plugin carries its own copy — no runtime cross-plugin dependency.
- **Referenced as `${CLAUDE_PLUGIN_ROOT}/lib/toolkit/<module>.md`** from skill prose and
  templates. Gate code doesn't import from toolkit/ (it's content, not plumbing).
- **Optional, always.** A skill that uses a module must state a one-line inline fallback and
  still function when the module is absent (graceful degradation).
- **Styled by the shared token schema.** Snippets use the shared CSS custom-property *names*
  (see `lib/html/base.html`) so they inherit whichever palette the consuming plugin defines.

## Modules

| Module | What it provides | Status |
|---|---|---|
| `tooltip.md` | Jargon-glossary hover/tap tooltip (overflow-safe, mouse + touch; stamped into consumers by `scripts/sync-shared.mjs`) | shipped |
| `pedagogy.md` | Visual-teaching principles: one idea per screen, show don't tell, lead with the point, split don't shrink, let visuals breathe | shipped |
| `svg-diagrams.md` | Inline-SVG authoring rules and pitfalls (`<tspan>` not `<b>`, no `var()` in SVG attrs, both-theme colors) | shipped |
| `code-translation.md` | Code ↔ plain-English translation (rules + zero-JS comments-on-top panel) | shipped |
| `quiz-patterns.md` | Quiz design (coverage rule, application-not-memory) + zero-JS reveal quiz | shipped |
| `diagrams.md` | HTML/CSS flow + annotated file-tree diagram idioms | shipped |

## Plugin-owned versioned chrome (indexed here, lives with its owner)

Some shared visual machinery is too heavy and too domain-specific to vendor into every plugin,
but still needs one canonical, versioned home. Those modules stay in their owning plugin and are
*indexed* here so "where does shared visual machinery live" has a single answer:

| Chrome | Canonical source | Version | Convention |
|---|---|---|---|
| Course chrome (`styles.css`, `main.js`, `_footer.html`, `build.sh`, `validate.mjs`) | `codebase-to-course/skills/codebase-to-course/references/` | `chrome v2 — inline translation engine (comments-on-top)` | `docs/skill-patterns.md` "Versioned course chrome" |

The rules that keep it from fossilizing: rendering files open with the version stamp (no stamp
= v1, the retired side-by-side renderer); `validate.mjs` carries `CHROME_VERSION`, and both
`build.sh` and the course gate fail unstamped or version-mixed copies; `build.sh` refreshes the
chrome from the canonical source whenever `CLAUDE_PLUGIN_ROOT`/`C2C_REFERENCES` resolves.
Vendored course copies are build artifacts, never templates.
