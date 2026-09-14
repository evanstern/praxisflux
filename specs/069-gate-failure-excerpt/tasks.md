# Spec 069 — tasks

**Task:** TASK-0131 · Phases are internal breakdown; they ride this one branch and merge in
this task's single PR.

## Phase 1 — capture and bound the subprocess output

- [x] Extract the tail-preserving bound (`capTrace`'s head + elision + tail shape) into one
      shared helper used by both the trace path and the verdict path — one spelling for
      "bounded subprocess output" in this file
- [x] `runGateCommand` returns a bounded `output` field alongside `{ ok:false, kind, reason }`
      on the `red` path, built from combined stdout+stderr
- [x] The `error` and `timeout` paths carry `output` when the subprocess produced any, and
      omit it cleanly when it did not
- [x] `{ ok:true }` is unchanged — no output field, no added work on the green path
- [x] `ok`/`kind`/`reason` keep their exact current meanings (append-only change)

## Phase 2 — surface the excerpt in the finding

- [x] The collapsed finding for a non-green `required` gate appends the excerpt after the
      existing one-line summary and after the remedy clause
- [x] The headline reads exactly as before: gate name, bucket label, reason, affected count
- [x] The `CANT_OUTRUN` remedy clause still appears (gates-convention.md: a failure names its fix)
- [x] `redByConstruction` findings are byte-identical to before this change
- [x] A gate that fails with NO output degrades to the current single-line finding, not an
      empty excerpt block

## Phase 3 — prove it

- [x] Fixture gate fails with known output; that output is asserted present in `checkBridge`'s problems
- [x] The cap is asserted: output well over the cap yields a finding bounded to it
- [x] Tail preservation asserted: a marker on the LAST line of a long output survives the cap
- [x] Negative control — the assertion is shown to FAIL when the excerpt is not threaded through
      (per TASK-118's convention: an assertion pinning a behaviour must be shown to fail when
      that behaviour regresses), and the control is shown to have actually broken the thing
- [x] `redByConstruction` reporting has a test pinning it unchanged
- [x] Full suite green: `node --test`

## Phase 4 — release and re-ground

- [x] Marketplace version bumped (released surface: `spec-bridge/`); edited skill `version:` bumped if any skill file changed
- [x] Planted block re-stamped per TASK-0121 finding 3 — two-file one-line re-stamp, NOT `plant.mjs --force`
- [x] `gen-marketplace.mjs --check`, `sync-version.mjs --check`, `check-docs.mjs` green
- [x] Every wiki note whose pinned sources this PR touched is re-pinned honestly — RE-PIN-ONLY vs
      NEEDS-REVIEW classified against the real diff, never a merge-commit pin that was not read
- [x] Wiki freshness gate green, re-run after every history move (unconditionally)
- [x] `check-version-bump.mjs --base origin/main` green
