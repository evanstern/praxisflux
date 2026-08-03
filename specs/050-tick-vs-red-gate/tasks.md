# 050 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Design decision and config surface

- [x] Read `spec-bridge/gates/bridge.mjs`, `spec-bridge/gates/cli.mjs`,
      `lib/spec-derive.mjs`, and the `statusVocabulary` tests in
      `test/spec-bridge.test.mjs` — the opt-in contract to mirror
- [x] Determine whether `parseTasks` exposes individual checkbox TEXT (AC #1 needs phase +
      box + gate in the message); record the finding and, if absent, the additive change
      needed
- [x] Decide and record **R4's design choice** in this file's Notes section with rationale:
      when declared gate commands execute, and why the chosen point is affordable
- [x] Decide and record the `command` representation (argv array strongly preferred over a
      shell string — `shell: false`, no interpolation) in the Notes section
- [x] Define the `projectGates` config schema and implement its parser, returning null
      unless at least one validly-shaped entry exists (the `vocabularyProfile` precedent)
- [x] Commit the parser plus its unit tests

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

### Phase 1 — recorded decisions and findings (2026-08-02)

**Finding: `parseTasks` does NOT expose individual checkbox text (AC #1 gap).**
`lib/spec-derive.mjs:parseTasks` returns `[{ name, done, total }]` per phase — phase name
plus a done/total count, nothing more. Its per-line regex is
`TASK_LINE = /^\s*[-*]\s+\[([ xX])\]\s+\S/`: it captures only the checkbox char and asserts
a non-space follows, but never captures the box's descriptive text. So the text a box
carries (e.g. "node --test green") is unavailable downstream today.

AC #1 requires the blocking message to name the phase, **the box**, and the failing gate.
The box text is therefore missing and Phase 2 needs it. **Additive change needed (do in
Phase 2, not here):** widen `TASK_LINE` to capture the trailing text —
`/^\s*[-*]\s+\[([ xX])\]\s+(\S.*?)\s*$/` — and have `parseTasks` attach a per-phase
`boxes: [{ checked, text }]` array alongside the existing `name/done/total`. This is
strictly additive: `name/done/total` and the `.filter(p => p.total > 0)` output shape stay
byte-identical, so every existing `parseTasks`/`deriveSpecState`/`spec-bridge` test passes
unmodified. `lib/spec-derive.mjs` feeds both the gate and the sync planner — the new field
must be added, never an existing one changed. (Not started in Phase 1 by dispatch scope.)

**R4 decision — declared gate commands execute ONLY when a linked spec is Done-eligible
(Stop hook), plus an explicit CLI `verify` verb for the mid-PR case. Measured, not assumed:**

| What | Wall time (this repo, node 3-run median) |
|---|---|
| `node --test` (one declared `required` command) | **~5,665 ms** (5678 / 5655 / 5673) |
| Ordinary bridge Stop-hook run today (deriveSpecState, no subprocess) | **~103 ms** (112 / 100 / 103) |
| Bare `node -e ''` startup baseline | **~82 ms** |

Running `node --test` on every Stop would turn a ~103 ms turn-end into ~5.7 s — a ~55× tax,
per turn, in every consumer repo that declares gates. That is exactly the cost the spec's
R4 constraint calls unacceptable, so the measurement **confirms** the recommended design
rather than contradicting it. Adopted as recommended:
- **Stop hook:** evaluate `required` commands only when at least one linked task's spec is
  Done-eligible (all boxes ticked) — the one bounded moment the answer changes an outcome
  (satisfies AC #3). Ordinary-turn cost: **zero commands run** (the ~103 ms path is
  untouched for the common case where nothing is Done-eligible).
- **CLI `verify` verb** (`node spec-bridge/gates/cli.mjs verify <root>`, Phase 2): checks
  every ticked box against the declared gates and exits nonzero on a violation — serves
  AC #1's broader mid-PR "tick claims greenness" case. The sweep's per-phase loop and CI
  call it. This is one shared pure evaluator with two entry points, mirroring `checkBridge`
  (Stop hook + `cli.mjs check`) — not two mechanisms.

**`command` representation — argv array with `shell: false` (no shell string).** Config
declares `"command": ["node", "--test"]`. Phase 2 executes via `spawnSync(argv[0],
argv.slice(1), { shell: false, cwd: root })`: no shell, so no interpolation and no injection
surface. A shell string is rejected by the parser as malformed — there is no safe general
split (quoting/word-splitting), and admitting one would reintroduce the surface the array
form exists to remove. (Note: the existing `sq()` helper in bridge.mjs shell-quotes
`backlog task edit` lines that are only ever PRINTED, never executed — a separate concern.)

**Parser shipped this phase — `projectGatesProfile(config)` in `spec-bridge/gates/bridge.mjs`.**
Mirrors `vocabularyProfile` exactly: returns `null` (behavior bit-for-bit unchanged) unless
at least one validly-shaped entry exists. A valid entry is
`{ name: <non-empty string>, command: <non-empty array of non-empty strings> }`; malformed
entries are dropped silently and a malformed argv element fails the whole entry (never
silently repaired). Returns `{ required, redByConstruction }`, each an array of
`{ name, command }` (command a `string[]` argv); an absent-but-other-present bucket is `[]`;
`null` iff no valid entry exists in either bucket. It is exported but **not yet wired** into
`checkBridge`/`planBridge` — nothing calls it — so no-config parity is trivially preserved
in Phase 1 (the wiring and its parity proof are Phase 2/3). Unit tests: 5 `projectGatesProfile`
cases in `test/phase-status.test.mjs` (opt-out/null, string-command rejection, bucket
normalization, single-bucket + name-trim, malformed-sibling drop).
