---
name: pr-review-sweep
version: 0.1.0
description: Work a GitHub pull-request review end to end — read the review and every child comment, triage each one (fix / pass with a reasoned reply / already covered by an epic or ticket / defer to its own task), card the accepted fixes and the deferrals on the Backlog board, run pdlc:sweep over the fix tasks, then reply on each review thread with the fix commit or the reason for passing. Use when the user hands over a PR review URL or comment link and says "address these comments", "examine this review and its children", "triage the PR feedback", "fix the review comments and reply", or "pass on what's not valid but say why". Not for reviewing a PR (that is a review skill), not for evaluating merged work (pdlc:refactor-triage), and not for a task set that did not come from review comments (pdlc:sweep directly).
---

# pdlc:pr-review-sweep — review comments → triage → tasks → sweep → replies

A PR review is a batch of small findings from someone who has read the diff. Handling
it well means three things the reviewer cannot see from outside: which comments are
actually right, which are already tracked elsewhere, and which belong in a later change.
This skill is the loop around that judgment: **read → triage → card → sweep → reply**,
leaving a durable record at each step so the thread, the board, and the branch agree.

It lives in pdlc because it composes `pdlc:sweep` and the `backlog` CLI; domain plugins
compose only through files + gates.

Artifacts of record: the **triage record** (every comment's disposition with its
reason, tracked — `docs/reviews/pr-<N>-review-<review-id>-triage.md`), the **board
tasks** (one per accepted fix or deferral, each citing its comment id), and the
**replies** on the PR threads.

## What it does NOT do

- It does **not review the PR.** The reviewer's findings are inputs; this skill judges
  them, it does not add its own. A new finding it trips over becomes a task or a note,
  not an unrequested review comment.
- It does **not implement.** Fixes are board tasks executed by `pdlc:sweep`'s
  dispatched implementers; this skill's hands touch the triage record, the board, and
  the thread replies.
- It does **not open pull requests.** "Create the PR" in a request about a *deferred*
  item means "put it somewhere trackable and link it": see **Deferral = task, not PR**.

## Precondition gate

1. **A PR reference that resolves.** A review URL (`…/pull/N#pullrequestreview-ID`),
   a comment URL, or a bare PR number plus repo. Resolve it with `gh`; if `gh` is not
   authenticated, stop and say so — do not fall back to guessing.
2. **A `backlog/` board and the sweep's own preconditions** (`.specify/`, root clean
   on the default branch). Those are `pdlc:sweep`'s gate; check them here, in Phase 4's
   precondition probe, not first — triage needs only `gh`.
3. **Find where the code actually is.** The checkout you were started in is often *not*
   the PR head: a worktree cut from the default branch has none of the PR's files
   (field case: reviewing PR #43 from a worktree on `master` while the code lived on
   `poc/vcs-port`). Run:

   ```bash
   gh pr view <N> --json headRefName,headRefOid,baseRefName,state
   git fetch origin <headRefName>
   git worktree list    # is the head branch already checked out somewhere?
   ```

   Read the comments' `path:line` against the **head SHA the review was written at**
   (`pull_request_review.commit_id`), not against whatever HEAD is now — lines move.
   Fixes are cut from `origin/<headRefName>`, never from the default branch, and the
   head branch's own worktree (often locked, possibly behind origin) is only touched at
   landing, by fast-forwarding it first.

## Phase 1 — READ

```bash
gh api repos/<o>/<r>/pulls/<N>/reviews/<review-id> --jq '{user:.user.login,state,body,commit_id}'
gh api repos/<o>/<r>/pulls/<N>/reviews/<review-id>/comments --paginate \
  --jq '.[] | {id,in_reply_to_id,path,line,original_line,body,user:.user.login}'
gh api repos/<o>/<r>/pulls/<N>/comments --paginate   # replies / sibling threads, when the review has children
```

