# Handoff: bring codebase-to-course into praxis as a plugin

**Goal:** `codebase-to-course` (today a standalone Claude Code skill) becomes a praxis
marketplace plugin that composes with the suite — consuming grounded corpora
(`docs/corpus-spec.md`) when present, gated like the other plugins, tested on the chassis.

Work Backlog.md-style: read the repo `CLAUDE.md` first, run `backlog instructions overview`,
create tasks from the slices below (one parent task + subtasks is a fine shape), plan → ACs →
commit per slice with `TASK-x:` prefixes. Pre-commit enforces `node --test`, marketplace
regeneration, and version sync.

## Source of truth (current state)

- Skill repo: `github.com/evanstern/codebase-to-course`, branch `main`, latest `0e3b61a`
  (locate or clone locally) — symlinked live at `~/.claude/skills/codebase-to-course`.
- Shape: `SKILL.md` (orchestration: analysis → curriculum → briefs → parallel module agents →
  assemble) + `references/` — prebuilt assets copied verbatim per course (`styles.css`,
  `main.js`, `_base.html`, `_footer.html`, `build.sh`) and authoring docs (`content-philosophy`,
  `design-system`, `interactive-elements`, `gotchas`, `module-brief-template`).
- Recent features (keep intact): dark mode, self-building ToC, comments-on-top code translation
  blocks with a display-only reformatter. All generic, all in the prebuilt assets.
- Reference outputs to test against: `akashic/docs/course` (course) + `akashic/docs/wiki`
  (corpus) — a local checkout of the `akashic` repo.

## Required reading before authoring

`praxis/CLAUDE.md` · `docs/skill-patterns.md` (esp. the new-plugin checklist and gates/ vs
scripts/ convention) · `docs/corpus-spec.md` · `docs/handoff-protocol.md`.

## The slices

1. **Port as-is.** Plugin dir `codebase-to-course/` with `.claude-plugin/plugin.json`, the skill
   at `skills/codebase-to-course/SKILL.md`, assets under the skill's `references/` (unchanged
   paths — the SKILL.md already resolves them relative to its base dir). Manual entry in
   `.claude-plugin/marketplace.json`, then `scripts/gen-marketplace.mjs --check`. No behavior
   change in this slice.
2. **Corpus-aware analysis** (praxis roadmap step 3). Phase 1: if the target repo has a corpus
   (`docs/wiki/INDEX.md` per corpus-spec), read INDEX + notes as the primary analysis input and
   fall back to raw-code reading only for gaps — cheaper and pre-verified. Phase 2.5: briefs
   gain a `grounding:` frontmatter listing the `[[note]]` names they drew from (briefs are the
   sidecar; NEVER write course fields into wiki notes — spec guardrail 1). A corpus must remain
   optional: no corpus → today's behavior (guardrail 2).
3. **Default output location.** Courses default to `docs/course/` inside the target repo
   (matching the common convention: grounding at `docs/wiki/`, courses at `docs/course/`),
   overridable when the user names a destination.
4. **Output gate on the chassis.** `gates/course.mjs` (+ `cli.mjs course <course-dir>`),
   read-only: built `index.html` exists and is self-contained (`lib/selfcontained.mjs` —
   already proven by the research artifact gate; Google Fonts is the one allowed external),
   nav dots == module count, every module has ≥1 quiz and ≥1 code translation block, course
   includes ≥1 group chat and ≥1 flow animation. Wire the gate into the SKILL.md's Phase 4 as
   the output gate. Tests in `test/` against a minimal fixture course.
5. **Cutover decision (needs a human decision).** Once the plugin is installed from the
   marketplace, the `~/.claude/skills` symlink would double-trigger. Options: retire the
   standalone repo (archive; praxis becomes home), or keep it as the upstream and vendor into
   praxis. Ask — don't decide unilaterally. Until then, keep the standalone repo untouched.

## Constraints

- Prebuilt assets are copied verbatim, never regenerated — that invariant is the skill's core.
- Don't fold the course's `_base.html` into `lib/html/base.html` in this pass (different
  contract: scroll-snap course shell vs. artifact page). Note it as a future candidate only.
- Educate/build handoffs are out of scope; note the seam (a course as a lesson deliverable)
  for a future task, don't build it.

## Done means

Marketplace-installed plugin generates a course end-to-end on a real repo (akashic is the
fixture: corpus present, expect grounded briefs) · course gate passes on the output ·
`gen-marketplace --check` + `node --test` green · skill-patterns checklist satisfied ·
backlog tasks finalized with summaries.
