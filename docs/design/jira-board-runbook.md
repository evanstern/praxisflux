# Jira as the main board (TASK-108 epic) — sweep runbook (2026-08-28)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it:
`docs/design/board-provider-seam.md` (the design of record) and
`docs/design/jira-board-handoff.md` win. Plan-of-record is the board; this file carries only
ordering, doctrine, and the log.

**Status:** **signed-off (partial)** — Lane 0 **done** (TASK-104 merged `a875256`, board
Done) · **Lanes 1–2 COMPLETE AND MERGED** — Lane 1 TASK-109 (`0c97243`, v0.59.0); Lane 2 all three merged: TASK-111 (#135, `e0ea7b2`, v0.59.3), TASK-114 (#133, `dafff60`, v0.59.5), TASK-110 (#134, `5377710`, v0.59.6) · **Lanes
3–4 SIGNED OFF 2026-09-09, ORDER INVERTED** (TASK-112, TASK-113 — see the
premise-inversion checkpoint below; **F2 is CLEARED**, so F1 is satisfied via option (a):
TASK-113 Phase 1 runs BEFORE TASK-112 is claimed)

<!-- Only the OPERATOR flips draft → signed-off. Lane 0 (TASK-104) was authorized by the
     operator on 2026-08-28 in answer to the blocker question: "Sweep TASK-104 first, then
     the epic." Lanes 1–2 were signed off by the operator on 2026-08-28 after the sweep's
     precondition gate surfaced two findings (F1, F2 below); the operator's ruling was
     "sign off Lanes 1–2 only; hold 3–4". Lanes 3–4 have NOT been signed off and must not
     "sign off Lanes 1–2 only; hold 3–4".

     LANES 3–4 SIGNED OFF BY THE OPERATOR 2026-09-09, in answer to this session's
     precondition gate, with two rulings:
       1. ORDER INVERTED (F1 option (a)): claim TASK-113 and run ONLY its Phase 1
          (knowledge-only, no code) to test marker survival against a live site FIRST;
          record the result; THEN claim TASK-112 (spec 055). TASK-113 Phases 2–4 merge
          last, on the SAME branch and PR as its Phase 1. The operator explicitly chose
          the live test over signing acceptance of the fixture-only risk (option (b)).
       2. SCRATCH PROJECT: exactly ONE operator-named project is authorized for Phase 1's
          live write→read test. Its key and the site coordinates are deliberately NOT
          recorded in this file: praxisflux is a PUBLIC repo that auto-publishes a GitHub
          Release on every merge to main, and the host site is a real corporate instance,
          so its cloudId/accountId/project keys are third-party infrastructure data that
          must not land here. They live untracked in the operator's local board config;
          a session that needs them asks the operator. Write exactly one scratch issue in
          the named project, clean up after it, and treat every other project as
          unauthorized.
     No tier escalation: every task stays sonnet (`defaultTier`). -->

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
  1–2)**; **TASK-112, TASK-113 (signed off 2026-09-09 once F2 cleared; F1 satisfied via
  option (a) — see the checkpoint section)**.
- **TASK-114** (flaky `team-review` id test that gates every commit and feeds the
  spec-bridge project-gate check) — carded 2026-08-28 as out of scope, **folded into Lane 2 at
  operator request 2026-09-01** after it caused 55 phantom gate findings during TASK-109.
- **TASK-115** — the "Open Brain grounding gate" card another session created on `main` as a
  SECOND `TASK-108` (`a6e9e68`); both files claimed `id: TASK-108`, so the CLI silently
  resolved only the epic and the newer card was invisible to the board. Renumbered to
  TASK-115 by operator decision 2026-09-01 (`b1c4f31`), duplicate archived. Not in this
  sweep's scope.
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

**Lane 2 — after TASK-109's contract lands (three tasks, disjoint files, parallel BRANCHES — see the dispatch constraint below):**
- **TASK-110 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 053: `bridge.mjs` reads the mirror;
  `resolveRoots` stops keying on `hasChild("backlog")`; fail-closed on stale/missing board.
