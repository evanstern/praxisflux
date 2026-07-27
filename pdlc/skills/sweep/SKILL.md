---
name: sweep
version: 0.6.0
description: Orchestrate a multi-task board sweep through the full PDLC — author a dependency-laned runbook from a set of board tasks (or adopt an existing runbook), get operator sign-off on the lanes, then execute every task automatically through spec → link → worktree → delegated implementation → PR → merge → re-ground, parallelizing development across lanes while merging serially, under explicit concurrency doctrine for repos where other agents/sessions are working at the same time. Use when the user wants to "run the sweep", "work through these tasks automatically", "act as orchestrator", "execute the runbook", "run these tasks through the SDLC/PDLC end to end", hands over a wave plan or reorientation synthesis naming several tasks, or asks to parallelize board work "creating PRs along the way" — even if they don't say "sweep".
---

# pdlc:sweep — orchestrate a board sweep through the lifecycle

This skill turns a **set of board tasks** into a **sequence of merged PRs** without the
operator driving each step. Its two artifacts of record: the **board** (always the plan of
record — the sweep never duplicates task content) and the **runbook** (the ordering,
lanes, and doctrine — the session-portable contract). The runbook exists because
orchestration outlives any one context window: a fresh session must be able to resume the
sweep from the runbook + the board alone. That is the design test for everything written
here — if a decision lives only in chat, the next session doesn't have it.

The orchestrator **plans, dispatches, and gates — it never implements inline.** Per-task
implementation goes to the host project's implementer agent under its model-tier rubric;
per-task rigor goes through the host's Spec Kit flow. This skill owns only the layer
above: ordering, parallelism, merges, re-grounding, and the operator checkpoints.

## What it does NOT do

- It does **not decide direction.** The tasks arrive already decided (a reorientation
  synthesis, a milestone, an explicit list). A sweep that finds itself re-litigating scope
  should stop and send that question back to whatever produced the tasks.
- It does **not replace per-task Spec Kit.** Every non-trivial task still gets its own
  specify → plan → tasks → implement cycle; the sweep instantiates that loop N times, it
  doesn't shortcut it.
- It does **not write code.** Implementation is dispatched; the orchestrator's hands touch
  specs, the board, worktree/PR plumbing, and grounding docs.

## Precondition gate

1. **A PDLC project** with both peers opted in: `backlog/` (the board) and `.specify/`
   (Spec Kit). Missing either → stop; this skill has nothing to orchestrate with.
2. **Root discipline holds:** repo root is on the default branch and clean
   (`git fetch origin && git pull --ff-only`); branch work happens only in worktrees.
3. **Probe for a merge-drift gate** — hosts following the spec-051 pattern (promptworld)
   ship `scripts/check-merge-drift.mjs` with `session` / `worktree` / `pr` modes and
   0 pass / 1 blocked / 2 env-error exit codes. When present it is **mandatory at its
   choke points for the whole sweep**, not a runbook-author judgment call: run
   `node scripts/check-merge-drift.mjs session` now — it subsumes the fetch/ff-pull
   above, prescribes janitor cleanup of merged worktrees, and emits the n-way drift
   matrix Phase 1 needs. When absent, the raw git commands above stand.
4. **Identify the input mode:**
   - A **runbook path** → adopt it; skip to Execute — but a runbook is an
     instruction-bearing artifact a session obeys, so verify its authority before obeying
     it: its status line must say **signed-off** (never execute a draft), it must be
     committed to the repo (an uncommitted runbook has no provenance), and its scoped
     tasks must exist on the board. Anything unverifiable → treat as draft and get the
     operator's sign-off fresh. Then re-verify its state snapshot — other sessions move
     the board while runbooks sit.
   - **Task ids / a label / a synthesis doc naming tasks** → Author first.

## Phase 1 — AUTHOR the runbook (skip when adopting one)

Read every input task (`backlog task view <id> --plain`), the synthesis/design doc that
produced them, and the project's own gate machinery (check scripts, freshness gates,
constitution/tier rubric). Orient on the project's grounded corpus (`docs/wiki/` or
similar) capsule-first: read `CAPSULES.md` — not the note bodies — for the whole-corpus
view, loading full notes only for the specific concepts the scoped tasks actually touch;
when no `CAPSULES.md` exists, route from `INDEX.md` and load notes just-in-time. Then
derive, in this order:

