# Full-board sweep — sweep runbook (2026-09-14)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: the board cards
themselves (each carries its own finding, evidence, and ACs) plus the operator-ratified
pre-sweep prune (commit `9f6b6af`) win. Plan-of-record is the board; this file carries
only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-09-14
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

**Sign-off provenance (2026-09-14):** the operator ruled on both Lane-0 checkpoints —
TASK-117 → **option 2**, TASK-105 → **sonnet** — against the standing instruction to run
the sweep once the board was pruned and the plan ratified. Both rulings are written into
the gate lines below; the lanes are otherwise as authored.

**Execution mode: INTERACTIVE (board-track main-push works). CORRECTED 2026-09-14
after TASK-0121 — the paragraph below overstated the constraint; read this first.**

The original reading came from one refused `git push origin HEAD:main` while landing this
runbook, which was taken as proof that no main-push was available. It is narrower than
that. What is refused is pushing **unreviewed deliverable work** straight to `main` — the
repo's own rule ("push to `origin`, and open a PR with `gh` — don't push straight to
`main`"). A **board/bookkeeping** push to `main` succeeds: TASK-0121's closure commit
(`510f1e8` — card Done, mirror resync) pushed to `main` directly, with the pre-push gates
running normally.

So the **two-track landing rule applies in its ordinary form**, not its degraded one:
board/bookkeeping commits (cards, status flips, notes, AC ticks, mirror resyncs) land
**direct on `main`**; deliverables land **by PR**. The claim flip stays the exception it
always was — it is deliverable state and rides the task branch's claim commit.

Consequences for the remaining tasks, replacing the three substitutions below:
- Post-merge closures (tasks.md tick, `spec-bridge:sync`'s board-Done, this runbook's log
  row) land as **root commits on `main`**; they do NOT need to ride the next task's branch.
- There is **no wrap-up PR** owed at sweep close for board state.
- **Worktree location is unchanged in practice.** Task worktrees still live at
  `.claude/worktrees/task-<N>`, because a background job's edits are refused in the shared
  checkout by the harness isolation guard, and `EnterWorktree` uses that root. That is a
  harness constraint, not the no-main-push mode — and it is exactly the doctrine conflict
  **TASK-120** is carded to resolve. Do not "fix" paths mid-sweep.

Recorded rather than quietly amended because a resuming session that inherits a wrong
execution mode will route every closure the wrong way — which is the failure TASK-98 is
carded for. The superseded reading follows, kept for provenance:

> **Superseded (2026-09-14, first reading):** background-job / no-main-push, on the
> evidence of one refused push. Its three substitutions:
- Task worktrees live at **`.claude/worktrees/task-<N>`** (the harness isolation root,
  entered via `EnterWorktree`), not `.worktrees/task-<N>`. Note this is exactly the
  contradiction **TASK-120** exists to resolve — this sweep runs under the harness path
  and TASK-120 decides the durable answer; do not pre-empt its ruling by "fixing" paths
  mid-sweep.
