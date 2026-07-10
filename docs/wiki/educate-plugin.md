---
name: educate-plugin
description: Socratic learning-project plugin — plants a project CLAUDE.md, orchestrates the lesson lifecycle, hands SPECs to build, and gates "done" on artifacts via a Stop hook.
kind: component
sources:
  - educate/.claude-plugin/plugin.json
  - educate/skills/start/SKILL.md
  - educate/skills/lesson/SKILL.md
  - educate/gates/dod.mjs
  - educate/gates/wiki.mjs
  - educate/hooks/hooks.json
  - educate/scripts/gate.sh
  - educate/scripts/progress.mjs
  - educate/scripts/stop.mjs
  - educate/scripts/wiki.mjs
  - educate/templates/CLAUDE.md
  - educate/templates/progress.schema.json
verified_against: 9717576758565c3844461c4df10e42507c7f25e7
---

# educate plugin

The `educate` plugin (v0.6.2, lockstep with the marketplace) turns a folder into a Socratic learning project: it teaches
lessons, authors build SPECs for the `build` plugin, and refuses to mark a lesson `done`
until auditable artifacts — notes, decks, guides — exist on disk, so learning produces
durable, verifiable work product rather than ephemeral chat.

## How it works

**Favored-home placement.** Lessons live at `topics/<topic-slug>/<NNN>-<lesson-slug>/`,
numbered from 101; the `topics/` directory is the project marker (root resolution in
`educate/scripts/progress.mjs` and `educate/scripts/wiki.mjs` tries `--root`, then
`$EDUCATE_PROJECT_ROOT`, then `findRootUpwards(cwd, hasChild("topics"))`). The
`educate:start` skill is the installer: it plants `templates/CLAUDE.md` as the project's
always-on layer (plugins have no always-on slot), copies `templates/.template/` to
`topics/.template/`, and plants `templates/progress.schema.json` as
`topics/progress.schema.json`. Re-running it migrates legacy `_template/` /
`_progress.schema.json` names and refreshes boilerplate, never touching real lessons.

**Lifecycle and DoD gate.** `educate/gates/dod.mjs` defines `STATES` —
`planned, scaffolded, taught, spec'd, built, decked, done` — and `ARTIFACT_FILES` mapping
progress keys to filenames (`checklist.md`, `raw-notes.md`, `HANDOFF.md`,
`POST_BUILD_HANDOFF.md`, `deck.html`, `guide.md`). `lifecycleFor(progress)` builds a
lifecycle via `createLifecycle` from `lib/lifecycle.mjs`: `done` always requires `checklist`
+ `rawNotes`; when `definitionOfDone.decksStandardForEveryLesson` is set, `decked` and `done`
also require `deck` + `guide`. `topicDoDProblems` additionally verifies any `deck.html` on
disk with `checkHtml` from `lib/selfcontained.mjs` (no Google-Fonts exception) and checks
cursor integrity. Gates never write; the mutating tracker is `scripts/progress.mjs`, whose
`--sync` derives each lesson's `artifacts` map from disk and `--check` exits non-zero on
problems.

**Progress as tracked state.** `topics/<topic>/progress.json` (schema
`templates/progress.schema.json`) is the source of truth: lifecycle, per-lesson `artifacts`
map, a `cursor` (`current`/`currentStatus`/`nextAction`) for resuming, and judgment fields.

**Teach→build seam.** For delegated-build topics the lesson skill writes the SPEC as a
handoff request (`.handoff/<id>.md`, `kind: request`, `from: educate`, `to: build`); payloads
are transient, evidence lives in `progress.json` (`handoff.specd/returned/foldedIn`).
`dod.mjs` blocks status ≥ `built` without `handoff.returned`, and blocks `done` unless
`foldedIn` is true *and* `hasReturnLegResidue` finds a `Post-build` (or `Return leg` /
`Build findings`) heading in `guide.md` or `raw-notes.md` — the return leg can't be skipped.

**Wiki roll-up.** `gates/wiki.mjs` derives navigation indexes over the isolated research
vaults (`.research-vault` sentinel) a topic accumulates: `renderTopicWiki` →
`topics/<topic>/WIKI.md` (one row per vault, linking its `Home.md`) and `renderProjectWiki` →
`topics/WIKI.md`. `scripts/wiki.mjs` owns the writes (`--sync`/`--check`), and
`progress.mjs --sync` regenerates both as part of the lesson ritual; the indexes use plain
relative Markdown links, never wikilinks, so corpora stay isolated.

**Hook.** `hooks/hooks.json` registers a `Stop` hook running `scripts/gate.sh`, a shim that
execs `scripts/stop.mjs`; that entry uses `runStopHook` from `lib/gate-runner.mjs` with one
gate — `check` = DoD problems (blocking), `warn` = `wikiStalenessWarnings` (advisory only).
Because Stop hooks run in a minimal non-login shell, the shim resolves `node` via
`command -v` with a login-shell fallback (`$SHELL -lc`), and exits 0 (no-op) when node is
genuinely unavailable — the gate never blocks Stop over a missing runtime.

## Connections

- The build leg rides [[handoff-protocol]] to and from [[build-plugin]]; educate folds the
  findings back and keeps the evidence.
- The DoD gate composes [[lifecycle-engine]] and [[selfcontained-verifier]] and runs through
  [[gate-runner]], following [[gates-convention]] (gates read, scripts write).
- Root resolution and vault discovery use [[project-root]]; wiki parsing uses
  [[markdown-module]] and dates from [[chassis-utilities]] — all part of the [[chassis]].
- `educate:start` is the archetype for [[installer]]; optional grounding hands off to
  [[research-plugin]]; decks borrow from [[toolkit]]; skills follow [[skill-patterns]].

## Operational notes

- `EDUCATE_PROJECT_ROOT` overrides root discovery; `--root` beats both. Exit codes: 0 clean,
  1 problems/staleness, 2 usage; `--gate` mode exits 0 silently outside an educate project.
- The Stop hook blocks on DoD failures but only warns on stale `WIKI.md`; wiki `--sync` over
  a pre-index project is the migration path (derives from `Home.md` trunks already on disk).
- The run-as-CLI entries of `progress.mjs` and `wiki.mjs` use `runAsCli` from `lib/cli.mjs`
  (realpaths both sides of the comparison), so invoking them through a symlinked path runs
  the CLI instead of silently doing nothing.
