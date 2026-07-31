---
name: sweep
version: 0.14.0
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
- It does **not replace per-task Spec Kit.** Every scoped task still gets its own
  specify → plan → tasks → implement cycle; the sweep instantiates that loop N times, it
  doesn't shortcut it. The only sanctioned skip is the Output gate's operator-signed
  escape line — never an inline judgment that a task is too small to spec.
- It does **not write code.** Implementation is dispatched; the orchestrator's hands touch
  specs, the board, worktree/PR plumbing, and grounding docs.

## Precondition gate

1. **A PDLC project** with both peers opted in: `backlog/` (the board) and `.specify/`
   (Spec Kit). Missing either → stop; this skill has nothing to orchestrate with.
2. **Root discipline holds:** repo root is on the default branch and clean
   (`git fetch origin && git pull --ff-only`); branch work happens only in worktrees.
3. **Probe for a merge-drift gate** — hosts following the spec-051 pattern (promptworld)
   ship `scripts/check-merge-drift.mjs` with four modes — `session` / `claim` /
   `worktree` / `pr` — and 0 pass / 1 blocked / 2 env-error exit codes. Probe for all
   four here; the four invocations the sweep uses, recorded verbatim in the runbook:
   `node scripts/check-merge-drift.mjs session` ·
   `node scripts/check-merge-drift.mjs claim --dir <NNN>-<slug>` ·
   `node scripts/check-merge-drift.mjs worktree [--spec <NNN>] [--task TASK-<n>]` ·
   `node scripts/check-merge-drift.mjs pr`. When present the gate is **mandatory at its
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
   tiered-workflow principle), with the justification recorded — and, next to each tier
   label, the **explicit model ID** the tier resolves to (e.g. `claude-opus-5`), plus a
   **fallback ID** for subscription-unavailability (the operator's 2026-07-31 ruling —
   `claude-opus-4-8` when `claude-opus-5` is unavailable in the subscription — is the
   field case) and, recorded at dispatch, which model actually served. A bare
   tier name is not a valid runbook entry: tier names have no mechanical resolution at
   dispatch time, so an unpinned tier silently resolves to the orchestrator session's
   model. Record tier + model ID + justification on the board task at dispatch time,
   not just in the runbook.
3. **Project-specific per-PR gates, enumerated.** Every repo grows its own ("run this
   check script before any PR touching X", "amend this reference doc in the same PR").
   The runbook lists them explicitly so a dispatched implementer can't miss one — hunt
   for them in the project CLAUDE.md, design-doc INDEX files, and `scripts/`. Record
   the merge-drift probe's result here (present/absent; when present, the four
   invocations — session / claim / worktree / pr — verbatim) so an adopting session
   doesn't re-derive it. **Lane-0/precondition rulings that change the per-task loop
   land as checkable gate lines in the runbook, never only prose** — a ruling recorded
   as narrative has no mechanical consequence, because no later step reads narrative
   back; the template's "Per-task artifacts required before PR" section carries the
   slot for exactly these lines.
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
2. **Claim before any spec authoring** — the first commit of the task claims it. Pick
   the spec number: **check for collisions against `origin/main` before claiming an
   NNN** — concurrent sessions take numbers constantly; renumber on conflict. With a
   merge-drift gate the checks are mechanical:
   `node scripts/check-merge-drift.mjs claim --dir <NNN>-<slug>` blocks on a taken
   number and names the next free one, and
   `node scripts/check-merge-drift.mjs worktree --spec <NNN> --task TASK-<n>` must
   exit 0 (fresh root at origin/main tip) before cutting. Then cut the worktree:
   `git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main` — the branch
   starts at the `origin/main` tip, which does **not** contain the spec yet; the spec
   is authored on this branch, after the claim. Make the claim the branch's FIRST
   commit — board card → In Progress, the spec number's directory (a stub claims the
   number), **and the link**: run `spec-bridge:link` against that stub so the card
   carries its machine-findable Spec marker from this same commit (a stub spec dir
   suffices — the bridge derives "planning" from it). The link rides the claim because
   the bridge's Stop gate is the mechanism that blocks a linked task's status from
   exceeding its spec artifacts — armed only after the spec cycle it protects, it is
   disarmed by exactly the skip it exists to catch; armed here, it holds from the
   branch's first commit. Then push immediately (`git push -u origin <branch>`), so in-flight
   work is auditable from any clone; never force-push a claim. A rejected push means
   you lost the race: fetch and re-read the board and `specs/`; if another session now
   holds that task or number, STOP the lane and surface it to the operator; on an
   unrelated rejection (e.g. a board-notes push) with the task+number still free,
   merge `origin/main` into the claim branch and re-push — a plain push (the
   merge-based remedy stays executable under a repo-wide rebase ban and never needs
   the force-push a claim forbids; rebasing an already-pushed claim would). One task,
   one worktree, one branch, one PR — subtasks are commits, never their own PRs.
