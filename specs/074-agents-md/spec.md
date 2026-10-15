# Spec 074 — AGENTS.md becomes the load-bearing planted file

**Task:** TASK-0134 · **Epic:** TASK-0143 (decision-0002, Harness port prerequisite) ·
**Status:** draft · **Created:** 2026-10-15 · **Runbook:** `docs/design/ports-rebuild-runbook.md`

## Problem

`pdlc/scripts/plant.mjs` writes the always-on grounding block into `<root>/CLAUDE.md` and
nowhere else: `claudePath = join(root, "CLAUDE.md")` (`:232`), template
`pdlc/templates/CLAUDE.md` (`:193`), and the required-artifact check
`verifyPresent(root, [... "CLAUDE.md", SENTINEL ...])` (`:291`). Codex, Cursor, Copilot,
Gemini CLI, opencode and the other harnesses read `AGENTS.md` and never `CLAUDE.md`. A
PDLC-planted project therefore gives them none of the loop, rules, tier doctrine or peer
blocks. The failure is silent.

The fix is Anthropic's documented bridge: `AGENTS.md` carries the content, and `CLAUDE.md` is
a thin pointer whose first directive is `@AGENTS.md`. Claude Code expands that import, so a
Claude Code session loads the same grounding it loads today. A symlink is rejected: it fails
silently on Windows checkouts under `core.symlinks=false`. Claude Code's own AGENTS.md
fallback (v2.1.277) is rejected as the mechanism: it applies only when `CLAUDE.md` is absent,
is toggleable, and is unsupported on Bedrock/Vertex/Foundry.

## Incumbent invariant (decision-0002)

Claude Code behavior is unchanged. A Claude Code session in a planted host loads, through
`CLAUDE.md` → `@AGENTS.md`, the same grounding block bytes it loads today.

## Surfaces that key on CLAUDE.md today (verified at 93374a4)

| Surface | Location | What it does |
|---|---|---|
| plant target | `pdlc/scripts/plant.mjs:232` | reads/writes the block in `CLAUDE.md` |
| template | `pdlc/scripts/plant.mjs:193`, `pdlc/templates/CLAUDE.md` | the rendered block source |
| block split | `pdlc/scripts/plant.mjs:109-117` `extractBlock` | before/block/after over one file |
| required artifacts | `pdlc/scripts/plant.mjs:291` | `missing` check names `CLAUDE.md` |
| report field | `plant()` return `claudeMd` | `created/appended/replaced/unchanged/drifted` |
| exclude set | `pdlc/scripts/plant.mjs:60` | already lists `/AGENTS.md` (spec 060 R2) |
| version stamp | `scripts/sync-version.mjs:82` | stamps `pdlc:grounding BEGIN v<x>` in `CLAUDE.md` (TASK-0137, ef405b1) |
| docs gate | `scripts/check-docs.mjs:31,66,79` | reads root `CLAUDE.md`; requires its `docs/releasing.md` link |
| Stop hook | `scripts/stop-docs.mjs:4,55` | runs check-docs; comments name CLAUDE.md |
| pre-commit | `.githooks/pre-commit:22` | echoes "README/CLAUDE.md in sync" |
| pre-push | `.githooks/pre-push:11` | comment cites CLAUDE.md "Enforcement is split by design" |
| CI | `.github/workflows/ci.yml:37,48,68` | step names + `plant.mjs --root . --peer backlog --check` |
| root-guard | `pdlc/hooks/root-guard-hook.mjs:458,654` | blocking message says `See CLAUDE.md "…"` |
| constitution | `.specify/memory/constitution.md:62,80,89` | Articles IV, VI, VII cite root `CLAUDE.md` |
| educate planter | `educate/skills/start/SKILL.md:28-44,77-` + `educate/templates/CLAUDE.md` | plants project CLAUDE.md |
| research planter | `research/skills/research-vault/SKILL.md:32-46` + `research/templates/CLAUDE.md` | plants vault CLAUDE.md |
| bootstrap skill | `pdlc/skills/bootstrap/SKILL.md` (description, `:10,16,151,168,236-242`) | teaches the CLAUDE.md block |
| prose | `README.md:76`, `docs/principles.md:118`, `docs/skill-patterns.md:28-31,212`, `docs/releasing.md:7,80,89,113`, `lib/installer.mjs:3` | name CLAUDE.md as the always-on file |

## Requirements

