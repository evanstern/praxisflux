# 051 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Read the source, decide the home, record the decisions

- [x] Read `/Users/evanstern/Claude/Code/promptworld/scripts/hooks/root-guard-hook.mjs` in
      full (522 lines, read-only — never modify another repo) and record in the Notes
      section: the policy tables, the ordering constraints, and the pre-bash/pre-write
      asymmetry that must be preserved
- [x] Verify the defect first-hand: confirm the boundary regex and the tokenizer regex
      behave as spec.md describes on the verbatim Co-Authored-By trailer; record the
      reproduction
- [x] Confirm praxisflux ships zero `PreToolUse` hooks today; record how you verified it
- [x] **Decide and record R6's home** — `pdlc/hooks/` vs `scripts/` vs extending
      `docs/skill-patterns.md` §5's convention — with rationale
- [x] **Decide and record the default-on vs opt-in wiring choice** for
      `.claude/settings.json`, with rationale. Ruling B said "ship it", not necessarily
      "enabled by default in every host"
- [x] **Decide and record** whether R5(a) cross-repo and R5(b) content-false-positive are
      both fixed in scope (both recommended); a deferral needs a stated reason
- [x] Commit the recorded decisions (spec-dir only; no implementation yet)

## Phase 2 — The quote-state scanner

- [x] Implement the single-pass quote-state scanner: single quotes, double quotes,
      backslash escapes, and separators (`;` `|` `&` newline backtick `)`) that are
      boundaries **only outside quotes**
- [x] Unbalanced quote ⇒ parse failure ⇒ **fail closed** (an unparseable command is not an
      allowed command); defined and tested
- [x] Require the `git` token to be in **command position** (R5(b))
- [x] Export the scanner as a pure function so it is unit-testable without the stdin
      contract
- [x] Unit tests for the scanner alone: quoted separators, nested/escaped quotes,
      multi-line messages, unbalanced input
- [x] Commit

## Phase 3 — Port the policy and wire the hook

- [ ] Port the policy tables and their ordering **verbatim in behavior**: `--amend` denied
      before both allow paths; MERGE_HEAD checked before the board-sync rule; the
      `COMMIT_LONG_WITH_VALUE` / `COMMIT_SHORT_WITH_VALUE` / `COMMIT_LONG_DENY` sets; the
      git-global `-p` (paginate) vs post-subcommand `-p` (`--patch`) distinction
- [ ] Preserve every existing deny path: rebase and force-push repo-wide;
      `merge --squash`, `cherry-pick`, `revert`, `am`, branch creation at root
- [ ] R5(a): an invocation whose resolved toplevel is outside `CLAUDE_PROJECT_DIR` is out
      of jurisdiction and passes
- [ ] R3: a correct denial names **the specific token read as an out-of-scope pathspec**
- [ ] Zero npm dependencies, Node ≥18, ESM
- [ ] Commit

## Phase 4 — The both-directions hazard suite

- [ ] Table-driven test over hazard characters — newline, `)`, `'`, `"`, `;`, `|`,
      backtick — each row asserting **both**: legitimate board-sync commit with the hazard
      in its message is **allowed**, AND a genuinely out-of-scope commit with the same
      hazard is **still blocked**
