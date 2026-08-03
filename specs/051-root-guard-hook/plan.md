# 051 — implementation plan

## Constitution check

**This project has no ratified constitution.** `.specify/` is absent (this repo authors its
Spec Kit artifacts by hand under the sweep runbook's operator-signed escape line), so there
is no `constitution.md` to check against. Stating that plainly is the required substitute;
the plan is checked against the project's actual grounding instead:

| Grounding doc | What it binds here |
|---|---|
| `CLAUDE.md` — "Enforcement is split by design" | the sentence ruling B may require this PR to amend |
| `docs/skill-patterns.md` §5 | `gates/` = read-only checkers, `scripts/` = operational entrypoints; written for Stop hooks, may need extending for `PreToolUse` |
| `docs/wiki/gates-convention.md` | fail-closed: a crashing check is a blocking problem, never a silent no-op |
| `docs/wiki/pdlc-plugin.md` | what pdlc plants today, and via `scripts/plant.mjs` |
| `docs/principles.md` | artifact-grounded action; one TASK, one PR |
| `docs/releasing.md` | released surface ⇒ marketplace bump + edited skill `version:` |
| `docs/design/gates-and-doctrine-sweep-runbook.md` | Lane 1, opus tier, merge-commit landing, same-PR wiki re-pins |

**Tension to resolve, not paper over.** `docs/skill-patterns.md` §5's directory convention
was authored for Stop hooks routed through `lib/gate-runner.mjs`. A `PreToolUse` hook has a
different stdin contract (`tool_input`), a different exit-code meaning, and is not a
"gate" in the lifecycle sense. Decide whether it belongs under a new `pdlc/hooks/`, under
`scripts/`, or warrants extending the documented convention — and **record the choice with
its rationale**. Silently inventing a fourth directory shape is the failure mode.

## Approach

### Start from the real source, not from the card's summary

`/Users/evanstern/Claude/Code/promptworld/scripts/hooks/root-guard-hook.mjs` (522 lines) is
the artifact being replaced. **Read it in full first.** Its header comment is an unusually
complete statement of the policy — the allow paths, the ordering constraints (MERGE_HEAD
checked *before* the board-sync rule; `--amend` denied before both), the option tables
(`COMMIT_LONG_WITH_VALUE`, `COMMIT_SHORT_WITH_VALUE`, `COMMIT_LONG_DENY`), and the
deliberate pre-bash/pre-write asymmetry. **That policy is correct and is being preserved.**
Only the parsing is defective.

Port deliberately: the policy tables and their ordering are the valuable, hard-won part.
Rewriting them from scratch risks losing a subtlety (e.g. that git-global `-p` before the
subcommand is *paginate* and harmless, while `-p` after it is `--patch` and denies).

### The parser (R2) — the actual fix

Replace the two-regex approach with a single **quote-state scanner** that does both jobs in
one pass:

- Walk the command string character by character, tracking: in-single-quote,
  in-double-quote, backslash-escaped.
- A separator character (`;`, `|`, `&`, newline, backtick, `)`) is a boundary **only when
  not inside quotes**.
- Token boundaries are unquoted whitespace; quoted runs accumulate into the current token
  (so `-m "a b"` yields two tokens, not three, and `'it'\''s'` yields one).
- **Unbalanced quote ⇒ parse failure ⇒ fail closed.** An unparseable command is not an
  allowed command. Define this explicitly and test it.

This one change is what makes R1 true: the message text is inside quotes, so it can never
produce a boundary or leak bare words into the pathspec list.

**Do not simply widen the boundary regex.** A negative-lookbehind or a "skip quoted runs"
patch on top of the existing regexes will pass the obvious tests and fail on nesting and
escapes. The scanner is the design.

### R5(a) — cross-repo jurisdiction

The hook already computes an effective directory (`effDir`) from `cd` prefixes and `-C`.
The bug is that when the invocation targets a *different repository*, the guard still
resolves the staged set against `CLAUDE_PROJECT_DIR`. Fix: resolve the invocation's
toplevel from its own `effDir`, and if that toplevel is not inside `CLAUDE_PROJECT_DIR`,
**pass — out of jurisdiction**. This narrows the hook to what it has authority over; it is
a correctness fix, not a loosening, and the test must say so.

### R5(b) — command-position `git`

With real tokenization, a `git` appearing inside a quoted argument is a token *value*, not
a command. Require the `git` token to be in **command position** — start of the segment, or
immediately after a separator/pipeline operator — and the `backlog task edit "…git commit…"`
case stops matching. **Test it directly**: it is the manifestation most likely to regress
silently, because nothing about it looks like a git command.

### R3 — the message

When the exception is denied, carry the *finding* into the message: the offending token as
parsed, and why it disqualified the commit ("read `foo.md` as a pathspec outside
`backlog/`"). Keep the rule text, but lead with the specific.

### Testing shape (R4)

A table-driven test over the hazard characters, each row asserting **both** directions:
- board-sync commit (staged set entirely under `backlog/`) with the hazard in the `-m`
  message ⇒ **allowed**
- out-of-scope commit with the same hazard in the message ⇒ **still blocked**

Plus the verbatim `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
trailer as its own named case — that exact string is the field failure and deserves to be
pinned literally, not just as "a message with a paren".

Test the parser as a **pure exported function** wherever possible; drive the full hook
through its stdin contract for a smaller number of end-to-end cases. A hook testable only
end-to-end is a hook whose parser will not be covered.

## Risks

- **Fail-open regression is the dangerous failure here.** Every change that makes the gate
  accept more must be paired with a test proving what still blocks. R4's both-directions
  rule is the mitigation; treat it as non-negotiable.
- **Posture drift.** If root `CLAUDE.md`'s enforcement sentence is left describing the old
  posture, this PR ships exactly the drift TASK-96 is cleaning up next door. Check it
  explicitly at the end, not as an afterthought.
- **Template edits trigger the re-plant obligation.** If `pdlc/templates/CLAUDE.md`
  changes, re-plant this repo's own block in the same PR — and per standing operator
  convention, **diff against the old rendered template and relocate hand edits, never
  clobber**.
- **TASK-96 (Lane 4) also edits `pdlc/templates/CLAUDE.md`.** This PR merges first; TASK-96
  will reconcile. Keep the template diff minimal and clearly scoped so that merge is cheap.
- **This branch is pin-carrying** (it re-pins `pdlc-plugin.md`): merge `origin/main` in,
  never rebase or squash; the PR lands as a merge commit.

## Verification

In the worktree, and again after every history move:

```
node --test
node scripts/check-docs.mjs
node scripts/sync-version.mjs --check
node grounding-wiki/gates/cli.mjs freshness . docs/wiki
```

Plus a manual proof of R1: in a scratch repo, stage a file under `backlog/` and commit with
the verbatim multi-line `Co-Authored-By` trailer through the hook — it must be accepted with
no workaround.
