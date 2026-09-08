# spec-bridge gate fan-out + transients — sweep runbook (2026-09-08)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it through
the host project's full PDLC — spec → link → worktree → delegated implementation → PR →
merge → re-ground. Direction is decided; do not re-litigate it: the board card **TASK-119**
IS the synthesis. It carries the finding (six Stop-hook firings, ~57 near-identical findings
each, one actionable), the per-round causal breakdown, the round-6 elimination list with the
command run for each, and four ACs. Plan-of-record is the board; this file carries only
ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-09-08
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

## Read first (in this order)

1. `backlog task view TASK-119 --plain` — the direction source; there is no separate
   synthesis doc. Its Description carries the two problems (fan-out, transient sampling);
   its Implementation Notes carry round 6's elimination list, which is the starting point
   for AC #4 and must not be re-derived from scratch.
2. `spec-bridge/gates/bridge.mjs` — the whole change surface. The three functions that
   matter: `evaluateProjectGates` (builds one finding per gate **per linked spec** — the
   fan-out), `checkBridge` (calls it once per Done-eligible spec), `verifyBridge` (the
   mid-PR CLI counterpart, same evaluator, same fan-out).
3. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect
   `spec-bridge-plugin`, `test-suite-catalog-plugins-gates`, `gate-runner`.
4. `docs/releasing.md` (bump rules — this PR touches released surface).
5. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-09-08, main @ c8bd2cf, v0.60.0)

- **Done already:** the TASK-116 sweep (runbook `local-only-planting-runbook.md`, status
  done). Root on `main`, clean, fast-forwarded.
- **In flight in other sessions (do not duplicate; expect their merges):** **TASK-112**
  (board verb table — docs surface) and **TASK-113** (Jira provider: board:sync skill) both
  sit In Progress, and **neither is paused**, so both are live lanes. TASK-113 is the one
  that matters here: it touches
  `lib/board-mirror.mjs` and the mirror/provider surface — which `bridge.mjs`
  *imports* (`readMirror`, `providers`, `mirrorStaleness`) but which this task does not
  edit. Treat `lib/board-mirror.mjs` as **someone else's file**: read it, never change it.
  If TASK-113 lands mid-flight, the merge-in is routine; if a conflict appears in
  `bridge.mjs`'s import block, take main's side.
- **Paused — untouched** (`paused` label in frontmatter `labels:`; excluded from lane
  conflict analysis; never claim, rebase, or clean their branches/worktrees): **none.**
  Verified 2026-09-08 by parsing each task's frontmatter `labels:` list — no task carries
  the label. (A plain `grep -rl paused backlog/tasks/` is a FALSE POSITIVE trap here: it
  matches TASK-54/55/99/112, which merely *discuss* pausing in their bodies. TASK-55 is
  itself the card that would build the marker. Check the frontmatter list, not the file.)
- **TASK-112/113 read In Progress but are NOT being worked** (operator question, 2026-09-08).
  Evidence: both have spec dirs (055, 056) with **zero phase boxes ticked** (0/6 and 0/7 on
  Phase 1), **no branch exists** for either (`git ls-remote --heads origin` finds none), and
  their 2026-09-08 14:17 timestamps are the 109/110/111 closure sync, not work. The status is
  honest by derivation — a spec dir with a `plan.md` and an untouched `tasks.md` derives
  `implementing` — but it is **useless as a liveness signal**: it means "claimed, spec
  written, nobody implementing." Hand-setting them back to `To Do` would contradict their
  artifacts and the gate would report the mismatch, so the legitimate remedies are the
  `paused` label (TASK-55's marker) or sweeping them (both are next in dependency order after
  111; 113 also depends on 112). **Operator decision pending; this sweep touches neither.**
