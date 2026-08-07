---
name: design-rounds
version: 0.1.0
description: Run operator-in-the-loop design iteration on a board task under PDLC — cut a long-running worktree, claim the card, produce N rounds of comparable demo artifacts, record the operator's selection as a tracked decision, and only then author the spec against the chosen direction so implementation can hand off to a sweep. Use when the work's deliverable is not knowable until someone looks at options: a UI or visual redesign, competing layouts or interaction models, "give me some directions and let me pick", "mock this up a few ways", "iterate with me on the design", or any task where a spec written before the choice would be fiction. Not for implementing an already-chosen design (that is pdlc:sweep) and not for evaluating merged work (pdlc:refactor-triage).
---

# pdlc:design-rounds — choose the direction, then spec it

`pdlc:sweep` runs spec → implement → PR. That order is correct for work whose shape is
known when the card is written. It inverts for design work, where the deliverable does not
exist until a human has looked at options and picked one: a spec authored before the
selection either says nothing (`"redesign the surface"`) or invents a direction the
operator never chose, and the implementation then satisfies a fiction.

This skill owns the seam before the spec. It ends where sweep's Phase 2 begins — with a
chosen direction, a tracked decision record, and a spec written against a real answer.

**The cadence, in one line:** worktree → claim → *N rounds of options → operator selects →
decision record* → spec → hand off to implementation.

The middle is the part nothing else models. A round is not a status change. The card sits
**In Progress** across every round, and each round lands as a commit plus a note on the
card — because a status can never exceed the artifacts that prove it, and "we looked at
three layouts" is not a status.

## What it does NOT do

- It does **not implement the chosen direction.** Selection produces a spec; the build is
  a sweep (or a direct implementation on the same branch — see Phase 5). A design-rounds
  run that starts refactoring the component tree has left its phase.
- It does **not replace the spec cycle.** It defers it. All three Spec Kit artifacts are
  still authored, still on the claimed branch, still before implementation — just written
  against a decision instead of a guess.
- It does **not decide.** The operator selects. A run that picks a direction on the
  operator's behalf and proceeds has produced the one artifact this skill exists to
  prevent: a design nobody chose.

## Precondition gate

1. **A board card exists and names the work.** No card → create one first (or run
   `pdlc:bootstrap` if there is no board at all). The card is what the rounds attach to;
   rounds with nowhere to record themselves are chat.
2. **The card is a design task, not an implementation task.** If the direction is already
   chosen — the operator handed over a mock, a design system, or a written spec of the
   look — this skill is the wrong one: go to `pdlc:sweep`. Say so rather than
   manufacturing options nobody asked for.
3. **A git repo with a clean root at the default branch.** Rounds run in a worktree;
   the root stays the shared read surface.

## Phase 1 — CLAIM

Do this **before writing a single demo file**. The failure this ordering prevents is
specific and was observed in the field: a card created in the root checkout *before* the
worktree was cut from `origin/main` never reached the branch, so the board CLI could not
see the task from inside the worktree, and the card sat stranded and uncommitted while the
work proceeded around it.

1. **Cut the worktree first, or commit the card first — never neither.** The branch starts
   at the `origin/main` tip, which does not contain a card created moments ago in the root:
   `git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main`
   (under a background-job or no-main-push execution mode the worktree lives at the
   harness isolation root `.claude/worktrees/task-<N>`, entered via the harness's worktree
   switch). If the card was already created in the root, bring it onto the branch as part
   of the claim commit.
2. **This worktree is long-running.** Unlike a sweep lane, it survives many operator
   round-trips and possibly many sessions. Say so on the card, with its path and branch, so
   a later session finds the work instead of starting over.
3. **Claim commit:** board card → **In Progress**, the card present on the branch, and the
   worktree path recorded in the card's notes. Push immediately
   (`git push -u origin <branch>`) so in-flight design work is auditable from any clone.

**Do not claim a spec number yet, and do not run `spec-bridge:link`.** Both belong to
Phase 5, after the decision exists. Linking a card to an empty spec dir here arms the
bridge's Stop gate against phases that have not been written, and the number would sit
reserved across an open-ended number of rounds while concurrent sessions need it. This is
the one place design-rounds deliberately departs from sweep's claim mechanics, and the
reason is that the spec's content is not yet knowable.

## Phase 2 — GROUND

Read what constrains the design before designing, and state the constraints back. Design
work is where a project's non-negotiables get violated most easily, because they are
usually invisible in a mockup: a font that loads from a CDN, a colour that says something
the copy is forbidden to say, an interaction that requires JavaScript in a surface that
must work without it.

Sources, in order: the project's constitution or equivalent; `docs/wiki/` notes covering
the surface (load `INDEX.md` and route — never bulk-load the corpus); the existing
implementation's own comments, which in a mature codebase often carry the reasoning behind
choices that look arbitrary; and the card.

**Write the binding constraints into the card or the round-1 commit message.** Not as
ceremony — as the thing every subsequent round is checked against. A constraint discovered
in round 3 invalidates rounds 1 and 2.

