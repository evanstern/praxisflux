# 024-gate-exit-contracts — enforcement must fail loudly and in the right exit code

Board: TASK-65 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane F).

## The failures

1. **Throwing gate exits 2, not 1 (live).** `scripts/run-gates.mjs:72-78` — gate
   functions execute inside `names.map(...)` at `:56`, i.e. inside the usage-error
   try/catch, so any exception thrown WHILE a gate runs exits 2 "usage error" instead
   of 1; reproduced with a broken-symlink wiki note (`usage error: ENOENT...`,
   exit 2). `docs/consuming-gates.md:76` pins 0/1/2 as the versioned consumer contract
   and the same file ships as the `@praxisflux/gates` bin — CI consumers branching on
   exit codes are misdirected.
2. **stop-docs root match wrong both directions.** `scripts/stop-docs.mjs:32` —
   `(startDir === repo || startDir.startsWith(repo))`: `repo` derives from
   `import.meta.url`, which Node realpaths for ESM entries, while `startDir` is the
   as-launched `CLAUDE_PROJECT_DIR`/hook cwd — any symlinked launch path (incl. macOS
   `/tmp` vs `/private/tmp`) makes the comparison false and the repo's own docs-sync
   Stop gate silently never fires. And without a path-separator boundary, a sibling
   dir like `.../praxis-anything` satisfies `startsWith` and can block Stop in an
   unrelated project whenever praxis docs are stale.
3. **resolveRoots crash swallowed.** `lib/gate-runner.mjs:46` — `catch { roots = []; }`
   silently swallows a crashing resolveRoots, converting a gate bug into permanent
   silent non-enforcement — in contrast to `:48-49`, where a crashing check surfaces
   as a blocking problem.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — an exception thrown during gate *execution* exits 1 (gate failure),
never 2; exit 2 stays reserved for genuine usage errors (unknown gate name, empty
list, bad root). `docs/consuming-gates.md` stays accurate to the behavior (amend its
wording only if it must name the crash case explicitly). Regression test drives a
throwing gate through the CLI and asserts exit 1. **Checkpoint (runbook): if keeping
the 0/1/2 contract intact proves impossible, stop and surface — that's an
outward-facing contract change.**

R2 (AC #2) — stop-docs realpaths BOTH sides of the comparison and requires a
path-separator boundary (`startDir === repo || startDir.startsWith(repo + sep)`), so
a symlinked launch path fires the gate and sibling dirs never match.

R3 (AC #3) — a crashing resolveRoots surfaces as a blocking problem (same shape as a
crashing check at `:48-49`), never as `roots = []` silence.

Versions per `docs/releasing.md`: `lib/` + `scripts/` are released surface →
marketplace `sync-version` next free (no skill version applies unless a SKILL.md is
touched). Wiki: re-verify + re-pin `docs/wiki/gate-runner.md`,
`docs/wiki/gates-consumption-surface.md`, `docs/wiki/test-suite.md` as their sources
change (+ lockstep stales); CAPSULES regen if descriptions change.

## Non-goals

- New exit codes or gate registry changes beyond the crash-classification fix.
- The grounding-wiki gate's own defects (TASK-59 / spec 020 — separate lane; note the
  broken-symlink fixture that reproduced R1 is unrelated to 020's missing-source
  check).