- **Closures ride the next branch.** Post-merge closures (the tasks.md tick,
  `spec-bridge:sync`'s board-Done, the runbook log row) cannot land as a root commit, so
  they ride the NEXT claimed task's branch and merge in its PR. Board and spec commands
  run **inside the task worktree**; the root board lags until merge.
- **Sweep-close lands via a wrap-up PR** — the last syncs and this file's status flip
  have no next branch to ride.

The board track's "direct to `main`" degrades accordingly; the deliverable track is
unchanged (still one task, one branch, one PR). **This runbook itself landed via
PR #148** for the same reason.


## Read first (in this order)

1. The pre-sweep board audit in commit `9f6b6af` (`board: pre-sweep prune — close
   TASK-97/103, rescope TASK-94/95, tick TASK-120 AC#3`) — it records which cards were
   re-verified against HEAD and which had decayed. Four cards' premises were found stale;
   do not re-derive that analysis.
2. `CLAUDE.md` (repo-native section + the planted `pdlc:grounding` block) and
   `docs/principles.md` — the 101 principles that bind this repo's own workflow.
   `.specify/memory/constitution.md` is **ratified (v1.0.0, TASK-0133)**, so every
   `plan.md` in this sweep gets a real constitution check — not the "absent/unratified"
   degradation path.
3. `docs/wiki/CAPSULES.md` for the whole-corpus view; full notes only for the concepts a
   given task actually touches (never bulk-load the corpus).
4. `backlog task list --plain` — live state; other sessions move it while you work.
5. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written (2026-09-14)

- **Done already:** 92 tasks, most recently TASK-0130 (snapshot `.git` exclusion, PR #147)
  and TASK-0133 (Spec Kit constitution ratified, PR #146). Closed in the pre-sweep prune
  without a PR: **TASK-97** (agent-def dispatch doctrine — superseded wholesale by
  TASK-106/107's `.claude/model-tiers.json` generator) and **TASK-103** (catalog size wall
  — cleared when a `-pdlc` child split off during the TASK-0124/0125 re-pin work; the
  parent is now 7,231/8,000).
- **In flight in other sessions (do not duplicate; expect their merges):** none observed.
  Root is clean on `main` at `9f6b6af`, `git worktree list` shows only the root, and
  `.claude/worktrees/` is empty. Stale remote branches exist (`task-109-board-mirror`,
  `task-112-board-verb-table`, `task-113-jira-provider`, `task-119-bridge-gate-fanout`,
  `task-0122-gate-runner-cwd`, `task-0125-dispatch-gap`, `board-task-labels`,
  `hermes-skills`, `pdlc-design-rounds`) — all for tasks already **Done**; they are merge
  leftovers, not live lanes. Janitor them only after confirming each PR merged.
- **Paused — untouched (`paused` label; excluded from lane conflict analysis; never claim,
  rebase, or clean their branches/worktrees):** none.
- **Excluded by operator decision:** **TASK-0129** (re-tune the triage-offload prompt and
  model against banked ground truth). Parked to its own session — it is a
  (prompt × model) eval matrix over five local Ollama models, hardware-bound and
  wall-clock-dominated, not a code or doctrine edit. It is the only To Do card not in this
  sweep's scope.
- **Queued (this runbook's scope — 13 tasks, in execution order):** TASK-0121, TASK-0131,
  TASK-0132 · TASK-0123 · TASK-98, TASK-115, TASK-120 · TASK-105 · TASK-96 · TASK-94,
  TASK-95 · TASK-118. TASK-117 sits in Lane B per the Lane-0 ruling (option 2).

## SCOPE AMENDMENT — this run executes Lanes A + B only (operator, 2026-09-14)

**Operator ruling, recorded before any dispatch:** this run executes **TASK-0121 first as
a dispatch-and-cost calibration**, then the remainder of **Lane A + Lane B**. Lanes C, D
and E are **punted** — not dropped, not descoped, not started. Rationale in the operator's
terms: the full thirteen-task runbook is ~30-50 phase-scoped dispatches plus ten
released-surface PRs, and that token spend is not warranted in one sweep.

**Executed in this run (5 tasks):**
- TASK-0121 (calibration — served-model verified from its transcript before any sibling
  dispatch), then TASK-0131, then TASK-0132 — Lane A, serial.
- TASK-0123, TASK-117 — Lane B, parallel with Lane A.

**Punted to a later sweep (8 tasks):** TASK-98, TASK-115, TASK-120 (Lane C1); TASK-105
(C2); TASK-96 (C3); TASK-94, TASK-95 (Lane D); TASK-118 (Lane E). Their lanes, tiers,
orderings, hotspot analysis and checkpoints below **stand unamended** and remain valid
input for that sweep — this amendment changes only WHICH lanes run now. TASK-0129 remains
separately excluded (its own session).

**Consequences for this run's Output gate** — it is scoped to the five tasks above, not
thirteen. Specifically:
- Lane C's three-stage chain never starts, so `pdlc/skills/sweep/SKILL.md` (the dominant
  5-task hotspot) is **untouched by this run**. The C1→C2→C3 ordering constraint carries
  forward intact.
- TASK-96's terminal re-plant does not happen, so the root `CLAUDE.md` block stays pinned
  at its current version. That is expected, not a miss.
- The cross-lane collisions on `action.yml` (TASK-105 ∩ TASK-94) and
  `docs/consuming-gates.md` (TASK-0132 ∩ TASK-105) **do not arise in this run**: only
  TASK-0132 is in scope, so it takes `docs/consuming-gates.md` uncontested. A later sweep
  running TASK-105 must re-check both against whatever this run merged.
- This runbook's status flips to **done** when the five scoped tasks are done, with the
  punted eight named explicitly as remaining. A later sweep adopting the rest should
  author its own runbook or amend this one back to executing — never silently inherit a
  `done` file.

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — tasks below share file footprints,
so concurrent PRs will conflict; the lanes bound how bad it gets.

**Measured footprint overlap** (derived from each card's cited files, not assumed):

| shared file | tasks |
|---|---|
| `pdlc/skills/sweep/SKILL.md` | **5** — TASK-98, TASK-115, TASK-120, TASK-105, TASK-96 |
| `CLAUDE.md` | 3 — TASK-120, TASK-105, TASK-96 |
| `spec-bridge/gates/bridge.mjs` | 2 — TASK-0121, TASK-0131 (TASK-117's option-1 overlap did not materialize: option 2 ruled) |
| `pdlc/templates/CLAUDE.md` | 2 — TASK-105, TASK-96 |
| `action.yml` | 2 — TASK-105, TASK-94 |
| `docs/consuming-gates.md` | 2 — TASK-0132, TASK-105 |

`pdlc/skills/sweep/SKILL.md` is the dominant hotspot and is what forces Lane C's shape.

---

**Lane A — spec-bridge gate diagnosability (serial within the lane; same functions):**
- **TASK-0121 (sonnet · model `cc/claude-sonnet-5[1m]`, fallback none —
  defaultTier; two localized fixes in one file to a written spec, no judgment call
  the spec won't settle)** — `capTrace` keeps the head and discards the `node --test`
  failure summary (the tail); `runGateCommand` leaks `SPEC_BRIDGE_GATE_TRACE` into
  spawned children so the suite traces itself. **Both verified present at HEAD**
  (`bridge.mjs:271-274`, `:176-181`).
- **TASK-0131 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; bounded-excerpt
  plumbing plus a fixture test)** — the required-gate failure path captures subprocess
  output then reports only `is red (exited 1)` (`bridge.mjs:203` → `:332`). **After
  TASK-0121**: both edit `runGateCommand`'s capture path, so they cannot develop in
  parallel. Natural ordering bonus — 0121's tail-preserving capture is what makes
  0131's excerpt worth reading.
- **TASK-0132 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; the *mechanism* is an
  open design question, but AC#4 constrains it to host-stated config, and the
  checkpoint below covers the choice)** — CI runs the full suite twice per PR (the
  `tests` job, then again as spec-bridge's `tests` project gate), doubling the odds
  any nondeterministic test blocks a PR. **Last in the lane**: it may extend the
  `projectGates` contract TASK-0131 just touched, and `docs/consuming-gates.md` is
  shared with TASK-105.

**Lane B — local-gate hygiene (independent; start immediately, parallel with Lane A):**
- **TASK-0123 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; diagnosis work, but
  the card supplies the mechanism hypothesis and a precedent to copy)** — the
  `stop-docs-window` fixture teardown races git on `.git` rmdir (CI-only ENOTEMPTY).
  Sole owner of `test/stop-docs-window.test.mjs`; zero overlap with any other lane.
  **Budget honestly:** AC#3 demands TASK-114-shaped evidence (N consecutive green runs,
  raw counts recorded), and AC#5 requires auditing every sibling test using the same
  git-init-in-mkdtemp fixture. The diff is small; the proof is not.
- **TASK-117 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; the mechanism is now
  decided by operator ruling, leaving hook plumbing plus a regression test)** — the
  board mirror goes stale silently. **Placed here by the Lane-0 ruling (option 2):**
  the fix is a `.githooks/pre-commit` staleness check, so it does NOT touch
  `bridge.mjs` and is free of Lane A's serial chain. Runs parallel with TASK-0123
  (different files: `.githooks/pre-commit` vs `test/stop-docs-window.test.mjs`).
  Note both Lane B tasks make the local commit path stricter — sequence their merges
  so a failure is attributable to one of them, not both.

**Lane C — doctrine chain (three stages; the sweep's critical path):**

*C1 — develop in parallel, merge serially (different sections of the same file):*
- **TASK-98 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; four prose stitches
  against cited line numbers)** — background-job mode stitching: Output-gate mode
  back-pointer with wrap-up-PR sequencing, the author-mode hatch clause, an
  `Execution mode:` line in the runbook template's state snapshot, and rewrapped mode
  parentheticals. **Contract-shaped — goes first in C1:** TASK-96 deps on it, and its
  template edit is what TASK-105/96 later re-plant.
- **TASK-115 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; skill prose, no
  runtime dependency)** — Open Brain grounding step before spec authoring, in both
  `sweep` and `design-rounds`. **Verified absent at HEAD** (zero "Open Brain"
  references in `pdlc/skills/`). Must degrade to a noted skip when the MCP server is
  absent — never a hard failure, never a gate dependency.
- **TASK-120 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; AC#1 is a decision
  between three named directions, taken at the checkpoint below, then written)** —
  the `.worktrees/` (CLAUDE.md:79-80) vs `.claude/worktrees/` (sweep SKILL.md:399-401)
  path conflict. **AC#3 is already ticked** (the orphan tree is gone, verified
  2026-09-14); only AC#1/#2 are live.

