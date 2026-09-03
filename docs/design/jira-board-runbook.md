# Jira as the main board (TASK-108 epic) — sweep runbook (2026-08-28)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it:
`docs/design/board-provider-seam.md` (the design of record) and
`docs/design/jira-board-handoff.md` win. Plan-of-record is the board; this file carries only
ordering, doctrine, and the log.

**Status:** **signed-off (partial)** — Lane 0 **done** (TASK-104 merged `a875256`, board
Done) · **Lanes 1–2 SIGNED OFF 2026-08-28** (TASK-109, then TASK-110 ‖ TASK-111) · **Lanes
3–4 HELD — NOT signed off** (TASK-112, TASK-113; see the premise-inversion checkpoint below)

<!-- Only the OPERATOR flips draft → signed-off. Lane 0 (TASK-104) was authorized by the
     operator on 2026-08-28 in answer to the blocker question: "Sweep TASK-104 first, then
     the epic." Lanes 1–2 were signed off by the operator on 2026-08-28 after the sweep's
     precondition gate surfaced two findings (F1, F2 below); the operator's ruling was
     "sign off Lanes 1–2 only; hold 3–4". Lanes 3–4 have NOT been signed off and must not
     execute until they are. -->

## Read first (in this order)

1. `docs/design/board-provider-seam.md` — the design of record: the decision, the honest
   cost table, and the five invariants every spec inherits. Do not re-derive it.
2. `docs/design/jira-board-handoff.md` — the handoff, including "What a fresh session must
   not repeat".
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written (2026-08-28)