- **TASK-111 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 054: `.board.json` config +
  `pdlc:peer:jira` planted block + `--peer jira`.
- **TASK-114 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 059: the flaky same-second
  run-id test. Folded into this lane at operator request 2026-09-01. Its spec was
  hand-authored by the orchestrator (no pre-existing spec) under the escape line. It is a
  top-level TASK, so it gets its OWN branch and PR — it does not ride TASK-110's or
  TASK-111's branch.

**Lane 2.5 — INSERTED 2026-09-09 (operator ruling); RUNS BEFORE LANE 3:**
- **TASK-0122 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 062: `lib/gate-runner.mjs`'s cwd
  precedence. The env var beats an explicitly-passed `{ cwd }`, and **eight** test files
  hand-work around it. **Why it goes first:** every remaining 112/113 phase dispatches under
  the Stop hook this defect makes falsely red, so fixing it once removes the gate-tripping
  from the rest of the sweep instead of fighting it seven more times. Released surface
  (vendored into nine plugins, ~10 wiki notes source it) ⇒ version bump + re-pin owed.
  Full detail and ACs on the card; do not re-derive the root cause — it is found and
  recorded.

**Lane 3' — RUNS BEFORE LANE 3 (operator ruling 2026-09-09, F1 option (a)):**
- **TASK-113 Phase 1 ONLY (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 056 Phase 1 is
  knowledge-only: no implementation, findings committed to the spec dir. It is the ONLY
  test of spec 055's premise (that `<!-- spec-phases -->` markers and checkbox syntax
  survive a Jira description write→read cycle), so it runs BEFORE TASK-112 is claimed.
  Live scratch issue in the ONE operator-named project only (coordinates out of tree — ask
  the operator; see the sign-off note). **If the markers do NOT survive: STOP
  and surface it** — that is an amendment to spec 055, never a local workaround in 056.

**Lane 3 — after Lane 2.5 merges and Lane 3' records marker survival (TASK-111 already merged):**
- **TASK-112 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 055: `docs/board-verbs.md`, the
  verb table skills resolve their board sentences against. Claimable only once Lane 3' has
  recorded that the markers survive, naming the `contentFormat` that preserved them.