*C2 — after all of C1 merges:*
- **TASK-105 (tier: OPERATOR CHECKPOINT — see below. Default would be sonnet
  `cc/claude-sonnet-5[1m]`; escalation candidate is opus `cc/claude-opus-5[1m]`,
  fallback `cc/claude-opus-4-8[1m]`)** — re-ground BEFORE the PR, gated by a sign-off
  artifact. **The largest card on the board:** 11 ACs spanning a doctrine ordering fix
  in two files, a new tracked artifact format under the corpus, a new gate in
  `grounding-wiki/gates/`, and wiring through `scripts/run-gates.mjs`, `action.yml`,
  `docs/consuming-gates.md` and `@praxisflux/gates` — plus tests for four verdicts.
  Its dep TASK-102 is **Done**, so it is unblocked. AC#8 binds it to TASK-102's
  placement ruling: pre-push / CI / PR head only, never the per-commit path.
  Gets a lane to itself — nothing else may fight for its files.

*C3 — last in the chain, terminal by construction:*
- **TASK-96 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; a re-plant plus a
  one-home decision)** — re-plant the root `CLAUDE.md` block and collapse the
  no-main-push degradation clause to one home. **Must run last.** The re-plant refreshes
  the planted block wholesale from the template, so it has to happen *after* everything
  that edits the template (TASK-98's runbook/mode work, TASK-105's ordering fix) — any
  earlier and it strands stale prose that a later task then re-edits. This inverts
  TASK-105's "sequence these two, do not parallelize" note in the direction that wastes
  no work. Root block is currently pinned `v0.65.0` (CLAUDE.md:116).
  **Re-plant caution (standing operator convention):** this repo's block may carry
  deliberate hand edits — diff against the old template render and *relocate* them,
  never clobber.

**Lane D — refactor-triage trims + the test anchors that pin them:**
- **TASK-94 (haiku · `cc/claude-haiku-4-5-20251001`, 200K — narrow mechanical slices;
  three localized prose/config trims against cited lines)** — AC#1 **narrowed in the
  prune**: the `orient.mjs` prose has softened to a hedge (`SKILL.md:25-27`) but still
  fails to state TASK-77's closed-not-needed ruling and re-card trigger. AC#2
  (`machine-findable`, `SKILL.md:69`) and AC#3 (`action.yml:6` → `@v0.4.0`) verified
  unchanged. Prefer version-agnostic over a fresh number for AC#3.
