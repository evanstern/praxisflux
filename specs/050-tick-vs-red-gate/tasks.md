# 050 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Design decision and config surface

- [ ] Read `spec-bridge/gates/bridge.mjs`, `spec-bridge/gates/cli.mjs`,
      `lib/spec-derive.mjs`, and the `statusVocabulary` tests in
      `test/spec-bridge.test.mjs` — the opt-in contract to mirror
- [ ] Determine whether `parseTasks` exposes individual checkbox TEXT (AC #1 needs phase +
      box + gate in the message); record the finding and, if absent, the additive change
      needed
- [ ] Decide and record **R4's design choice** in this file's Notes section with rationale:
      when declared gate commands execute, and why the chosen point is affordable
- [ ] Decide and record the `command` representation (argv array strongly preferred over a
      shell string — `shell: false`, no interpolation) in the Notes section
- [ ] Define the `projectGates` config schema and implement its parser, returning null
      unless at least one validly-shaped entry exists (the `vocabularyProfile` precedent)
- [ ] Commit the parser plus its unit tests

## Phase 2 — The evaluator and its two entry points

- [ ] Implement the pure evaluator: given declared gates and a spec's tick-state, produce
      the blocking findings — separately exported, so tests drive it without a subprocess
- [ ] Command execution: `spawnSync` with `shell: false`, `cwd` = project root, per-command
      time box; nonzero = red; **spawn failure or timeout = blocking problem naming the
      gate and the reason, never green**
- [ ] Blocking message names **the phase, the box, and the failing gate** (AC #1)
- [ ] Wire into `checkBridge` at the point R4's decision specifies
- [ ] Add the `verify` verb to `spec-bridge/gates/cli.mjs`, sharing the same evaluator
- [ ] Confirm no re-entrancy path: a declared command must not be able to re-trigger the
      bridge Stop hook; document the constraint for hosts
- [ ] Commit

## Phase 3 — Tests, including the parity proof

- [ ] Blocking case: all boxes ticked + a required gate red ⇒ blocks, naming phase/box/gate
      (AC #1, AC #3)
- [ ] Allowance case: mid-PR phase ticked while only a `redByConstruction` gate is red ⇒
      passes, silently — no warning (AC #2)
- [ ] Boundary case: the same red-by-construction gate still red at Done-eligible ⇒ blocks
- [ ] Fail-closed case: a declared command that cannot execute ⇒ blocking problem, not green
- [ ] **No-config parity: every existing gate message and `plan` output byte-identical to
      today's**, in the style of the existing `no statusVocabulary: … byte-identical` tests
- [ ] `node --test` green — report the real count, never a remembered one
- [ ] Commit

## Phase 4 — Dogfood, docs, and re-ground

- [ ] Add `.spec-bridge.json` at the repo root declaring this project's own gates (R7):
      required = `node --test`, `node scripts/check-docs.mjs`,
      `node scripts/sync-version.mjs --check`; redByConstruction = the wiki freshness gate
- [ ] Verify the gate passes against this repo with that config present
- [ ] `docs/skill-patterns.md` (§4-5) names the new rule
- [ ] `spec-bridge/README.md` documents the config key
- [ ] Cite the 2026-08-01 field case literally in the shipped surface (AC #5) — spec 048
      phases 1-2, "254 pass, 0 fail" ticked with four notes staled and the freshness gate red
- [ ] Record the advisory-vs-blocking reconciliation (see plan.md) in the shipped doc, so
      the next reader does not re-derive it
- [ ] Amend `docs/wiki/gates-convention.md` as **NEEDS-REVIEW** — re-verify its prose
      against this diff, amend, THEN re-pin; also re-pin `docs/wiki/spec-bridge-plugin.md`
      after classifying it honestly
- [ ] Regenerate `CAPSULES.md` if any `description:` changed
- [ ] Bump: `node scripts/sync-version.mjs <next-free>` at merge-readiness + the edited
      spec-bridge skill's own `version:` if a SKILL.md changed
- [ ] All gates green: `node --test`, `check-docs`, `sync-version --check`,
      freshness, `spec-bridge/gates/cli.mjs check .`
- [ ] Commit; PR opens only after every box above is ticked

## Notes

(Implementers append recorded decisions and measurements here — this section is part of
the phase handoff artifact set. R4's decision and the `command` representation choice are
required entries.)
