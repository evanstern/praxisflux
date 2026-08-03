# 051 — Ship a hardened root-guard hook from pdlc

Board task: **TASK-101** · runbook: `docs/design/gates-and-doctrine-sweep-runbook.md`
(Lane 1, default implementer tier) · governing ruling: **operator ruling B, 2026-08-02 —
SHIP the hook**

## Problem

`pdlc` plants the **two-track landing** doctrine — board/bookkeeping commits direct to
`main`, deliverables by PR (`pdlc/skills/sweep/SKILL.md:364` names it as the planted
`pdlc:peer:backlog` grounding block) — but ships **no enforcement**. Every host that
wants that carve-out enforced builds its own. The downstream host **promptworld** did
(`scripts/hooks/root-guard-hook.mjs`, its TASK-160/161): a `PreToolUse` hook that blocks
commits at the root checkout unless they are scoped entirely to `backlog/`.

That hook classifies a `git commit` by parsing the **raw command string** rather than a
real argv, and the parse is wrong in a way that fires on the repo's own default-correct
commit message.

### The defect, confirmed by reading the source (2026-08-02)

`parseGitInvocation` (promptworld `scripts/hooks/root-guard-hook.mjs:181`) does two things
in order:

```js
const rest = command.slice(gitIndex);
const boundary = /[;|&\n`)]/.exec(rest);          // ← truncates at the FIRST of these
const segment = boundary ? rest.slice(0, boundary.index) : rest;

