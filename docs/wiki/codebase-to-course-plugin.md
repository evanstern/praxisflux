---
name: codebase-to-course-plugin
description: Plugin that turns any codebase into a self-contained single-page interactive HTML course for non-technical learners, with a corpus-aware analysis phase and an output gate.
kind: component
sources:
  - codebase-to-course/.claude-plugin/plugin.json
  - codebase-to-course/README.md
  - codebase-to-course/skills/codebase-to-course/SKILL.md
  - codebase-to-course/skills/codebase-to-course/references/content-philosophy.md
  - codebase-to-course/skills/codebase-to-course/references/design-system.md
  - codebase-to-course/skills/codebase-to-course/references/gotchas.md
  - codebase-to-course/skills/codebase-to-course/references/interactive-elements.md
  - codebase-to-course/skills/codebase-to-course/references/module-brief-template.md
  - codebase-to-course/skills/codebase-to-course/references/main.js
  - codebase-to-course/skills/codebase-to-course/references/build.sh
  - codebase-to-course/skills/codebase-to-course/references/validate.mjs
  - codebase-to-course/gates/course.mjs
  - codebase-to-course/gates/cli.mjs
verified_against: ab6e3fd6377e2472c7e8db3af1abfe66ed7300d7
---

# codebase-to-course plugin

The `codebase-to-course` plugin (v0.4.0, lockstep with the marketplace) turns a codebase into a single-page interactive HTML
course that teaches how the code works to non-technical "vibe coders" — people who build with
AI tools and need to read, understand, and direct code, not write it. It was ported from the
standalone repo `github.com/evanstern/codebase-to-course`. The output is a directory whose
assembled `index.html` opens in a browser with no setup.

## How it works

**Pipeline (one skill, phased).** `skills/codebase-to-course/SKILL.md` runs: Phase 1 codebase
analysis → Phase 2 curriculum design (4–6 modules, up to 7–8) → Phase 2.5 module briefs
(complex codebases only, enabling parallel subagent writing) → Phase 3 build → Phase 4 gate,
review, open. Simple codebases take a sequential path; complex ones dispatch briefs to
subagents in batches of up to 3, each receiving only its brief and the reference sections it
needs — never the full codebase or SKILL.md.

**Corpus-aware analysis.** Phase 1 checks the target repo for `docs/wiki/INDEX.md`; if
present, the grounded corpus becomes the primary analysis input (read `INDEX.md`, then
relevant notes), falling back to raw source only for gaps. Two hard rules: never write into
the wiki notes, and a corpus is optional — without one, everything proceeds from raw code.
Briefs record consumed `[[note]]` names in `grounding:` frontmatter
(`references/module-brief-template.md`), making briefs the course's sidecar record.

**Output layout.** Default destination is `docs/course/` in the target repo (pairing with a
corpus at `docs/wiki/`), user override allowed. Five files — `styles.css`, `main.js`,
`_footer.html`, `build.sh`, and `validate.mjs` — are copied verbatim from `references/`,
never regenerated; that invariant is the skill's core, and copies must come **from the
plugin's `references/` only, never from another course directory** (an existing course is a
snapshot of whatever chrome generation built it, not a template). `_base.html` gets exactly
three substitutions (title, `ACCENT_*` palette, `NAV_DOTS`). Modules are bare
`<section class="module">` files in `modules/`; `build.sh` assembles `index.html`.
`references/main.js` is the complete JS engine — quizzes, drag-and-drop, group chat and flow
animations, glossary tooltips, dark mode (`course-theme` in localStorage), and a self-built
table of contents — auto-initializing off class names and `data-*` attributes.

**Versioned chrome.** The five copied files are the plugin's "course chrome", registered as
a plugin-owned toolkit citizen in `lib/toolkit/README.md`. Every rendering file opens with a
`chrome v<N> — <engine name>` stamp (currently `chrome v2 — inline translation engine
(comments-on-top)`; no stamp = the retired v1 side-by-side renderer), and `validate.mjs`
carries the matching `CHROME_VERSION` constant. The stamp bumps only when the rendering
contract changes — the same authored markup meaning something different on screen. When
`CLAUDE_PLUGIN_ROOT` (in-session) or `C2C_REFERENCES` (manual override) resolves, `build.sh`
refreshes `styles.css`, `main.js`, `_footer.html`, and `validate.mjs` from the canonical
references before assembling; `build.sh` itself and the per-course `_base.html` are never
auto-refreshed. Before assembly, `build.sh` runs `validate.mjs` over the modules: every
translation block needs 1:1 `.tl`/`.code-line` pairing and bracket-balanced code (excerpts
trimmed from within, never cut mid-structure); `--fix` auto-closes blocks that only miss
closing brackets.

**Content rules.** `references/content-philosophy.md` mandates screens at least 50% visual,
2–3 sentence text blocks, one concept per screen, fresh metaphors (never "restaurant"),
verbatim code snippets, aggressive glossary tooltips, and quizzes that test application under
a coverage rule (only already-taught terms). `references/gotchas.md` is the failure
checklist (tooltip clipping, `scroll-snap-type: y proximity` not `mandatory`, token-only
colors so dark mode works). `references/design-system.md` defines the warm token palette and
also ships the praxis shared token schema as aliases so toolkit snippets drop in unchanged.

**Output gate.** `gates/course.mjs` exposes `validateCourse(courseDir)`, read-only: fails if
`index.html` is missing; runs `checkHtml` from `lib/selfcontained.mjs` with Google Fonts URLs
masked out (the one allowed external host); requires nav-dot count == module count; per
module, at least one quiz (any of `quiz-container`, `dnd-container`, `bug-challenge`,
`scenario-block`) and one `.translation-block`; and course-wide at least one `.chat-window`
and one `.flow-animation`. It also imports `checkTranslationBlocks` and `checkChrome` from
the skill's `references/validate.mjs`: the assembled `index.html` must honor the
pairing/bracket-balance contracts, and the course's vendored chrome must carry the plugin's
current version stamp — a fossilized (unstamped or version-mixed) course can't pass.
`gates/cli.mjs` is the entry (`node cli.mjs course <course-dir>`); Phase 4 requires fixing
and rebuilding until it passes.

## Connections

- Consumes grounded corpora shaped by [[grounded-corpus-spec]] and produced by
  [[grounding-wiki-plugin]]; it reads notes but never writes them.
- The output gate builds on [[selfcontained-verifier]] and follows [[gates-convention]]
  within the [[chassis]].
- Teaching elements and pedagogy align with [[toolkit]] (shared token aliases,
  `lib/toolkit/pedagogy.md` cited by content-philosophy); the skill's phase structure
  follows [[skill-patterns]].
- Its single-file interactive output is a sibling deliverable to [[educate-plugin]] decks,
  which face the stricter no-external-hosts rule.

## Operational notes

- Gate CLI exit codes: 0 pass, 1 gate failure (issues listed), 2 usage error.
- Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) is the single allowed external
  dependency; everything else must be inline.
- `briefs/` may be deleted after assembly; `index.html` is generated — never hand-written.
- `validate.mjs`'s run-as-CLI entry realpaths both `import.meta.url` and `process.argv[1]`
  before comparing (inline, since a planted copy can't import the chassis) — through a
  symlinked path the naive comparison silently skipped `main()`, validating nothing.
