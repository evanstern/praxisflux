# Spec 072 — implementation plan

**Task:** TASK-0132 · **Spec:** `specs/072-ci-double-run/spec.md`

## Constitution check

Checked against `.specify/memory/constitution.md` **v1.0.0 (ratified 2026-09-11)** — a real
check, not the absent/unratified degradation path.

| Article | Verdict |
|---|---|
| I. Artifact-Grounded Action | **PASS.** The mechanism was not chosen here — it is an operator ruling already recorded as a runbook gate line, and this plan resolves it FROM that artifact rather than re-asking it. The premise correction and the `run-gates` finding are both recorded in `spec.md` rather than living in a session. |
| II. One TASK, One PR | **PASS.** One TASK, one branch (`task-0132-ci-double-run`), one PR. The reason a human approves it is real and stated: this removes the last dedicated CI proof that the suite is green, leaving the gate as the only one. |
| III. Artifact-Gated Seams | **PASS.** No payload is trusted. The gate re-derives its verdict by running the suite itself, exactly as before; what changes is that nothing runs it twice. |
| IV. Gates: Status Never Exceeds Proven Artifacts | **PASS — and this is the article the task lives under.** The `projectGates` entry that enforces "a ticked box cannot outrun a red gate" is deliberately KEPT. R2 exists so the enforcement is *proven* to survive by a deliberate red-suite run rather than assumed, which is what this article demands of a change in this area. |
| V. Composition Through Files and Gates Only | **PASS.** Workflow-only change; no cross-plugin import, no direct call. |
| VI. Advisory Local, Authoritative CI | **PASS — and the article that makes R2 non-negotiable.** CI is the authoritative enforcement point, so a change that removes a CI step must prove the remaining one still blocks. R3 keeps the advisory-local side untouched. |
| VII. Grounding Freshness Is Part of Done | **PASS — check, don't assume.** `.github/workflows/ci.yml` is plausibly a pinned source (`gates-consumption-surface.md`, `build-and-release.md`, `test-suite.md` all describe CI). The freshness probe decides, and any note whose prose enumerates CI's steps is amended before re-pinning — a sibling task in this sweep found `test-suite.md` listing the pre-commit steps *in order*, so this is a live risk, not a theoretical one. |
| VIII. Amendment Procedure | **N/A.** |

No violations. No complexity-deviation entries required.

## Approach

**One deletion, then the proof.** Remove `ci.yml`'s `- name: tests` step (`:22-23`). The
spec-bridge step at `:34-35` already runs the whole suite through the `tests` project gate, so
after the deletion CI runs it exactly once.

**What makes this small change worth a careful PR.** Before it, CI had a dedicated step whose
only job was "the suite is green", and the gate was a redundant second opinion. After it, the
gate is the *only* thing in CI standing between a red suite and a green run. The diff is two
lines; the risk is entirely in whether that gate really blocks. Hence R2, and hence the
deliberate red-suite run is the deliverable rather than a formality.

**Why not the other directions** (settled by the ruling, recorded so nobody re-opens it):
config-declared sibling satisfaction would extend the `projectGates` contract and owe a
`docs/consuming-gates.md` change for a problem a deletion solves; splitting into dependent jobs
creates a job boundary only to keep both runs, which does not satisfy AC#1 at all.

**Ordering within the change:** delete the step, then prove enforcement, then re-ground. The
proof must run against the deleted state — proving the gate blocks *while the dedicated step
still exists* proves nothing, because the step would fail first.

## Phases

- **Phase 1 — the deletion (R1, R3, R4).** Remove the two-line step. Leave a comment where the
  reader would otherwise wonder why CI has no explicit `tests` step, naming the gate that
  covers it and this spec — the file is heavily commented with exactly that kind of rationale,
  and an unexplained absence invites someone to "restore" it. Verify `.spec-bridge.json` and
  every local path are untouched.
- **Phase 2 — prove enforcement survives (R2, the real work).** Demonstrate that a genuinely
  red suite still fails the spec-bridge gate in CI. **Design the proof honestly:** it must
  exercise the CI path, and it must not leave a broken test behind. State exactly what was run,
  what CI reported, and how the red state was reverted. A local-only demonstration is weaker
  evidence and must be labelled as such if that is what lands.
- **Phase 3 — re-ground and close (R5, R6, VII).** Confirm `test/run-gates.test.mjs:35-44` is
  intact and still passes unmodified (the finding says it needs no edit — verify, don't assume).
  State in `docs/consuming-gates.md` terms why AC#5's condition is unmet rather than skipping
  it. Run the freshness probe and re-pin honestly any note whose sources include `ci.yml`,
  amending prose FIRST where a note enumerates CI's steps.

## Gates this PR owes

- Pre-commit: `gen-marketplace.mjs --check` · `sync-version.mjs --check` · `check-docs.mjs` ·
  `board-mirror.mjs --check` (new, from TASK-117)
- Pre-push: `check-version-bump.mjs --base origin/main` · wiki freshness
- Project gates: `tests`, `docs-in-sync`, `versions-consistent`
- **Version bump: verify, do not assume.** `.github/` is not obviously released surface;
  `check-version-bump.mjs --base origin/main` is the arbiter, exactly as it was for TASK-0123
  (which correctly owed none).
- Merge commit, never squash. Pin-carrying if any note re-pins ⇒ merge `origin/main` IN.
- `Dispatch:` line per dispatch — `note=[…]` BEFORE `served=`, so `served=` ends the line as a
  bare token (the format error this sweep's bridge gate caught in the orchestrator's own work).

## Risks

- **This is the one change in the sweep that can make CI *less* safe if done carelessly.** A
  passing CI run after the deletion does not prove the gate blocks; only a red-suite run does.
  Do not let a green run stand in for R2.
- **A note may enumerate CI's steps.** Re-pinning without reading would leave a note describing
  a step that no longer exists — the same defect a sibling task found in `test-suite.md`.
- **Merge-phase traps now on record** (runbook): resolve no pin conflict by picking a side —
  pin to a commit containing both parents' changes and verify via
  `git fetch origin refs/pull/<N>/merge` in a probe worktree; and if another branch takes the
  next patch version first, take the one after rather than renumbering what merged.