const tokens = [];
const tokRe = /("[^"]*"|'[^']*'|\S+)/g;           // ← quoted-string alternative
while ((t = tokRe.exec(segment))) tokens.push(stripQuotes(t[1]));
```

The boundary class `[;|&\n`)]` is applied to the raw string **without regard for
quoting**. A `-m` message containing a **newline** or a **`)`** therefore cuts the segment
mid-quote. The now-unterminated quote never matches `"[^"]*"`, so `\S+` shatters the
message into bare words. Every word not starting with `-` is collected as a **pathspec**;
none start with `backlog/`; the board-sync exception is denied; the commit blocks.

**The default-correct message carries both hazards at once:**

```
<subject>
                                              ← blank line: the \n hazard
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
                                 ^^^^^^^^^^^^  ← the ) hazard
```

So the commit message this project and its downstreams are told to write is precisely the
one that reliably trips the gate.

### Why it costs more than one retry

The refusal reads:

> root-guard: blocked `git commit` — direct commits at the root checkout are forbidden
> EXCEPT board-sync commits scoped entirely to backlog/ (TASK-161: no -a/--patch/--include,
> every pathspec — or, with none, every staged path — under backlog/)

That describes a **scoping** violation. The scoping was fine. The message sends the reader
to `git diff --cached` and the staged set, which look correct — so the actual cause, the
shape of the message text, is the last place anyone looks. Observed on promptworld
2026-08-02 committing a single board card, staged set exactly one file under `backlog/`.

### Two further manifestations (card Implementation Notes, 2026-08-02)

Both share the same root cause — the classifier reasons about a raw command **string**
rather than the invocation's real argv and target repo:

- **(a) Cross-repo.** The hook fires on every Bash commit invocation in a session whose
  `CLAUDE_PROJECT_DIR` is the host repo, **including invocations targeting a different
  repository**. Committing a card in `~/Claude/Code/praxis` was refused by promptworld's
  guard, which resolved the staged set against promptworld (nothing staged) instead of the
  repo being written to. Workaround: pass `-C <other-repo>`, which the hook honors when
  computing `effDir`. A session working two repos cannot commit to the second one normally.
- **(b) Content false-positive.** The first attempt to append that very note was itself
  refused, because the note **text** mentioned the words "git" and "commit" adjacently. A
  `backlog task edit` command is not a VCS write at all, yet prose describing one trips
  the guard.

### Why this is a praxis card, not only a promptworld one

The defect is in a host's file; the **gap** is praxisflux's. pdlc plants doctrine whose
enforcement every host must build itself, so each one re-implements a raw-string
git-command classifier and re-discovers this bug class independently. **Three
manifestations already.** A shipped, tested hook is the fix that generalizes.

**The fail-closed posture is correct and must be preserved.** The ask is to parse
correctly, not to loosen the gate.

## Operator ruling B (2026-08-02) — binding

AC #6 asked whether pdlc ships the hook or documents the fix for hosts. The operator
answered **SHIP**: pdlc plants a hardened root-guard hook like its other peer artifacts.
The spec implements that; it does not re-open the question. Two obligations ride with it:

1. **Own the precedent gap.** praxisflux ships **zero `PreToolUse` hooks today** (verified
   2026-08-02 by grep across the repo). Every hook the suite ships is a **Stop** hook
   routed through `lib/gate-runner.mjs`. This is a new hook shape for the suite, and the
   spec must name it as such rather than sliding it in.
2. **Reconcile the posture, in the same PR.** Root `CLAUDE.md` currently states: *"the
   Stop hooks plugins ship are advisory/opt-in — local pressure while you work, never
   guaranteed present; CI … is the authoritative enforcement point."* A shipped,
   command-blocking `PreToolUse` hook planted into every host is a **change of
   enforcement posture**. If that sentence becomes false, **amend it in this PR**. A new
   enforcement surface that leaves the always-on grounding describing the old posture is
   exactly the drift TASK-96 is next door cleaning up — do not create more of it.

## Requirements

Mapped to the board card's acceptance criteria.

### R1 — message text can never deny the exception (AC #1, AC #2)

- A board-sync commit scoped entirely to `backlog/` is **accepted regardless of what its
  commit message text contains** — newlines, parentheses, quotes, semicolons, pipes and
  backticks all included.
- The standard multi-line `Co-Authored-By` trailer, **verbatim**, commits successfully at
  root with **no workaround** — no `-F <file>`, no `-C <repo>`.

### R2 — quote-aware parsing (AC #3)

The classifier honors quoting **across newlines** rather than truncating the segment on a
character class that can occur inside a quoted string. Concretely: find the invocation's
command-separator boundary by **scanning with quote state**, so a separator character
inside a quoted string is not a boundary; then tokenize with the same quote awareness.
A real shell-word splitter is the shape; the two-regex approach is the defect.

**Single-quote, double-quote, and backslash-escape handling must all be explicit**, and
the behavior for an *unbalanced* quote (a genuinely malformed command) must be **defined**.

> **Reconciliation (Phase 3 + orchestrator verification, 2026-08-02).** This requirement
> originally read "defined **and fail-closed** — an unparseable command is not an allowed
> command." That conflicted with the policy this spec elsewhere requires be ported
> *verbatim*: the upstream hook is **fail-OPEN** on malformed input (Phase 1 inventory —
> exit 0 on "no git match, out of jurisdiction, malformed stdin, internal error"). The
> spec was internally inconsistent; Phase 3 surfaced it rather than silently picking a side.
>
> **Resolved as: the SCANNER fails closed, the HOOK fails open on residual `ok:false`.**
> The scanner never fabricates tokens from an unparseable command — that is the whole
> defect being fixed, and it is preserved absolutely. The hook, after stripping heredoc
> bodies, allows a command it still cannot parse.
>
> **RETRACTED — the invariant this rested on is FALSE (Phase 4, 2026-08-02).**
>
> This block previously claimed "unparseable ⊆ unexecutable": that every command the
> scanner reports `ok:false` for is also rejected by bash, so fail-open could not pass a
> commit. The orchestrator's probe that "verified" it was **not representative** — it
> tested benign `$'hello'`, which parses fine, and generalized to all ANSI-C quoting.
> Phase 4 tested the realistic forms and found two counterexamples, since re-confirmed by
> the orchestrator:
>
> | form | scanner | `bash -n` | new hook | OLD hook |
> |---|---|---|---|---|
> | `git commit -m $'it\'s a fix' README.md` | `ok:false` | **VALID** | **ALLOW** | **BLOCK** |
> | `git commit -m msg README.md\` (trailing `\`) | `ok:false` | **VALID** | **ALLOW** | **BLOCK** |
>
> Both are **executable, out-of-scope root commits that the old regex parser blocked and
> the new hook allows.** That is a genuine **AC #5 regression** — "no commit that was
> blocked for genuine scoping reasons becomes allowed by this fix" — and it falsifies the
> premise fail-open was justified on. Practical severity is low (an honest sweep emits
> neither ANSI-C quoting nor stray backslashes) but AC #5 is absolute, not probabilistic.
>
> **Required fix (R2a, blocking for merge):** model `$'…'` and `$"…"` in
> `pdlc/hooks/shell-scan.mjs`, and resolve a trailing backslash, so these forms scan
> `ok:true` and are **gated normally** rather than waved through. This is the "parse
> correctly, don't loosen the gate" fix the card asks for, and it **strictly tightens** —
> it converts `ok:false` (allow) into `ok:true` (evaluate), so it cannot make anything
> more permissive.
>
> Fail-open on the *residual* `ok:false` stays, for the reasons below — but the residue
> must first be narrowed to forms bash itself rejects. **TASK-101 must not close with
> AC #5 marked satisfied while the two rows above are pinned as ALLOWED.**
>
> A blanket residual fail-closed was rejected for two concrete reasons: it would block
> non-git commands containing an apostrophe (violating "non-git commands always pass"), and
> it would block out-of-jurisdiction commits (R5(a)), because an `ok:false` result carries
> no reliable scope information — you cannot tell whether an unparseable command is even a
> git command, let alone one at the root checkout.

### R3 — self-diagnosing refusals (AC #4)

When the board-sync exception **is** correctly denied, the refusal **names the specific
token it read as an out-of-scope pathspec**. That alone would have made the original
incident self-diagnosing. The current message describes the rule; the new one must
describe the *finding*.

### R4 — fail-closed posture preserved, proven per hazard (AC #5)

- **No commit that was blocked for genuine scoping reasons becomes allowed by this fix.**
- **A test per hazard character** — newline, `)`, `'`, `"`, `;`, `|`, backtick — each
  proving *both* directions: the legitimate board-sync commit carrying that character in
  its message is allowed, **and** a genuinely out-of-scope commit carrying the same
  character is still blocked. A one-directional test suite proves only that the gate got
  looser.