- [ ] The verbatim `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
      trailer pinned as its own named case — it is the field failure
- [ ] R5(b) tested directly: `backlog task edit "…git commit…"` is not classified as a git
      invocation
- [ ] R5(a) tested directly: an invocation targeting a different repository passes
- [ ] Confirm no previously-blocked scoping violation became allowed — enumerate the deny
      cases covered
- [ ] `node --test` green; report the real count
- [ ] Commit

## Phase 5 — Plant, posture, docs, re-ground

- [ ] Wire the hook per Phase 1's recorded planting decision; `pdlc/scripts/plant.mjs`
      updated if it plants the hook
- [ ] `pdlc/README.md` documents the hook and its wiring
- [ ] Record the **`-F` and `-C` workarounds** in the planted grounding for hosts still on
      an unpatched copy
- [ ] Note the **promptworld copy's divergence** (AC #6) — what changed, so that host can
      tell what it is replacing
- [ ] **Ruling B obligation:** check root `CLAUDE.md`'s "Enforcement is split by design"
      sentence. If this PR makes it false, amend it here. Record the check either way
- [ ] If `pdlc/templates/CLAUDE.md` changed: re-plant this repo's block in the same PR
      (`plant.mjs --check` first, then `--force` after diffing) — **relocate hand edits,
      never clobber**
- [ ] Amend `docs/wiki/pdlc-plugin.md` as **NEEDS-REVIEW** — re-verify prose against the
      diff, amend, THEN re-pin. Same for `docs/wiki/gates-convention.md` if the hook lands
      as a new gate shape
- [ ] Regenerate `CAPSULES.md` if any `description:` changed
- [ ] Bump at merge-readiness: `node scripts/sync-version.mjs <next-free>` + each edited
      skill's own `version:`
- [ ] All gates green: `node --test`, `check-docs`, `sync-version --check`, freshness
- [ ] Manual proof of R1: in a scratch repo, a `backlog/`-scoped commit with the verbatim
      multi-line trailer is accepted through the hook with **no workaround**
- [ ] Commit; PR opens only after every box above is ticked

## Notes

(Implementers append recorded decisions here — this section is part of the phase handoff
artifact set. Phase 1's four recorded decisions are required entries.)

### Phase 1 recorded decisions (2026-08-02, opus-implementer, TASK-101)

Source read in full: `/Users/evanstern/Claude/Code/promptworld/scripts/hooks/root-guard-hook.mjs`
(523 lines, read-only — not modified). Everything below is the inventory Phase 3 ports.

#### 1. Policy inventory — what is being PRESERVED (only the parsing is defective)

**Two subcommands, one process** (`argv[2]` selects): `pre-bash` (PreToolUse on Bash),
`pre-write` (PreToolUse on Write|Edit|NotebookEdit). Exit codes for both: **0 = allow**
(no git match, out of jurisdiction, malformed stdin, internal error, or all rules pass —
fail-OPEN on everything except an actual rule violation); **2 = block** (a rule fired;
message on stderr). No env-var bypass by design.

**pre-bash rules, in the order the code applies them per git invocation:**

- **Repo-wide (root AND worktrees):**
  - `rebase` → block (rebases forbidden repo-wide).
  - `push` with `-f` or any `--force*` (`--force`, `--force-with-lease[=…]`,
    `--force-if-includes`) → block.
- **Root-only** (invocation's `rev-parse --show-toplevel` realpath-equals
  `$CLAUDE_PROJECT_DIR`; worktrees under `.worktrees/` have their own toplevel and pass as
  NOT root):
  - `commit`: **`--amend` denied OUTRIGHT — checked BEFORE both allow paths** (it rewrites
    the previous root commit; `--amend` with MERGE_HEAD present is not a merge conclusion).
    Otherwise allowed only if one of two allow paths holds, **checked in this order**:
    1. **MERGE_HEAD present** (`rev-parse -q --verify MERGE_HEAD` status 0) → concluding a
       merge → allow. **Checked FIRST** so a conflicted-merge conclusion is never forced
       through the board-sync rule.
    2. **board-sync exception (TASK-161)** — `isBoardSyncCommit`. Qualifies iff ALL hold:
       no `-a/--all`, `--interactive`, `-p/--patch`, `-i/--include` among post-subcommand
       args; no `--pathspec-from-file` (cannot statically verify); AND either every explicit
       pathspec arg is under `backlog/` (option VALUES like the `-m` message are never
       pathspecs), or — with no pathspecs — `git diff --cached --name-only` is **non-empty
       and entirely under `backlog/`**. Fail-CLOSED within the exception: anything
       unverifiable ⇒ not board-sync ⇒ the commit blocks.
  - `cherry-pick`, `revert`, `am` → block.
  - `merge --squash` → block (plain `merge` is ALLOWED — it is how branches land).
  - `checkout -b/-B`, `switch -c/-C/--create/--force-create` → block (branch creation at root).
  - Everything else at root (reads, `fetch`, `pull`, plain `merge`, `push`, `worktree
    add/remove`, `branch -d`, status/log/diff) → allow.

**Option tables (verbatim, `git commit` classifier):**
- `COMMIT_LONG_WITH_VALUE` = `--message --file --reuse-message --reedit-message --fixup
  --squash --author --date --cleanup --pathspec-from-file --template --trailer` (space-sep
  long opts whose NEXT token is a value, never a pathspec; `--opt=value` inline consumes
  nothing extra).
- `COMMIT_LONG_DENY` = `--all --interactive --patch --include`.
- `COMMIT_SHORT_WITH_VALUE` = `'mFcCt'` (cluster chars consuming a value: remainder of token,
  else next token).
- `COMMIT_SHORT_DENY` = `'api'` (a=`--all`, p=`--patch`, i=`--include`).
- Git-global option tables (parsed BEFORE the subcommand): `GIT_GLOBAL_WITH_ARG` =
  `-C -c --git-dir --work-tree --namespace`; `GIT_GLOBAL_NO_ARG` =
  `-p --paginate --no-pager --exec-path`; `GIT_GLOBAL_INLINE_PREFIXES` =
  `--git-dir= --work-tree= --exec-path= --namespace=`.

**Ordering constraints that MUST be preserved (Phase 3 regression risks):**
- `--amend` denied before BOTH allow paths (not just before board-sync).
- MERGE_HEAD checked BEFORE the board-sync rule.
- **git-global `-p` (paginate, before the subcommand) vs post-subcommand `-p` (`--patch`,
  denies).** Same character, opposite meaning by position — the two-layer parse
  (`parseGitInvocation` walks globals to find the subcommand, then `isBoardSyncCommit`
  walks the post-subcommand args) is what keeps them apart. Likewise `-C`/`-c` mean
  git-global (path / config) before the subcommand but commit value-opts (reuse-message)
  after it.
- `effDir` chaining: hook cwd → last `cd <path>` before the invocation → each `-C <path>`
  in order (each relative to the prior effDir, matching git's own `-C` chaining).
- `--` ends option parsing; everything after is a pathspec.
- Absolute pathspecs realpath-resolve strictly under `<root>/backlog/`; relative must start
  `backlog/` after stripping leading `./`.

**Deliberate pre-bash/pre-write asymmetry (preserve, do not "fix"):** pre-write blocks
Write/Edit of any tracked/would-be-tracked file in the root checkout (allow: outside
`$CLAUDE_PROJECT_DIR`, under `.worktrees/`, or gitignored). But Bash-level root mutation
(`echo >`, `sed -i`, `mv`) CANNOT be statically intercepted — so the pre-bash **`git commit`
block at root is the enforcement boundary**: root dirt may transiently exist but can never
be committed, so it never reaches `main`. Non-git Bash commands always pass. The board-sync
exception is pre-bash-ONLY: pre-write still blocks hand-editing `backlog/` at root (the
`backlog` CLI via Bash is the sanctioned editor).

**Verified against spec.md:** every claim in spec.md §"The defect" and the policy summary is
accurate against the actual 523-line source — regexes (`:183`, `:187`), the ordering, and
all four option tables match. **No divergence found**; spec.md, though written from a partial
read, describes the real policy correctly.

#### 2. Defect reproduced first-hand (not taken from spec)

Ran `parseGitInvocation`'s two regexes verbatim on the real command
`git commit -m "<subject>\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"`:
- boundary `/[;|&\n\`)]/` matched **`"\n"` at index 42** → `segment` truncated to
  `git commit -m "TASK-101: card the decision` (cut mid-quote; the `)` in `(1M context)`
  would cut a newline-free message the same way).
- tokenizer `/("[^"]*"|'[^']*'|\S+)/g` on the truncated segment: the now-unterminated `"`
  never matches `"[^"]*"`, so `\S+` shatters it → tokens
  `["git","commit","-m","\"TASK-101:","card","the","decision"]`.
- `isBoardSyncCommit`: `-m` consumes its value (`"TASK-101:`), leaving pathspecs
  **`["card","the","decision"]`** — none under `backlog/` → exception denied → **commit
  BLOCKS**. Confirmed the field failure exactly. The refusal message describes a *scoping*
  violation though the scoping was fine — which is why R3 (name the offending token) matters.

#### 3. Zero `PreToolUse` hooks in praxisflux today — how verified

- `git grep -n "PreToolUse"` over tracked files: the only hits are this task's own
  artifacts (`specs/051-*`, the runbook, the TASK-101 card). No hook wiring.
- All five shipped hook manifests inspected (`research/`, `spec-bridge/`, `reorient/`,
  `educate/`, `team-review/` `hooks/hooks.json`): **every one declares `Stop` only**, routed
  through `${CLAUDE_PLUGIN_ROOT}/scripts/gate.sh`. No `PreToolUse` block anywhere.
- The repo's own `.claude/settings.json` wires a single `Stop` hook
  (`scripts/stop-docs.mjs`) — no `PreToolUse`.
- `pdlc/` ships NO `hooks/` dir, NO `gates/` dir, and README states "No Stop hook: pdlc has
  no lifecycle of its own."
- Confirms ruling B obligation 1: this is a **new hook shape for the suite** — a
  command-blocking `PreToolUse` hook, whereas every existing hook is an advisory Stop gate.

#### 4. R6 home — DECISION: new `pdlc/hooks/root-guard-hook.mjs`, extend §5's convention

**Decision:** the hook source lives at **`pdlc/hooks/root-guard-hook.mjs`**, and
`docs/skill-patterns.md` §5's directory convention is **extended** to name a third role.

Rationale:
- §5 today defines two roles, both authored for the Stop-hook shape: `gates/` =
  skill-invoked, read-only checkers routed through `lib/gate-runner.mjs` (never writes);
  `scripts/` = the plugin's OWN operational entrypoints (the Stop-hook shim `gate.sh` +
  `stop.mjs`, and state-mutating tracker CLIs).
