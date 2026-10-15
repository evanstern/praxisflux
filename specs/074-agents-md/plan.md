# Spec 074 — implementation plan

**Task:** TASK-0134 · **Spec:** `specs/074-agents-md/spec.md`

## Constitution check

Checked against `.specify/memory/constitution.md` v1.0.0 (ratified 2026-09-11).

| Article | Verdict |
|---|---|
| I. Artifact-Grounded Action | **PASS.** The design choices below are recorded here and on the card; migration is surfaced as reported drift, never a silent move. |
| II. One TASK, One PR | **PASS.** One branch (`task-0134-agents-md`), one PR. The reviewer's decision: the planted-file contract changes for every downstream host. |
| III. Artifact-Gated Seams | **PASS.** The planted footprint stays gated by `plant.mjs --check` in CI; only its target file changes. |
| IV. Gates: Status Never Exceeds Proven Artifacts | **PASS.** The sentinel still never advances past unconfirmed drift (R3, R4). |
| V. Composition Through Files and Gates Only | **PASS.** educate and research adopt the pattern from their own templates; no cross-plugin import. |
| VI. Advisory Local, Authoritative CI | **PASS.** CI's plant check and check-docs move to the load-bearing file; local hooks only echo. |
| VII. Grounding Freshness Is Part of Done | **PASS.** Phase 5 re-pins every note whose sources change (list below). |
| VIII. Amendment Procedure | **APPLIES (PATCH).** R9 corrects the source pointers in Articles IV, VI, VII from root `CLAUDE.md` to root `AGENTS.md`. That is a pointer correction: bump the constitution to 1.0.1 and set Last Amended. The PR carries operator sign-off at merge. |

## Design

### plant.mjs — two files, one block

- New constants: `AGENTS = "AGENTS.md"`, `POINTER = "@AGENTS.md"`. Template stays
  `pdlc/templates/CLAUDE.md` content but is renamed `pdlc/templates/AGENTS.md`; the template
  content is unchanged, so the rendered block is byte-identical (R1).
- `extractBlock` is unchanged (it is file-agnostic). It is applied to `AGENTS.md` for the
  block and to `CLAUDE.md` only to detect a legacy block.
- **Report fields.** `agentsMd` takes over the block states
  (`created | appended | replaced | unchanged | drifted`). `claudeMd` becomes the pointer
  status: `created` (no file), `pointer-added` (file lacked the pointer), `unchanged`,
  `migrated` (legacy block removed under `--force`), `drifted` (legacy block present, no
  `--force`). This is a report-contract change; bootstrap and tests move with it in this PR.
- **Pointer rule (R2).** The pointer is satisfied when the file's first line is exactly
  `@AGENTS.md`. Otherwise prepend `@AGENTS.md\n\n`. Nothing else in the file is touched.
- **Migration (R4).** If `CLAUDE.md` holds the pdlc markers:
  - without `--force`: `claudeMd: "drifted"`; nothing written to either file for the block;
    sentinel not advanced; `--check` exits 1 with the existing drifted remedy line.
  - with `--force`: render the block into `AGENTS.md` (append or replace per R1 rules), then
    rewrite `CLAUDE.md` as `@AGENTS.md\n\n` + `before` + `after` (trimmed of the blank
    lines the block left), `claudeMd: "migrated"`.
  - Project text around the old block stays in `CLAUDE.md`. The plant never moves project
    text between files; a host that wants it in AGENTS.md moves it by hand.
- **Both files carry markers** (a half-migrated host): AGENTS.md is authoritative; the
  CLAUDE.md copy is reported `drifted` and removed only under `--force`.
- Sentinel advance condition becomes: not (`agentsMd` drifted or `claudeMd` drifted or
  `modeSwitch` drifted). `pending` in the CLI adds `agentsMd !== "unchanged"`.
- `missing` checks `AGENTS.md`, `CLAUDE.md`, `.pdlc` (+ `.gitignore` in tracked mode).
- `excludeSet` is untouched (R5); its existing test asserting `/AGENTS.md` stays.

### sync-version.mjs — the stamp follows the block

The stamp entry at `:82` targets `AGENTS.md`. Keep a fallback: if `AGENTS.md` has no BEGIN
marker, try `CLAUDE.md`, so a fixture or a pre-migration checkout still stamps. Update
`test/sync-version.test.mjs:127-134` to plant the marker in `AGENTS.md` and add a fallback
case.

### check-docs.mjs, Stop hook, hooks, CI (R8)