- The existing deny paths must survive unchanged: `--amend` denied outright; `-a/--all`,
  `--interactive`, `-p/--patch`, `--include`, `--pathspec-from-file`; rebase and
  force-push blocked repo-wide; `merge --squash`, `cherry-pick`, `revert`, `am`, and
  branch creation at root.

### R5 — the two further manifestations (card Implementation Notes)

The spec must **state explicitly whether it fixes both, and defer only with a reason**:

- **(a) Cross-repo targeting.** An invocation whose effective directory resolves outside
  `CLAUDE_PROJECT_DIR` is **out of jurisdiction** and must pass — the guard governs its own
  repo, not every repo a session touches. This is a correctness fix, not a loosening: the
  hook currently blocks writes it has no authority over. **Recommended: fix in scope.**
- **(b) Content false-positive.** A command that is not a VCS write at all (e.g.
  `backlog task edit …` whose *argument text* contains the words git and commit) must not
  be classified as a git invocation. This follows from R2's real tokenization plus
  requiring the `git` token to be in **command position** — but it must be **tested
  directly**, since it is the manifestation most likely to regress silently.
  **Recommended: fix in scope.**

### R6 — where it ships, and how it is planted (AC #6)

- The hook ships from `pdlc` and is planted like the other peer artifacts. The implementer
  chooses and **records** the exact home (e.g. `pdlc/hooks/` + a `scripts/` entry, mirroring
  the `gates/` vs `scripts/` convention in `docs/skill-patterns.md` §5 — noting that
  convention was written for Stop hooks and may need extending for a `PreToolUse` shape).
- **Record the decision on default-on vs opt-in wiring** in `.claude/settings.json`, with
  its rationale. The operator chose "ship it", not specifically "plant it enabled by
  default in every host" — so this is a real sub-decision the spec must settle explicitly
  rather than let the plant mechanics decide by accident.
- **Note the promptworld copy's divergence** (AC #6's second clause) so that host can tell
  what it is replacing and what changed.
- Zero npm dependencies, Node ≥18, ESM — matching the chassis convention.

### R7 — tests, docs, and the grounding

- Tests in the repo's `node --test` suite, following `test/pdlc.test.mjs`'s existing style.
- `pdlc/README.md` documents the hook and its wiring.
- **Amend root `CLAUDE.md`'s enforcement-split sentence** if this PR makes it false (see
  ruling B obligation 2), and re-plant the block if `pdlc/templates/CLAUDE.md` changes.
- `docs/wiki/pdlc-plugin.md` re-verified and amended (**NEEDS-REVIEW**, not stamp-only) —
  its sources include `pdlc/README.md` and `pdlc/scripts/plant.mjs`, both likely touched.
  `docs/wiki/gates-convention.md` too if the hook lands as a new gate shape.
- Until/unless the hook is adopted by a host, record the **`-F` and `-C` workarounds** in
  the planted grounding so downstream sessions do not each lose a cycle to the old copy.

## Out of scope

- Fixing promptworld's copy in place. This ships the replacement; adopting it is
  promptworld's own card.
- Extending the guard to new rules (new blocked subcommands, new exceptions). Parse
  correctly; do not re-scope the policy.
- The `pre-write` half's policy. It may be ported as-is if the chosen home carries it, but
  its rules are not under revision here.

## Version bump

Touches released surface (`pdlc/`, and `pdlc/templates/CLAUDE.md` if grounding changes) ⇒
marketplace bump via `node scripts/sync-version.mjs <next-free>` **at merge-readiness**,
plus each edited skill's own `version:`. Current lockstep 0.52.0.

## Definition of done

All six card ACs checked; ruling B's two obligations discharged (precedent gap named, the
posture sentence reconciled in this PR); R5's two manifestations each explicitly fixed or
explicitly deferred with a reason; a test per hazard character proving both directions;
`docs/wiki/pdlc-plugin.md` amended and honestly re-pinned in the same PR.