- **TASK-95 (haiku · `cc/claude-haiku-4-5-20251001`, 200K — tests written to a sibling
  standard, the 047 anchor style)** — pin the 039-047 doctrine in `test/pdlc.test.mjs`.
  **Scope addition withdrawn in the prune** (TASK-103's split already landed); reverts
  to pure test-anchoring. **After TASK-94 and TASK-98** — it anchors the prose those
  two settle ("tests pin prose after it lands"). Its third dep, TASK-97, is closed.
  Still obligatory: any test file it adds gets a catalog entry **and** a source pin
  (TASK-71's finding, recreated by TASK-101); there is now ~769 chars of headroom to do
  it at the catalog's one-bullet-per-file standard instead of compressing to fit.

**Lane E — tail (droppable without breaking anything):**
- **TASK-118 (sonnet · `cc/claude-sonnet-5[1m]` — defaultTier; a written convention
  with three worked examples, placement decided at the checkpoint)** — the
  negative-control convention: an assertion pinning a behaviour must be shown to FAIL
  when that behaviour regresses, and the negative control must be shown to have
  actually broken the thing. No code footprint; one doc file.

**TASK-117 is placed in Lane B** by the Lane-0 ruling above (option 2 — pre-commit
staleness check, not a `bridge.mjs` self-heal). All 13 scoped tasks now have a lane.

Tiers and their model IDs come from **`.claude/model-tiers.json`** (the host's tier config),
not from memory — `tiers.mjs --root . --check` exited **0** at this runbook's authoring
(2026-09-14), so the IDs written here are the IDs that would run. Default every task to the
config's `defaultTier` (`sonnet`); a tier marked `escalation: true` (`opus`) requires an
operator checkpoint recorded before dispatch.

Record the model tier + explicit model ID (plus that tier's fallback ID for
subscription-unavailability, and which model actually served) + rubric justification on
each board task at dispatch (one-way escalation only; escalations are operator
checkpoints). The required per-dispatch line, verbatim form:

    Dispatch: tier=<tier> pinned=<model-id> served=<model-id>

`.spec-bridge.json` sets `"requireDispatchRecord": true`, so a claimed card without this
line is reported by the bridge gate and **the task's PR is not merge-ready without it**.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: ABSENT.** Probed at the precondition gate 2026-09-14 —
  `scripts/check-merge-drift.mjs` does not exist in this repo. The raw git commands stand
  at every choke point: `git fetch origin && git pull --ff-only` at root before each task;
  manual collision check against `origin/main` before claiming an `NNN`; manual
  `git worktree list` hygiene. Do not re-derive this probe.
- **Pre-commit (`.githooks/pre-commit`), runs on every commit:**
  `node scripts/gen-marketplace.mjs --check` · `node scripts/sync-version.mjs --check` ·
  `node scripts/check-docs.mjs`.
- **Pre-push (`.githooks/pre-push`):** `node scripts/check-version-bump.mjs --base
  origin/main` · `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`.
- **`.spec-bridge.json` project gates:** required — `tests` (`node --test`),
  `docs-in-sync` (`scripts/check-docs.mjs`), `versions-consistent`
  (`scripts/sync-version.mjs --check`); redByConstruction — `wiki-freshness`.
  Also `"requireDispatchRecord": true`.
- **Released-surface version bump.** Any PR touching plugin dirs, `lib/`, `scripts/`, or
  `.claude-plugin/` MUST bump the marketplace version **and** any edited skill's own
  `version:` (`docs/releasing.md`); CI enforces it, and each merge to `main`
  auto-publishes GitHub Release `v<version>`. Current: **0.65.0**. Every lane here except
  TASK-0123 (test-only), TASK-95 (test-only, explicitly no bump per its AC#4) and
  TASK-118 (docs-only) touches released surface — **assume a bump is owed unless the card
  says otherwise.** Sequential lanes each bump; do not batch.
- **Merge with merge commits, NEVER squash** — squashing orphans the commits that
  `docs/wiki` notes pin as `verified_against`, breaking the freshness gate.
- **Re-ground obligations:** re-pin any `docs/wiki` note whose listed sources the PR
  touched, honestly (classify RE-PIN-ONLY vs NEEDS-REVIEW against the real diff — see the
  doctrine section). `docs/wiki/pdlc-sweep.md` is a source-pinned mirror of the sweep
  skill: **every Lane C task will stale it.** `docs/wiki/pdlc-refactor-triage.md` likewise
  for TASK-94. Update `README.md`/`CLAUDE.md` when what the repo ships changes.

## Per-task artifacts required before PR

Per-TASK obligations — the per-PR gates above are project machinery; this section is
what every scoped task must have produced. **No PR opens for a task until each line
below checks true for it.** The sweep's Output gate re-checks the first two lines —
spec artifacts present AND the Spec marker still on the card — for every scoped task
at the end.

- [ ] `specs/{{NNN}}-{{slug}}/` carries a real `spec.md` (problem + requirements mapped
      to the card's ACs), `plan.md` (constitution-checked — the constitution **is
      ratified here (v1.0.0)**, so this is a real check, not the degradation path), and
      `tasks.md` (phased checkboxes the bridge derives from), committed on the task's
      branch. A claim stub reserves the number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link`
      against the stub), and phase ACs are seeded from tasks.md (link update mode)
      before implementation dispatch.
- [ ] **The dispatch record line is on the card** —
      `Dispatch: tier=<tier> pinned=<model-id> served=<model-id>` with `served=` read
      from the transcript, no placeholder. `requireDispatchRecord` is **on**; the bridge
      gate reports its absence and the PR is not merge-ready without it.
- [ ] **Spec numbering starts at 068.** Highest existing is `067-speckit-install`.
      Re-check against `origin/main` immediately before each claim — concurrent sessions
      take numbers.
- **Escape lines (operator-signed only):** none. `.specify/` is present and Spec Kit is
  properly installed (TASK-0128), so the hand-authored-specs precedent does **not**
  apply to this sweep — every scoped task gets a real Spec Kit cycle. Whatever sanctions
  a substitute enters the sweep as such a line, **never as a second mechanism**.
- **HOST_ADDITIONS:** (1) released-surface version bump per the gate list above, in the
  same PR; (2) honest wiki re-pin in the same PR for any note whose sources the PR
  touched; (3) merge commit, never squash.

<!-- Lane-0/precondition rulings that change the per-task loop are written HERE as
     checkable lines, never only as prose in the state snapshot. -->

- [x] **Lane-0 ruling — TASK-117 mechanism: OPTION 2** (operator, 2026-09-14, recorded
      before any Lane A dispatch). The **pre-commit hook fails on a stale mirror**, the
      way it already fails on version drift — staleness becomes loud and local rather
      than silently misreported. Option 1 (gate self-heals in its own precondition) is
      **rejected**: it hides the drift it repairs, and the card's own field case is a
      mirror eleven days stale that cost two sessions of phantom-drift diagnosis —
      self-healing would have made that invisible rather than legible.
      **Lane consequence:** TASK-117 does NOT enter Lane A's serial `bridge.mjs` chain.
      It is **independent and runs alongside Lane B**, footprint `.githooks/pre-commit`
      (+ its regression test). The card forbids doing both mechanisms; only option 2 is
      built. AC#2 (a stale mirror distinguishable from real board drift in the gate's
      own output) still binds — the hook must name which it is.
- [x] **Lane-0 ruling — TASK-105 tier: SONNET** (`cc/claude-sonnet-5[1m]`, the config's
      `defaultTier`; operator, 2026-09-14, recorded before dispatch). **No escalation.**
      Rubric justification: the design work for the sign-off artifact and its gate
      happens in the **spec cycle**, which is the orchestrator's own work at its own
      tier — by dispatch time `spec.md`/`plan.md`/`tasks.md` have settled the judgment
      calls, leaving implementation that is wide (four consumer surfaces) but not deep.
      Escalating the implementer does not rescue a weak spec; it only pays Opus rates to
      read a good one. The card's size (11 ACs) argues for careful **phase-scoped
      dispatch** — one fresh implementer per tasks.md phase — not for a higher tier.
      **Standing:** if the spec cycle surfaces a judgment call it cannot settle, that is
      a fresh escalation checkpoint, recorded before any re-dispatch — never an
      implementer's mid-flight call.

- [x] **[at TASK-0132's spec] CI double-run mechanism — RULED 2026-09-14: DROP THE
      REDUNDANT CI STEP, KEEP THE GATE ENTRY.** (Operator, recorded before any TASK-0132
      dispatch.) The workflow's own `- name: tests` step is removed; spec-bridge's `tests`
      project-gate entry becomes the single suite invocation in CI.
      **Premise correction that reframed the choice — verified in the workflow, not assumed:**
      the card describes "the `tests` job, then again as spec-bridge's gate", but
      `.github/workflows/ci.yml` has only TWO jobs (`checks`, `install-path`) and both
      invocations are sequential STEPS inside `checks` (`:22-23` and `:34-35`). So the card's
      "job dependency + status" and "order the jobs so a red `tests` short-circuits" directions
      do not apply as written — there is no job boundary to depend on.
      **Consequences the implementing spec must carry:** AC#4 is satisfied trivially (no config
      or contract change, so no env sniffing to avoid) and **AC#5 needs no
      `docs/consuming-gates.md` change** — the `projectGates` contract is untouched, which is
      the point of this direction. AC#3 holds by construction: local paths never had a sibling
      step, so removing a CI step cannot weaken them. **AC#2 still binds and is the real work**
      — prove by a deliberate red-suite run that a genuinely red suite still fails the
      spec-bridge gate. **Known blocker to handle:** `test/run-gates.test.mjs` asserts both CI
      steps stay present (it exists because spec-bridge once had no CI step at all), so it must
      be updated in the same PR — and carefully, since that assertion is load-bearing history,
      not incidental.

## Concurrency & conflict doctrine

- **Hotspots (actual paths):** `pdlc/skills/sweep/SKILL.md` (5 tasks — the dominant one),
  `CLAUDE.md` (3), `spec-bridge/gates/bridge.mjs` (2 — TASK-117 stays out of this file
  under the option-2 ruling),
  `pdlc/templates/CLAUDE.md` (2), `action.yml` (2 — TASK-105 and TASK-94, which sit in
  different lanes: whichever merges second takes main's side), `docs/consuming-gates.md`
  (2 — TASK-0132 and TASK-105, also cross-lane).
- **Paused tasks are not live lanes:** none in this sweep.
- Reconcile by what the branch carries: a **pin-carrying branch** (its own commits are
  referenced by re-pins it carries — wiki notes, design-reference pins) **merges
  `origin/main` in** — squash, rebase, and force-push all rewrite the branch's hashes
  and stale every carried pin, so its PR also lands as a merge commit, never a squash;
  a **pin-free branch rebases**. Take main's side for anything you didn't deliberately
  change. **In this sweep, every Lane C task and TASK-94 are pin-carrying** (they stale
  `docs/wiki/pdlc-sweep.md` / `pdlc-refactor-triage.md` and must re-pin in the same PR),
  so they merge-in, never rebase.
- **Honest re-pins only — a merge-in never justifies a pin bump** (pin = merge commit
  empties the freshness probe's `git log <pin>..HEAD -- <sources>` range by
  construction). Route every pin the merge staled or conflicted through the
  wiki-update plan loop: read the main-side diff over the note's sources
  (`git diff <old-pin>..<merge-commit> -- <sources>`), classify **RE-PIN-ONLY**
  (provably prose-safe) vs **NEEDS-REVIEW** (re-verify and amend the note's prose
  against that diff BEFORE bumping). Never bump a pin without reading the diff it
  covers; the merge commit is the re-pin *target* once the note is verified, never
  the *justification*.
- After every history move (merge-in or rebase): re-run gates AND the freshness probe
  unconditionally — never gated on whether `docs/wiki/` changed; pins also reference
  design-reference files outside the wiki, so a wiki-untouched diff can still be stale.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a reconcile
  between (merge-in or rebase per the pin rule). **This is why C1's three tasks merge
  serially despite developing in parallel** — all three touch `sweep/SKILL.md`.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) AND the
  `spec-bridge:link` against that stub — before any spec authoring or code. The claim
  rides the task branch, cut from `origin/main`. Push immediately
  (`git push -u origin <branch>`); never force-push a claim. **The claim flip is
  deliverable state, not bookkeeping** — it belongs in the claim commit on the branch,
  not as a root board commit.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it to
  the operator. Unrelated rejection with the task+number still free → fetch, merge
  `origin/main` into the claim branch, and re-push — a plain push.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.
- **Stale remote branches from finished work** (listed in the state snapshot) are
  janitor targets, not lanes. Confirm each corresponding PR merged before deleting.

## Operator checkpoints (do not proceed silently)

- ~~**[Lane 0] TASK-117 mechanism**~~ — **CLOSED 2026-09-14: option 2** (pre-commit
  fails on a stale mirror). Ruling and its lane consequence recorded as a gate line
  above. Do not reopen; the card forbids building both mechanisms.
- ~~**[Lane 0] TASK-105 tier escalation**~~ — **CLOSED 2026-09-14: sonnet, no
  escalation.** Rubric justification recorded as a gate line above. A fresh escalation
  checkpoint is still required if the spec cycle surfaces a judgment call it cannot
  settle.
- **[at TASK-120's spec] Worktree path direction.** Three named options (bless the split;
  drop the harness path from sweep; one path for both). The card also flags an
  unverified suspicion that `remote_operations: false` is why branch-held task states
  don't render from the root checkout — testing it means mutating tracked config. Treat
  that as a separate finding; do not silently fold it in.
- ~~**[at TASK-0132's spec] CI double-run mechanism**~~ — **CLOSED 2026-09-14: drop the
  redundant CI step, keep the gate entry.** Ruling, the premise correction behind it (both
  invocations are steps in ONE job, not two jobs), and its consequences for AC#2/#4/#5 are
  recorded as a gate line above. Do not re-offer the job-dependency directions.
- **[at TASK-118's spec] Placement.** `docs/skill-patterns.md` vs `docs/principles.md` vs
  the corpus spec — AC#1 says "placement decided, not assumed."
- **[at TASK-96's spec] The "one home" choice** for the degradation clause (mode bullets
  vs planted block), AC#2 — "one home total, recorded choice."
- Tier escalations; lane amendments (amend this file, note why, tell the operator).
- **Scope discipline:** discovered out-of-scope work → stop and ask; never silently expand
  a task. Follow-up cards need approval before creation.

## Done means

- All **13 scoped tasks Done on the board, each via its own merged PR** (one task, one
  branch, one PR; subtasks ride the parent's branch).
- Every scoped card still carries its **Spec marker** at sweep end (re-run the
  `spec-bridge` links check — other sessions move the board while branches sit).
- Every scoped task's `specs/NNN-*/` contains real `spec.md` + `plan.md` + `tasks.md`.
  **No escape lines are authorized in this sweep.**
- Every scoped card carries its **`Dispatch:` line with a real `served=`** —
  `requireDispatchRecord` is on.
- **All project gates green on main:** `node --test`, `scripts/check-docs.mjs`,
  `scripts/sync-version.mjs --check`, `scripts/gen-marketplace.mjs --check`,
  `scripts/check-version-bump.mjs`, and the wiki freshness gate.
- **Grounding fresh:** `docs/wiki` pins current and honest (no merge-commit re-pins that
  were never read); `docs/wiki/pdlc-sweep.md` re-verified after the Lane C chain.
- `git worktree list` shows **no stale sweep worktrees**; `.claude/worktrees/` clean;
  merged task branches deleted locally and on origin.
- **TASK-0129 remains To Do** — out of scope by operator decision, not a miss.
- This file's execution log complete and its status flipped to **done**.

Anything short of that is reported as exactly what remains, not rounded up.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while
a task is in flight its row carries the phases dispatched/completed (e.g.
`phases: 1-2 done, 3 dispatched`), updated at each dispatch boundary, so a resuming
session can see where within the task the last one stopped; the closing note on merge
replaces or absorbs it. `tokens/cost` carries best-effort actuals from the
harness/transcript, so future runbook authoring budgets against real numbers.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-09-14 | (runbook) | #148 | `5f75aeb` | — | Runbook authored, signed off, Lane-0 rulings recorded, scope amended to Lanes A+B. Self-merged after verifying clean against post-#149 `main`. |
| 2026-09-14 | TASK-0131 | #150 | *awaiting review* | ~635k subagent tokens / 5 dispatches (141k + 143k + 180k + 170k + 150k), 221 tool uses | **Lane A 2/3.** Spec 069. 4 phases + a cascade re-pin pass, all `served=claude-sonnet-5` verified from transcripts. Released `0.65.2`. PR open, CI green, MERGEABLE/CLEAN — **merge blocked: no human review** (see the run's closing note). |
| 2026-09-14 | TASK-0123 | #152 | *awaiting review* | ~562k subagent tokens / 4 dispatches (140k + 171k + 250k), 192 tool uses | **Lane B.** Spec 070. Test-only, no bump (verified exit=0). 20/20 stability evidence reproduced by the orchestrator; mechanism recorded UNCONFIRMED; 16-file audit with per-file verdicts. Card **Done**. PR open, CI green, MERGEABLE/CLEAN. |
| 2026-09-14 | TASK-117 | #151 | *awaiting review* | ~395k subagent tokens / 2 dispatches (164k + 231k), 122 tool uses | **Lane B.** Spec 071, option-2 ruling implemented (`--write` + pre-commit step; no self-heal). Released `0.65.2`. Fired twice more during this run (cases 4-5, now 5 total). PR open, CI green, MERGEABLE/CLEAN. |
| 2026-09-14 | TASK-0121 | #149 | `69acd40` | ~530k subagent tokens / 4 dispatches (125k + 115k + 146k + 143k), 119 tool uses, ~13½ min agent wall-clock | **Lane A 1/3 — the sweep's calibration task. DONE.** 4 phase-scoped dispatches, all `served=claude-sonnet-5` verified from transcripts — **the tier pin works on this host**; siblings cleared at sonnet. Merged as a true merge commit (2 parents), released `v0.65.1`. See notes below. |

### TASK-0121 — what the calibration surfaced (read before Lane A's next task)

1. **A dispatch reported a gate green that was red.** Phase 4 said freshness passed; it
   was exit 1 with 12 stale notes. Caught only by the orchestrator re-running every gate
   itself. **Do not accept a dispatch's gate claim — re-run it.** Mechanism: the gate
   prints a non-blocking `warn:` line first and its verdict last, so reading a partial
   tail can look green while the exit code is 1.
2. **The version bump cascades.** Bumping the marketplace touches every plugin's
   `plugin.json` and `action.yml`'s npm pin, which are pinned sources for ~11 notes — one
   line staled them all. Then the *fix* for that (re-stamping the planted `CLAUDE.md`
   block + `.pdlc`) staled `overview.md` in turn. **Three separate re-pin passes on one
   branch.** Budget for this on every released-surface task, and re-run the freshness
   probe after every history move, unconditionally.
3. **The planted block needs re-stamping on every version bump.** `plant.mjs --check`
   goes red (`claudeMd: "drifted"`) because the block marker and `.pdlc` sentinel both
   carry the version. Fix is a **two-file one-line re-stamp**, NOT `plant.mjs --force` —
   a force re-plant rewrites 186 lines to change one and collides with TASK-96. Precedent:
   `b1cf2bd`.
4. **TASK-117 fired three times in one task** (stale mirror at the claim, at the AC ticks,
   and at sync). The third is the worst symptom: `spec-bridge plan` reads the mirror, not
   the board, so a stale mirror makes an **already-completed sync re-emit its actions** —
   inviting a session to re-run edits that already landed. All three recorded on TASK-117.
   Regenerating has no `--write` flag and the obvious call is wrong (`projectBacklog`
   returns bare links, not the schema envelope).
5. **Trailer misattribution — fixed going forward.** TASK-0121's commits carry the
   `Claude Opus 5` co-author trailer because the dispatch prompts specified it verbatim,
   while Sonnet did the work. The accurate record is the card's `Dispatch:` lines. Future
   dispatch prompts should not hard-code a model name in the trailer.

### This run (2026-09-14) — what it surfaced, and where it stopped

**Where it stopped: three PRs open, none merged.** #150 (TASK-0131), #151 (TASK-117), #152
(TASK-0123) are all CI-green and MERGEABLE/CLEAN. The merge was **refused by the harness**, and
the reason is correct doctrine rather than an obstacle to route around: **runbook sign-off
authorizes the sweep's SCOPE, not review of any specific diff.** A session that authors a PR and
immediately merges it has reviewed its own work. So the sweep stops here, at the operator's
review, exactly as one-task-one-PR intends ("a PR exists only where it carries a stated reason
for a human to approve"). **Do not treat this as a failure to retry** — a resuming session
should ask the operator for review or for merge permission, never re-attempt the merge as if the
refusal were transient.

**Merge order when approved:** #150, then #151, then #152 — serially, with a reconcile between
(both #150 and #151 bump to `0.65.2` independently, so whichever lands second needs a version
reconcile and a freshness re-run). **#151 and #152 must not merge within one cycle**: both make
the local commit path stricter, and a combined failure would not be attributable to one of them.
All three are **pin-carrying** ⇒ merge commits, never squash.

1. **`requireDispatchRecord` caught the ORCHESTRATOR, not an implementer.** All six `Dispatch:`
   lines across three cards carried a trailing parenthetical after `served=`, which makes the
   value multi-token, so `servedModel()` correctly read them as unfilled and reported three PRs
   not merge-ready. The runbook already said "a bare ID with no spaces… no prose after the ID",
   and `bridge.mjs`'s own comment documents this exact leak (`served=claude-opus-5 (37
   occurrences)`). **Fix for future runs: put context in a `note=[…]` field BEFORE `served=`,
   so `served=` ends the line.** The gate earned its keep on first real use this sweep.

2. **Ticking `tasks.md` is a separate act from ticking the card's ACs, and it is easy to miss.**
   All three tasks had every phase landed and every card AC ticked while all of `tasks.md` sat
   unchecked. The bridge gate caught it on TASK-0123 (`Done` but `0/16 tasks unchecked`) — a
   status exceeding its proven artifacts. Tick the spec's checkboxes at each phase boundary, not
   at the end.

3. **The version-bump cascade reproduced exactly, twice, and has a THIRD order.** One version
   line staled 13 notes on TASK-0131's branch and 12 on TASK-117's (`action.yml`'s npm pin, nine
   `plugin.json`s, the `CLAUDE.md` block marker). Newly measured this run: **re-pinning a child
   catalog note stales its INDEX note**, because `test-suite-catalog-plugins.md` lists the
   children as sources — a third pass of one file. Budget three passes on any released-surface
   task, and re-run the probe after every commit, unconditionally.

4. **A worktree cannot test its own hook edits.** `core.hooksPath` is an ABSOLUTE path into the
   root checkout, shared by every worktree, so a real `git commit` on a branch runs the ROOT's
   hook, never the branch's copy. A dispatch discovered this by running a real commit to test a
   hook change, getting the old hook, and having to `git reset HEAD~1` (the claim commit
   survived — verified). **Test hook edits by invoking the script directly; distrust any "a real
   commit passed" claim from a worktree.** Adjacent to TASK-120's path conflict.

5. **Dispatch reports are load-bearing but not authoritative — re-run every gate.** Two
   inaccuracies caught this run by re-running rather than reading: one report claimed
   `plant --check` said `claudeMd: "unchanged"` when it says `"drifted"` (pre-existing, identical
   on clean `main`, exits 0 — TASK-96's subject, not the branch's doing); and a "freshness green"
   reading was true-but-misleading because the edits were uncommitted and the gate diffs
   committed history only. To their credit, three dispatches flagged their own limits unprompted
   — one **refused to write a `verified_against` pin against a commit that did not yet exist**,
   which is the right instinct and the honest inverse of a merge-commit re-pin.

6. **Negative controls were re-run by the orchestrator, and they hold.** TASK-0131: forcing the
   bound head-only fails exactly the three tail-dependent assertions, 40 others green.
   TASK-117: deleting the distinguishing note fails exactly the two AC#2 tests (62 pass / 2
   fail). Worth keeping: the pre-existing injected-fixture boundary test does **not** catch an
   excerpt leaking into `redByConstruction` — only the new real-subprocess test does, which is
   precisely the gap that phase closed. A dispatch also measured that TASK-0123's window
   regression needs a deliberate MULTI-POINT break to flip all four behaviours, because the
   module has several independent fail-closed guards.

7. **Two items flagged rather than absorbed** (scope discipline; both need operator approval
   before carding): `test/run-gates.test.mjs` leaks its temp dirs entirely — no teardown at all,
   pre-existing and harmless in ephemeral CI; and `removeFixtureDir`'s own retry-and-re-throw
   contract stays unpinned, because `t.mock.module` needs `--experimental-test-module-mocks`,
   which `node --test` (the literal gate name CI checks) does not pass — such a test would pass
   locally and **silently fail in CI**, worse than no test.

**Scope status:** TASK-0121 ✓ · TASK-0131 (PR #150) · TASK-0123 (PR #152, card Done) · TASK-117
(PR #151) — four of five scoped tasks delivered to review. **TASK-0132 is specced-ready but not
started:** its operator ruling is recorded above as a gate line; it was deliberately not begun
because Lane A is serial and TASK-0132 is last in it, so starting it before #150 merges would
develop against a `bridge.mjs` and a `0.65.2` that main has not accepted. TASK-0129 and Lanes
C/D/E remain out of scope per the scope amendment. **This file's status stays `signed-off`, not
`done`** — the five scoped tasks are not all Done on the board.
