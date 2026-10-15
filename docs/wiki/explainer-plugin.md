---
name: explainer-plugin
description: The explainer plugin — builds cited, house-style HTML explainers (PR explainers, architecture sites, decision briefings, onboarding guides) from wiki-first facts; read-only check suite in gates/, Stop hook keeps built dist/ pages self-contained.
kind: component
sources:
  - explainer/.claude-plugin/plugin.json
  - explainer/README.md
  - explainer/skills/explainer/SKILL.md
  - explainer/agents/fact-gatherer.md
  - explainer/agents/fact-checker.md
  - explainer/gates/check.mjs
  - explainer/gates/explainer.mjs
  - explainer/hooks/hooks.json
  - explainer/scripts/explainer.mjs
  - explainer/scripts/lib/check.mjs
  - explainer/scripts/lib/plant.mjs
  - explainer/templates/CLAUDE.md
verified_against: 617c27cb8a6578af4d6541f51c2d5c7522cfacf0
---

# explainer plugin

The `explainer` plugin (lockstep with the marketplace version; skills `explainer` and
`explainer-answer` at their own `version:`) builds **cited, house-style HTML explainers**:
PR explainers, architecture sites, decision briefings, and onboarding guides. `/explain`
runs interview → gather → outline approval → parallel page-writing → build → fact-check →
check (with a bounded per-page fix loop) → publish → commit. `/explain-answer` answers
open comment threads on a published artifact from the same facts. It uses the
**favored-home** placement model ([[skill-patterns]]): every artifact lives in
`docs/explainers/<name>/`.

## How it works

**Wiki first.** Every profile lists a `wiki` source kind first, and the where-to-look
interview pre-selects "Grounding wiki". When `docs/wiki/INDEX.md` exists, the
fact-gatherer reads the corpus ([[grounded-corpus-spec]]) before code and cites notes as
`file` sources. A note stale against its `verified_against` pin is not trusted — the
gatherer cites code instead. The fact-checker checks wiki-cited facts against a code path
the note lists, and the code wins on disagreement. A project with no wiki loses nothing.

**Checks split along [[gates-convention]].** `gates/check.mjs` holds the read-only checks
(markup balance, `node --check` piped on stdin, self-containment, titles, references,
house-style rules, brand tokens, the fact-checker verdict, and `wiki.fresh`). It never
writes. `scripts/lib/check.mjs` orchestrates them and owns everything that writes: the
browser runs and their screenshots, `fact.real-fresh` (re-running generators caches
`dist/gen/`), and `dist/check.json` + `dist/check-report.md`.

**`wiki.fresh`** warns (never errors) when a cited `docs/wiki/` note's sources changed
after its pin. It mirrors grounding-wiki's freshness rule without importing that plugin —
plugins compose through files, not code.

**Self-containment** uses [[selfcontained-verifier]]'s `externalLoads` in both the
`self.contained` check and the Stop hook ([[gate-runner]]). The hook resolves every
directory holding `contents.json` + `dist/` and blocks while a built page loads an
external resource.

**Planting.** `explainer.mjs plant [--check]` lands a marked block from
`templates/CLAUDE.md` in the host's `CLAUDE.md` — created, appended, or replaced between
markers; text outside the markers is never touched. Pipeline step 0 runs `--check`.

## Connections

- [[chassis]] — reached through the committed `lib` symlink (`selfcontained`,
  `markdown`, `project-root`, `gate-runner`, `template`).
- [[grounding-wiki-plugin]] — produces the corpus explainer reads first.
- [[codebase-to-course-plugin]] — the sibling render plugin; separate page shells by design.

## Operational notes

- Node built-ins only. The `browser.*` checks report `skipped` with no browser;
  `EXPLAINER_NO_BROWSER=1` forces that.
- `check` exit codes: 0 clean, 1 an error-level check failed, 2 usage error (no `dist/`),
  3 `fact.checker` pending.
- Tests live in `test/explainer/` (moved out of the plugin so packaging ships no tests).