1. **Lanes** — the dependency-ordered parallelism plan. The governing rule is
   **develop in parallel, merge serially**: parallel worktrees are cheap, but concurrent
   PRs touching the same files tax every merge after the first. First set aside what
   isn't live: tasks carrying the `paused` label (see "Paused lanes" below) are
   **excluded from lane conflict analysis** — their branches and worktrees are not
   another session's live lane, so they contribute nothing to the drift/conflict
   reasoning — and are listed in the runbook's state snapshot as **paused — untouched**.
   Then construct lanes so that:
   - Hard dependencies (a task consuming another's contract/API) order the lanes.
   - **Contract-shaped work goes first** even when its full implementation can lag — a
     published interface unblocks consumers; its internals don't.
   - Tasks with overlapping file footprints share a lane and merge smallest-first.
     Where the precondition probe found a merge-drift gate, its session-mode **drift
     matrix is evidence for this** — branch pairs it predicts to conflict must not
     develop in parallel lanes on the promise of an easy merge.
   - The biggest slice gets a lane with nothing else fighting for its files.
   - Low-priority polish goes in the tail lane, droppable without breaking anything.
2. **Model tier per task**, from the host project's rubric (e.g. a constitution's
   tiered-workflow principle), with the justification recorded — the tier note lands on
   the board task at dispatch time, not just in the runbook.
3. **Project-specific per-PR gates, enumerated.** Every repo grows its own ("run this
   check script before any PR touching X", "amend this reference doc in the same PR").
   The runbook lists them explicitly so a dispatched implementer can't miss one — hunt
   for them in the project CLAUDE.md, design-doc INDEX files, and `scripts/`. Record
   the merge-drift probe's result here (present/absent; when present, the three
   invocations verbatim) so an adopting session doesn't re-derive it.
4. **Concurrency doctrine** — the repo's conflict hotspots (name actual paths) and the
   rebase/merge rules (see Execute below), written down because the next session won't
   have watched this session's conflicts happen.
5. **Operator checkpoints** — the specific decisions where the sweep must stop and ask
   (open design questions parked "until X is built", one-way doors, tier escalations).
6. **Done means** — the checkable end state: which tasks Done via merged PRs, which gates
   green on main, grounding fresh, no stale worktrees.

Write it from `templates/runbook.md` (if the template is missing, hand-write the runbook
with exactly the sections above plus an execution-log table) to
`docs/design/<slug>-runbook.md` in the host project, with a **state snapshot** (date,
what's already Done, what's in flight in other sessions, what's paused — untouched) so
staleness is detectable. Commit it — then **get operator sign-off on the
lanes** before executing. Lane construction is judgment, and it's the one place a wrong
guess costs days instead of minutes.

## Phase 2 — EXECUTE

Work lane by lane. Within a lane, open parallel worktrees and dispatch; across merges, go
one at a time. For **each task**, the loop is the host PDLC's, instantiated:

1. Root freshness (`git fetch origin && git pull --ff-only` at root; with a merge-drift
   gate, `node scripts/check-merge-drift.mjs session` — apply its janitor prescriptions
   for merged leftovers before starting new work).
2. Spec Kit cycle (specify → clarify only if ambiguous → plan → tasks). **Check for spec
   number collisions against `origin/main` before claiming an NNN** — concurrent sessions
   take numbers constantly; renumber on conflict. With a merge-drift gate this check is
   mechanical: `node scripts/check-merge-drift.mjs worktree --spec <NNN>` blocks on a
   taken number and names the next free one.
3. `spec-bridge:link` the spec to the board task BEFORE implementation.
4. With a merge-drift gate, `node scripts/check-merge-drift.mjs worktree` must exit 0
   first (fresh root at origin/main tip). Then
   `git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main`. One task, one
   worktree, one branch, one PR — subtasks are commits, never their own PRs.
5. Dispatch implementation to the host's implementer agent at the runbook's tier; record
   tier + justification on the board task.
6. Run the runbook's enumerated per-PR gates in the worktree; produce any same-PR
   companion artifacts they demand (design-doc amendments, reference re-pins).
7. Reconcile with fresh `origin/main` per the concurrency doctrine below: a
   **pin-carrying branch merges main in** (re-pinning conflicted pins to the merge
   commit); a pin-free branch rebases. Re-run tests, gates, and the freshness probe
   AFTER every history move — unconditionally, not only when the move touched
   `docs/wiki/` (sibling merges change tripwires, and pins reference sources outside
   the wiki). With a merge-drift gate, `node scripts/check-merge-drift.mjs pr` from
   the worktree is the last gate before `gh pr create` — and again after every history
   move; a nonzero exit blocks the PR, and its semantic-overlap warnings (board files,
   wiki-pinned sources, design surfaces) are the same-PR companion-artifact checklist.
   Then open the PR from the worktree.
8. **Merge serially:** before merging, confirm the branch still sits on current
   `origin/main`; after merging, verify (`gh api ... --jq .merged`) BEFORE deleting
   anything; then remove the worktree, delete the branch, ff-pull root. Never
   delete+recreate a closed PR's head branch — open a fresh PR instead.
9. **Re-ground — the merge is not the end:** `spec-bridge:sync`; tick the spec's tasks.md
   at root; refresh the wiki when the merge touched any note's sources — re-orienting
   capsule-first: `CAPSULES.md` when present for the whole-corpus view, full notes only
   for the concepts the merge touched (else INDEX + just-in-time); run the project's
   downstream doc skills if their freshness checks say stale; mark the task Done with a
   final summary.
10. **Log it:** append one line to the runbook's execution log (task, PR, merge sha,
    date). Board hygiene throughout: add specific task files to git, never `backlog/`
    wholesale; run board/spec commands from root, never inside a worktree.