- `check-docs.mjs` reads `AGENTS.md` for the `docs/releasing.md` link rule and messages
  `AGENTS.md: does not link docs/releasing.md`. It also asserts `CLAUDE.md`'s first line is
  `@AGENTS.md` (the pointer cannot silently regress). Update `test/check-docs.test.mjs`
  fixtures.
- `stop-docs.mjs`, `.githooks/pre-commit:22`, `.githooks/pre-push:11` and
  `ci.yml:37,48` change wording only. `ci.yml:68`'s command is unchanged; it now checks
  AGENTS.md through plant.

### Dogfood ordering for this repo's root

The root `CLAUDE.md` carries 114 lines of repo orientation and the Backlog.md
`<CRITICAL_INSTRUCTION>` guidelines above the marked block. **Decision: move all of it into
`AGENTS.md`, above the marked block, in this PR.** Reason: AC #8 says AGENTS.md carries the
content and CLAUDE.md is the pointer, and the orientation (worktree discipline, commit rule,
docs-are-load-bearing) is exactly what a non-Claude harness must read. Order:

1. Land the plant.mjs, sync-version and check-docs changes with their tests (phases 1-2).
2. Run `node pdlc/scripts/plant.mjs --root . --peer backlog --force`; it migrates the block
   and leaves the orientation in CLAUDE.md below the pointer.
3. Hand-move the orientation + Backlog guidelines from `CLAUDE.md` into `AGENTS.md` above the
   BEGIN marker, leaving `CLAUDE.md` as exactly `@AGENTS.md\n`.
4. Run `plant.mjs --check` (must exit 0), `check-docs.mjs`, `sync-version.mjs --check`.

Backlog.md's agent-guideline markers (`<!-- BACKLOG.MD GUIDELINES START/END -->`) move with
the text. `backlog` supports AGENTS.md as an agent-instructions file, so a future
`backlog init` refresh targets AGENTS.md; verify that once by reading the CLI's
`--help`/config, and record it in the task notes.

### Cross-plugin planters (R7)

- `educate`: rename `educate/templates/CLAUDE.md` → `educate/templates/AGENTS.md`
  No pointer template is needed: the skill writes `@AGENTS.md\n` directly.
  `educate:start` fresh-install step 3 writes `AGENTS.md` and `CLAUDE.md` (pointer); mode
  detection treats `AGENTS.md`, `CLAUDE.md` or `topics/` as "already a project"; the update
  path reconciles `AGENTS.md`, and for a legacy project offers the same move (diff, consent).
  Skill `version:` 0.2.0 → 0.3.0.
- `research`: same rename; `research:research-vault` Step 0 recognizes a vault by
  `AGENTS.md` **or** `CLAUDE.md` (+ `Home.md`/`_templates/`), scaffolds `AGENTS.md` + pointer.
  The `.research-vault` sentinel is unchanged. `analyze-vault` and `vault-artifact` say
  "the vault's AGENTS.md (or CLAUDE.md)". Skill versions bump (research-vault 0.1.1 → 0.2.0;
  the other two patch).
- `lib/installer.mjs` changes its header comment only.
- Tests: add assertions that each template file exists at its new path and that each
  SKILL.md names `AGENTS.md` as the planted file (these planters are prose-driven skills,
  not scripts, so the test is a content assertion like existing skill-content tests).

### Prose (R9)

`README.md:76`; `docs/principles.md:118` (template path); `docs/skill-patterns.md:28-31,212`
(pattern 3 becomes "Plant a project AGENTS.md, with a CLAUDE.md pointer"); `docs/releasing.md:7,80,89,113`;
`.specify/memory/constitution.md:62,80,89` + version line; `pdlc/hooks/root-guard-hook.mjs:458,654`
→ `See AGENTS.md (or CLAUDE.md on hosts not yet re-planted) "…"`; `pdlc/skills/sweep/SKILL.md:103,132,208`
(planted file named). `docs/task-courses.md:29,31`, `docs/board-verbs.md:41`,
`docs/task-labels.md:53` get the same correction where they name the always-on file.

## Phases

See `tasks.md`. Five phases, each sized for one fresh sonnet implementer; phase 4 is
mechanical prose and may run on haiku as a recorded orchestrator call.

## Gates this PR owes

- `node --test` green.
- `node scripts/check-docs.mjs`, `node scripts/sync-version.mjs --check`,
  `node scripts/gen-marketplace.mjs --check`, `node scripts/build.mjs`.
- `node pdlc/scripts/plant.mjs --root . --peer backlog --check` exits 0.
- `node scripts/check-version-bump.mjs --base origin/main`: marketplace **minor** bump
  (0.66.0 → 0.67.0) — pre-1.0, so minor is the breaking-change bump; plus every edited
  skill's `version:` (bootstrap, sweep, educate:start, research-vault, analyze-vault,
  vault-artifact).
