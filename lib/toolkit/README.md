# lib/toolkit — shared educational content modules

Reusable teaching and visual tools shared across the praxis plugins. Where the rest of `lib/`
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
| `svg-diagrams.md` | Inline-SVG authoring rules and pitfalls (`<tspan>` not `<b>`, no `var()` in SVG attrs) | planned — TASK-7.7 |
| `code-translation.md` | Code ↔ plain-English side-by-side translation block | planned — TASK-7.6 |
| `quiz-patterns.md` | Interactive quiz widgets + the coverage rule (test application, not memory) | planned — TASK-7.6 |
| `diagrams.md` | HTML/CSS flow, architecture, and file-tree diagram idioms | planned — TASK-7.6 |