### Concurrency doctrine (conflicts are routine, not exceptional)

Other agents are working the same repo — the runbook's authoring assumed it; execution
must too:

- Reconcile by what the branch carries. A **pin-carrying branch** — one whose own
  commits are referenced by re-pins it carries (wiki notes, design-reference pins;
  routine on hosts with a wiki-in-PR lifecycle) — **merges `origin/main` into the
  branch** and re-pins conflicted pins to the merge commit. All three
  history-rewriting moves break pins the same way: **squash, rebase, and force-push**
  rewrite the branch's hashes and stale every pin it carries at once; only a merge
  commit keeps the old hashes reachable — which is also why such a branch's PR must
  land as a merge commit, never a squash. A **pin-free branch rebases**, as before.
  Either way, take main's side for anything you didn't deliberately change.
- **After every history move — merge-in or rebase — re-run the gates AND the freshness
  probe, unconditionally.** Never gate the probe on whether `docs/wiki/` changed: pins
  also reference design-reference files outside the wiki, so a wiki-untouched diff can
  still be stale (field case: a keymap-doc-only change staled a pinned page invisibly
  because the probe fired only on wiki diffs).
- Two PRs heavy in the same hotspot must not merge within one re-ground cycle without a
  reconcile between them (merge-in or rebase per the pin rule), or the grounding gates
  thrash.
- When your open PR conflicts with a sibling session's, let the **smaller** one merge
  first, regardless of whose it is.
- Before diagnosing "my branch broke," fetch and diff against `origin/main` — concurrent
  sessions land merges on main frequently, and a moved base explains most surprises. A
  merge-drift gate's session mode answers this in one run: base lag, predicted
  conflicts, and which sibling branch they're with.

### Paused lanes — the `paused` marker

An operator can pause an In Progress task without moving it on the board. The marker is
a **`paused` label on the task**, set and cleared **only** via
`backlog task edit TASK-<n> --labels …` (never a hand edit), which makes the pause
machine-findable: the label appears in the task file's frontmatter `labels:` list.
Provenance rides an append-note written at pause time —
`backlog task edit TASK-<n> --append-notes "paused by <who> <date>: <why>"` — so a stale
pause is auditable; clearing the label gets a matching resume note.

A paused task is **not a live lane**. Its branch and worktree are the pausing operator's
parked state, so the sweep **never claims, rebases, or cleans a paused task's branches
or worktrees** — not in janitor cleanup, not in conflict resolution, not in
end-of-sweep hygiene — and runbook authoring excludes paused tasks from lane conflict
analysis, listing them in the state snapshot as **paused — untouched** (Phase 1). Hosts
that ship a merge-drift gate read the same label and downgrade a paused task's
branch/worktree findings from blocking to info, with the pause cited as evidence.

### Operator checkpoints — never proceed silently past

- Any checkpoint the runbook names (parked design questions, one-way doors).
- Escalating a task's model tier (record the rubric justification on the task).
- Dropping, reordering, or resplitting a lane mid-sweep — that's a runbook amendment, and
  the runbook is signed-off state: amend the file, note why, tell the operator.

## Output gate

Prove the sweep before declaring it: every scoped task **Done on the board via its own
merged PR**; every project gate green on main; grounding fresh (wiki pins current,
downstream doc freshness checks passing); `git worktree list` shows no stale sweep
worktrees; the runbook's execution log complete and its status flipped to done. Anything
short of that is reported as exactly what remains, not rounded up.

## Handing off

The board now carries the shipped state and the runbook the audit trail. What's natural
next: a re-grounding pass if any note drifted, the host project's review flow over the
merged work, or the next sweep — and if the tasks came from a reorientation, its
synthesis's parked questions may now be answerable. Suggest; don't start.

## Bundled resources

- `templates/runbook.md` — the runbook skeleton Phase 1 fills in.