Read the review body as well as the inline comments — it usually ranks them ("the two I'd
look at first") and states what the reviewer verified live versus read. That ranking is
evidence for triage; keep it. Collect every comment id, its path/line, and any child
replies (`in_reply_to_id`). Anything the reviewer says they did **not** run is a claim
you must verify against the code before accepting it.

## Phase 2 — TRIAGE

For **every** comment, read the code it names at the review's `commit_id` and at the
current head, and assign exactly one disposition:

| Disposition | Test | What happens |
| --- | --- | --- |
| **fix** | The defect is real; the reviewer's repro (or yours) shows it. | Board task → sweep → reply with the commit. |
| **pass — not valid** | The claim is wrong, already handled, or out of the PR's contract. | Reply with the reason and the evidence (file:line, a test, a spec/decision record). No task. |
| **pass — covered** | An existing epic/ticket already owns it (e.g. the Jira epic the user named, its children, or an existing board task). | Reply linking the ticket. No new task — unless the gap is easy to fix now **or** a blocker for other work, in which case it is a **fix**. |
| **defer** | Real but not a blocker for this change, and better handled in its own task/PR. | Board task (labelled `deferred`) → reply linking it. Not swept this round. |

Rules that keep the triage honest:

- **Back every pass with evidence** a reader can check — the code line, a test name, a
  decision-record id. "I disagree" is not a reason. A pass the reviewer can refute in one
  reply is a fix you declined to do.
- **Check the named epic yourself** before marking anything covered: read the epic and
  its linked children (Jira MCP when present, else the board), and match on the actual
  defect, not on the epic's theme. Covered means a ticket *names this defect*.
- **Reproduce before you fix.** A comment that says "I ran this and got X" is cheap to
  re-run; do it, so the fix task carries a failing case.
- **Parity claims need the baseline.** "Matches master's behaviour" (a reviewer's own
  non-blocking note, say) is a defer-with-record, not a silent drop: check the baseline,
  then card the decision so it is revisited deliberately.
- **Do not split by effort alone.** An easy fix inside the same file as a harder one still
  rides the sweep as its own task; the sweep's lanes handle the overlap.

Write the **triage record** (table: comment id · path:line · disposition · reason/evidence
· task id once carded) and commit it. This is the artifact the next session reads instead
of re-triaging.

**Operator checkpoint:** if the user authorized "decide each one yourself", proceed;
otherwise show the disposition table and get a go-ahead before carding. Every *pass*
becomes a public reply under the operator's name — they should know which ones.

## Phase 3 — CARD

One task per **fix** and per **defer**, via the `backlog` CLI/MCP (never hand-edit task
files; see `docs/board-verbs.md`):

- Title leads with a stable review id (`PR43-5: …`), so threads and tasks cross-reference.
- Description: the reviewer, the comment id/URL, path:line, the defect in one paragraph,
  and the suggested fix. Acceptance criteria are checkable — include the **test that would
  have caught it**, not only the behaviour.
- Labels: `pr<N>-review` on all; `deferred` on defers; carry the host's own
  follow-up/needs-merge labels (`docs/task-labels.md`) when the work depends on code that
  is not on the default branch yet.
- Priority from the reviewer's ranking and blast radius, not from effort.

Add the task id back into the triage record. Check the board for an existing task that
already covers a finding before creating a duplicate.

### Deferral = task, not PR

A request like "if you pass because it should be handled separately, create the PR and
link to it" has two readings: *open a pull request* or *open a ticket*. Resolve it from
artifacts, not preference:

1. If the host forbids PRs for this work (a standing order — e.g. a proof of concept with
   "no PRs until the whole thing is done") or one-task-one-PR means a deferral with no
   code has nothing for a PR to carry, it is a **board task**. Say so in the reply.
2. If the host's flow does want a branch/PR per deferral and the user plainly asked for
   one, open it per the host's rules — but only after asking once, because a PR is
   outward-facing and hard to retract.
3. Never open a PR just to have something to link.

State which reading you used in the final report, so the operator can correct it.

## Phase 4 — SWEEP

Run `pdlc:sweep` over the **fix** tasks only (deferred tasks are named as excluded in the
invocation). Pass the sweep what it cannot discover:

- **Base:** the PR head branch at its origin SHA (Precondition 3), not the default branch.
- **Standing orders override sweep defaults.** Read the host's CLAUDE.md and memory for
  rules like *no pull requests*, *push only one branch*, *merge in, never rebase*. The
  sweep's own defaults — push the claim branch immediately, open one PR per task — are
  suspended where such a rule exists: keep task branches local, open no PRs, land by merge
  into the head branch, push only that branch. Put the rule in the sweep's invocation and
  in the runbook's first lines; a rule that lives only in chat is not a rule the next
  session has.
- **Overlap hints:** list which tasks share files, so lane construction starts from the
  real footprints.
- **Spec Kit may be root-local.** Hosts often keep `.specify/` and `specs/` untracked and
  git-excluded (`.git/info/exclude`); a fresh worktree then has neither and the
  precondition looks failed when it is not. Check the **repository root** (`git rev-parse
  --git-common-dir`'s parent), including `specs/` numbering, before treating it as missing.
  If it is genuinely absent, stop and offer the sweep's two real options — install it, or
  an operator-signed escape line for this one sweep — and wait; never decide it inline.
- **Lane sign-off is the operator's.** Propose lanes, get the go-ahead (the sweep already
  requires this); parallel lanes are cheap but a wrong overlap guess costs a merge each.

Implementation goes to the tier agent named by the project's rubric
(`.claude/model-tiers.json`); this skill and the orchestrating session do not edit the
code the review is about.

## Phase 5 — REPLY

Replies are **outward-facing**. Post them only after the fix is somewhere the reviewer can
see it, and confirm with the operator first unless they have already authorized replying.

- **Fix:** `Fixed in <short-sha> — <one line of what changed + the test that covers it>.`
  If the commit is local (standing orders forbade pushing task branches), the SHA is a dead
  link until the head branch is pushed: reply after that push, or say plainly "fixed on the
  head branch, lands with the next push".
- **Pass — not valid / covered:** the reason and the evidence, no defensiveness. Link the
  ticket for *covered*.
- **Defer:** the task id (or URL) and the reason it is separate.
- Post as a reply to the comment, not a new top-level review:

  ```bash
  gh api repos/<o>/<r>/pulls/<N>/comments/<comment-id>/replies -f body="$(cat reply.md)"
  ```

  Build bodies from files; never interpolate markdown into a single-quoted shell string —
  apostrophes and newlines silently corrupt it (the same defect class this loop often finds
  in other people's PRs).
- Reply to the **review comment**, then — only if the host's convention wants it — a short
  summary comment on the PR listing the dispositions. Do not resolve the threads: that is
  the reviewer's call.

Update the triage record with each reply's URL.

## Output gate

Prove the round before declaring it: every comment in the review has a disposition in
the triage record; every **fix** task is Done via the sweep (or reported as exactly what
remains); every **defer** has a task and a reply linking it; every **pass** carries
evidence; every reply is posted (or explicitly held, with why); and no host standing order
was violated (`git branch -r` shows no stray task branches, no unrequested PRs exist).
Anything short of that is reported as what remains, not rounded up.

## Handing off

Suggest, don't start: the deferred tasks for a later sweep; a re-ground
(`/grounding-wiki:wiki-update`) if merged fixes touched pinned sources; the reviewer's
next-round re-review request. Capture any reusable lesson from the pass reasons in the
host's decision record, so the next review does not re-argue it.