- **Queued (this runbook's scope):** **TASK-119, alone.**
- **Next free spec number at authoring:** **061** (`origin/main:specs/` tops out at
  `060-local-only-planting`). No remote branch matches `task-119*`
  (`git ls-remote --heads origin 'task-119*'` empty). Claim-before-work governs —
  re-check both at claim time and renumber on collision.
- **Tier config:** `node <pdlc>/scripts/tiers.mjs --root . --check` exits 0; all three
  agent definitions `unchanged`. **Nothing was regenerated, so no session restart is owed
  before dispatch.**
- **Stale non-sweep worktree dir — AND A RED `backlog/`-BEARING TREE:**
  `.claude/worktrees/refactor-triage-2026-07-31/` exists on disk but is **not** a registered
  worktree (`git worktree list` shows only the root). It carries its own `backlog/` and
  `docs/wiki/`, and **its suite exits 1** (36 wiki pins "not a known commit" in that tree).
  It is not this sweep's and not a paused task's, so this sweep does not clean it — but it is
  a live hazard for any root-resolving gate and a candidate mechanism for the unexplained
  firings (see design ruling 3). **Recommend removing it on its own merits**; that is an
  operator call, not a silent sweep action. It is not a stale *sweep* worktree for
  Output-gate purposes.

## Execution lanes (dependency-ordered; parallelize within a lane)

One task, one lane — there is nothing to parallelize and nothing to serialize against.

**Lane 1 — the only lane:**
- **TASK-119 (`sonnet` · model `cc/claude-sonnet-5[1m]` · fallback: **none declared for
  this tier** — on subscription unavailability, STOP and ping the operator rather than
  silently falling to another tier)** — collapse the project-gate fan-out to one finding
  per red gate, make a dirty-tree sample non-blocking and labeled, add the regression
  tests, and record/instrument the unexplained firing.
  **Rubric justification:** `defaultTier`. The card's Description states directions as
  "not decided", but the ACs decide the two that matter — AC #1 fixes the collapse shape
  ("ONE finding naming that gate, not one per linked spec") and AC #3 fixes what the
  regression must assert. The remaining latitude in AC #2 (skip *or* label) is **settled
  in this sweep's spec.md by the orchestrator, not left to the implementer** (see the
  design rulings below), which is exactly what makes this sonnet-scope: work to a written
  spec against an existing pattern, with the judgment calls already made. The existing
  pattern is in-repo and close by — `memoizeRun` (spec 050 defect 2) already de-duplicates
  the gate *result* across specs; this task extends the same de-duplication to the
  *finding*. **No escalation; no operator checkpoint owed for tier.**

Tiers and their model IDs come from **`.claude/model-tiers.json`**, not from memory —
`tiers.mjs --root . --check` exited 0 before these lanes were authored.

Record the model tier + explicit model ID + rubric justification + **which model actually
served** on TASK-119 at dispatch. **Verify the served model from the FIRST dispatch's
transcript before launching any sibling/next-phase dispatch** — a wrong pin caught after
one phase is a rounding error.

## Design rulings this sweep settles (spec.md carries these; the implementer does not re-decide)

These are resolved **from existing artifacts and principles**, not re-asked as preferences
— which is why they are rulings here rather than operator checkpoints.