- The root-guard hook fits **neither**: it is not a lifecycle gate (harness-invoked via a
  host's `.claude/settings.json`, not skill-invoked; its exit-2 blocks a tool call, a
  different contract than a Stop gate's), and it is not one of *pdlc's own* operational
  entrypoints — **it does not run in pdlc's session at all**; it is PLANTED into a host and
  runs in the host's session, like the planted `CLAUDE.md`. Filing it under `scripts/` would
  conflate "the plugin's own entrypoints" with "an artifact installed into a host."
- So §5 gains a third documented role: **`<plugin>/hooks/` = harness-level (PreToolUse)
  enforcement**, distinct from `gates/` (skill-invoked read-only checkers) and `scripts/`
  (the plugin's own Stop-hook entry + state CLIs).
- **Load-bearing guard for Phase 3/5:** the marketplace auto-wires a plugin's own hooks via
  `hooks/hooks.json`. This artifact must NOT auto-fire in every pdlc session — it is planted
  into hosts. Therefore `pdlc/hooks/` must contain the `.mjs` **with NO `hooks.json`
  alongside it**, so the marketplace never registers it as a pdlc-session hook. `plant.mjs`
  copies the file into the host and injects the host's own `.claude/settings.json`
  `PreToolUse` entries.

#### 5. Default-on vs opt-in wiring — DECISION: OPT-IN (recorded, injected on opt-in only)

**Decision:** the hook is **opt-in**, not enabled by default in every bootstrapped host.
`pdlc:bootstrap` offers it like a peer utility; on opt-in, `plant.mjs` copies the hook and
injects the `PreToolUse` entries into the host's `.claude/settings.json` and records the
choice in the `.pdlc` sentinel. Absent opt-in, nothing is wired.

Rationale:
- Ruling B said **"ship it," explicitly NOT "enabled by default in every host"** (R6 flags
  this as a real sub-decision the spec must settle, not let plant mechanics decide).
- It is a **hard blocker** (exit 2) enforcing a *specific workflow doctrine* — root checkout
  read-only + worktree-only + the `backlog/` board-sync carve-out. That doctrine is
  praxisflux's own convention, not universal; wiring it default-on would block ordinary
  root commits in any host that has not adopted worktree discipline.
- Every existing shipped hook **no-ops outside its project type** and only warns/refuses to
  finish. A default-on hard blocker would break bootstrap's "safe to install anywhere"
  property. Opt-in preserves it.
- **"Planted like the other peer artifacts" (R6's own words) ⇒ opt-in**: the Backlog and
  Spec Kit peer blocks are opt-in, recorded in `.pdlc`, re-presented as defaults on update.
  The root-guard hook is the same shape (a workflow enforcement a host adopts) and rides the
  same opt-in mechanism.
- **This materially eases ruling B obligation 2:** because the blocking hook is opt-in, root
  `CLAUDE.md`'s "Stop hooks … are advisory/opt-in … CI is the authoritative enforcement
  point" stays true of the suite's *default* posture — the new blocking surface is itself
  opt-in. (Phase 5 must still re-check that sentence and decide whether to amend it to
  *name* the opt-in blocking hook; opt-in reduces, not eliminates, the reconciliation.)
- praxisflux itself and promptworld are natural first adopters (both mandate worktree-only),
  but that is each host's own adoption decision, not the plant default.

#### 6. R5(a) and R5(b) — DECISION: BOTH fixed in scope (no deferral)

**Decision:** both manifestations are fixed in this task; neither is deferred.

Rationale:
- **R5(a) cross-repo jurisdiction — in scope.** Same root cause (reasoning about a raw
  string / wrong target repo). The hook already computes `effDir` from `cd`/`-C`; the fix is
  to resolve the invocation's own toplevel from `effDir` and pass when it is outside
  `$CLAUDE_PROJECT_DIR` (out of jurisdiction). This is a **correctness fix, not a
  loosening** — the hook currently blocks writes it has no authority over. (Note: the
  existing code at `:379` already does a jurisdiction check on `effDir` before the
  root-toplevel check, and `:393-396` compares the *toplevel* to the project dir; Phase 3
  must confirm the actual failure path — likely that the staged-set query resolves against
  the wrong repo — and make the out-of-jurisdiction pass explicit and tested.)
- **R5(b) content false-positive — in scope.** Falls out of R2's real tokenization plus
  requiring the `git` token to be in **command position**: a `git` inside a quoted argument
  (`backlog task edit "…git commit…"`) becomes a token value, not a command, so it is not
  classified as a git invocation. It is the manifestation **most likely to regress
  silently**, so it must be tested directly (Phase 4).
- Both were **recommended in scope** by spec R5; no reason to defer either, so no deferral is
  recorded.

### Phase 2 recorded decisions (2026-08-02, opus-implementer, TASK-101)

The quote-state scanner (R2) plus command-position detection (R5(b)) shipped as a pure,
standalone module. Everything below is the contract Phase 3 consumes.

#### 1. Where it lives — `pdlc/hooks/shell-scan.mjs` (a SECOND file beside the hook)

**Decision:** the scanner is its own module, `pdlc/hooks/shell-scan.mjs`, NOT inlined into
`root-guard-hook.mjs`. Two exported pure functions, zero deps, no stdin/fs/process — so it
is unit-testable in isolation (the phase's explicit requirement: "unit-testable without the
hook's stdin contract"). Unit tests: `test/root-guard-scan.test.mjs` (46 cases, node:test
style matching `test/pdlc.test.mjs`).

Consequence Phase 1's home note did not anticipate: `pdlc/hooks/` now holds **two** `.mjs`
files, still **no `hooks.json`** (Phase 1's load-bearing guard against auto-wiring holds —
verified: no `hooks.json` created). Phase 3 does `import { findGitInvocations } from
'./shell-scan.mjs'`. **Phase 5 plant obligation:** `plant.mjs` must copy BOTH
`root-guard-hook.mjs` AND `shell-scan.mjs` into the host (same relative dir), or the hook's
relative import breaks. Phase 1 wrote "plant.mjs copies the file" (singular); it is now two
files. If a single-file planted artifact is preferred, the alternative is to inline
shell-scan at plant time — but the standalone module is the tested unit and the recommended
shape.

#### 2. The scanner's exact API and fail-closed contract

`scanCommand(command)` → discriminated result, **never throws**:
- success: `{ ok: true, segments }` where `segments[i]` is that segment's tokens in order,
  each token `{ value, index }` (`value` = quotes/escapes resolved; `index` = char offset in
  `command` where the token began — Phase 3 needs `index` for `lastCdBefore`/effDir).
- failure (fail closed): `{ ok: false, reason }` with reason one of
  `'unbalanced-single-quote' | 'unbalanced-double-quote' | 'dangling-escape'`, and **NO
  `segments` key**. A malformed command returns no token list at all — a caller cannot
  mistake shredded words for pathspecs, which was the exact original defect.

`findGitInvocations(command)` → `{ ok: true, invocations }` or the scanner's `{ ok: false,
reason }` unchanged. Each invocation `{ index, tokens: string[] }` with `tokens[0] === 'git'`
and `index` = char offset of the `git` token. A `git` qualifies ONLY as the **first token of
its segment** (command position). This is the R5(b) fix.

**Phase 3 must decide how the hook USES a scan failure.** The scanner only reports
parseability. The doctrine (spec R2, and the board-sync exception's own "anything
unverifiable ⇒ not board-sync ⇒ block") points to: a root `git commit` whose command does
not parse cannot be verified as board-sync ⇒ deny the exception ⇒ block. But the overall
hook is fail-OPEN on malformed stdin, and "non-git commands always pass." The scanner keeps
those reconcilable by never fabricating tokens; the *policy* wiring of ok:false is Phase 3.

#### 3. Separator set — includes `(`, matching promptworld's real behavior

Boundary separators (outside quotes only): **`;` `|` `&` newline backtick `)` `(`**. The
first six are exactly the defective parser's boundary class `[;|&\n` + backtick + `)]`. `(`
is **added** so `$(git …)` / `(git …)` subshell invocations are seen at command position —
promptworld's own git-detection regex `/(?:^|[;&|` + backtick + `(\n])\s*git(?=\s|$)/`
already includes `(`, so this **preserves** its behavior, it does not widen policy. Omitting
`(` would MISS `$(git commit)` — a regression from promptworld. An unquoted `(` in a real
git command outside a subshell is effectively never seen (globs/paths are quoted). Flagged
per the dispatch note to report deviations from the listed boundary set: this is a
deliberate, documented superset of the tasks.md line, justified by preserving upstream
detection, not a silent change.

#### 4. Escape handling (all three states explicit, per R2)

- **Outside quotes:** `\` escapes the next char literally (quote, space, separator all become
  literal, token stays open). Trailing `\` with no next char ⇒ `dangling-escape` ⇒ fail
  closed.
- **Single quotes:** nothing is special except the closing `'` — backslashes and separators
  are literal (POSIX). `'it'\''s'` ⇒ one token `it's`.
- **Double quotes:** `\` escapes only `" \ $ ` + backtick + ` newline` (POSIX subset);
  before anything else the backslash is literal. `"say \"hi\""` ⇒ `say "hi"`. A backtick
  inside double quotes is **literal** (a message may contain backticks) — so it is NOT a
  boundary there, only unquoted.

#### 5. Verified tokenizations (the pins Phase 4 will drive end-to-end)

- The verbatim field failure
  `git commit -m "<subject>\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"`
  (real newlines) ⇒ **exactly** `["git","commit","-m",<the whole message as ONE token>]`.
  One command-position git invocation. The blank line and the `(1M context)` paren stay
  inside the token.
- `backlog task edit TASK-1 --notes "the git commit was blocked; retry"` ⇒ **zero** git
  invocations (R5(b): quoted `git`, and the `;` inside quotes does not split).
- `-m "a b"` ⇒ two tokens (`-m`, `a b`), never three.

#### 6. Contradictions with the prior artifacts — none new

No divergence from spec.md/plan.md found in Phase 2. plan.md's "single quote-state scanner"
design is implemented as written; the two-regex approach is fully replaced (not patched).
Phase 1's flagged R5(a) jurisdiction concern (promptworld `:379`, `:393-396` already do a
jurisdiction/toplevel check) is **untouched by Phase 2** — R5(a) is Phase 3 and Phase 3 must
still confirm the actual cross-repo failure path as Phase 1 warned.

#### 7. Gates run at end of Phase 2 (real output)

All four `.githooks/pre-commit` gates were run manually and are **genuinely green** — Phase 2
only ADDS files (`pdlc/hooks/shell-scan.mjs`, `test/root-guard-scan.test.mjs`) and does not
touch any pinned source or bump released versions (both Phase 5), so the freshness /
sync-version "red-by-construction" condition that runbook amendment 1 (2026-08-02) authorized
`--no-verify` for **did not arise here**:

- `node --test` (full suite): **305 pass, 0 fail** (259 pre-existing + 46 new scanner cases).
- `node scripts/check-docs.mjs`: **green** — "README.md and CLAUDE.md are in sync".
- `node scripts/sync-version.mjs --check`: **green** — "all versions = 0.52.0".
- `node scripts/gen-marketplace.mjs --check`: **green** — "marketplace.json is up to date".
- `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`: **green** — "36 note(s) fresh"
  (one pre-existing `warn` on `test-suite-catalog-plugins.md` for no sources listed —
  unrelated to this change).

Because every gate passes, the Phase 2 commit was made with the **pre-commit hook ACTIVE
(no `--no-verify`)** — the authorized bypass was available but not needed. Recorded so Phase
3/5, where a pinned-source touch WILL turn the freshness gate red-by-construction, know the
bypass was deliberately unused here.