- **Done already:** TASK-102 (PR #129, v0.57.0 — the repo-state wedge, removed).
  **TASK-107** — closed this session: all three tier pins verified to actually serve,
  evidence from the 9router request ledger rather than agent self-report.
- **In flight in other sessions (do not duplicate; expect their merges):** none observed.
  `git worktree list` showed only the root at sweep start.
- **Paused — untouched:** none. No task carries the `paused` label.
- **Queued (this runbook's scope, in execution order):** ~~TASK-104 (Lane 0)~~ **Done
  2026-08-28** (PR #130, merge `a875256`, v0.58.0) — the epic's last blocker is cleared and
  TASK-109 is now claimable. Remaining: **TASK-109, TASK-110, TASK-111 (signed off, Lanes
  1–2)**; **TASK-112, TASK-113 (HELD — not signed off, see F1/F2)**.
- **Also carded this session:** TASK-114 (flaky `team-review` id test that gates every commit
  and feeds the spec-bridge project-gate check) — not in this sweep's scope.
- **Epic:** TASK-108 gets **no PR** (`docs/principles.md` P2).

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially.

**Lane 0 — the unblocker; must merge before any epic task is claimable:**
- **TASK-104 (sonnet · model `cc/claude-sonnet-5[1m]`, fallback none configured — the spec
  settles the judgment calls; `defaultTier` per `.claude/model-tiers.json`)** — spec 058:
  the bridge gate must see spec dirs that live only on a branch. Every epic task reaches
  TASK-109, which depends on TASK-104; the dependency wiring is deliberate and is not
  routed around. Also the highest-leverage fix for this sweep specifically: the sweep's own
  claim protocol authors each spec on a branch, which is exactly what the gate cannot
  currently see.

**Lane 1 — after Lane 0 merges. The contract-shaped spine, goes first:**
- **TASK-109 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 052: `lib/board-mirror.mjs`, the
  schema, read/write/validate, staleness, the Backlog projector, `--check`. A published
  interface unblocks consumers even while its internals lag.

**Lane 2 — after TASK-109's contract lands (two tasks, disjoint files, develop in parallel):**
- **TASK-110 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 053: `bridge.mjs` reads the mirror;
  `resolveRoots` stops keying on `hasChild("backlog")`; fail-closed on stale/missing board.
- **TASK-111 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 054: `.board.json` config +
  `pdlc:peer:jira` planted block + `--peer jira`.

**Lane 3 — after TASK-111:**
- **TASK-112 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 055: `docs/board-verbs.md`, the verb
  table skills resolve their board sentences against.

**Lane 4 — merges last; the only spec touching MCP:**
- **TASK-113 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 056: the Jira provider —
  `board:sync` skill, one-call spiking, assignees. **Phase 1 is a knowledge-only phase and
  MUST run first** (see Operator checkpoints).

Tiers and model IDs come from **`.claude/model-tiers.json`**, not memory.
`node <pdlc>/scripts/tiers.mjs --root . --check` exited **0** on 2026-08-28 (all three tiers
`unchanged`) before these lanes were authored. Every task defaults to `sonnet`
(`defaultTier`); **`opus` is `escalation: true`** and requires an operator checkpoint
recorded before dispatch. Record tier + model ID + justification + **which model actually
served** on each board task at dispatch.

**Served-model verification is settled for this host (TASK-107, 2026-08-28).** All three
tiers were confirmed to serve the model their config names — sonnet → `claude-sonnet-5`,
haiku → `claude-haiku-4-5-20251001`, opus → `claude-opus-5` (not the stale `opus-4-8`
fallback that leaked on 2026-08-10). Evidence: the 9router request ledger's per-request
`model` column, **not** the agents' self-reports — two of three probes had no
harness-provided evidence of their own identity. A resuming session need not re-derive this,
but must still spot-check the first dispatch of any lane if the tier config has changed since.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: ABSENT.** This host ships no `scripts/check-merge-drift.mjs`. The sweep
  falls back to raw git (`git fetch origin && git pull --ff-only` at root) and **loses
  claim-collision detection and the drift matrix**. Compensate manually: before claiming a
  spec number, check it against `origin/main` with
  `git ls-tree --name-only origin/main specs/` and check for a live branch with
  `git ls-remote --heads origin 'task-<n>*'`.
- **`core.hooksPath` is active.** `.githooks/pre-commit` runs the FULL `node --test` suite
  (443 tests as of 2026-08-28) plus marketplace/version/docs sync checks on **every** commit,
  and `.githooks/pre-push` runs the version-bump and wiki-freshness gates. A red suite blocks
  every intermediate commit, so sequence work such that each commit leaves the suite green.
- **Run the suite as bare `node --test`** — no path argument, exactly as `.githooks/pre-commit`
  does (`env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE node --test`). There is **no
  `package.json`** in this repo, so there is no `npm test`. Passing a path — `node --test test/`
  — makes node resolve `test` as a **module** and die with
  `Error: Cannot find module '<root>/test'`, reporting `tests 1 / fail 1`. That failure looks
  exactly like a red suite and, chased through the spec-bridge gate's `tests` check, reads as a
  repo-wide breakage that is not real. Cost three wrong conclusions on 2026-08-28 before the
  hook was read. Verify with `node --test` alone; 443/443 pass.
- **Scratch files in the worktree get collected by the test runner.** A stray `t.txt`/`g.txt` in
  the repo root is picked up as a test file and fails the run. Write throwaway output to
  `$CLAUDE_JOB_DIR/tmp`, never the worktree.
- **Released surface ⇒ version bump.** Any PR touching plugin dirs, `lib/`, `scripts/`, or
  `.claude-plugin/` MUST bump the marketplace version **and** any edited skill's own
  `version:` (`docs/releasing.md`). CI enforces it; each merge to `main` auto-publishes
  `v<version>`.
- **Docs sync.** `node scripts/check-docs.mjs` plus the wiki freshness gate run in CI, in
  both git hooks, and in a repo Stop hook (`scripts/stop-docs.mjs`) that refuses to end a
  turn while they fail. Update `README.md`/`CLAUDE.md` when what the repo ships changes.
- **Re-ground obligations.** Use the classifier — `node grounding-wiki/gates/cli.mjs plan .
  docs/wiki` — which computes RE-PIN-ONLY vs NEEDS-REVIEW and prints executable re-pin
  commands for the safe half. **Re-pin volume is larger than it looks:** a marketplace
  version bump touches every `plugin.json`, so a released-surface PR can stale ~17 notes.
- **F4 — PUSH AFTER EVERY PHASE, not just at the claim (learned 2026-09-03).** The
  claim-and-push-immediately rule saved this sweep when the entire repo relocated on disk
  mid-session (an extra path segment inserted by a sandbox remount), breaking all three sweep
  worktrees at once. All three branch **tips** were safe on `origin` because every claim was
  pushed. But **phase commits are not covered by that rule** — TASK-111's Phase 1 and Phase 2
  commits were local-only, and across this sweep four phase dispatches on three branches sat
  unpushed. They survived only because the main repo's object store did; had the store gone
  with the worktrees, that work was gone. **Push after each phase's commit**, not merely at
  claim time: the cost is one command, and the exposure otherwise is every phase since the
  claim. (Recovery that worked, for the next session: verify tips on `origin`, check whether
  local-only commits still exist as objects via `git cat-file -t <sha>`, push them, then
  `git worktree prune` and re-cut at the new path.)
- **Note budgets bite.** Several notes sit near the 8,000-char cap and capsules near 500.
  On overflow take a summary-style split or a genuine trim; `size_budget_exempt` is for
  content that cannot be split, not for prose you just added.
- **Merge commits, never squash.** Squashing orphans the commits `docs/wiki` notes pin as
  `verified_against`, breaking the freshness gate.

## Per-task artifacts required before PR

**No PR opens for a task until each line below checks true for it.**

- [ ] `specs/NNN-<slug>/` carries a real `spec.md`, `plan.md`, and `tasks.md` (phased
      checkboxes the bridge derives from), committed on the task's branch. A claim stub
      reserves the number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link`), and phase
      ACs are seeded from tasks.md (link update mode) **before** implementation dispatch.
- **Escape lines (operator-signed only):** **`.specify/` is absent on this host.** Spec Kit
  artifacts for every task in this sweep are **hand-authored** under the sweep's
  operator-signed escape line, per this host's established precedent (specs 052–056 were
  authored that way; spec 045 records the hatch). Signed: operator, 2026-08-28. This is the
  recorded host-precedent sanction — never a second mechanism.
- [ ] **The claim is ATOMIC** (host ruling, 2026-08-28): card flip + spec dir +
      `spec-bridge:link` land in **ONE commit on the branch**. Two-track landing's "board
      commits direct to `main`" covers notes, AC ticks, labels, and new cards — **never** the
      status flip that claims a task, which is deliverable state. Splitting it in a prior
      session produced **~50 gate findings from one status flip**.
- [ ] **Background-job execution mode applies to this sweep.** Worktrees live at
      `.claude/worktrees/task-<N>` (the harness isolation root, entered via `EnterWorktree`),
      not `.worktrees/`. Post-merge closures (tasks.md tick, `spec-bridge:sync` board-Done,
      the log row) ride the NEXT claimed task's branch; sweep-close lands via a wrap-up PR.
- [ ] **F2 — Atlassian MCP is HARD-BLOCKED on this host (verified 2026-08-28).** Three calls
      across two tools (`getAccessibleAtlassianResources`, `atlassianUserInfo`) and two AWS
      regions all returned an **AWS WAF CAPTCHA challenge page**, not a tool result — a
      browser-verification wall, not a flake and not an auth error. **Consequence, checkable:**
      spec 056 Phase 1 (the live write→read marker test) **cannot run on this host** until MCP
      access is restored, and neither can any 056 AC that requires a live site. Any session
      that reaches TASK-113 must **first** re-probe with one MCP call and **STOP if it returns
      HTML** — do not substitute fixtures for the live test that Phase 1 exists to be, and do
      not read a CAPTCHA page as "no Jira configured".
- [ ] **F1 — ORDERING INVERSION: spec 055 ships its premise untested (found 2026-08-28).**
      Spec 055 (TASK-112, Lane 3) *builds* the `<!-- spec-phases -->` block render/parse pair
      and `renderJira`; spec 056 (TASK-113, Lane 4) Phase 1 is the **only** place the premise —
      that HTML comment markers and checkbox syntax survive a Jira description write→read
      cycle — is ever tested against a live site. Lane 4 merges **last**, so 055's central
      assumption is verified only *after* 055 has shipped. 055's own Phase 3 round-trips the
      block against **fixtures** (`specs/055.../tasks.md` Phase 3), which cannot detect Jira
      normalizing or stripping the markers. **Consequence, checkable:** TASK-112 must **not**
      be claimed until either (a) 056 Phase 1's marker test has run against a live site and
      recorded that markers survive (naming the `contentFormat` that preserved them), or
      (b) the operator signs an explicit acceptance of the fixture-only risk in this file. If
      the markers do **not** survive, that is an **amendment to spec 055** — never a local
      workaround in 056.
- [ ] **`grep` hides matches in `spec-bridge/gates/bridge.mjs`.** It contains a literal NUL
      byte at line 217 (a legitimate cache-key separator in a `command.join("\0")`), so grep
      classifies the file as **binary** and suppresses match output: `grep -n <pat> <file>`
      prints only `Binary file … matches` — **no line numbers, no content** — while still
      exiting 0. Some wrappers surface that as an empty result, which reads as "not found."
      Verified on this host 2026-08-28. **Use `grep -a`** (or `grep -na`) on this file. Spec
      053 edits it directly; an implementer who greps it and sees nothing will wrongly
      conclude the code is absent.

## Concurrency & conflict doctrine

- **Hotspots:** `lib/spec-derive.mjs` and `spec-bridge/gates/bridge.mjs` (Lane 0 and
  TASK-110 both touch the derivation path — Lane 0 merges first, so TASK-110 develops
  against the merged result); `.claude-plugin/marketplace.json` and every `plugin.json`
  (every released-surface PR bumps versions — guaranteed conflict between any two concurrent
  PRs); `docs/wiki/*` pins; `README.md` / `CLAUDE.md`.
- **Paused tasks are not live lanes:** none currently.
- Reconcile by what the branch carries: a **pin-carrying branch** (its own commits
  referenced by re-pins it carries) **merges `origin/main` in** — squash, rebase, and
  force-push all rewrite hashes and stale every carried pin, so its PR also lands as a merge
  commit; a **pin-free branch rebases**. Take main's side for anything you didn't
  deliberately change.
- **Honest re-pins only — a merge-in never justifies a pin bump** (pin = merge commit empties
  the freshness probe's range by construction). Classify every stale/conflicted pin via the
  plan loop: read `git diff <old-pin>..<merge-commit> -- <sources>`, mark **RE-PIN-ONLY** or
  **NEEDS-REVIEW**, and amend prose BEFORE bumping.
- After every history move: re-run gates AND the freshness probe **unconditionally** — never
  gated on whether `docs/wiki/` changed.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a reconcile between.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work; push immediately** (`git push -u origin <branch>`); never force-push a
  claim. A rejected push means you lost the race: fetch, re-read the board and `specs/`; if
  another session holds that task or number, STOP the lane and surface it.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree.

## Operator checkpoints (do not proceed silently)

- **Lanes 1–2 are signed off (2026-08-28); Lanes 3–4 are HELD.** TASK-109, then
  TASK-110 ‖ TASK-111, may execute. **TASK-112 and TASK-113 must not be claimed** without a
  fresh operator sign-off — the hold is not a scheduling artifact, it is finding **F1**: the
  premise 055 builds on is only tested by 056, which runs after it. Lanes 1–2 are entirely
  MCP-free and unaffected by **F2**.
- **The premise-inversion checkpoint (F1) — the decision the operator holds.** Before Lane 3
  can be signed off, ONE of: (a) 056 Phase 1's live marker test has run and recorded that the
  markers survive, or (b) the operator accepts the fixture-only risk in writing here. This
  session could not do (a): the MCP is CAPTCHA-walled (**F2**).
- **Spec 056 Phase 1 is knowledge-only and MUST run before any 056 implementation — AND, per
  F1, before TASK-112 (spec 055) is claimed at all**, because 055 builds the mechanism this
  phase validates. **It cannot run on this host while F2 holds.** Spec
  055's entire phase-AC mechanism assumes HTML comment markers
  (`<!-- spec-phases BEGIN -->`) survive a Jira description write→read cycle. That is
  **untested**. Phase 1 tests it against a scratch issue in both `markdown` and `adf` content
  formats. **If the markers do not survive: STOP and surface it** — a delimiter change amends
  spec 055; it is not a local workaround. Confirm in the same phase: `transitionJiraIssue`
  takes a transition **id**, not a status name (a status move is two calls), and a set
  `resolution` can block a backwards transition — which the bridge *does* perform when a
  regenerated `tasks.md` moves a card back.
- **Tier escalation to `opus`** (`escalation: true`) requires a recorded checkpoint before
  dispatch. No epic task is currently assigned to it.
- Lane amendments: amend this file, note why, tell the operator.

## Done means

- TASK-104, TASK-109, TASK-110, TASK-111, TASK-112, TASK-113 each **Done on the board via
  their own merged PR**; TASK-108 (the epic) closed with **no PR of its own**.
  **Scope note (2026-08-28):** only Lanes 0–2 are signed off, so this sweep's *signed*
  completion is TASK-104 + TASK-109 + TASK-110 + TASK-111. TASK-112, TASK-113, and the epic
  close-out remain owed and require the F1 checkpoint plus fresh sign-off — a Lanes-1–2 sweep
  that reports "done" must say exactly that, not round up to the epic.
- Every scoped card **still carries its Spec marker at sweep end** (re-run the
  `spec-bridge` links check — other sessions move the board while branches sit).
- Every scoped task's `specs/NNN-*/` contains `spec.md` + `plan.md` + `tasks.md`, under the
  hand-authored escape line above.
- Every project gate green on `main`: full `node --test`, `scripts/check-docs.mjs`, wiki
  freshness, version-bump consistency.
- Grounding fresh: wiki pins current and honestly classified.
- `git worktree list` shows no stale sweep worktrees.
- This file's execution log complete and its status flipped to **done**.

## Execution log

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-08-28 | TASK-107 | — (board track, direct to `main`) | `05bb793` | ~257k subagent tokens (3 probes) | Done. Tier pins verified to actually serve via the 9router ledger, not self-report. Unblocked the epic by one of its two deps. |
| 2026-08-28 | TASK-109 | [#132](https://github.com/evanstern/praxisflux/pull/132) | `0c97243` | ~686k subagent tokens (4 phase dispatches: ~158k + ~146k + ~147k + ~235k) | **Done.** Lane 1 complete; v0.59.0. Claim `415d5c8` (atomic: status flip + 4 phase ACs seeded from spec 052 tasks.md — the spec dir and Spec marker already existed on main under the hand-authored escape line). Phases: 1 `14b4577` (schema + read/write/validate, +9 tests), 2 `5580d51` (parser MOVED out of bridge.mjs, −46 lines, re-exported), 3 `412c935` (staleness + provider registry + projector, +7 tests), 4 `19e7a67`+`edea9b8`+`4694352`+`990b61f`+`5c47903` (--check CLI +3 tests, dogfood mirror, 0.59.0 bump, 12-note re-ground). All dispatches sonnet · `cc/claude-sonnet-5[1m]`; served model is pin-consistent self-report, NOT ledger-proven — every implementer stated it had no harness-provided evidence of its identity (router admin API rejects `ANTHROPIC_AUTH_TOKEN`). Orchestrator verified independently, not on report: suite 468/468, check-docs 0, versions 0.59.0, freshness exit 0; AC#9's three protected test files byte-identical across the whole branch; no provider-name conditional in `lib/`; ZERO new or widened `size_budget_exempt`. Merged as a merge commit (pins stay reachable); operator merged after review. Board Done via `spec-bridge:sync`'s derived plan, never by hand. **Gate lesson:** 55 Stop-hook findings reading 'required gate "tests" is red' were the TASK-114 flake, not misattribution — see TASK-114 for the confirmed mechanism and three ruled-out causes. |
| 2026-08-28 | TASK-104 | [#130](https://github.com/evanstern/praxisflux/pull/130) | `a875256` | ~407k subagent tokens (3 phase dispatches: ~152k + ~122k + ~133k) | **Done.** Lane 0 complete. Claim `3615c12` (atomic: card + spec 058 + link, pushed). All 4 phases: 1 `0608633` (resolver, +6 tests), 2 `c05631c` (wiring, +3/−7 in spec-derive), 3 `1b3e6f8` (+6 integration tests, AC1–AC8), 4 `70716f9` (re-pins + 0.58.0), plus `0d8685f` (the 11 notes the bump staled). All dispatches sonnet · `cc/claude-sonnet-5[1m]`, served model confirmed via router ledger. Merged as a merge commit (pins stay reachable); operator merged after review. Board moved to Done by `spec-bridge:sync`'s derived plan, never by hand. Suite 449/449; freshness exit 0; bridge check exit 0. |