3. Spec Kit cycle (specify → clarify only if ambiguous → plan → tasks), authored in the
   worktree on the claimed branch — commits on top of the claim. The cycle's output is
   **three named artifacts** in `specs/<NNN>-<slug>/`, each real before implementation
   dispatches — the claim's stub reserved a number; it satisfies none of these:
   - **`spec.md`** — the problem and the requirements, mapped to the board card's
     acceptance criteria. If it says nothing about what "done" means beyond the card's
     title, it is still a stub.
   - **`plan.md`** — the how, checked against the host constitution. Constitution
     absent or unratified (an unfilled template)? State that plainly in plan.md and
     plan against the project's grounding docs (`docs/wiki/`, CLAUDE.md, README)
     instead — never treat the plan step as ceremony because the checker it expects is
     missing.
   - **`tasks.md`** — phased checkboxes. This is the file the bridge derives phase ACs
     and status from, so the phases must be real work breakdown, not one catch-all box.
   All three committed on the claimed branch before any implementation dispatch. The
   detail here is the obligation, same as the claim step's: a session that executes the
   claim's mechanics precisely and reads this cycle as advisory ships exactly the
   degradation this step exists to prevent (field case: two tasks of a twelve-task
   sweep shipped claim-stub spec.md only — no plan.md, no tasks.md — and nothing
   noticed until a human did).
4. **Complete the link the claim armed:** run `spec-bridge:link` in update mode now
   that tasks.md exists — it seeds/refreshes the card's phase acceptance criteria from
   tasks.md's phases — and verify the claim's Spec marker survived on the card (other
   sessions move the board while branches sit). Still BEFORE implementation: the
   bridge can only hold status to what the artifacts prove if it knows what the
   phases are.
5. Dispatch implementation to the host's implementer agent at the runbook's tier —
   **passing the runbook's explicit model ID on the dispatch call** (the Agent tool's
   `model` param, or the host's equivalent), never relying on session-model
   inheritance: an orchestrator often runs a price tier above the implementer intent,
   and an unpinned dispatch inherits its model (field case: "Opus tier" implementers
   silently ran on the orchestrator's Fable session model at 2x the unit price).
   The board-task tier note Phase 1 item 2 requires lands here — including which model
   actually served the dispatch.
   **Dispatch phase-scoped:** one fresh implementer agent per tasks.md phase — or per
   explicitly-grouped small adjacent phases, the grouping being the orchestrator's
   recorded call; the default is one per phase — each dispatched at the runbook's
   pinned model and re-grounded from the spec artifacts plus the branch's commits,
   never one agent living across the whole task. The rationale lives here because the
   cost mechanism is structural: every tool call re-pays the agent's full context
   read, and a long-lived implementer's context is mostly its own transcript — field
   case: one implementer ran 699 requests at ~427k average context ($404) against a
   ~32k dispatch baseline; fresh-per-phase restarts at ~35k. The **phase handoff
   artifact set** is the spec dir (spec.md, plan.md, tasks.md), the tasks.md
   tick-state, and the branch's commits — nothing is handed between phases via chat
   context: if the next phase needs it, it lives in an artifact — a ticked box, a
   committed slice, a deviation note in the spec dir or on the board task.
   **At each dispatch boundary, update the task's in-flight row in the runbook's
   execution log** (phases dispatched/completed, e.g. `phases: 1-2 done, 3 dispatched`)
   so a resuming session sees where within the task the last dispatch stopped; the
   closing row update lands at merge (step 10).
   **Every dispatch prompt carries a turn-hygiene block:** batch independent
   reads/checks as parallel tool calls in a single message; minimal between-call
   narration; run mechanical phases at lower reasoning effort, which produces fewer,
   more consolidated tool calls. Same structural mechanism, prompt-level lever:
   micro-turns pay that cost on every call — field case: the
   expensive implementers averaged ~300 output tokens per request.
6. Run the runbook's enumerated per-PR gates in the worktree; produce any same-PR
   companion artifacts they demand (design-doc amendments, reference re-pins).
7. Reconcile with fresh `origin/main` per the concurrency doctrine below: a
   **pin-carrying branch merges main in**; a pin-free branch rebases. The merge-in
   itself licenses no pin bump — route the staleness it creates through the
   wiki-update plan loop (the "honest re-pins" rule below): classify every stale or
   conflicted pin against the main-side diff over the note's sources
   (`git diff <old-pin>..<merge-commit> -- <sources>`) as **RE-PIN-ONLY** (the diff
   provably can't invalidate prose) or **NEEDS-REVIEW** (re-verify the note's prose
   against that diff and amend it BEFORE bumping). The merge commit is the *target*
   of an honest re-pin, never the *justification* for one. Re-run tests, gates, and
   the freshness probe
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
9. **Re-ground — the merge is not the end:** tick the spec's tasks.md at root FIRST,
   then `spec-bridge:sync` — sync derives the board from the spec artifacts, so it must
   see the ticked boxes, and per spec-bridge doctrine its derived plan is the ONLY path
   that moves a linked task to Done (it emits `-s Done` with the derived final summary);
   the sweep never hand-sets Done on a linked task. Refresh the wiki when the merge
   touched any note's sources — re-orienting capsule-first: `CAPSULES.md` when present
   for the whole-corpus view, full notes only for the concepts the merge touched (else
   INDEX + just-in-time); run the project's downstream doc skills if their freshness
   checks say stale.
10. **Log it:** the closing row update at merge — the task's in-flight row (maintained
    at each dispatch boundary, step 5) is completed with the PR, merge sha, tokens/cost
    best-effort from the harness/transcript, and date. Board hygiene
    throughout: add specific task files to git, never `backlog/` wholesale; run
    board/spec commands from root, never inside a worktree. At a lane boundary, the
    orchestrator SHOULD end its session and resume from the runbook + board — a cost
    prescription, not just crash-resilience: orchestrator context grows
    monotonically, and the tail is the expensive part (field case: one main session
    grew 172k→548k; its last fifth cost as much as its first two-fifths). The runbook
    is the contract that makes the fresh resumption safe.