**Lane 4 — merges last; the rest of the only spec touching MCP:**
- **TASK-113 Phases 2–4 (sonnet · `cc/claude-sonnet-5[1m]`)** — spec 056: the Jira
  provider — `board:sync` skill, one-call spiking, assignees. Rides the SAME branch and
  the SAME PR as Phase 1 (one task, one PR: Phase 1's findings commit is simply the first
  commit on that branch, never a PR of its own).

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
- **Re-pins CASCADE — re-run the freshness gate AFTER committing them (found 2026-09-01,
  TASK-114).** A note that is itself listed in another note's `sources:` propagates staleness
  when re-pinned: bumping `docs/wiki/test-suite-catalog-plugins-gates.md`'s `verified_against`
  line made its parent `test-suite-catalog-plugins.md` go stale, because the parent sources the
  child FILE. One re-pin pass is therefore NOT enough — a pass that greens the gate before
  committing can leave it red after. Run the freshness gate again once the re-pin commit
  exists, and expect a possible second (cascading) re-pin. Hub/catalog notes that source other
  notes are where this bites.
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
- **F5 — `core.hooksPath` IS ABSOLUTE LOCAL CONFIG AND BREAKS SILENTLY ON RELOCATION
  (found 2026-09-03).** This repo's `core.hooksPath` was **local** config holding an
  **absolute** path (`/Users/evanstern/projects/praxis/.githooks`). When the repo relocated
  (see F4), that path stopped existing and **both the pre-commit and pre-push hooks went
  silently inert repo-wide** — git does not warn when `core.hooksPath` does not resolve. Every
  commit after the move was unguarded while appearing normal; the tell is latency (a real
  pre-commit run takes ~26–47s here, an inert one returns instantly) and the absence of the
  hook's own `pre-commit:` echo lines. **Never infer that "the hook passed" from a commit
  succeeding.** Fixed by `git config core.hooksPath .githooks` — RELATIVE, so it survives any
  future move — and verified by an empty commit that actually printed the gate output and took
  ~26s. **Consequence, checkable:** on any host, and especially after any path change, confirm
  `ls -d "$(git config --get core.hooksPath)"` resolves before trusting local enforcement; CI
  remains the authoritative gate either way (`CLAUDE.md`'s enforcement-split doctrine), which
  is exactly why that split exists.
- **F6 — A GATE RUN AGAINST A DIRTY WORKING TREE PROVES NOTHING ABOUT THE COMMIT
  (found 2026-09-04, by CI, not locally).** During TASK-110's second reconcile,
  `sync-version.mjs 0.59.6` was run *before* the merge commit, but only the conflicted paths
  were staged — so the bump sat **uncommitted in the working tree** and the merge shipped
  main's version unchanged. Local `sync-version.mjs --check` then read the dirty tree and
  reported `0.59.6`: green-looking, while `git show HEAD:.claude-plugin/marketplace.json` said
  `0.59.5`. CI's `check-version-bump.mjs` was right (`base 0.59.5, head 0.59.5`) and was the
  only thing that caught it. **Consequence, checkable:** verify a commit's content with
  `git show HEAD:<file>`, never by reading the file on disk, and treat every `--check` run as
  a statement about the *tree* until the tree is clean (`git status --porcelain` empty). This
  is the second finding this sweep where CI beat the local gate (see F5) — together they are
  the concrete case for the repo's enforcement split: local checks are advisory, **CI is
  authoritative**.
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
- [x] **EXECUTION MODE: INTERACTIVE (amended 2026-09-09, operator ruling).** Earlier lanes
      ran in background-job / no-main-push mode. That mode no longer matches reality: this
      session pushed the Lanes 3–4 sign-off commit **directly to `main`** (`c3999f6`), so
      main-push rights demonstrably exist. Operator ruling: run the remaining lanes
      interactive. **Post-merge closures — tasks.md ticks, `spec-bridge:sync`'s board-Done,
      and the log row — land as ordinary root commits on `main`**, not riding the next
      claimed task's branch, and sweep-close needs **no wrap-up PR**. Board/spec commands
      run from the root while it is on `main`.
      **Worktree location is UNCHANGED:** task worktrees still live at
      `.claude/worktrees/task-<N>` (the harness isolation root, entered via `EnterWorktree`),
      not `.worktrees/` — that is where `task-113-jira-provider` already sits, and moving it
      mid-sweep would strand it. If main-push is ever revoked mid-sweep, fall back to the
      background-job degradation this line replaced (closures ride the next branch;
      wrap-up PR at close) rather than inventing a third rule.
- [ ] **F3 — ONE ORCHESTRATOR SESSION CANNOT HOST CONCURRENT DISPATCHES ACROSS SIBLING
      WORKTREES (verified 2026-09-01, the hard way).** A dispatched subagent's Bash sandbox is
      bound to the **orchestrator session's** current worktree, NOT the worktree named in its
      dispatch prompt. So switching the orchestrator session to a sibling worktree — to claim
      the next task, say — **breaks the Bash tool of every dispatch already running**, which
      then correctly refuses to act (guard: "this command's working directory resolved to the
      shared checkout <other worktree>"). Field case: TASK-110 and TASK-111 Phase 1 were
      dispatched, the session then moved on to claim TASK-111 and TASK-114, and **both agents
      lost Bash and stopped** — zero edits, zero commits, both worktrees clean. Both behaved
      correctly: they refused to operate in a worktree they had no authority over and refused
      to edit code they could not test or commit. **Consequence, checkable:** "develop in
      parallel" in this runbook means parallel **BRANCHES** (real, and it holds — claims are
      pushed and independent), never concurrent dispatches from one orchestrator session on
      this harness. Dispatch **serially**, with the orchestrator session parked in the target
      worktree for the whole duration of that dispatch. A sweep that reads "parallelize within
      a lane" as "launch N implementers at once from one session" will lose every one of them.
- [x] **F2 — CLEARED 2026-09-09. Atlassian MCP is REACHABLE on this host.** It was
      hard-blocked on 2026-08-28: three calls across two tools
      (`getAccessibleAtlassianResources`, `atlassianUserInfo`) and two AWS regions all
      returned an **AWS WAF CAPTCHA challenge page** rather than a tool result — a
      browser-verification wall, not a flake and not an auth error. **Re-probed and cleared
      by this session's precondition gate (2026-09-09):** `getAccessibleAtlassianResources`
      returned a real cloudId with jira + confluence read-write, `atlassianUserInfo`
      returned a real accountId, and a live `getVisibleJiraProjects` returned a real
      project list. (Identifiers withheld deliberately — see the sign-off note; this repo
      is public.) Access was restored by an operator `/mcp` re-auth
      ("Authentication successful") at the head of that session, so the wall was
      auth-adjacent after all, though it did not present as an auth error. **Consequence:**
      spec 056 Phase 1's live write→read marker test **can now run**, which is what let the
      operator satisfy F1 via option (a). The site is a **real corporate instance**
      with many unrelated projects; only the ONE operator-named project is authorized for
      the scratch issue. **Still checkable for any future session:** re-probe with ONE MCP call
      before trusting access, **STOP if the response is HTML**, never substitute fixtures
      for the live test Phase 1 exists to be, and never read a CAPTCHA page as "no Jira
      configured".
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
- [x] **F7 — THIS REPO IS PUBLIC; NEVER WRITE LIVE SITE IDENTIFIERS INTO A TRACKED FILE
      (near-miss, 2026-09-09).** `evanstern/praxisflux` is a **public** repo and every merge
      to `main` **auto-publishes a GitHub Release**, so any tracked file here is a publishing
      surface. The host Jira is a **real corporate instance** with many unrelated projects.
      Writing up the Lanes 3–4 sign-off, this orchestrator put the authorized scratch
      project's key and id, the site `cloudId`, and the caller's `accountId` — all harvested
      from the precondition gate's own MCP probes — straight into this runbook. The
      **permission classifier blocked the `git push`** and was right to. Nothing left the
      machine: the offending commit sat on no remote and was squashed away locally at
      operator instruction, so the identifiers exist in **no pushed object**.
      **The principle: authorization to ACT on an external system is not authorization to
      NAME it publicly.** The operator's answer authorized *writing a scratch issue to* a
      project; it said nothing about publishing that project's coordinates.
      **Consequence, checkable:** record the *doctrine* in the tracked artifact ("exactly ONE
      operator-named project; one scratch issue; clean up after") and keep the *coordinates*
      out of tree — untracked local config, or ask the operator. Before committing any doc
      that quotes MCP output, **grep it for cloudIds, accountIds, org names, and project
      keys**. This is also why the F2 clearance line above states that access was restored
      without naming the site.
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

- **ALL LANES NOW SIGNED OFF.** Lanes 1–2 signed 2026-08-28; **Lanes 3–4 signed 2026-09-09**
  once F2 cleared. TASK-112 and TASK-113 are claimable — in the INVERTED order the operator
  ruled: TASK-113 Phase 1 (knowledge-only, live marker test) FIRST, then TASK-112, then
  TASK-113 Phases 2–4. Lanes 1–2 were entirely MCP-free and were never affected by **F2**.
- **The premise-inversion checkpoint (F1) — RESOLVED via option (a), 2026-09-09.** The
  decision was the operator's: of (a) run 056 Phase 1's live marker test first, or (b) sign
  written acceptance of the fixture-only risk, the operator chose **(a)**. The 2026-08-28
  session could not offer (a) because the MCP was CAPTCHA-walled (**F2**); that wall is gone.
  **The checkpoint is therefore not closed by this sign-off — it is DISCHARGED BY RUNNING
  THE TEST.** If the markers do not survive, spec 055 is AMENDED before TASK-112 is claimed.
- **Spec 056 Phase 1 is knowledge-only and MUST run before any 056 implementation — AND, per
  F1, before TASK-112 (spec 055) is claimed at all**, because 055 builds the mechanism this
  phase validates. **It can now run: F2 is cleared (2026-09-09).** Spec
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

## RESUME HERE (fresh session, 2026-09-09) — Lane 3' done; Lane 3 is next

**Read this block first; it is the whole handoff.** Lane 3' (TASK-113 spec 056 Phase 1,
the live marker test) is **COMPLETE**, and with it **finding F1 is DISCHARGED**. The
operator ruled that the remaining lanes run in **fresh sessions, one per lane** — the
lane-boundary prescription below, taken deliberately as a cost lever.

**What is next, exactly:** **TASK-0122** (Lane 2.5, spec 062) — the `lib/gate-runner.mjs`
cwd-precedence defect — then TASK-112 (spec 055, clear to claim: the markers survive so 055
needs no amendment), then TASK-113 Phases 2–4.

**Lane 2.5 was inserted by operator ruling 2026-09-09** and this session made sole owner of
all three, with no other session modifying `main`. The gate defect goes first because every
remaining phase dispatches under the Stop hook it makes falsely red. Its root cause is
FOUND and recorded on TASK-0122 — do not re-derive it: `lib/gate-runner.mjs:39` prefers
`process.env.CLAUDE_PROJECT_DIR` over an explicitly-passed `{ cwd }`, and eight test files
hand-work around it. Two sessions found it independently; the immediate red was already
fixed test-only in `10ed971`, which is a symptom patch, not the defect.

**The three things Lane 3' proved that TASK-112's implementer MUST honor** (full detail in
`specs/056-jira-provider/findings/phase-1-mcp-surface.md`, on branch
`task-113-jira-provider`, commit `d874b88` — read it, do not re-derive it):

1. The block parser must tolerate **two silent normalizations** Jira applies to every
   description read: a **blank line inserted after the `BEGIN` marker**, and **trailing
   whitespace appended to the last checkbox line**. Test against those observed shapes, not
   only 055's clean fixtures — fixtures produce neither, which is the exact gap F1 named.
2. The block contract is **markdown-only**, and `docs/board-verbs.md` must say so. An
   `html` read returns the markers as **escaped entities** (not comment nodes), converts the
   checkboxes to a native **ADF task-list** with server-assigned UUIDs, and **swallows the
   `END` marker inside the final `<li>`**.
3. For TASK-113 Phase 2 later: **map `statusMap` on status NAME, not `statusCategory`.** The
   host workflow offers nine transitions from `Open` with several distinct statuses sharing
   one category (four `new`, three `indeterminate`), so a category-keyed map is
   non-injective **by construction**.

**Still owed, and NOT blocking Lane 3:**
- **The resolution quirk is UNVERIFIED** (spec 056 Phase 1 box 5, deliberately left
  unticked at 6/7). Testing it needs workflow writes on a real corporate project; the
  sign-off covered a description round-trip only and the permission boundary declined it.
  **Owed before Phase 3** (the write path) relies on backwards transitions.
- **The operator deletes or closes the scratch issue** (`[SCRATCH — praxisflux spec 056
  Phase 1] …`). The orchestrator has no delete authorization.
- **`.claude/worktrees/task-119`** is a merged leftover (PR #137, merged 2026-09-09). Its
  janitor cleanup was declined by the permission classifier. Inert; blocks nothing.
- Branch `task-113-jira-provider` is **pushed and parked** at `1cc5afe` with Phase 1's
  findings + tick + board note. TASK-113 Phases 2–4 ride that SAME branch and PR.

## Sweep status: Lanes 0–2 DONE (2026-09-04); Lane 3' DONE (2026-09-09); Lanes 3–4 EXECUTING

**Delivered and merged:** TASK-104 (`a875256`, v0.58.0) · TASK-107 (`05bb793`) ·
TASK-109 (`0c97243`, v0.59.0) · TASK-111 (`e0ea7b2`, v0.59.3) · TASK-114 (`dafff60`,
v0.59.5) · TASK-110 (`5377710`, v0.59.6). Every one Done on the board via
`spec-bridge:sync`'s derived plan, never hand-set; every PR landed as a merge commit so
the wiki pins referencing branch commits stay reachable.

**Now in flight (Lanes 3–4, signed off 2026-09-09):** TASK-112 (spec 055) and TASK-113
(spec 056). Both holds are discharged: **F2 is CLEARED** — the Atlassian MCP is reachable
on this host again after an operator `/mcp` re-auth — and **F1 is satisfied via option (a)**:
the operator ruled that TASK-113 Phase 1's live marker test runs BEFORE TASK-112 is claimed,
inverting the original lane order, rather than signing acceptance of the fixture-only risk.
The live scratch issue is authorized in ONE operator-named project only — a real corporate
project, not a sandbox; its coordinates stay out of this public repo. TASK-108, the epic, stays open with **no PR of its own**
(`docs/principles.md` P2) and closes when both tasks land.

**Seven findings this sweep produced**, all recorded above as checkable gate lines rather
than prose: F1 premise inversion (**discharged 2026-09-09**) · F2 MCP hard-blocked
(**cleared 2026-09-09**) · F3 no concurrent cross-worktree dispatches · F4 push after every
phase · F5 `core.hooksPath` breaks silently on relocation · F6 a gate run against a dirty
tree proves nothing · **F7 this repo is public — never write live site identifiers into a
tracked file**. F3, F4, F6, and F7 came from orchestrator errors; F5 was surfaced by an
implementer. F1 is the one finding a *later* session was able to discharge with evidence
rather than argument, which is what the hold was for. F5 and F6 are both cases where
**CI caught what the local gate missed** — the concrete argument for the repo's
advisory-local / authoritative-CI split.

## Execution log

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-09-09 | TASK-113 (Lane 3' — Phase 1 only) | open on `task-113-jira-provider` (Phases 2–4 ride the same PR) | not merged | orchestrator-run, no implementer dispatch (knowledge-only phase) | **F1 DISCHARGED.** Live marker test PASSED: `<!-- spec-phases -->` markers, checkbox syntax, checked/unchecked state and the `Spec:` marker all survive a Jira description write→read cycle in `contentFormat: markdown`; a second write with a different tick pattern persisted with byte-identical normalization, so the cycle is **idempotent, not degrading** — the proof that mattered, since the bridge rewrites this block repeatedly. Spec 055 needs **no amendment**; TASK-112 clear to claim. Four things fixtures could not have shown: (1) blank line inserted after `BEGIN`, (2) trailing whitespace on the last checkbox, (3) block contract is **markdown-only** — an `html` read escapes the markers, converts checkboxes to an ADF task-list, and swallows `END` inside the final `<li>`, (4) host workflow is non-injective on `statusCategory` (9 transitions from `Open`; 4 `new`, 3 `indeterminate`) so Phase 2 must map on status **name**. Also corrected two wrong tool names in the spec (`listJiraIssueTransitions`, `listJiraProjectIssueTypesMetadata`) and confirmed token-based JQL pagination. Phase 1 ticked **6/7** — the resolution quirk left honestly unverified (needs workflow writes; sign-off covered a description round-trip only). Commits `4b0b870` findings, `d874b88` tick, `1cc5afe` board note; all pushed per F4. **Near-miss recorded as F7 below.** |
| 2026-08-28 | TASK-107 | — (board track, direct to `main`) | `05bb793` | ~257k subagent tokens (3 probes) | Done. Tier pins verified to actually serve via the 9router ledger, not self-report. Unblocked the epic by one of its two deps. |
| 2026-08-28 | TASK-109 | [#132](https://github.com/evanstern/praxisflux/pull/132) | `0c97243` | ~686k subagent tokens (4 phase dispatches: ~158k + ~146k + ~147k + ~235k) | **Done.** Lane 1 complete; v0.59.0. Claim `415d5c8` (atomic: status flip + 4 phase ACs seeded from spec 052 tasks.md — the spec dir and Spec marker already existed on main under the hand-authored escape line). Phases: 1 `14b4577` (schema + read/write/validate, +9 tests), 2 `5580d51` (parser MOVED out of bridge.mjs, −46 lines, re-exported), 3 `412c935` (staleness + provider registry + projector, +7 tests), 4 `19e7a67`+`edea9b8`+`4694352`+`990b61f`+`5c47903` (--check CLI +3 tests, dogfood mirror, 0.59.0 bump, 12-note re-ground). All dispatches sonnet · `cc/claude-sonnet-5[1m]`; served model is pin-consistent self-report, NOT ledger-proven — every implementer stated it had no harness-provided evidence of its identity (router admin API rejects `ANTHROPIC_AUTH_TOKEN`). Orchestrator verified independently, not on report: suite 468/468, check-docs 0, versions 0.59.0, freshness exit 0; AC#9's three protected test files byte-identical across the whole branch; no provider-name conditional in `lib/`; ZERO new or widened `size_budget_exempt`. Merged as a merge commit (pins stay reachable); operator merged after review. Board Done via `spec-bridge:sync`'s derived plan, never by hand. **Gate lesson:** 55 Stop-hook findings reading 'required gate "tests" is red' were the TASK-114 flake, not misattribution — see TASK-114 for the confirmed mechanism and three ruled-out causes. |
| 2026-09-01 | TASK-114 | [#133](https://github.com/evanstern/praxisflux/pull/133) | `dafff60` | ~660k subagent tokens (3 dispatches) | **Done** (v0.59.5, merged 2026-09-04). Folded into Lane 2 at operator request; spec 059 hand-authored by the orchestrator. Fixed the same-second run-id flake that had amplified one red gate into 55 phantom findings. **Proof: 20/20 consecutive suite runs, 469 pass / 0 fail each, zero failure markers** — read from the raw log by the orchestrator, not from a summary. 8 lines of production code. Findings: re-pins CASCADE (a note in another note's `sources:` staleness-propagates), and F3 (one orchestrator session cannot host concurrent cross-worktree dispatches). |
| 2026-09-01 | TASK-110 | [#134](https://github.com/evanstern/praxisflux/pull/134) | `5377710` | ~640k subagent tokens (3 phase dispatches + 1 lost to F3) | **Done** (v0.59.6, merged 2026-09-04 — took TWO reconciles as the sibling merges moved main; CI caught an uncommitted-bump slip the local gate missed). `boardLinks(root)` seam, `hasAnyChild` in both resolvers in lockstep, R3/R4 fail-closed findings (as `problems`, never warnings — `gate-runner` swallows warnings), planner split with all ordering in `planIntents`, and a differential test asserting mirror and live paths are indistinguishable. Suite 480/480. |
| 2026-09-03 | TASK-111 | [#135](https://github.com/evanstern/praxisflux/pull/135) | `e0ea7b2` | ~540k subagent tokens (3 phase dispatches + 2 lost to F3/relocation) | **Done** (v0.59.3, merged 2026-09-03 — merged FIRST, inverting the planned order). `.board.json` config with NO silent unknown-provider fallback, two deliberately-separate provider tables, `jira` peer + mutual exclusion, `pdlc:peer:jira` block with zero backlog verbs. Suite 483/483. Survived the repo relocation with nothing lost → finding **F4** (push after every phase, not just the claim). The re-pin cascade fired **twice** here. |
| 2026-08-28 | TASK-104 | [#130](https://github.com/evanstern/praxisflux/pull/130) | `a875256` | ~407k subagent tokens (3 phase dispatches: ~152k + ~122k + ~133k) | **Done.** Lane 0 complete. Claim `3615c12` (atomic: card + spec 058 + link, pushed). All 4 phases: 1 `0608633` (resolver, +6 tests), 2 `c05631c` (wiring, +3/−7 in spec-derive), 3 `1b3e6f8` (+6 integration tests, AC1–AC8), 4 `70716f9` (re-pins + 0.58.0), plus `0d8685f` (the 11 notes the bump staled). All dispatches sonnet · `cc/claude-sonnet-5[1m]`, served model confirmed via router ledger. Merged as a merge commit (pins stay reachable); operator merged after review. Board moved to Done by `spec-bridge:sync`'s derived plan, never by hand. Suite 449/449; freshness exit 0; bridge check exit 0. |
