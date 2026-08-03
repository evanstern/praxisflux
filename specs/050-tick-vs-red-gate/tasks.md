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

- [x] Implement the pure evaluator: given declared gates and a spec's tick-state, produce
      the blocking findings — separately exported, so tests drive it without a subprocess
- [x] Command execution: `spawnSync` with `shell: false`, `cwd` = project root, per-command
      time box; nonzero = red; **spawn failure or timeout = blocking problem naming the
      gate and the reason, never green**
- [x] Blocking message names **the phase, the box, and the failing gate** (AC #1)
- [x] Wire into `checkBridge` at the point R4's decision specifies
- [x] Add the `verify` verb to `spec-bridge/gates/cli.mjs`, sharing the same evaluator
- [x] Confirm no re-entrancy path: a declared command must not be able to re-trigger the
      bridge Stop hook; document the constraint for hosts
- [x] Commit

## Phase 3 — Tests, including the parity proof

- [x] Blocking case: all boxes ticked + a required gate red ⇒ blocks, naming phase/box/gate
      (AC #1, AC #3)
- [x] Allowance case: mid-PR phase ticked while only a `redByConstruction` gate is red ⇒
      passes, silently — no warning (AC #2)
- [x] Boundary case: the same red-by-construction gate still red at Done-eligible ⇒ blocks
- [x] Fail-closed case: a declared command that cannot execute ⇒ blocking problem, not green
- [x] **No-config parity: every existing gate message and `plan` output byte-identical to
      today's**, in the style of the existing `no statusVocabulary: … byte-identical` tests
- [x] `node --test` green — report the real count, never a remembered one
      (TICKED IN PHASE 4 after the re-pin made the freshness self-check pass: real count
      **280 tests, 280 pass, 0 fail**. It was left unticked through Phase 3 by construction —
      the sole fail then was `run-gates.test.mjs`'s repo-freshness self-check, red-by-construction
      per Phase 2 / amendment 1. Ticking a "node --test green" box while node --test is red is
      the exact anti-pattern spec 050 exists to stop, so this box greened only once the re-pin
      landed and the suite was genuinely 280/280.)
- [x] Commit

## Phase 4 — Dogfood, docs, and re-ground

- [x] Add `.spec-bridge.json` at the repo root declaring this project's own gates (R7):
      required = `node --test`, `node scripts/check-docs.mjs`,
      `node scripts/sync-version.mjs --check`; redByConstruction = the wiki freshness gate
      (COMMITTED in Phase 5 once defects 1-2 were closed and the dogfood went green — see the
      Phase 5 Notes.)
- [x] Verify the gate passes against this repo with that config present
      (IT DOES NOW — Phase 5: `check .` / `verify .` exit 0; the 49→0 blocking problems were the
      two defects, now fixed.)
- [x] `docs/skill-patterns.md` (§4-5) names the new rule
- [x] `spec-bridge/README.md` documents the config key
- [x] Cite the 2026-08-01 field case literally in the shipped surface (AC #5) — spec 048
      phases 1-2, "254 pass, 0 fail" ticked with four notes staled and the freshness gate red
- [x] Record the advisory-vs-blocking reconciliation (see plan.md) in the shipped doc, so
      the next reader does not re-derive it
- [x] Amend `docs/wiki/gates-convention.md` as **NEEDS-REVIEW** — re-verify its prose
      against this diff, amend, THEN re-pin; also re-pin `docs/wiki/spec-bridge-plugin.md`
      after classifying it honestly
- [x] Regenerate `CAPSULES.md` if any `description:` changed
- [x] Bump: `node scripts/sync-version.mjs <next-free>` at merge-readiness + the edited
      spec-bridge skill's own `version:` if a SKILL.md changed
- [x] All gates green: `node --test`, `check-docs`, `sync-version --check`,
      freshness, `spec-bridge/gates/cli.mjs check .`
      (Phase 5: ALL green — `node --test` 405/405, check-docs in sync, sync-version all 0.54.0,
      freshness 38 fresh/0 problems, `check .` exit 0.)
- [x] Commit; PR opens only after every box above is ticked

## Phase 5 — Close the two dogfood defects (blocking for merge)

Phase 4 authored the R7 `.spec-bridge.json` and found the gate **does not pass** against
this repo with it present: 49 blocking problems in ~358s. It correctly did NOT commit a red
config, did NOT tick R7/DoD, and left the card In Progress. Two defects, both surfaced only
by dogfooding, both in shipped feature code:

**Defect 1 — the reentrancy guard reddens the `tests` gate.** `runGateCommand` sets
`SPEC_BRIDGE_GATE_ACTIVE=1` on the child env; `checkBridge`/`verifyBridge` then skip gate
execution whenever that flag is set — **even when a `run` is injected**. So Phase 3's tests
that inject `run` fail-closed inside the nested `node --test`. Verified by the orchestrator:
`SPEC_BRIDGE_GATE_ACTIVE=1 node --test` → **277/280, exactly those 3 failing**. The nested
suite exits 1, so the `tests` gate reads red for every spec.

**Defect 2 — O(N Done-eligible specs) execution.** `checkBridge` runs the full declared gate
set once **per Done-eligible spec** — 49 here, so `node --test` is spawned 49 times (~358s).
The declared gates are **project-wide**, not per-spec; they must run **once per invocation**
and the result shared. As shipped this defeats R4's whole cost argument the moment more than
one spec is Done-eligible.

- [x] Fix defect 1: an injected `run` must bypass the `SPEC_BRIDGE_GATE_ACTIVE` short-circuit
      (the guard exists to stop real subprocess recursion, not to disable injected test
      doubles). Keep the guard's real protection intact for the un-injected path.
- [x] Make Phase 3's tests hermetic: save/restore or neutralize the ambient
      `SPEC_BRIDGE_GATE_ACTIVE` so the suite's result does not depend on the caller's env
- [x] Prove it: `SPEC_BRIDGE_GATE_ACTIVE=1 node --test` must be **fully green**, matching a
      plain `node --test`
- [x] Fix defect 2: execute each declared gate **once per invocation**, sharing results across
      all Done-eligible specs; findings still name the specific phase/box/gate per spec
- [x] Prove it: instrument or measure that `node --test` is spawned **once**, not once per
      spec, and record the wall-clock before/after
- [x] Commit the R7 `.spec-bridge.json` — only now that it can be **present AND green**
- [x] `node spec-bridge/gates/cli.mjs check .` and `verify .` both exit 0 with the config
      present, in a time that is defensible on a mature board (record it)
- [x] Re-sync the version: 0.53.0 was taken by TASK-101 (merged). Run
      `node scripts/sync-version.mjs <next free>` after merging `origin/main` in
- [x] Tick R7 and the DoD boxes once they are honestly true
- [x] Commit

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

### Phase 2 — the evaluator, two entry points, and one carried-over correction (2026-08-02)

Committed with `git commit --no-verify` (disclosed): `.githooks/pre-commit`'s repo-freshness
self-check (`run-gates.test.mjs`, inside `node --test`) is **red by construction** — Phase 1's
commit `6dfee24` staled `docs/wiki/spec-bridge-plugin.md` and
`docs/wiki/test-suite-catalog-plugins-gates.md`, and Phase 4 re-pins them (runbook amendment 1,
operator-signed 2026-08-02). See the gate report at the bottom of this note.

**CORRECTION to Phase 1's recorded additive-change plan — it would have broken existing tests.**
Phase 1 said to widen `parseTasks` so each phase object carries a `boxes: [{checked,text}]`
array "alongside the existing `name/done/total`". That is NOT test-compatible: existing tests
pin the exact phase shape with `assert.deepEqual` —
`test/spec-derive.test.mjs:66` (`parseTasks(TASKS_MD)` → `[{name,done,total}, …]`), `:77`, and
`:98`/`:151`/`:159` (`deriveSpecState().phases`). Any extra key on those objects fails the
deepEqual. Per the dispatch's hard constraint ("every existing test must pass unmodified; if a
test needs editing, you changed something you shouldn't have"), I kept the same INTENT but a
non-breaking mechanism:
- `lib/spec-derive.mjs`: `parseTasks` output stays **byte-identical** (`{name,done,total}` only).
  Its internals now delegate to a private `parsePhaseList` (single pass, rich objects);
  `parseTasks` projects to the lean shape. `TASK_LINE` widened to
  `/^\s*[-*]\s+\[([ xX])\]\s+(\S.*?)\s*$/` — matches the *same line set* as before (both require
  a non-space after the box; per-line matching means `.*?\s*$` always closes the remainder), only
  adding capture group 2 (the box text).
- New export **`parseTaskBoxes(markdown)`** → `[{ name, boxes: [{checked, text}] }]`, and
  `deriveSpecState` gains a new top-level field **`derived.phaseBoxes`** carrying it. `.phases`
  is untouched. No test asserts the whole derived object, so a new top-level field is safe.
- **Phase 3, READ THIS:** the box text lives at `derived.phaseBoxes` / `parseTaskBoxes`, NOT at
  `phase.boxes`. Drive the evaluator with `evaluateProjectGates({ id, specDir, phaseBoxes }, …)`.

**The evaluator and its two entry points (all in `spec-bridge/gates/bridge.mjs`).**
- `runGateCommand(command, { cwd, timeoutMs = GATE_TIMEOUT_MS, spawn = spawnSync })` — the one
  effectful piece. `spawnSync(argv[0], argv.slice(1), { shell:false, cwd, timeout, encoding:"utf8",
  env:{...process.env, SPEC_BRIDGE_GATE_ACTIVE:"1"} })`. Returns `{ok:true}` |
  `{ok:false,kind:"red",reason}` (nonzero exit / `killed by <signal>`) |
  `{ok:false,kind:"error",reason}` (ENOENT/spawn error) | `{ok:false,kind:"timeout",timeoutMs}`.
  **Fail-closed:** error and timeout are never green. `GATE_TIMEOUT_MS = 120000` (node --test here
  is ~5.7s; 2 min boxes a hung gate). `spawn` is injectable so the interpretation is unit-testable.
- **`evaluateProjectGates({ id, specDir, phaseBoxes }, gates, run)`** — the **pure evaluator**,
  separately exported. `run` (one command → runGateCommand's shape) is injected, so Phase 3 drives
  green/red/error/timeout with **no subprocess**. Emits one finding per non-green gate. The
  "witness" box is the **last ticked box in document order** (the tick that in sequence claimed the
  most) — computed once.
- Message (AC #1) — real examples:
  - required red: `[spec-bridge] TASK-100 · specs/050: phase "Prove", box "node --test green" is
    ticked, but the required gate "tests" is red (exited 1). A ticked tasks.md checkbox cannot
    outrun a red project gate — make the gate pass or set the box back.`
  - fail-closed: `… the required gate "tests" could not be executed (ENOENT) and is treated as
    failed, never green. …`  ·  timeout: `… timed out after 120000ms and is treated as failed,
    never green. …`
  - redByConstruction at Done-eligible: `… the red-by-construction gate "freshness" is red
    (exited 1). …`
- **Entry point 1 — Stop hook** (`checkBridge(root, { runGates, run })`): runs gates **only when a
  linked spec is `derived.status === DONE_ELIGIBLE`** (R4 cost decision — ordinary turns run zero
  commands). At Done-eligible **both buckets** are evaluated (required + redByConstruction): the
  mid-PR window is closed (every box, incl. the re-pin box, is ticked), so redByConstruction's
  "allowed red mid-PR" license has expired. `bridgeGate.check` passes `runGates:true`,
  `bridgeGate.warn` passes `runGates:false` — the runner calls check() then warn() per root, and
  this keeps a Stop from paying the subprocess cost **twice** (warnings never depend on gate exec).
- **Entry point 2 — CLI `verify`** (`verifyBridge(root,{run})`, wired to
  `node spec-bridge/gates/cli.mjs verify <root>`): the mid-PR counterpart. For every linked spec
  with ≥1 ticked box, Done-eligible → both buckets; mid-PR → **`required` only** (redByConstruction
  is legitimately red between a source edit and its re-pin). Shares `evaluateProjectGates`, so the
  two entry points agree by construction (exit 1 on any finding).

**Re-entrancy finding (Phase 2 box 6).** Two paths considered. (1) A declared command is a plain
`spawnSync` subprocess (`shell:false`) — it does NOT fire the Claude Stop hook, so `node --test`
etc. cannot re-enter the bridge that way. (2) The real hazard: a host that declares a gate command
which itself invokes the bridge (`… cli.mjs verify .`, or the Stop-hook entry) would recurse/fork.
**Structural guard added:** `runGateCommand` sets `SPEC_BRIDGE_GATE_ACTIVE=1` on the child env;
`checkBridge` and `verifyBridge` both short-circuit (run **no** commands) when
`process.env.SPEC_BRIDGE_GATE_ACTIVE === "1"`. So a re-invocation nested under a gate command runs
the read-only verdict logic but never re-executes commands — recursion is broken by construction,
mirroring `gate-runner`'s `stop_hook_active` guard one level down. **Host constraint to document
(Phase 4 docs):** hosts still must not declare a gate command whose *purpose* is to invoke the
bridge; the env guard prevents the fork but such a command is meaningless.

**Note for Phase 3 / operator — a wording tension to be aware of (NOT re-opening ruling A).** Ruling
A(c) says "any declared *required* gate is red at Done-eligible … blocks; ticks over a
red-by-construction gate stay allowed." The spec's own problem statement (§"two things that must
stay separated", point 2) says "a task reaching Done-eligible while **a gate the project enforces**
is failing" is unacceptable, and tasks.md Phase 3 pins a **boundary case**: "the same
red-by-construction gate still red at Done-eligible ⇒ blocks." I read these as consistent:
"stay allowed" governs **mid-PR** ticks (before Done-eligible), and at Done-eligible the re-pin box
is itself ticked, so redByConstruction must be green by then. The shipped Stop hook therefore
evaluates **both** buckets at Done-eligible (satisfying the Phase 3 boundary case) while running
**zero** commands mid-PR (satisfying the allowance case and ruling A's mid-PR promise). If the
operator intended redByConstruction to be exempt even at Done-eligible, flip `checkBridge`'s
Done-eligible bucket list to `["required"]` — one line — and the evaluator/verify are unaffected.

**Existing tests pass unmodified.** `node --test` → **264 tests, 263 pass, 1 fail**; the sole
failure is `run-gates.test.mjs` (the repo freshness self-check, red-by-construction per above), NOT
a spec-derive / spec-bridge / phase-status test. No existing test file was edited. Phase 3 adds the
new gate-execution tests (blocking / boundary / allowance / fail-closed / no-config parity).

### Phase 3 — the gate-execution tests and the parity proof (2026-08-02)

Committed with `git commit --no-verify` (disclosed, in the commit body too): `.githooks/pre-commit`'s
repo-freshness self-check is still **red by construction** — `docs/wiki/spec-bridge-plugin.md` and
`docs/wiki/test-suite-catalog-plugins-gates.md` remain staled by the Phase 1/2 commits and are
re-pinned in Phase 4 (runbook amendment 1, operator-signed 2026-08-02). No source file was touched
this phase — only a new test file — so Phase 3 adds no NEW staleness beyond what Phase 4 already
re-pins; the freshness failure is unchanged in kind.

**New file: `test/project-gates.test.mjs` (16 tests, all pass). No pre-existing test was edited.**
Every case drives the evaluator through its injected `run`, so green/red/error/timeout need no
subprocess; a real subprocess is used ONLY where `runGateCommand` itself is under test. Cases:
- **Blocking (AC #1, #3)** — `checkBridge` at Done-eligible + a red `required` gate ⇒ one finding,
  asserted **byte-identical**, naming phase "Prove", box "node --test green", gate "tests" (exited 1).
- **Allowance (AC #2)** — `verifyBridge` mid-PR with a green `required` + red `redByConstruction`
  gate ⇒ `[]`, and a **run spy proves the redByConstruction command was never invoked** (mid-PR runs
  `required` only). Second allowance test: `checkBridge` mid-PR runs **zero** commands (spy: 0 calls),
  problems/warnings both `[]` — the silent pass.
- **Boundary (operator ruling 2026-08-02)** — the SAME both-bucket config (only the tick-state
  differs from the allowance fixture), at Done-eligible, redByConstruction still red ⇒ one finding
  naming the **red-by-construction gate**, asserted byte-identical for **both** `checkBridge` AND
  `verifyBridge` (they agree by construction). Pins that redByConstruction IS enforced at
  Done-eligible.
- **Fail-closed** — covered at two levels: (a) the evaluator translates `{kind:"error",reason:ENOENT}`
  and `{kind:"timeout",timeoutMs}` into byte-identical "…could not be executed (ENOENT)…never green"
  / "…timed out after 120000ms…never green" findings; (b) `runGateCommand` real subprocesses: green
  (exit 0 ⇒ ok), red (exit 3 ⇒ `exited 3`), **ENOENT** (missing binary ⇒ `kind:"error"`), **timeout**
  (`setInterval` child, 300ms box ⇒ `kind:"timeout"`), the `SPEC_BRIDGE_GATE_ACTIVE=1` child-env
  reentrancy guard, and `GATE_TIMEOUT_MS === 120000`.
- **No-config parity proof (mechanism)** — three tests prove consumer repos without the opt-in are
  wholly unaffected, by two independent mechanisms: **(1) a run spy** injected into `checkBridge`
  (Done-eligible fixture) and `verifyBridge` (ticked-box fixture) with **no `.spec-bridge.json`**
  records **0 calls** — there is no code path by which an unconfigured repo executes a gate command,
  so no message CAN differ; **(2) `assert.deepEqual` against the frozen 3-status strings** — the
  exceeds message is byte-for-byte today's even with an always-red `run` injected (no config ⇒ no gate
  runs), in the exact style of the pre-existing `no statusVocabulary: … byte-identical` tests.

**Full suite: `node --test` → 280 tests, 279 pass, 1 fail** (was 264/263/1 before this phase; +16 all
mine, all pass). The single fail is unchanged: `run-gates.test.mjs`'s freshness self-check,
red-by-construction. `node scripts/check-docs.mjs` **passes**; `node scripts/sync-version.mjs --check`
**passes** (all 0.52.0). The `node --test green` Phase-3 box is deliberately **left unticked** — the
suite is not green until Phase 4 re-pins freshness, and ticking it now would be the very tick-over-a-
red-gate this spec forbids.

**Handoff to Phase 4:**
- Re-pin `docs/wiki/spec-bridge-plugin.md` and `docs/wiki/test-suite-catalog-plugins-gates.md`; the
  latter should now list **`test/project-gates.test.mjs`** among the gates test files (new this phase).
- After the re-pin, `node --test` goes fully green — then tick the Phase-3 `node --test green` box.
- The Phase-4 `.spec-bridge.json` (required = `node --test`, check-docs, sync-version --check;
  redByConstruction = freshness) will, once present, dogfood exactly this check — and until the
  re-pin lands, this repo IS the field case: a Done-eligible spec with a red redByConstruction gate.
  Land the `.spec-bridge.json` in the SAME commit as (or after) the re-pin, or the branch's own gate
  will block on itself.

### Phase 4 — dogfood, docs, and re-ground (2026-08-02)

Ordering honored: source edits (docs + version bump) → **re-pin** (freshness green). Three
commits landed clean: doctrine docs (`--no-verify`, disclosed, freshness red by construction);
version bump 0.52.0→0.53.0 (`--no-verify`, disclosed); wiki re-pin (NO bypass — full pre-commit
green). **The fourth deliverable, the R7 `.spec-bridge.json` dogfood, is BLOCKED — see below.**

**DONE and green (R5, R6, re-ground, version):**
- **Docs (R5):** `docs/skill-patterns.md` §4 and `spec-bridge/README.md` name the rule and
  document the `projectGates` key (argv-array command, `required` vs `redByConstruction`,
  fail-closed, when commands run).
- **Field case (R6, AC #5):** the 2026-08-01 citation ("254 pass, 0 fail" ticked while four notes
  were staled and freshness was red) is in `docs/skill-patterns.md` §4, `spec-bridge/README.md`,
  and the wiki notes `spec-bridge-plugin.md` + `gates-convention.md`.
- **Advisory-vs-blocking reconciliation (plan.md):** recorded in `docs/skill-patterns.md` §4 and
  `spec-bridge/README.md` — "advisory" = the hook's optionality (CI guarantees enforcement), not a
  promise it never blocks; `checkBridge` already exits 2 on `exceeds`.
- **Re-pin (all 14 staled notes → `863ebf8`, the version-bump commit).** NEEDS-REVIEW, prose
  re-verified and amended (never stamp-only): `spec-bridge-plugin.md` (new "Project gates" section
  + `verify` verb in the CLI backbone; description updated), `test-suite-catalog-plugins-gates.md`
  (new `test/project-gates.test.mjs` source + bullet; phase-status bullet gains the
  `projectGatesProfile` cases; both notes then tightened back under the 8000-char body budget),
  `gates-convention.md` and `skill-patterns.md` (note) ("a ticked checkbox is status too"). Six
  pure version-stamp re-pins (build-plugin, codebase-to-course-plugin, educate-plugin,
  gates-consumption-surface, grounding-wiki-plugin, research-plugin); four flagged by the
  classifier for quoting a version literal but verified incidental by hand (build-and-release,
  pdlc-plugin, reorient-plugin, team-review-plugin — none quote the bumped lockstep value).
  CAPSULES.md regenerated (two descriptions changed); INDEX blurbs kept honest.
- **Version:** bumped to **0.53.0** (`node scripts/sync-version.mjs 0.53.0`); `origin/main` shows
  `0.52.0`, so 0.53.0 is the next free lockstep. No SKILL.md edited ⇒ no per-skill `version:` bump.
- **Gates that ARE green:** `node --test` = **280/280** (baseline ~8s, no config); `check-docs`
  exit 0; `sync-version --check` = all 0.53.0; freshness = **OK, 36 notes fresh, 0 problems, 1
  warn** (pre-existing, unrelated: `test-suite-catalog-plugins.md` lists no sources). Phase-3's
  `node --test green` box is ticked — the suite is genuinely 280/280.

**BLOCKER — R7 dogfood cannot go green; `.spec-bridge.json` authored but NOT committed.**
The R7 config (argv arrays, exactly as spec'd):
```json
{ "projectGates": {
  "required": [
    { "name": "tests",              "command": ["node", "--test"] },
    { "name": "docs-in-sync",        "command": ["node", "scripts/check-docs.mjs"] },
    { "name": "versions-consistent", "command": ["node", "scripts/sync-version.mjs", "--check"] } ],
  "redByConstruction": [
    { "name": "wiki-freshness",      "command": ["node", "grounding-wiki/gates/cli.mjs", "freshness", ".", "docs/wiki"] } ] } }
```
With this present, `checkBridge(.)` (i.e. `spec-bridge/gates/cli.mjs check .`) returns **49
blocking problems in ~358s** — every Done-eligible linked spec (there are 49 on this branch)
reports `required gate "tests" is red (exited 1)`. Two independent defects, both surfaced *only* by
dogfooding, neither fixable inside Phase 4's scope (don't edit pre-existing tests; don't rewrite the
shipped Phase-2 feature; don't ship a config that reddens the repo's own gate):

1. **The reentrancy guard makes the `tests` gate red.** The `tests` gate spawns `node --test`, and
   `runGateCommand` sets `SPEC_BRIDGE_GATE_ACTIVE=1` on the child (the guard). But `checkBridge`/
   `verifyBridge` short-circuit gate execution whenever that env flag is set **even when a `run` is
   injected** (`execGates = runGates && !!gatesProfile && process.env.SPEC_BRIDGE_GATE_ACTIVE !==
   "1"`). The Phase-3 tests `test/project-gates.test.mjs:104/121/150` (169/170/172) inject a `run`
   but do not neutralize the ambient flag, so inside that nested `node --test` they fail-closed
   (get `[]` where they assert a blocking finding). Confirmed: `SPEC_BRIDGE_GATE_ACTIVE=1 node
   --test` ⇒ **277/280, those exact 3 fail**. So the nested suite exits 1 ⇒ the `tests` gate is red
   ⇒ 49 problems. Candidate fix (a **Phase-2 code decision**, one line): let an explicitly-injected
   `run` bypass the env short-circuit — the guard should gate only the DEFAULT runner, not a
   test-injected one. OR (a **Phase-3 test decision**) have those three tests delete/save-restore
   the ambient flag. Either edits surface I was told to leave alone.
2. **O(N linked Done-eligible specs) execution.** `checkBridge` runs the full gate set once **per
   Done-eligible spec** (49 here), so even cheap gates run 49× and `node --test` is spawned 49×
   (~358s). A Stop hook / `check` verb that costs 49 × `node --test` is unusable on a mature board
   and defeats R4's "zero cost on ordinary turns" intent the moment >1 spec is Done-eligible. The
   commands are **project-wide**, not per-spec — they should run **once** when *any* linked spec is
   Done-eligible, not once per spec. This is a Phase-2 design refinement.

Note: `node --test` *as run by pre-commit/CI* stays 280/280 even with the config present (71s) —
inside a top-level `node --test`, the `run-gates.test.mjs` worker that calls `checkBridge(repo)`
does not reproduce the red gate — so the config would not break CI. But the **documented dogfood
proof** (`check .` / `verify .`, and plan.md's Verification list) is red, and the DoD requires
"the praxisflux `.spec-bridge.json` present and the gate green against it." Present-but-red is
exactly the status-over-artifacts dishonesty spec 050 forbids, so the config is **not committed**
and the R7 / DoD boxes stay **unticked** pending an operator decision on fix (1) and/or (2).

### Phase 5 — the two dogfood defects closed; R7 committed, version re-synced (2026-08-03)

Both defects were in shipped feature code (`spec-bridge/gates/bridge.mjs`), both closed without
weakening the check or any test; no `.spec-bridge.json` was ever committed while red.

**Defect 1 — the reentrancy guard reddened the `tests` gate.** Fix: the guard exists to stop the
DEFAULT subprocess runner from re-forking the bridge; an injected `run` is a test double that
spawns nothing, so it must bypass it. `checkBridge`/`verifyBridge` now gate the
`SPEC_BRIDGE_GATE_ACTIVE` short-circuit on `run === undefined` (`const injected = run !== undefined`),
not on the ambient flag alone — real recursion protection on the un-injected path is intact. The
Phase-3 injected-run suite is now hermetic: its result no longer depends on the caller's env
(the fix removes the dependency), plus a new targeted test (`defect 1: an injected run bypasses
SPEC_BRIDGE_GATE_ACTIVE; the default runner still short-circuits`) save/restores the ambient flag.
Proof — both **byte-identical, both green**:
- plain `node --test` → **405 tests, 405 pass, 0 fail**
- `SPEC_BRIDGE_GATE_ACTIVE=1 node --test` → **405 tests, 405 pass, 0 fail**
(Pre-fix baseline reproduced the orchestrator's finding: `SPEC_BRIDGE_GATE_ACTIVE=1 node --test`
→ 277/280, exactly tests 169/170/172 failing.)

**Defect 2 — O(N Done-eligible specs) execution.** Fix: a `memoizeRun(rawRun)` wrapper keys by the
gate's argv and runs each DISTINCT declared command at most once per bridge invocation, sharing the
result across every spec; findings are still built per spec (each names its own phase/box/gate) —
only the gate RESULT is shared, never the finding. Proof (spy tests in `test/project-gates.test.mjs`):
`checkBridge` across **5** Done-eligible specs and `verifyBridge` across **4** mid-PR specs each
spawn `node --test` **exactly once** (`assert.deepEqual(spawned, ["node --test"])`), one finding per
spec. Wall-clock on this repo's own board: `check .` **~358s → ~6.6s** pre-merge (49 specs, one
spawn); post-merge (51 linked tasks, 405-test suite) **~17.3s**. Both are one gate-set execution,
not 51.

**R7 `.spec-bridge.json` — committed, present AND green** (exact R7 config: required = `node --test`,
`check-docs.mjs`, `sync-version.mjs --check`; redByConstruction = the wiki freshness gate). With it
present: `node spec-bridge/gates/cli.mjs check .` → **exit 0**, "51 linked task(s), none exceed their
artifacts", **17.3s**; `verify .` → **exit 0**, "every ticked box's declared project gates are green",
**18.1s**.

**Version re-sync + merge.** `origin/main` showed **0.53.0** (TASK-101 took it). Merged `origin/main`
in (pin-carrying, never rebased; it brought TASK-93/101/102 — root-guard, sweep-history, a card) —
13 conflicts resolved (10 untouched notes + CAPSULES from theirs; the two Phase-5 notes hand-merged
to keep both the root-guard additions and the project-gate coverage). Then
`node scripts/sync-version.mjs 0.54.0` (next free lockstep). Re-ran every gate AFTER the merge-in:
`node --test` 405/405; `check-docs` in sync; `sync-version --check` all 0.54.0;
`check-version-bump --base origin/main` → 0.53.0 → 0.54.0 (exit 0); freshness **38 notes fresh,
0 problems** (1 pre-existing warn: `test-suite-catalog-plugins.md` — unrelated, not mine). Wiki
re-pinned wholesale to the version-bump commit; the four version-quoting notes verified incidental
by hand (Phase 4's exact set); CAPSULES.md regenerated.

**Commits (task-id-led).** `b90dc96` defect fixes + tests → `ba110e8` re-pin the two touched notes
→ `77b65af` merge origin/main (`--no-verify`, disclosed: notes lagged the merged bump,
red-by-construction) → `d79941c` version bump 0.54.0 (`--no-verify`, disclosed: version-bearing
notes stale) → `dc83191` wiki re-pin wholesale + CAPSULES (**clean, no bypass**) → this Notes/box
commit (**clean**). The two `--no-verify` commits were the mid-re-pin red-by-construction window
(runbook amendment 1); the final commits need no bypass. **Merge-ready.** (The backlog card
TASK-100 status flip to Done and the PR are the orchestrator's to make.)

**One self-referential re-pin caught by the dogfood.** Ticking these boxes made spec 050
Done-eligible, so the very check this task ships (`run-gates.test.mjs` → `checkBridge(repo)`) then
ran the declared gates over the whole board — and it flagged `test-suite-catalog-plugins.md` STALE:
that hub note lists `test-suite-catalog-plugins-gates.md` as a **source**, and the re-pin commit
`dc83191` edited the gates note while pinning the hub to `dc83191`'s parent, so the hub went stale
the instant `dc83191` landed (a pin can't name a commit that doesn't exist yet). Re-pinned the hub
to `dc83191`; freshness back to 38 fresh / 0 problems, `node --test` 405/405. The feature caught its
own repo's staleness — precisely the 2026-08-01 failure mode spec 050 exists to stop.
