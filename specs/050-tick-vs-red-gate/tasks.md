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
- [ ] `node --test` green — report the real count, never a remembered one
      (LEFT UNTICKED BY CONSTRUCTION — real count **280 tests, 279 pass, 1 fail**; the sole
      fail is `run-gates.test.mjs`'s repo-freshness self-check, red-by-construction per Phase
      2 / amendment 1. Ticking a "node --test green" box while node --test is red is the exact
      anti-pattern spec 050 exists to stop, so this box greens in Phase 4 after the re-pin.)
- [x] Commit

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
