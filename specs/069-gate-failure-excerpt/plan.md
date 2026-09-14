# Spec 069 — implementation plan

**Task:** TASK-0131 · **Spec:** `specs/069-gate-failure-excerpt/spec.md`

## Constitution check

Checked against `.specify/memory/constitution.md` **v1.0.0 (ratified 2026-09-11)** — a real
check, not the absent/unratified degradation path.

| Article | Verdict |
|---|---|
| I. Artifact-Grounded Action | **PASS.** The change makes a gate's finding carry the evidence it already holds — strictly more artifact-grounded. No chat-only decision; the mechanism is settled by this spec before dispatch. |
| II. One TASK, One PR | **PASS.** One TASK, one branch (`task-0131-gate-failure-excerpt`), one PR. No subtasks; the phases below are internal breakdown and ride this one branch. |
| III. Artifact-Gated Seams | **PASS.** No stage boundary added or crossed. The finding is re-derived from the subprocess result each run, never from a cached or passed-in payload. |
| IV. Gates: Status Never Exceeds Proven Artifacts | **PASS — and strengthened.** This never loosens a verdict: `ok` is computed exactly as before. Only the *text* of an already-failing finding gains context. R7 explicitly freezes the `redByConstruction` path. |
| V. Composition Through Files and Gates Only | **PASS.** Confined to `spec-bridge/`; no cross-plugin import, no direct plugin call. |
| VI. Advisory Local, Authoritative CI | **PASS.** No local hook becomes load-bearing. The improved finding helps equally in the Stop hook and in CI; neither is made mandatory by it. |
| VII. Grounding Freshness Is Part of Done | **PASS — with an obligation.** `spec-bridge/gates/bridge.mjs` is a pinned source for wiki notes; Phase 4 re-pins honestly (classify RE-PIN-ONLY vs NEEDS-REVIEW against the real diff). |
| VIII. Amendment Procedure | **N/A.** This plan does not touch the constitution. |

No violations. No complexity-deviation entries required.

## Approach

Thread the captured output from the point it already exists to the point the finding is
built, and bound it on the way — reusing the tail-preserving shape TASK-0121 established.

**Why this shape.** `runGateCommand` already has `stdout`/`stderr` in hand at `:209`. The
only reason the finding lacks them is that the returned object drops them. So the change
is additive on a value that already exists, not a new capture mechanism: add a bounded
`output` field to the non-green return, and have the finding formatter append it.

**Three deliberate constraints:**

1. **The verdict shape is append-only.** `{ ok, kind, reason }` keeps its exact meaning;
   `output` is a new optional sibling. Nothing that reads `ok`/`kind`/`reason` changes
   behaviour, so `evaluateProjectGates`, `verifyBridge` and `cli.mjs state` are unaffected
   unless they opt in.
2. **Bounding happens at capture, not at format.** Cap before the string is stored, so a
   600-line suite dump never travels through the gate's data path or into a trace record.
3. **Tail-preserving, per R3.** `node --test` prints its failure summary last. Reuse
   `capTrace`'s established head+elision+tail shape rather than inventing a second
   bounding rule — one spelling for "bounded subprocess output" in this file.

**Headline-first composition (R4).** The excerpt is appended AFTER the existing sentence
and after `CANT_OUTRUN`, on its own indented block, so a session scanning findings reads
gate → reason → count → fix first and the raw output only if it keeps reading.

## Phases

Phase-scoped dispatch: one fresh implementer per phase, each handed this spec + plan.

- **Phase 1 — capture and bound.** `runGateCommand` returns a bounded `output` on the
  non-green paths (`red`, and the `error`/`timeout` paths where output exists). Extract the
  bounding helper so `capTrace` and this share one implementation. (R1, R2, R3)
- **Phase 2 — surface in the finding.** `gateReason`/`collapsedGateProblems` append the
  excerpt after the headline and the remedy clause; `redByConstruction` untouched. (R4, R5, R7)
- **Phase 3 — prove it.** Fixture gate failing with known output, asserted through
  `checkBridge`'s problems; cap and tail-preservation asserted; a negative control that the
  `redByConstruction` wording did not change. (R6, R7)
- **Phase 4 — release + re-ground.** Marketplace version bump (released surface: `spec-bridge/`)
  and the `spec-bridge` skill `version:` if its skill files changed; re-stamp the planted block
  per the TASK-0121 finding (two-file one-line re-stamp, NOT `plant.mjs --force`); honest wiki
  re-pin for every note whose pinned sources this PR touched.

## Gates this PR owes

- Pre-commit: `gen-marketplace.mjs --check` · `sync-version.mjs --check` · `check-docs.mjs`
- Pre-push: `check-version-bump.mjs --base origin/main` · wiki freshness gate
- Project gates: `tests` (`node --test`), `docs-in-sync`, `versions-consistent`
- Released-surface version bump (`spec-bridge/` is released surface) — **owed**
- Merge commit, never squash. Pin-carrying branch ⇒ merge `origin/main` IN, never rebase.
- `Dispatch:` line on the card per dispatch, `served=` read from the transcript.

## Risks

- **A version bump cascades** (TASK-0121 finding 2): bumping the marketplace touches every
  plugin's `plugin.json` plus `action.yml`'s npm pin — pinned sources for ~11 notes. Expect
  more than one re-pin pass, and re-run the freshness probe after every history move.
- **Do not trust a dispatch's gate claim** (TASK-0121 finding 1): the freshness gate prints
  a non-blocking `warn:` line first and its verdict last, so a partial tail reads green at
  exit 1. The orchestrator re-runs every gate itself.
