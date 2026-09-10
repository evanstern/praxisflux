# Close the dispatch gap (TASK-0125) — sweep runbook (2026-09-10)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through praxis's full PDLC — claim → spec → link → worktree → **delegated**
implementation → PR → merge → re-ground. Direction is decided; do not re-litigate it:
`backlog task view TASK-0125 --plain` (comments #1 and #2, the amended triage) and
`docs/design/lane-4-dispatch-gap.md` win. Plan-of-record is the board; this file carries
only ordering, doctrine, and the log.

**The irony is load-bearing:** this runbook exists to close a gap where an orchestrator
implemented inline instead of dispatching. A session that authors this runbook and then
implements TASK-0125 itself has reproduced the very defect the task fixes. **Dispatch it.**

**Status:** signed-off · operator sign-off on lanes: 2026-09-10 (lanes approved; spec 066
confirmed; R3b ruled — see its AMENDED gate line: the ruling's intent stands, but the
"breaking change" premise it was ruled on was wrong and is withdrawn per the F1 correction)

## Read first (in this order)

1. `backlog task view TASK-0125 --plain` — direction source. Comment **#2 supersedes #1**:
   fixes 1/2/3/5 adopted, **fix 4 (the inline carve-out) REJECTED and recorded as rejected**.
2. `docs/design/lane-4-dispatch-gap.md` — the full root-cause analysis. Its "What will close
   it" section is the amended, authoritative set.
3. `docs/wiki/CAPSULES.md` for orientation; then **only** `docs/wiki/pdlc-grounding-block.md`
   and `docs/wiki/pdlc-sweep.md` just-in-time — their sources are the files this task edits.
4. `docs/design/lane-4-handoff.md` — the artifact whose shape produced the miss (fix 5's
   subject). Read its opening to see what a handoff that does NOT assign a role looks like.
5. `docs/releasing.md` + `docs/skill-patterns.md` — released-surface and authoring rules.

## State when this runbook was written (2026-09-10)

- **Done already:** the TASK-108 epic and its sweep closed (`d0f1aa7`); `docs/design/
  lane-4-dispatch-gap.md` is on `main` (rode PR #140, merged `fbe5b4c`). Operator triage
  of the candidates is complete — **AC #5 is already ticked on the card.**
- **In flight in other sessions (do not duplicate; expect their merges):** the
  **sweep-cost offload sweep** — `docs/design/sweep-cost-offload-runbook.md`, signed off
  `390ca61`, executing **TASK-0126 / TASK-0124 / TASK-0127** against specs **063/064/065**.
  Shares this lane's hotspots; see **F4**. No board task was In Progress at authoring, so
  their claims had not landed yet.
- **Paused — untouched:** none.
- **Queued (this runbook's scope):** TASK-0125, single task, single lane.
- **Root state:** `main` at **`390ca61`**, clean, marketplace **v0.63.0**. (Authoring began
  at `d0f1aa7`; `origin/main` advanced by the two sibling-runbook commits mid-authoring —
  this snapshot is the re-verified state.)
- **Precondition probes run at authoring:**
  - `.specify/` **ABSENT** → the hand-authored-specs escape line applies (see below).
  - `scripts/check-merge-drift.mjs` **ABSENT** → raw git commands stand; no drift-gate
    choke points in this sweep.
  - `node pdlc/scripts/tiers.mjs --root . --check` → **exit 0**, all three definitions
    `unchanged`. **Nothing was regenerated, so no session restart is required** before
    dispatching.
  - `node pdlc/scripts/plant.mjs --root . --peer backlog --check` → `claudeMd: "drifted"`,
    **exit 0**. See finding **F1**.

## Findings at authoring (checkable, not prose)

**F1 — praxis's own planted block is 6 versions stale, and NOTHING RUNS THE CHECK THAT
WOULD SAY SO.** `.pdlc` records `version: 0.57.0`; the marketplace is at **v0.63.0**.

**CORRECTED 2026-09-10, before dispatch.** An earlier version of this finding (and of
ruling R3b below) claimed `plant --check` "reports `drifted` but exits 0". **That was a
measurement error by the runbook's author** — the probe piped node's output to `head`, so
the shell reported `head`'s exit status, not node's. Measured correctly,
`node pdlc/scripts/plant.mjs --root . --peer backlog --check` **exits 1** on this repo's
drifted block, and `plant.mjs:324` has carried
`if (check && pending) process.exit(1)` — with `pending` including
`claudeMd !== "unchanged"` and `modeSwitch === "drifted"` — all along.

**The actual gap is narrower and is about invocation, not exit codes:** nothing ever runs
`plant --check`. It appears in no CI workflow, no git hook, and not in
`scripts/check-docs.mjs` (verified by grep over `.github/`, `.githooks/`, `scripts/`). A
working gate that no surface invokes is why this repo drifted six versions unnoticed.

The defect shape still rhymes with the dispatch gap — written doctrine, detectable state,
nothing that forces the check — but the fix is **wiring an existing check**, not changing
its contract. **A drifted block is still why AC #6 exists:** a template edit that is not
re-planted leaves this repo running doctrine it no longer ships.

**F2 — there is NO lane-handoff template in the repo.** `docs/design/lane-4-handoff.md`
and `docs/design/jira-board-handoff.md` are hand-authored one-offs.
`docs/handoff-protocol.md` + `lib/handoff.mjs` are the **inter-plugin `.handoff/`
transport** — a different mechanism entirely; do not conflate them. So AC #2/#5 require
**creating** a lane-handoff template, not editing one. Its natural home is
`pdlc/skills/sweep/templates/`, beside `runbook.md`.

**F3 — the dispatch record is mechanically readable today; fix 3 needs no new surface.**
`parseLinkedTask` (`lib/board-mirror.mjs:361`) already parses a linked card's raw text and
frontmatter, and `checkBridge` already walks every linked card. A dispatch-record line on
the card is therefore checkable by the gate that already reads it — exactly what comment
#2 claimed when it chose the board-task record over the runbook execution-log line. Author
fix 3 against `spec-bridge/gates/bridge.mjs` + `lib/board-mirror.mjs`; **do not invent a
new gate script.**

**F4 — a SIBLING SWEEP is in flight and shares this sweep's hotspots.**
`docs/design/sweep-cost-offload-runbook.md` (signed off 2026-09-10, `390ca61`) is executing
**TASK-0126 → TASK-0124 → TASK-0127**. Consequences that bind this lane:

- **Spec numbers 063, 064 and 065 are RESERVED** by that runbook (063
  `structured-offload-seam`, 064 `read-size-gate`, 065 `wiki-triage-offload`) even though no
  `specs/063-*` dir exists on `main` yet. **This lane takes 066.** Verify again at claim.
- **Guaranteed version-file conflict.** Their runbook names
  `.claude-plugin/marketplace.json` + every `*/plugin.json` version field as a hotspot all
  its PRs collide on "by construction" — and this PR bumps the same lockstep version. Also
  shared: **`CLAUDE.md`** (their check-docs sync vs. this lane's re-plant) and
  `docs/wiki/` pins.
- **Merge order: the SMALLER PR merges first, regardless of whose it is.** Expect to
  reconcile (merge `origin/main` in — this branch is pin-carrying) at least once, possibly
  three times if all their PRs land during this lane. Re-run tests + `check-docs` + the
  freshness probe after **every** merge-in.
- **Do NOT touch their branches, worktrees, or spec dirs.** Their tasks are not this
  sweep's scope; TASK-0125 is not in theirs.
- Corroboration worth noting: their runbook independently records the same
  hand-authored-specs escape line, confirming this host's `.specify`-absent precedent.

## Operator rulings (2026-09-10) — these SUPERSEDE the card's sequencing note

**R1 — ONE PR, all four fixes.** The card's comment #1 said "3 changes enforcement and
should be specced separately." The operator ruled otherwise at sign-off: fixes 1, 2, 5 and
**3** ride **one spec dir, one branch, one PR**. One TASK = one PR, and TASK-0125 is one
task. The prose fixes and the enforcement fix land together.

**R2 — re-plant in the SAME PR.** AC #6's re-plant of `CLAUDE.md` and the
`pdlc-grounding-block` re-pin ride this PR, not a follow-up. Per F1 the repo is already
6 versions behind; shipping a template edit without re-planting would widen that gap in
the very repo the task is fixing.

**R4 — SEQUENCING (follows from R3b + F1).** Wiring `plant --check` into any always-run
surface while this repo's own block is drifted would land a gate that fails praxis
immediately. So within this task: **re-plant `CLAUDE.md` (R2) BEFORE wiring the check**,
and let the implementer's tasks.md phases reflect that order. A green suite at the end of
the task is the check that this held. (Unchanged by the F1 correction — the ordering
constraint comes from praxis being drifted, not from any exit-code change.)

**R3 — the downstream upgrade path is IN SCOPE.** Raised by the operator mid-authoring:
*"We may need an upgrade path if we are changing CLAUDE.md planted version — all downstream
dependants will need a way to update. Please fold that in, if necessary along with
instructions on how to do such an update."* Ruling: **in scope for this PR.** The
mechanism already exists (re-run `pdlc:bootstrap` → drift → diff → consent → `--force`;
`.pdlc` stamps the planted version) — what is missing is **discoverability and
enforcement**: `docs/releasing.md` never mentions re-planting, CI never runs
`plant --check`, and a stale block is silent (F1). See the dedicated gate lines below.

## Execution lanes (single lane, single task)

**Lane 1 — TASK-0125, the only task:**

- **TASK-0125 (`opus` tier · model `cc/claude-opus-5[1m]`, fallback `cc/claude-opus-4-8[1m]`
  — ESCALATION, operator checkpoint recorded here at sign-off)** — close the dispatch gap:
  fixes 1, 2, 5 (planted block + lane-handoff template + role-first opening), fix 3 (the
  merge-ready dispatch record), the fix-4 rejection record, the re-plant + re-pin, and the
  downstream upgrade path (R3).

**Escalation justification (required, recorded BEFORE dispatch per the tier rubric):**
`opus` is marked `escalation: true` in `.claude/model-tiers.json`, scoped to *"design work,
cross-surface doctrine, anything with a real judgment call the spec does not already
settle."* This task is **cross-surface doctrine by definition** — it rewrites the always-on
planted block that binds every PDLC host, creates a new template genre, and adds an
enforcement rule to a shipped gate. The precedent is exact and cited in the card's own
comment #2: `docs/design/sweep-cost-levers-runbook.md` dispatched **TASK-86/87/88 — pure
doctrine prose edits — to an opus implementer rather than inline.** The repo's history
already settles that doctrine work is dispatched, and dispatched at this tier.

**Dispatch target:** the generated agent definition **`opus-implementer`**
(`.claude/agents/opus-implementer.md`, frontmatter `model: cc/claude-opus-5[1m]` — verified
`unchanged` by `tiers.mjs --check` at authoring). Pass the model ID on the dispatch call
too, but **verify the served model from the first dispatch's transcript before launching
any sibling** — on this host the frontmatter pin is authoritative and the bare ID/alias are
rejected.

**Record on the card at dispatch:** tier + model ID + this justification + **which model
actually served**. That record is not bookkeeping here — under fix 3 it becomes the very
artifact this task makes load-bearing, so TASK-0125 must satisfy its own new rule.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: ABSENT** (no `scripts/check-merge-drift.mjs`). Raw git: `git fetch
  origin && git pull --ff-only` at root before starting; confirm the branch sits on current
  `origin/main` before merging.
- `node scripts/check-docs.mjs` — the repo's docs gate. Run in the worktree before the PR;
  it also runs in CI, in the pre-commit/pre-push hooks, and in the `scripts/stop-docs.mjs`
  Stop hook, which **refuses to end a turn while it fails**.
- **Wiki freshness gate** — `node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness`.
- **Released-surface version bump (`docs/releasing.md`, CI-enforced):** this PR edits
  `pdlc/` and `lib/`/`spec-bridge/`, so it **MUST** bump the marketplace version AND any
  edited skill's own `version:`. Currently v0.63.0.
- **Full test suite** — `npm test`. Fix 3 touches `spec-bridge/gates/bridge.mjs` and
  `lib/board-mirror.mjs`, both heavily covered; new behavior needs new tests.
- **Merge with a merge commit, never squash** — squashing orphans commits that
  `docs/wiki/` notes pin as `verified_against`.

## Per-task artifacts required before PR

**No PR opens for this task until each line below checks true.**

- [ ] `specs/066-dispatch-gap/` carries a real `spec.md`, `plan.md`, and `tasks.md`
      (phased checkboxes the bridge derives from), committed on the task's branch. **066 is
      the next free number — 062 is the highest on disk, but 063/064/065 are RESERVED by
      the sibling sweep (F4). Re-check before claiming; other sessions take numbers
      constantly.**
- [ ] The card carries its `Spec: specs/066-dispatch-gap` marker **from the claim commit**
      (`spec-bridge:link` against the stub), with phase ACs seeded from tasks.md (link
      update mode) **before** implementation dispatch.
- [ ] **The card carries a dispatch record** naming tier + model ID + justification + the
      model that actually served. Per R1 this task implements the rule that makes this
      mandatory, so it must comply with it.
- [ ] **AC #4 lands as a POSITIVE artifact, not an omission.** "REJECTED, recorded as
      rejected" is only satisfied by written text stating the inline carve-out was
      considered and refused, with its reasoning (`docs/design/lane-4-dispatch-gap.md`
      already carries it; the planted/template surface must not contradict it). Silence
      does not tick this box.
- [ ] **AC #3's sufficiency test:** the dispatch-record rule **fails closed** — no record,
      no merge-ready. A change that merely documents the expectation does not tick it;
      there must be a check that reports a missing record.
- [ ] **R3a (upgrade path — instructions).** A downstream host must be able to find out
      *how* to update a stale planted block without reading `plant.mjs`. Land a written
      upgrade path — `docs/releasing.md` is the natural home (it is the released-surface
      doc and today says **nothing** about re-planting) — carrying the concrete sequence:
      update the plugin → re-run `pdlc:bootstrap` → the block reports `drifted` → **diff
      it** → consent → re-plant with `--force`; note that `.pdlc` stamps the planted
      version so `<planted version> < <plugin version>` is the staleness test, and that
      **user edits belong OUTSIDE the markers** or a re-plant discards them.
- [ ] **R3b (upgrade path — enforcement). AMENDED 2026-09-10 per the F1 correction:
      the exit code ALREADY does this. WIRE IT, don't change it.** The operator's ruling
      stands in intent — *"yes, we need to stop the bleed"* — but the mechanism it was
      ruled on was misdescribed to them by this runbook's author. `plant --check` **exits
      1** on a drifted block today (`plant.mjs:324`; `pending` covers
      `claudeMd !== "unchanged"` and `modeSwitch === "drifted"`). So:
      - **Do NOT change `plant --check`'s exit-code contract** — it is already correct.
        There is **no breaking change**, and the obligations that rode that false premise
        (a breaking-change bump, a "downstream CI may start failing" warning) are
        **WITHDRAWN**. Do not implement them.
      - **The real work is invocation: make some surface actually RUN it.** Nothing does —
        verified by grep over `.github/`, `.githooks/`, `scripts/`: not
        `.github/workflows/ci.yml`, not a git hook, not `scripts/check-docs.mjs`. A working
        gate no surface invokes is exactly why this repo drifted six versions unnoticed.
        Wire it where this repo's other doctrine checks already live.
      - **Sequencing (R4) still binds:** praxis's own block is drifted right now, so wiring
        the check before the re-plant lands would fail the repo's own suite. Re-plant first.
      - **Verify the failure line names the fix** (re-run `pdlc:bootstrap`; diff; re-plant
        with `--force`) per this repo's gate convention. Adding that if absent is in scope.
      - **`--check` must remain read-only** — no sentinel advance, no write. Confirm; do
        not "improve" it.
      - Tests: a drifted block fails the newly-wired surface, a clean one passes. **Do not
        write a test asserting a behavior change that isn't happening.**
- [ ] **R3c — this is the SAME defect shape as the task's subject; keep them distinct.**
      A stale planted block and a skipped dispatch are both *written doctrine with no
      residue a gate enforces*. The fix for R3 must not be folded into fix 3's
      dispatch-record check — they are separate rules over separate artifacts. Note the
      parallel in the spec's rationale; do not merge the mechanisms.
- **Escape lines (operator-signed only):** **TASK-0125: hand-authored spec set per this
  host's established precedent — `.specify/` is absent and all 62 existing `specs/NNN-*`
  dirs are hand-authored — signed operator 2026-09-10.** This is the sole sanctioned
  substitute; there is no other path to a skipped spec set.

## Concurrency & conflict doctrine

- **Hotspots this task owns:** `pdlc/templates/CLAUDE.md`, `CLAUDE.md` (the planted block),
  `pdlc/skills/sweep/templates/`, `spec-bridge/gates/bridge.mjs`, `lib/board-mirror.mjs`,
  `docs/wiki/pdlc-grounding-block.md`, `docs/releasing.md`, `.claude-plugin/marketplace.json`.
  No sibling lane, so no intra-sweep contention — but other sessions land on `main`
  frequently, so fetch before diagnosing any surprise.
- **This branch is PIN-CARRYING** (it re-pins `docs/wiki/pdlc-grounding-block.md`): it
  **merges `origin/main` IN** — never rebase, never squash, never force-push, and its PR
  lands as a **merge commit**. All three rewrite the branch's hashes and stale every pin it
  carries.
- **Honest re-pins only.** The `pdlc-grounding-block` re-pin is legitimate *because this PR
  actually rewrites `pdlc/templates/CLAUDE.md`* — one of that note's three sources — and the
  note's prose describing the Model tiers section **must be amended to match** before the
  pin is bumped (NEEDS-REVIEW, not RE-PIN-ONLY: the prose makes claims about that section's
  content). A merge-in never justifies a pin bump on its own.
- After every history move (merge-in): re-run tests, `check-docs`, AND the freshness probe
  **unconditionally** — never gated on whether `docs/wiki/` changed.
- **Claim before work:** the FIRST commit claims the task — card → In Progress, the
  `specs/063-dispatch-gap/` stub, AND the `spec-bridge:link` marker, together. Push
  immediately (`git push -u origin task-0125-dispatch-gap`); never force-push a claim.
  A rejected push means the race was lost: fetch, re-read board + `specs/`; if another
  session holds the task or the number, STOP and surface it.
- Verify merged (`gh api … --jq .merged`) BEFORE deleting the worktree or branch.

## Execution mode — background job / no-main-push

This sweep runs as a **Claude Code background job**, so the no-main-push mode applies:

- The worktree lives at **`.claude/worktrees/task-0125`** (harness isolation root, entered
  via `EnterWorktree`), **not** `.worktrees/`.
- Board and spec commands run **inside the task worktree**; the root board lags until merge.
- Post-merge closures (the tasks.md tick, `spec-bridge:sync`'s board-Done, the log row) have
  no next task to ride — this is a single-task sweep — so they land via a small **wrap-up PR**.

## Operator checkpoints (do not proceed silently)

- **The `opus` escalation** — recorded above at sign-off; no further ping needed.
- **Any softening of a gate this runbook enumerates** — amend this file, note why, tell the
  operator. Never an implementer's decision note buried in a spec artifact.
- **If fix 3's fail-closed check would break existing green cards** (e.g. every already-Done
  linked card lacks a dispatch record): STOP. Retrofitting history vs. applying the rule
  only to newly-claimed tasks is an operator decision, not an implementer's.
- **R3b: the ruling stands, its mechanism was corrected** (see the F1 correction and the
  amended R3b gate line). The operator ruled *"we need to stop the bleed"* against a
  misdescription — that `--check` exits 0 on drift and making it nonzero would be breaking.
  It already exits 1. **Wire the existing check; change no contract.** Do not re-ask the
  intent, and do not soften enforcement to a warning. What remains a checkpoint: if wiring
  the check into CI/hooks cannot be made green even after the R2 re-plant lands, STOP and
  report rather than weakening the gate or skipping the wiring.
- **Scope discipline:** discovered out-of-scope work → stop and ask. No follow-up cards
  without approval.
- **Sibling-sweep collisions (F4):** if a reconcile with their merged PRs turns into a
  genuine doctrine conflict — not a mechanical version-file conflict — STOP. Two runbooks
  editing the same doctrine surface is an operator decision.

## Done means

- TASK-0125 **Done on the board via its own merged PR**, moved by `spec-bridge:sync`'s
  derived plan (never hand-set on a linked task).
- The card still carries its `Spec:` marker at sweep end, plus its dispatch record.
- `specs/063-dispatch-gap/` holds real `spec.md` + `plan.md` + `tasks.md`.
- All six ACs checked, including **#4 as a positive rejection record** and **#3 as a
  fail-closed check**.
- `npm test`, `check-docs`, and the wiki freshness gate green on `main`; marketplace version
  bumped; `pdlc-grounding-block` re-pinned with its prose amended.
- **praxis's own planted block re-planted** (F1: `.pdlc` no longer 6 versions behind) and the
  downstream upgrade path landed per R3a/R3b/R3c — a downstream host can discover a stale
  block and follow written instructions to update it.
- `git worktree list` shows no stale sweep worktrees; this file's log complete, status `done`.

## Execution log

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-09-10 | TASK-0125 | — | — | — | runbook authored; signed off (R1/R2/R3); opus escalation recorded; awaiting claim |