### Concurrency doctrine (conflicts are routine, not exceptional)

Other agents are working the same repo — the runbook's authoring assumed it; execution
must too:

- Reconcile by what the branch carries. A **pin-carrying branch** — one whose own
  commits are referenced by re-pins it carries (wiki notes, design-reference pins;
  routine on hosts with a wiki-in-PR lifecycle) — **merges `origin/main` into the
  branch**. All three history-rewriting moves break pins the same way: **squash,
  rebase, and force-push** rewrite the branch's hashes and stale every pin it
  carries at once; only a merge commit keeps the old hashes reachable — which is
  also why such a branch's PR must land as a merge commit, never a squash. A
  **pin-free branch rebases**, as before. Either way, take main's side for anything
  you didn't deliberately change.
- **Honest re-pins only — a merge-in never justifies a pin bump.** The freshness
  probe checks `git log <pin>..HEAD -- <sources>`, so setting pin = merge commit
  empties that range *by construction*: a mechanical merge-commit re-pin turns the
  gate green while the note may contradict code that landed on main. After a
  merge-in, route every stale or conflicted pin through the **wiki-update plan
  loop's classifier**: read the main-side diff over the note's sources
  (`git diff <old-pin>..<merge-commit> -- <sources>`) and classify it
  **RE-PIN-ONLY** (the diff provably can't invalidate prose — version stamps,
  no-op churn) or **NEEDS-REVIEW** (re-verify every claim in the note against that
  diff, amend the prose, then re-pin). Never bump a pin without reading the diff it
  covers — a dishonest pin is worse than a stale note. Once a note is verified, the
  merge commit is the correct *target* for its re-pin; it is never the
  *justification* for one.
- **Downstream hosts that inherited the older convention** — a recorded
  "merge main in and re-pin conflicted pins to the merge commit" rule, from the
  doctrine as it stood before this rewrite — should treat that rule as superseded:
  keep the merge-in (it is still what preserves pinned hashes), drop the mechanical
  re-pin, and apply the classify-then-pin procedure above to every pin the merge
  staled or conflicted. Pins already bumped under the old convention are suspect:
  at the next update pass, re-verify each such note against
  `git diff <previous-pin>..<current-pin> -- <sources>` before trusting it.
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
merged PR**; every scoped card **still carries its Spec marker at sweep end** (re-run
the `spec-bridge` links check — other sessions move the board while branches sit, and a
dropped marker disarms the gate that held the task honest); every scoped task's
`specs/NNN-*/` **contains `spec.md` + `plan.md` +
`tasks.md`, or the runbook records an operator-signed escape line naming the task and
what stands in for the artifacts** — whatever sanctions a substitute (a host's recorded
hand-authored-specs precedent included) enters the sweep as such a line, never as a
second mechanism; every project gate green on main; grounding fresh (wiki pins current,
downstream doc freshness checks passing); `git worktree list` shows no stale sweep
worktrees; the runbook's execution log complete and its status flipped to done. Anything
short of that is reported as exactly what remains, not rounded up.

## Handing off

The board now carries the shipped state and the runbook the audit trail. What's natural
next: a re-grounding pass if any note drifted; **`pdlc:refactor-triage` over the merged
range** — the post-sweep review step: evaluate the sweep's merged work for tech debt and
intent drift, triage the findings, and card accepted items back onto the board as
sweepable tasks; or the next sweep — and if the tasks came from a reorientation, its
synthesis's parked questions may now be answerable. Suggest; don't start.

## Bundled resources

- `templates/runbook.md` — the runbook skeleton Phase 1 fills in.
