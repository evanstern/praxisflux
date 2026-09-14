# Spec 071 — tasks

**Task:** TASK-117 · Phases are internal breakdown; they ride this one branch and merge in
this task's single PR.

## Phase 1 — a supported regenerate entry point

- [x] `lib/board-mirror.mjs`'s CLI gains a write/regenerate mode: read → replace `links` +
      `generatedAt` → `validateMirror` → write
- [x] It refuses to write an invalid mirror (never produces the envelope-less file that
      `--check` misreports as `unknown schema undefined`)
- [x] The envelope contract is documented at the entry point, so no future caller has to
      rediscover that `projectBacklog()` returns a bare array
- [x] A `requiresSync` provider (no local recompute) is handled explicitly, not crashed

## Phase 2 — the hook step and its distinguishing output

- [x] `.githooks/pre-commit` runs the mirror check, in the established label-then-check style
- [x] Placement chosen deliberately among the existing steps, with the reason recorded
- [x] A stale/drifted mirror blocks the commit (`set -e` already carries this)
- [x] The failure output distinguishes "your mirror is stale" from "your board lags your
      specs" — a session cannot confuse it with the bridge gate's status finding
- [x] The failure NAMES ITS FIX: the Phase 1 regenerate command, copy-pasteable
      (gates-convention.md: a failure line names its fix)
- [x] The `requiresSync` path degrades to staleness-only rather than demanding an impossible
      recompute — verified, so a Jira-provider host can still commit
- [x] No self-heal anywhere: the hook reports and blocks, never regenerates for the session
      (the ruling rejects option 1 and forbids building both mechanisms)

## Phase 3 — prove it and close

- [x] Regression test: a deliberately stale mirror produces the intended block naming
      staleness, not a misleading status finding
- [x] Negative control: the assertion is shown to FAIL when the mechanism is absent, and the
      control is shown to have actually broken the thing
- [x] `spec-bridge/gates/bridge.mjs` is untouched by this task (R6) — verified by diff
- [x] Full suite green: `node --test`, raw counts recorded
- [x] Version bumped (`lib/` is released surface); planted block re-stamped per TASK-0121
      finding 3 — two-file one-line re-stamp, NOT `plant.mjs --force`
- [x] `gen-marketplace.mjs --check`, `sync-version.mjs --check`, `check-docs.mjs` green
- [x] Wiki notes pinning any touched file re-pinned honestly (RE-PIN-ONLY vs NEEDS-REVIEW
      classified against the real diff); freshness gate green
