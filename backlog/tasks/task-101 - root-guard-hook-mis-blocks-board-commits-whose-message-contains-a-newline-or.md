---
id: TASK-101
title: >-
  root-guard hook mis-blocks board commits whose message contains a newline or
  ')'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-03 00:41'
updated_date: '2026-08-03 02:58'
labels:
  - gates
  - bug
  - downstream-bug-find
dependencies: []
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The hook that enforces "the root checkout is read-only, except board commits" rejects perfectly legal board commits whenever the commit message contains a newline or a closing parenthesis — which the standard Co-Authored-By trailer contains both of. The block message blames the wrong thing, so the session goes hunting through its staged files for a problem that was never there.

As a session doing routine board sync, I want a normal multi-line commit message to be accepted, so I do not lose a cycle to a block that had nothing to do with what I staged.

As a session that just got blocked, I want the refusal to name the real cause, so I fix the message rather than re-staging files that were already correct.

As praxisflux, I want the enforcement of doctrine I plant to be shipped rather than reimplemented per host, so this class of parsing defect is fixed once instead of independently rediscovered in every downstream repo.

## What happens

`pdlc` plants the two-track landing doctrine (board/bookkeeping commits direct to `main`, deliverables by PR — `pdlc/skills/sweep/SKILL.md:364` names it as the planted `pdlc:peer:backlog` grounding block), but ships **no enforcement hook**. The downstream host promptworld hand-rolled one at `scripts/hooks/root-guard-hook.mjs` (its TASK-160) to enforce exactly that carve-out: commits at root are blocked unless scoped entirely to `backlog/`.

That hook classifies a `git commit` by parsing the **raw command string**, not a real argv. Its `parseGitInvocation` first truncates the segment at the first ``[;|&\n`)]``, and only then tokenizes with `("[^"]*"|'[^']*'|\S+)`.

So a `-m` message containing a **newline** or a **`)`** cuts the segment mid-quote. The now-unterminated quote never matches the quoted alternative, so `\S+` shatters the message into bare words; every word that does not start with `-` is collected as a **pathspec**; none of them start with `backlog/`; the board-sync exception is denied and the commit blocks.

Observed on promptworld 2026-08-02 committing a single board card. The staged set was exactly one file under `backlog/` — correct by every rule — and the commit was still refused.

## Why it costs more than one retry

The refusal reads:

> root-guard: blocked `git commit` — direct commits at the root checkout are forbidden EXCEPT board-sync commits scoped entirely to backlog/ (TASK-161: no -a/--patch/--include, every pathspec — or, with none, every staged path — under backlog/)

That describes a **scoping** violation. The scoping was fine. The message sends the reader to `git diff --cached` and the staged set, which look correct, so the actual cause — the shape of the message text — is the last place anyone looks.

The standard trailer this project and its downstreams append carries **both** hazards at once:

```
<subject>
                                              <- blank line: the \n hazard
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
                                 ^^^^^^^^^^^^  <- the ) hazard
```

So the default-correct commit message is the one that reliably trips the gate.

## Workaround (already in use)

Write the message to a file outside the repo and `git commit -F <path>`. `F` is in the hook's `COMMIT_SHORT_WITH_VALUE` set, so the path is consumed as an option value, the pathspec list comes out empty, and the staged-set branch decides — which is the intended path.

## Why this is a praxis card, not only a promptworld one

The defect is in a host's file, but the **gap** is praxisflux's: pdlc plants doctrine whose enforcement every host must build itself, so each one re-implements a raw-string git-command classifier and re-discovers this class of bug independently. A shipped, tested hook is the fix that generalizes. Note the fail-closed posture is correct and worth preserving — the ask is to parse correctly, not to loosen the gate.

## Suggested direction (not yet decided)

- Ship a hardened root-guard hook from `pdlc` (planted like the other peer artifacts) so hosts stop hand-rolling it.
- Parse the command with a real shell-word splitter that honors quotes across newlines, rather than truncating on a character class that can fall inside a quoted string.
- When the exception is denied, say **which** token was read as a pathspec — that alone would have made this self-diagnosing.
- Until shipped: record the `-F` workaround in the planted grounding, so downstream sessions do not each lose a cycle to it.

Spec: specs/051-root-guard-hook
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A board-sync commit scoped entirely to backlog/ is accepted regardless of what its commit message text contains — newlines, parentheses, quotes, semicolons, pipes and backticks all included
- [ ] #2 The standard multi-line Co-Authored-By trailer, verbatim, commits successfully at root without a workaround
- [ ] #3 The command classifier honors quoting across newlines rather than truncating the segment on a character class that can occur inside a quoted string
- [ ] #4 When the board-sync exception IS correctly denied, the refusal names the specific token it read as an out-of-scope pathspec, so the cause is self-diagnosing
- [ ] #5 The gate's fail-closed posture is preserved: no commit that was blocked for genuine scoping reasons becomes allowed by this fix, covered by a test per hazard character
- [ ] #6 Decision recorded on whether pdlc ships the hook (planted like other peer artifacts) or the fix is documented for hosts to apply to their own copy; if shipped, the promptworld copy's divergence is noted
- [ ] #7 Spec phase: Phase 1 — Read the source, decide the home, record the decisions
- [ ] #8 Spec phase: Phase 2 — The quote-state scanner
- [ ] #9 Spec phase: Phase 3 — Port the policy and wire the hook
- [ ] #10 Spec phase: Phase 4 — The both-directions hazard suite
- [ ] #11 Spec phase: Phase 5 — Plant, posture, docs, re-ground
- [ ] #12 Spec phase: Phase 5 — Close the fail-open gap (R2a, blocking for merge)
- [ ] #13 Spec phase: Phase 6 — Plant, posture, docs, re-ground
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
THIRD manifestation, found 2026-08-02 while carding this one. (a) Cross-repo: the hook fires on every Bash commit invocation in a session whose CLAUDE_PROJECT_DIR is the host repo, INCLUDING invocations targeting a different repository — committing this card in ~/Claude/Code/praxis was refused by promptworld's guard, which resolved the staged set against promptworld (nothing staged) instead of the repo being written to. Workaround: pass -C <other-repo>, which the hook honors when computing effDir. A session working two repos cannot commit to the second one normally. (b) Content false-positive: the FIRST attempt to append this very note was itself refused, because the note TEXT mentioned the two words g-i-t and c-o-m-m-i-t adjacently. A 'backlog task edit' command is not a VCS write at all, yet prose describing one is enough to trip the guard. Both share the root cause: the classifier reasons about a raw command STRING rather than the invocation's real argv and target repo.

Sweep dispatch (runbook: docs/design/gates-and-doctrine-sweep-runbook.md, Lane 1). Tier: default implementer. Model ID: claude-opus-4-8, pinned via .claude/agents/opus-implementer.md frontmatter (NOT the dispatch-call model param). Primary claude-opus-5 documented but not surfaced by the subscription (operator ruling C, 2026-08-02). Rubric justification: AC #6 is a one-way door on the suite's enforcement posture (praxisflux ships zero PreToolUse hooks today), and the fix is a shell-word parser whose failure mode is a fail-open gate. Design + security-shaped parsing = default tier, never mechanical. Operator ruling B answered AC #6 SHIP at sign-off, with two riders recorded as gate lines in the runbook.
<!-- SECTION:NOTES:END -->
