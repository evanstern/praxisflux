# 068 — Implementation plan

**Spec:** `specs/068-gate-tracer-capture/spec.md`
**Board task:** TASK-0121

## Constitution check

Checked against `.specify/memory/constitution.md` **v1.0.0 (ratified 2026-09-11)** — a
real check, not the absent/unratified degradation path.

| Article | Verdict | Basis |
|---|---|---|
| I. Artifact-Grounded Action | **PASS** | The work is carded (TASK-0121), specced here, and lands as commits on one branch. The spec's own claims were re-verified against the branch base rather than taken from the card. |
| II. One TASK, One PR | **PASS** | One task, one branch (`task-0121-gate-tracer`), one PR. The phases below are internal breakdown and ride the same branch — no phase gets its own PR. |
| III. Artifact-Gated Seams | **N/A** | No inter-plugin or orchestrated seam. Single-file change inside `spec-bridge/gates/`. |
| IV. Gates: Status Never Exceeds Proven Artifacts | **PASS** | No hand-set status, no write to derived state. The card reaches Done only via `spec-bridge:sync` deriving it from ticked `tasks.md` boxes. |
| V. Composition Through Files and Gates Only | **PASS** | No cross-plugin import, no direct call between plugins. |
| VI. Advisory Local, Authoritative CI | **PASS — and this change strengthens it.** R2 removes a way a *local* traced run corrupts its own evidence. Neither fix makes a local hook load-bearing; CI stays authoritative. |
| VII. Grounding Freshness Is Part of Done | **PASS with an obligation.** `spec-bridge/gates/bridge.mjs` is a pinned source. Phase 4 carries the honest re-pin of whichever notes list it — classified against the real diff, never a mechanical merge-commit bump. |
| VIII. Amendment Procedure | **N/A** | This plan does not edit the constitution. |

No violations. No complexity deviations to justify.

## Approach

Two independent one-function fixes plus their tests. They are independent in the code
(different functions, no shared state) but share a file, so they are sequenced to keep
each phase's diff readable rather than to satisfy a dependency.

**Why not one phase:** the spec's R3 requires each test to be negative-controlled —
demonstrated failing when its behaviour regresses. Interleaving both fixes makes a
negative control ambiguous about which change it is actually pinning.

## Phases

### Phase 1 — R1: `capTrace` preserves the tail

Rewrite `capTrace` (`spec-bridge/gates/bridge.mjs:271-274`) to keep head **and** tail with
the middle elided, within the existing `TRACE_CAP` total budget.

- [ ] 1.1 Replace the head-only slice with a head+tail capture whose combined length does
      not exceed `TRACE_CAP`. Split the budget so the head keeps enough to identify the
      command context and the tail keeps enough to carry a `node --test` failure summary;
      the tail is the half that matters, so it may take the larger share.
- [ ] 1.2 The truncation marker names **which part was dropped** (an elided middle), not
      merely the byte count — a reader must be able to distinguish this from a dropped head.
- [ ] 1.3 Strings at or under `TRACE_CAP` pass through **unchanged and untouched** (no
      marker, no reallocation) — the existing early return semantics.
- [ ] 1.4 Non-string input keeps its current pass-through behaviour (`typeof s !== "string"`).

### Phase 2 — R2: the child env drops `SPEC_BRIDGE_GATE_TRACE`

- [ ] 2.1 In `runGateCommand` (`bridge.mjs:176-182`), build the child env so
      `SPEC_BRIDGE_GATE_TRACE` is **absent** — not empty-string, not `"0"`. `tracePath()`
      treats any truthy value as on, so `"0"` would still be a path override; only absence
      is off.
- [ ] 2.2 `SPEC_BRIDGE_GATE_ACTIVE: "1"` continues to be set on the child, unchanged.
- [ ] 2.3 The parent process's own `process.env` is **not** mutated — the strip applies to
      the spawned child's env object only. Mutating the parent would silently disarm
      tracing for the rest of the Stop invocation, which is the opposite of the fix.

### Phase 3 — R3: regression tests, negative-controlled

- [ ] 3.1 Test (a): a capped capture whose failure text sits in the **last ~1000 chars**
      still contains that text after `capTrace`. Build the fixture well over `TRACE_CAP`
      so the cap definitely engages.
- [ ] 3.2 Test (b): a spawned gate child's env lacks `SPEC_BRIDGE_GATE_TRACE` while still
      carrying `SPEC_BRIDGE_GATE_ACTIVE`. Use `runGateCommand`'s injectable `spawn` to
      capture the env the child *would* receive — no real subprocess needed.
- [ ] 3.3 **Negative-control both**, per spec R3 and TASK-118's rule: revert each fix
      locally, confirm the matching test FAILS, restore. Record in the commit message what
      was broken and that it actually broke — a control that silently no-ops looks
      identical to a real pass.
- [ ] 3.4 Full suite green: `node --test`.

### Phase 4 — release obligations and re-ground

- [ ] 4.1 Marketplace version bump + any touched skill's own `version:`
      (`docs/releasing.md`); `node scripts/sync-version.mjs --check` green.
- [ ] 4.2 Catalog the new tests: entry in the relevant `docs/wiki/test-suite-catalog*`
      note **and** the test file pinned as one of its sources. (TASK-71's finding,
      recreated by TASK-101 — a test file that is not a source is invisible to the
      freshness gate.)
- [ ] 4.3 Honest re-pin of any `docs/wiki` note listing `spec-bridge/gates/bridge.mjs` as
      a source: read `git diff <old-pin>..HEAD -- <sources>`, classify **RE-PIN-ONLY** vs
      **NEEDS-REVIEW**, amend prose before bumping where the diff could invalidate it.
      Never a mechanical bump.
- [ ] 4.4 Gates green: `node --test`, `scripts/check-docs.mjs`,
      `scripts/sync-version.mjs --check`, `scripts/gen-marketplace.mjs --check`, wiki
      freshness.

## Risks

- **The suite may currently depend on the leak.** If any test passes *because* it inherits
  tracing, Phase 2 will surface it as a new failure. That is the fix working, not a
  regression — but it must be investigated and reported, not silenced by re-adding the
  variable.
- **Phase 1 changes recorded evidence format.** Any tooling that parses the old
  head-truncated marker would need updating. None is known to exist; if the implementer
  finds one, stop and report rather than expanding scope.
- **Out of scope, do not chase:** the intermittent red itself. If it fires during this
  work, capture the trace record (it will now be readable — that is the point) and attach
  it to TASK-0121's notes for the follow-up card. Do not start diagnosing it under this
  task.