Where constraints exist, treat them as a **source of identity rather than a limit**. A
surface that may not fetch a webfont has to find its personality in structure, palette,
and how it uses what is already on the reader's machine — which is a sharper brief than an
unconstrained one, not a poorer one.

## Phase 3 — ROUNDS

A round produces **comparable options**. The unit of comparison matters more than the
count: options that differ on many axes at once cannot be chosen between, only reacted to.

**Every option in a round shows the same content in the same states.** Enumerate the states
from the real system — for a result-rendering surface that means every result shape,
including the failure and refusal states, not just the happy path. States nobody mocks are
states nobody designs, and they ship as whatever fell out.

**Use the system's real copy, never placeholder text.** A direction is judged on the
sentences that actually ship. Lorem, or invented marketing copy, produces a choice that
does not survive contact with the real words.

**Each option states its own thesis and its own risk.** A named direction the operator can
argue with beats an unlabelled variation. If two options cannot be told apart in a
sentence, they are one option.

**Delivery.** Static self-contained HTML in the worktree under a tracked path
(`docs/design/<topic>/`) is the default and the most portable: the operator opens files,
nothing leaves the machine, and the options are versioned beside the code they will become.
Where the host offers artifact publishing and the operator prefers it, publish — but write
the files to the worktree regardless, because a published page is not a tracked artifact.
**Verify options render before handing them over** — screenshot them, or open them — rather
than shipping unviewed markup.

**Each round is one commit plus one card note.** The commit carries the option files; the
note carries what each direction is, what it risks, and what is being asked of the
operator. The card does not move.

**Ask for a selection explicitly**, and make the question answerable: name the directions,
say what distinguishes them, and say what happens next. Then **stop**. An operator
round-trip is the point of this skill; filling the wait by starting to implement a favourite
defeats it.

**Subsequent rounds respond to what the operator said.** Round 2 is not three more
directions — it is usually one direction developed further, or a hybrid the feedback
implied, or the same directions with a discovered constraint applied. Record what changed
and why in the round's note, so the path to the final choice is legible to someone reading
the card later.

## Phase 4 — DECIDE

The selection is an artifact or it did not happen. An operator saying "B, but with A's
scale" in conversation is a decision that exists nowhere a future implementer can read.

**Write a decision record** — tracked, in the project's decisions home
(`docs/decisions/<task>-<topic>.md`, or wherever the project keeps them):

- **What was chosen**, named, with a pointer to the option file that shows it.
- **What was rejected and why** — the rejected directions are the record's most valuable
  half. They are what stops a later editor from "improving" the design back into something
  already considered and declined.
- **Modifications** the operator asked for on top of the chosen direction.
- **The constraints from Phase 2** that the design must continue to satisfy, restated —
  this is what the implementer will be checked against.
- **Open questions the design raises** that implementation must resolve.

Commit it, and note it on the card. This record is the input to Phase 5, and it is what a
fresh session reads to continue the work without re-litigating the choice.

## Phase 5 — SPEC AND HAND OFF

Now the spec can be written, because there is something to write about.

1. **Claim the spec number** (`spec-bridge:link` was deliberately deferred to here) —
   check for collisions against `origin/main` before taking an `NNN`, since concurrent
   sessions take numbers constantly.
2. **Author the Spec Kit cycle on the claimed branch**: `spec.md` (requirements, mapped to
   the card's acceptance criteria, written against the chosen direction), `plan.md` (the
   how, checked against the constitution and the Phase 2 constraints), `tasks.md` (real
   phased breakdown — this is what the bridge derives phase ACs from). The decision record
   is cited by the spec, not copied into it.
3. **Run `spec-bridge:link`** so the card carries its Spec marker and its phase acceptance
   criteria, and the bridge's Stop gate arms against real phases.
4. **Hand off implementation.** Either dispatch it on this branch at the appropriate tier,
   or hand the task to `pdlc:sweep` as a normal spec-driven lane — the branch, the spec, and
   the decision record are exactly what a sweep lane expects to find. One task, one branch,
   one PR: the design rounds and the implementation land together in the task's single PR,
   with the option files and decision record part of the history that justifies it.

## Cadence rules that hold across every phase

- **The card stays In Progress from Phase 1 to merge.** Rounds do not move it. A status
  can never exceed the artifacts that prove it, and neither can it lag them: work in
  flight is In Progress, however many round-trips it takes.
- **Every round leaves a commit and a note.** Design conversation is the most volatile
  state in the lifecycle — it lives in chat, and chat is lost. If a round happened and the
  repo cannot show it, it did not happen.
- **The operator decides; the skill records.** Every selection, rejection, and modification
  is the operator's, and every one of them is written down.
- **Constraints are discovered early or they invalidate rounds.** Phase 2 is not optional
  overhead; it is the cheapest phase to be thorough in.
- **Long-running means resumable.** At any point, a fresh session should be able to read
  the card notes, the option files, and the decision record, and know exactly where the
  work stands. Test this by asking: if this session ended right now, what is lost? The
  answer must be "nothing".