- `node scripts/run-gates.mjs --gates spec-bridge --path .` (Dispatch lines present).
- `node scripts/run-gates.mjs --gates wiki-freshness --path .` after `/grounding-wiki:wiki-update`.

### Wiki notes expected to re-pin (freshness probe decides; honest re-pins only)

`overview` (sources `CLAUDE.md`), `pdlc-plugin`, `pdlc-grounding-block` (template path),
`build-and-release` (sync-version, check-docs, stop-docs), `release-pipeline` (ci.yml),
`educate-plugin` (template, start skill), `research-plugin` (research-vault skill),
`skill-patterns`, `installer`, `test-suite-catalog-plugins-gates-pdlc`, `pdlc-sweep` (sweep
SKILL.md), plus `CAPSULES.md`/`INDEX.md` lines that say "CLAUDE.md block". Every note's prose
that says the block lives in CLAUDE.md is NEEDS-REVIEW, not RE-PIN-ONLY.

## Risks

- **Report-contract change** (`claudeMd` meaning). Anything parsing the plant report outside
  this repo would misread it. Mitigation: changelog line in the PR body; bootstrap updated in
  the same PR.
- **Backlog CLI rewriting CLAUDE.md.** If `backlog` re-inserts its guidelines into
  `CLAUDE.md`, the pointer file regains content. Harmless to Claude Code; check-docs only
  asserts the first line.
- **Downstream re-plant.** Every host sees drift on upgrade and must consent. That is the
  designed consent path (card), and `docs/releasing.md`'s re-plant section names it.

## Open checkpoints (not settled by the card)

- **OC1 — release size.** `docs/releasing.md` says planted-file schema changes are *major*.
  Pre-1.0, this plan takes the minor bump (0.67.0). If the operator wants 1.0.0 to mark the
  contract change, that is their call.
- **OC2 — explainer's planter.** `explainer/scripts/explainer.mjs:337-343` plants its own
  marked block into `CLAUDE.md`. The card names only educate and research. Recommendation:
  card it as a follow-up (or ride TASK-0139); keep it out of this PR to hold scope.

## Phase 1 deviation note (recorded, not fixed — Phase 2/3 scope)

Phase 1 landed `plant.mjs`'s new AGENTS.md/pointer behavior and its tests green (`node --test`
passes in full). As an expected, out-of-scope-for-Phase-1 side effect, this repo's own
pre-commit hook step (`node pdlc/scripts/plant.mjs --root . --peer backlog --check`) now exits
1 against this repo's root: this repo's root `CLAUDE.md` still carries the legacy
pdlc-markers block (pre-074), so the new `plant()` reports `agentsMd: "drifted"` and
`claudeMd: "drifted"` — exactly the honest-migration-needs-consent path R4 designs for. That
consent (`--force`) and the hand-move of the root's orientation prose into `AGENTS.md` is
Phase 3's "dogfood this repo" task, not Phase 1's. `scripts/sync-version.mjs --check` is
unaffected by this PR (Phase 2 scope; it still stamps `CLAUDE.md` as before). Per the Phase 1
dispatch brief, this is recorded here rather than fixed inline.

## Phase 2 deviation note (recorded, not a scope change)

Phase 2 landed `sync-version.mjs`'s AGENTS.md-then-CLAUDE.md fallback exactly as designed
above. `check-docs.mjs` needed the same shape even though this plan's R8/design section didn't
spell it out for it: this repo's own root carries no `AGENTS.md` yet (Phase 3's migration), and
`checkDocs` is called directly on the real repo root by
`test/check-docs.test.mjs`'s "the praxisflux repo itself is in sync" test (no CLI, no
try/catch) — an unconditional `readFileSync(join(root, "AGENTS.md"))` would throw ENOENT on
that test today, not just report a problem. `checkDocs` now reads `AGENTS.md` when present and
falls back to `CLAUDE.md`'s content otherwise (same releasing.md-link check, message names
whichever file it actually read); the `CLAUDE.md`-first-line-is-`@AGENTS.md` pointer check only
applies once `AGENTS.md` exists — a pre-migration host has nothing to point at yet, and that
migration is Phase 3's honest-drift step (`plant.mjs --force`), not this check's job. Both
fallback branches are covered in `test/check-docs.test.mjs`. `node --test` (full suite, 1244
tests), `node scripts/check-docs.mjs`, and `node scripts/sync-version.mjs --check` are all green
against this repo's current pre-migration root.