- **R1 — AGENTS.md is the plant target.** `plant()` renders the same block (same template
  content, same markers, peer blocks, tier section) into `<root>/AGENTS.md`, with the same
  `created / appended / replaced / unchanged / drifted` semantics `CLAUDE.md` has today. The
  rendered block is byte-identical to what `CLAUDE.md` carried for the same inputs.
  `AGENTS.md` joins the `missing` required-artifact list. *(AC #1)*
- **R2 — CLAUDE.md is a thin pointer.** `plant()` ensures `<root>/CLAUDE.md` exists and its
  first line is exactly `@AGENTS.md`. A missing file is created with the pointer. A file
  lacking the pointer gains it as its first line. Every other byte of the file is the
  project's and survives a re-plant untouched. The pointer status is reported separately
  from the block status. *(AC #2)*
- **R3 — Drift and consent on the new target.** `extractBlock`, `--check` and `--force`
  operate on `AGENTS.md`. An unconfirmed drift in `AGENTS.md` still refuses to advance the
  `.pdlc` sentinel and still fails `--check` with the drifted remedy line. *(AC #3)*
- **R4 — Migration is honest drift.** When `CLAUDE.md` carries the pdlc markers, re-planting
  reports a migration needing consent and writes nothing for it without `--force`. With
  `--force` the block lands in `AGENTS.md` and is removed from `CLAUDE.md`. The text before
  and after the old block stays in `CLAUDE.md`, below the pointer. Unconfirmed, the sentinel
  does not advance and `--check` exits 1 with the drifted remedy. *(AC #4)*
- **R5 — Local-only planting unchanged.** A first local-only plant leaves `git status`
  clean. The exclude write still happens before any artifact write. `excludeSet` gains no
  line, because `/AGENTS.md` and `/CLAUDE.md` are both already in `ALWAYS_ON_EXCLUDES`.
  *(AC #5)*
- **R6 — bootstrap teaches it.** `pdlc:bootstrap` describes the AGENTS.md-first shape and why
  the pointer exists. Its report names both files and states that `AGENTS.md` is
  load-bearing. Its Output gate verifies the markers in `AGENTS.md` and the pointer in
  `CLAUDE.md`. *(AC #6)*
- **R7 — Cross-plugin planters follow.** `educate:start` and `research:research-vault` plant
  `AGENTS.md` from their own templates plus the same `@AGENTS.md` pointer `CLAUDE.md`.
  Existing projects and vaults that carry only a `CLAUDE.md` are still recognized as
  existing, never clobbered. *(AC #7)*
- **R8 — Dogfood this repo.** praxisflux's root `AGENTS.md` carries the content and
  `CLAUDE.md` is the pointer. `scripts/check-docs.mjs` reads the load-bearing file;
  `sync-version.mjs` stamps the block where it now lives; the hooks, CI and the Stop hook
  check the load-bearing file. CI's `plant.mjs --root . --peer backlog --check` passes.
  *(AC #8)*
- **R9 — Prose corrected.** Every reference naming `CLAUDE.md` as the always-on file is
  corrected: `README.md`, `docs/principles.md`, `docs/skill-patterns.md`,
  `docs/releasing.md`, the constitution's source citations, `lib/installer.mjs`'s header
  comment, and the root-guard hook's blocking messages. *(AC #9)*
- **R10 — Tests pin it.** Tests cover the planting target, pointer content, drift and consent
  on the new path, migration of an existing plant, the sync-version stamp target, the
  check-docs read target, and the cross-plugin planters. *(AC #10)*
- **R11 — Re-ground and release.** Every wiki note whose sources changed is re-pinned
  honestly. The marketplace version and each edited skill's `version:` are bumped. All
  enumerated gates are green. *(AC #11)*

## Non-goals

- No Harness port, no `pdlc` CLI verbs — that is TASK-0139.
- No renaming of `${CLAUDE_PLUGIN_ROOT}` script paths in skills — TASK-0139.
- No change to the block's *content* beyond prose that names its own file.
- The explainer plugin's `plant` verb (`explainer/scripts/explainer.mjs:337-343`) also
  writes a marked block into `CLAUDE.md`. The card does not name it. See plan.md's
  open checkpoint OC2.

## Requirement → acceptance-criterion map

| AC | Requirement |
|---|---|
| #1 | R1 |
| #2 | R2 |
| #3 | R3 |
| #4 | R4 |
| #5 | R5 |
| #6 | R6 |
| #7 | R7 |
| #8 | R8 |
| #9 | R9 |
| #10 | R10 |
| #11 | R11 |