1. **Collapse shape (AC #1): one finding per red gate, naming the affected count.** AC #1
   states it. The finding replaces ~57 per-spec lines with one that names the gate, its
   failure reason, and how many ticked/Done-eligible specs it affects — the card's own
   words: "A single 'the `tests` gate is red — N ticked phases are affected' would carry
   the same information." Per-spec *witness* detail (phase/box) is not load-bearing for a
   project-wide gate and is dropped rather than concatenated; a reader who needs it runs
   the CLI. Both entry points collapse — `checkBridge` **and** `verifyBridge` — because
   they "agree by construction" is a stated property of the shared evaluator, and fixing
   one would break it.
2. **Dirty tree (AC #2): non-blocking and labeled — the warnings channel, not silence.**
   Resolved from the repo's own **F6** principle: *a gate run against a dirty working tree
   proves nothing about the commit.* A verdict that proves nothing must not block, and
   silence would hide a genuine red. `lib/gate-runner.mjs` already has the exact seam —
   a `warnings` channel that writes to stderr and still exits 0. So: tree dirty →
   the gate's not-green verdict is emitted as a **labeled warning** stating that the
   sample was taken against a dirty tree and proves nothing about the commit; tree clean →
   unchanged blocking behavior. Dirtiness is judged with `git status --porcelain` at the
   bridge's root, and a repo where that cannot be determined **fails closed** (treated as
   clean, i.e. blocking) — consistent with the gate-runner contract that an
   unrunnable check is never silently green.
3. **AC #4 scope: record, and instrument.** The card's Implementation Notes already satisfy
   AC #4's "explicitly recorded as unreproduced with what was ruled out" — nine eliminations
   now, each with its command (rounds 6 and 7). This sweep does **not** re-run that
   elimination sweep. It adds what the card itself names as the useful next step: opt-in
   instrumentation that logs, **at Stop time**, the gate command's captured stdout/stderr and
   exit code **and the roots `resolveRoots` returned**, so the next firing is diagnosable from
   the inside rather than unreproducible from the outside. Off by default (a Stop hook must
   not write on every turn); enabled by an env var; writes outside the tracked tree.
   **Log the resolved roots, not just the exit code** — round 7 (this session) fired while
   the orchestrator was isolated in a worktree, ruled out the `SPEC_BRIDGE_GATE_ACTIVE`
   child flag and the worktree cwd (both green, 508/508), and showed a faithful
   `runGateCommand` spawn replay returning status 0 against both trees. What it also found:
   `.claude/worktrees/refactor-triage-2026-07-31/` is an unregistered leftover tree that
   carries its own `backlog/` and whose suite **exits 1** (36 pins "not a known commit").
   `findRootsDownwards`'s `defaultSkip` skips dot-dirs, so from either checkout the resolver
   returns exactly one root — verified by calling it directly — which means the stale tree is
   reachable ONLY if some invocation starts the walk at `.claude/worktrees/` itself, where
   neither child is dot-prefixed and both resolve as roots, one of them red. That is a
   **candidate mechanism, not a confirmed cause**, and only in-hook instrumentation can
   settle it. Keep the distinction in spec.md: the instrumentation is the deliverable; the
   diagnosis is not promised.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: ABSENT.** This host ships no `scripts/check-merge-drift.mjs`
  (verified 2026-09-08). The sweep falls back to raw git and **loses claim-collision
  detection and the drift matrix**. Compensate manually, both before claiming:
  `git ls-tree --name-only origin/main specs/` (spec number free?) and
  `git ls-remote --heads origin 'task-119*'` (branch free?).
- **`core.hooksPath` is active and RESOLVES** (verified 2026-09-08: `.githooks`, relative,
  `ls -d` succeeds). `.githooks/pre-commit` runs the **full `node --test` suite** plus
  marketplace/version/docs-sync checks on **every** commit; `.githooks/pre-push` runs the
  version-bump and wiki-freshness gates. A red suite blocks every intermediate commit —
  sequence work so each commit leaves the suite green.
- **Run the suite as bare `node --test`** — no path argument, exactly as
  `.githooks/pre-commit` does. There is **no `package.json`**, so there is no `npm test`.
  Passing a path (`node --test test/`) makes node resolve `test` as a module and die with
  `Cannot find module '<root>/test'`, reporting `tests 1 / fail 1` — a failure that looks
  exactly like a red suite and is not real. Cost three wrong conclusions on 2026-08-28.
- **Scratch files in the worktree get collected by the test runner.** A stray `t.txt` in
  the repo root is picked up as a test file and fails the run. Write throwaway output to
  `$CLAUDE_JOB_DIR/tmp`, never the worktree.
- **Released surface ⇒ marketplace version bump.** This PR touches `spec-bridge/` (a
  plugin dir), so it MUST bump `.claude-plugin/marketplace.json`'s `version` (0.60.0 →
  next) and re-sync every `plugin.json` — `node scripts/sync-version.mjs <version>`, per
  `docs/releasing.md`. CI enforces it; each merge to `main` auto-publishes `v<version>`.
  **No skill `version:` bump is owed** unless the implementer edits a file under
  `spec-bridge/skills/` — `gates/` is not a skill dir. If a skill's SKILL.md *is* touched
  (e.g. sync's documented behavior changes), that skill's `version:` bumps too.
- **Docs sync.** `node scripts/check-docs.mjs` plus the wiki freshness gate run in CI, in
  both git hooks, and in the repo Stop hook (`scripts/stop-docs.mjs`), which refuses to end
  a turn while they fail. Update `README.md`/`CLAUDE.md` only if what the repo *ships*
  changes — a gate's finding shape and a dirty-tree label are behavior of shipped surface,
  so check both rather than assuming neither.
- **DOGFOOD WARNING — this repo's own gate is the thing being changed.** `.spec-bridge.json`
  opts this repo into four project gates (`tests`, `docs-in-sync`, `versions-consistent`,
  and red-by-construction `wiki-freshness`), and the repo has ~60 linked specs. Editing
  `bridge.mjs` therefore changes the gate that runs at the end of every turn of this very
  task. Two consequences: (a) `SPEC_BRIDGE_GATE_ACTIVE` re-entrancy and the
  injected-`run` bypass (spec 050 defect 1) must keep working or the suite reddens itself;
  (b) **the collapse will change this repo's own Stop output** — that is the point, and it
  is the fastest available end-to-end check.
- **Re-ground obligations.** Use the classifier — `node grounding-wiki/gates/cli.mjs plan .
  docs/wiki`. The wiki is **fresh at authoring time** (`plan` exits 0). Notes sourcing the
  files this task touches: **`docs/wiki/spec-bridge-plugin.md`** (sources
  `spec-bridge/gates/bridge.mjs`) and **`docs/wiki/test-suite-catalog-plugins-gates.md`**
  (sources `test/project-gates.test.mjs`). `gate-runner.md` is in scope only if the
  implementer changes `lib/gate-runner.mjs` (the warnings channel already exists — prefer
  using it over changing it).
- **`docs/wiki/spec-bridge-plugin.md` IS ALREADY OVER BUDGET AND `size_budget_exempt`**
  (8,446 body chars; the exemption reads "at 7998/8000 … TASK-103/95 already own this note
  family's owed summary-style split; fold this into it and remove"). This task **describes
  the note's own subject matter** and will want to add prose. Checkable: the note's
  re-verified prose is **net-neutral-or-smaller** in body chars — say the new thing by
  replacing the sentence it supersedes, not by appending — and the existing
  `size_budget_exempt` block is left in place and **not** extended to cover new growth.
  Do **not** attempt the owed split here: TASK-95 owns it (operator decision 2026-08-03).
  `test-suite-catalog-plugins-gates.md` has real headroom (6,820/8,000) and takes its
  per-file bullet update normally.
- **Re-pins CASCADE — re-run the freshness gate AFTER committing them** (TASK-114,
  2026-09-01). A note listed in another note's `sources:` propagates staleness when
  re-pinned; `test-suite-catalog-plugins-gates.md` is exactly such a hub note and this
  task edits a test file it pins. **Re-pin volume is larger than it looks:** the
  marketplace version bump touches every `plugin.json`, so this released-surface PR can
  stale ~17 notes. One pass is NOT enough.
- **A GATE RUN AGAINST A DIRTY WORKING TREE PROVES NOTHING ABOUT THE COMMIT** (F6,
  2026-09-04, caught by CI not locally). Verify a commit's content with
  `git show HEAD:<file>`, never by reading the file on disk; treat every `--check` run as
  a statement about the *tree* until `git status --porcelain` is empty. **This task is the
  F6 principle applied to the bridge itself** — the same rule governs how it is verified.
- **Merge commits, never squash.** Squashing orphans the commits `docs/wiki` notes pin as
  `verified_against`, breaking the freshness gate.

## Per-task artifacts required before PR

**No PR opens for TASK-119 until each line below checks true.**

- [ ] `specs/061-bridge-gate-fanout/` carries a real `spec.md` (problem + requirements
      mapped to TASK-119's four ACs, and carrying the three design rulings above as
      requirements), `plan.md` (**this host has no ratified constitution — state that
      plainly** and plan against `CLAUDE.md`, `docs/principles.md`, and `docs/wiki/`), and
      `tasks.md` (phased checkboxes the bridge derives from), all committed on the task's
      branch. A claim stub reserves the number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link` against
      the stub), and phase ACs are seeded from tasks.md (link update mode) **before**
      implementation dispatch.
- **Escape lines (operator-signed only):** **`.specify/` is absent on this host.** Spec Kit
  artifacts for TASK-119 are **hand-authored** under this sweep's operator-signed escape
  line, per this host's established precedent (specs 052–060 were authored that way; spec
  045 records the hatch). Signed: **operator, 2026-09-08.** This is the recorded
  host-precedent sanction — never a second mechanism.
- [ ] **The claim is ATOMIC** (host ruling, 2026-08-28): card flip + spec dir +
      `spec-bridge:link` land in **ONE commit on the branch**. Two-track landing's "board
      commits direct to `main`" covers notes, AC ticks, labels, and new cards — **never**
      the status flip that claims a task, which is deliverable state. Splitting it in a
      prior session produced ~50 gate findings from one status flip — the same fan-out this
      task exists to fix.
- [ ] **PUSH AFTER EVERY PHASE, not just at the claim** (F4, 2026-09-03). Phase commits
      left local were nearly lost when the repo relocated on disk mid-session.
- [ ] **ONE ORCHESTRATOR SESSION CANNOT HOST CONCURRENT DISPATCHES ACROSS SIBLING
      WORKTREES** (F3, 2026-09-01). A dispatched subagent's Bash sandbox binds to the
      **orchestrator session's** current worktree, not the one named in its prompt.
      Dispatch **serially**, with the orchestrator parked in the target worktree for the
      duration. Moot across tasks in a one-task sweep, but it **governs the phase
      dispatches within TASK-119**: park in the task worktree and do not switch away
      mid-dispatch.
- [ ] **EXECUTION MODE IS BACKGROUND-JOB / NO-MAIN-PUSH** — verified 2026-09-08: this
      orchestrator runs as a Claude Code background job, which may not push the default
      branch. The three substitutes apply and are **not** optional here:
      (a) the task worktree lives at **`.claude/worktrees/task-119`** (the harness
      isolation root, entered via `EnterWorktree`), not `.worktrees/task-119`;
      (b) post-merge closures — the tasks.md tick, `spec-bridge:sync`'s board-Done, and
      this runbook's log row — **cannot land as a root commit**; with no next task in the
      sweep to ride, they land via the **wrap-up PR** below;
      (c) board and spec commands run **inside the task worktree**; the root board lags
      until merge, which is expected, not drift.
- [ ] **A WRAP-UP PR IS PART OF THIS SWEEP, not an afterthought.** Because (b) above has no
      next branch to ride, sweep-close — final `spec-bridge:sync`, the runbook status flip
      to `done`, and the execution-log row — lands as a small wrap-up PR. The sweep is not
      done when TASK-119's PR merges; it is done when the wrap-up merges.

## Concurrency & conflict doctrine

- **Hotspots:** `spec-bridge/gates/bridge.mjs` and `test/project-gates.test.mjs` (this
  task's core — no other queued task touches them); `.claude-plugin/marketplace.json` and
  every `plugin.json` (the version bump — guaranteed conflict with any other concurrent
  released-surface PR); `lib/board-mirror.mjs` (**TASK-113's live surface — read-only for
  this task**); `docs/wiki/*` pins; `README.md` / `CLAUDE.md`.
- **Paused tasks are not live lanes:** none currently carry the `paused` label, so the
  doctrine binds nothing this sweep. If one is paused mid-sweep, it is never claimed,
  rebased, or cleaned here — its branches and worktrees belong to the pausing operator.
- Reconcile by what the branch carries: this branch **WILL be pin-carrying** (it re-pins
  wiki notes to its own commits), so it **merges `origin/main` in** — squash, rebase, and
  force-push all rewrite hashes and stale every carried pin, so its PR also lands as a
  **merge commit**. Take main's side for anything you didn't deliberately change.
- **Honest re-pins only — a merge-in never justifies a pin bump** (pin = merge commit
  empties the freshness probe's `git log <pin>..HEAD -- <sources>` range by construction).
  Classify every stale/conflicted pin via the plan loop: read
  `git diff <old-pin>..<merge-commit> -- <sources>`, mark **RE-PIN-ONLY** (provably
  prose-safe — e.g. the version-bump churn across `plugin.json`s) or **NEEDS-REVIEW**
  (re-verify and amend the note's prose first). Never bump a pin without reading the diff.
- After every history move: re-run gates AND the freshness probe **unconditionally** —
  never gated on whether `docs/wiki/` changed.
- Conflicting with a sibling session's open PR → the **smaller** PR merges first,
  regardless of whose it is.
- **Claim before work; push immediately** (`git push -u origin task-119-bridge-gate-fanout`);
  never force-push a claim. A rejected push means you lost the race: fetch, re-read the
  board and `specs/`; if another session holds TASK-119 or spec 061, **STOP and surface it
  to the operator.** On an unrelated rejection with task+number still free, merge
  `origin/main` into the claim branch and re-push (a plain push — the merge remedy stays
  executable under the rebase ban and never needs the force-push a claim forbids).
- Before diagnosing "my branch broke," fetch and diff against `origin/main` — a moved base
  explains most surprises.
- Verify the PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head branch.

## Operator checkpoints (do not proceed silently)

- **Runbook sign-off** — the lane, the three design rulings, and the hand-authored-specs
  escape line are **draft** until the operator flips the status line.
- **OUT OF SCOPE, and it stays out unless the operator says otherwise: the card's third
  suggested direction** — "consider whether the Stop hook is the right place to run a
  ~45-second full suite at all." **No AC covers it.** It is a doctrine question about gate
  placement with real blast radius (every host that opts into `projectGates`), and moving
  or throttling the Stop-time run is a different task with a different risk profile.
  Scope discipline governs: the sweep does not silently expand. If the operator wants it,
  it is a **new card**, not an amendment to this one. Surfaced here so the decision is
  visible rather than quietly dropped.
- **Tier escalation** — none planned; TASK-119 runs at `defaultTier`. Escalating to `opus`
  requires a checkpoint recorded here **before** dispatch.
- **Softening any gate enumerated above** — at plan, implement, or merge time — is a
  runbook amendment **plus** an operator ping (amend this file, note why, tell the
  operator), never an implementer decision note buried in a spec artifact. Field case:
  specs/033's plan.md relaxed a signed-off runbook's root-README gate with no amendment.
- **If AC #4's instrumentation turns out to reproduce the round-5 firing**, that is a real
  finding with its own remedy — record it on the card, tell the operator, and do not
  expand this task to fix whatever it reveals.

## Done means

- **TASK-119 is Done on the board via its own merged PR** — moved there by
  `spec-bridge:sync`'s derived plan, never a hand-set `-s Done`.
- All four ACs checked, with AC #3's regression tests present and passing: a red gate plus
  N Done-eligible specs yields **one** finding (not N), and a dirty tree yields a
  labeled/skipped verdict rather than a bare red.
- `specs/061-bridge-gate-fanout/` carries real `spec.md` + `plan.md` + `tasks.md`, and the
  card **still carries its Spec marker** at sweep end (re-run the links check).
- Every project gate green on `main`: bare `node --test`, `scripts/check-docs.mjs`,
  `scripts/sync-version.mjs --check`, and the wiki freshness gate.
- Marketplace version bumped and every `plugin.json` in lockstep; `v<version>` published by
  the release workflow.
- Grounding fresh: `grounding-wiki/gates/cli.mjs plan . docs/wiki` clean **after** the
  re-pin commit (cascade re-run done), and `spec-bridge-plugin.md` net-neutral-or-smaller
  with its exemption intact.
- `git worktree list` shows no stale **sweep** worktrees (the pre-existing
  `.claude/worktrees/refactor-triage-2026-07-31/` dir is not this sweep's and is not
  counted).
- **The wrap-up PR is merged**, and this file's execution log is complete with its status
  flipped to `done`.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while a
task is in flight its row carries the phases dispatched/completed (e.g.
`phases: 1-2 done, 3 dispatched`), updated at each dispatch boundary, so a resuming session
can see where within the task the last one stopped; the closing note on merge replaces or
absorbs it. `tokens/cost` carries best-effort actuals from the harness/transcript, so
future runbook authoring budgets against real numbers.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-09-08 | TASK-119 | — | — | — | runbook authored; round-7 firing observed live during authoring; two more causes ruled out and an ORPHANED red `backlog/`-bearing tree found (recorded on the card, folded into ruling 3) |
| 2026-09-08 | TASK-119 | — | — | — | operator signed off (lane + 3 design rulings + escape line). Claimed atomically at `43223bc` (card→In Progress + spec 061 stub + Spec marker + mirror regen). **Mirror regen was REQUIRED to claim:** `boardLinks()` is mirror-first and unconditional, so a stale mirror made the freshly-marked card invisible to the links CLI *and to the gate itself* — a live instance of TASK-117. Spec cycle (real spec/plan/tasks, 4 phases, 26 boxes) at `6ee8f90`; 8 phase+card ACs seeded |
| 2026-09-08 | TASK-119 | — | — | ~157k subagent tokens (Phase 1) | **Phase 1 done** at `0956e9b` — fan-out collapsed, 510/510 green, observed N=3 pre-fix with the negative control, bucket asymmetry proven by a mixed-eligibility test. Served model **verified `claude-sonnet-5`** across all 68 requests (frontmatter pin held; no silent inheritance of the orchestrator's tier). `phases: 1 done, 2 dispatched` |
| 2026-09-08 | TASK-119 | — | — | — | **AC #4 SOLVED at `c35efb2` — by reproduction, not by "recorded as unreproduced."** Round 8 fired with the worktree CLEAN and the suite green, killing the dirty-tree theory; `checkBridge` returned 58 findings all naming `tests` red while every gate ran green individually in the same process. Post-collapse the same call returns ONE finding: `wiki-freshness` red (exited 1), 58 specs affected — staled by Phase 1's own commit. **The red gate was always `wiki-freshness`; `tests` was never red.** The nine prior eliminations were correct and irrelevant — they eliminated causes of a red that did not exist. Makes R1 a **correctness** fix, not noise reduction. Also carded **TASK-120** (operator-raised worktree path conflict + board branch-state rendering) |
