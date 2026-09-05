# Local-only planting mode — sweep runbook (2026-09-04)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground. Direction is decided; do not re-litigate it: the board card
TASK-116 (commit e65068b) IS the synthesis — it carries the finding, the live precedent
(kofile/ai-coe-plugins running the pattern by hand since 2026-08-27), the exact exclude
set, both known edges, and eight ACs. Plan-of-record is the board; this file carries only
ordering, doctrine, and the log.

**Status:** draft · operator sign-off on lanes: pending
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

## Read first (in this order)

1. `backlog task view TASK-116 --plain` — the direction source; there is no separate
   synthesis doc. Its Description names the working downstream precedent and the exact
   exclude list; its ACs are the requirements the spec maps to.
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect
   `pdlc-plugin`, `pdlc-grounding-block`, `installer`, `test-suite-catalog-plugins-gates`.
3. `docs/releasing.md` (bump rules — this PR touches released surface).
4. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-09-04, main @ e65068b, v0.59.6)

- **Done already:** the TASK-110/111/114 sweep (runbook `jira-board-runbook.md`, status
  done); root on `main`, clean, fast-forwarded; `git worktree list` shows only the root.
- **In flight in other sessions (do not duplicate):** none — no `task-*` worktrees, no
  open sweep branches.
- **Paused — untouched:** none (no task carries the `paused` label).
- **Queued (this runbook's scope):** TASK-116, alone.
- **Next free spec number at authoring:** **060** (`origin/main:specs/` tops out at
  059-flake-deterministic-clock). Claim-before-work governs — re-check at claim time and
  renumber on collision.
- **Tier config:** `node <pdlc>/scripts/tiers.mjs --root . --check` exits 0, all three
  agent definitions `unchanged`. **Nothing was regenerated**, so no session restart is
  owed before dispatch.

## Execution lanes (dependency-ordered; parallelize within a lane)

One task, one lane — there is nothing to parallelize and nothing to serialize against.

**Lane 1 — the only lane:**
- **TASK-116 (`sonnet` · model `cc/claude-sonnet-5[1m]`, fallback: none declared for this
  tier — on unavailability, STOP and ping the operator rather than silently falling to
  another tier)** — local-only planting mode on `plant.mjs` + the bootstrap question +
  tests. **Rubric justification:** `defaultTier`. The card settles every judgment call
  the implementer would otherwise have to make — the exclude set is enumerated verbatim,
  the sentinel-recording requirement is stated, the ordering constraint (excludes before
  artifacts) is stated, and both edges (pre-`git init`, mode switching as honest drift)
  are named. This is work to a written spec against an existing pattern (the `--hook`
  opt-in is the sibling shape the card explicitly points at), which is exactly
  `sonnet`'s scope. **No escalation; no operator checkpoint owed for tier.**

Tiers and their model IDs come from **`.claude/model-tiers.json`**, not from memory —
`tiers.mjs --root . --check` exited 0 before these lanes were authored.

Record the model tier + explicit model ID + rubric justification + **which model actually
served** on TASK-116 at dispatch.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: ABSENT.** This host ships no `scripts/check-merge-drift.mjs`
  (verified 2026-09-04: `scripts/` holds build, check-docs, check-version-bump,
  gen-marketplace, new-plugin, run-gates, stop-docs, sync-shared, sync-version). The
  sweep falls back to raw git (`git fetch origin && git pull --ff-only` at root) and
  **loses claim-collision detection and the drift matrix**. Compensate manually: before
  claiming the spec number, check it against `origin/main` with
  `git ls-tree --name-only origin/main specs/`, and check for a live branch with
  `git ls-remote --heads origin 'task-116*'`.
- **`core.hooksPath` is active and RESOLVES** (verified 2026-09-04: `.githooks`, relative,
  `ls -d` succeeds — the F5 relocation trap from the previous sweep is fixed).
  `.githooks/pre-commit` runs the FULL `node --test` suite plus marketplace/version/docs
  sync checks on **every** commit; `.githooks/pre-push` runs the version-bump and
  wiki-freshness gates. A red suite blocks every intermediate commit, so sequence work so
  each commit leaves the suite green.
- **Run the suite as bare `node --test`** — no path argument, exactly as
  `.githooks/pre-commit` does. There is **no `package.json`** in this repo, so there is no
  `npm test`. Passing a path (`node --test test/`) makes node resolve `test` as a module
  and die with `Cannot find module '<root>/test'`, reporting `tests 1 / fail 1` — a
  failure that looks exactly like a red suite and is not real. Cost three wrong
  conclusions on 2026-08-28.
- **Scratch files in the worktree get collected by the test runner.** A stray `t.txt` in
  the repo root is picked up as a test file and fails the run. Write throwaway output to
  `$CLAUDE_JOB_DIR/tmp`, never the worktree.
- **Released surface ⇒ version bump.** This PR touches `pdlc/` (a plugin dir), so it MUST
  bump the marketplace version **and** `pdlc/skills/bootstrap/SKILL.md`'s own `version:`
  (`docs/releasing.md`). CI enforces it; each merge to `main` auto-publishes `v<version>`.
- **Docs sync.** `node scripts/check-docs.mjs` plus the wiki freshness gate run in CI, in
  both git hooks, and in the repo Stop hook (`scripts/stop-docs.mjs`), which refuses to end
  a turn while they fail. Update `README.md`/`CLAUDE.md` if what the repo ships changes —
  a new planting MODE is shipped surface, so check both.
- **Re-ground obligations.** Use the classifier — `node grounding-wiki/gates/cli.mjs plan .
  docs/wiki`. Notes that source the files this task touches:
  `docs/wiki/pdlc-plugin.md` (sources `pdlc/scripts/plant.mjs`,
  `pdlc/skills/bootstrap/SKILL.md`), `docs/wiki/pdlc-grounding-block.md`,
  `docs/wiki/installer.md` (sources `lib/installer.mjs` — only if the implementer adds an
  `ensureExclude`-shaped helper there), and
  `docs/wiki/test-suite-catalog-plugins-gates.md` (sources `test/pdlc.test.mjs`).
  **Re-pin volume is larger than it looks:** a marketplace version bump touches every
  `plugin.json`, so this released-surface PR can stale ~17 notes.
- **Re-pins CASCADE — re-run the freshness gate AFTER committing them** (TASK-114,
  2026-09-01). A note listed in another note's `sources:` propagates staleness when
  re-pinned. One pass is NOT enough: run the gate again once the re-pin commit exists.
  **`test-suite-catalog-plugins-gates.md` is exactly such a hub note and this task edits
  the test file it pins** — expect the cascade.
- **`test-suite-catalog-plugins-gates.md` is at 7987/8000 chars (TASK-103, open).** This
  task adds tests to `test/pdlc.test.mjs`, whose per-file bullet lives in that note. Adding
  a sentence there will **overflow the 8,000-char budget**. Take a genuine trim or a
  summary-style split in this PR; `size_budget_exempt` is not the answer.
- **A GATE RUN AGAINST A DIRTY WORKING TREE PROVES NOTHING ABOUT THE COMMIT** (F6,
  2026-09-04, caught by CI not locally). Verify a commit's content with
  `git show HEAD:<file>`, never by reading the file on disk; treat every `--check` run as
  a statement about the *tree* until `git status --porcelain` is empty.
- **Merge commits, never squash.** Squashing orphans the commits `docs/wiki` notes pin as
  `verified_against`, breaking the freshness gate.

## Per-task artifacts required before PR

**No PR opens for a task until each line below checks true for it.**

- [ ] `specs/060-local-only-planting/` carries a real `spec.md` (problem + requirements
      mapped to TASK-116's eight ACs), `plan.md` (this host has no ratified constitution —
      state that plainly and plan against `CLAUDE.md`, `docs/principles.md`, and
      `docs/wiki/`), and `tasks.md` (phased checkboxes the bridge derives from), all
      committed on the task's branch. A claim stub reserves the number; it satisfies
      nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link`), and
      phase ACs are seeded from tasks.md (link update mode) **before** implementation
      dispatch.
- **Escape line (operator-signed only):** **`.specify/` is absent on this host.** Spec Kit
  artifacts for TASK-116 are **hand-authored** under this sweep's operator-signed escape
  line, per this host's established precedent (specs 052–059 were authored that way; spec
  045 records the hatch). Signed: operator, pending at sign-off of this runbook. This is
  the recorded host-precedent sanction — never a second mechanism.
- [ ] **The claim is ATOMIC** (host ruling, 2026-08-28): card flip + spec dir +
      `spec-bridge:link` land in **ONE commit on the branch**. Two-track landing's "board
      commits direct to `main`" covers notes, AC ticks, labels, and new cards — **never**
      the status flip that claims a task, which is deliverable state. Splitting it in a
      prior session produced ~50 gate findings from one status flip.
- [ ] **PUSH AFTER EVERY PHASE, not just at the claim** (F4, 2026-09-03). The
      claim-and-push rule covers only branch tips; phase commits left local were nearly
      lost when the repo relocated on disk mid-session. Push after each phase's commit.
- [ ] **ONE ORCHESTRATOR SESSION CANNOT HOST CONCURRENT DISPATCHES ACROSS SIBLING
      WORKTREES** (F3, 2026-09-01). A dispatched subagent's Bash sandbox binds to the
      **orchestrator session's** current worktree, not the one named in its prompt.
      Dispatch **serially**, with the orchestrator parked in the target worktree for the
      duration. Moot for a one-task sweep, but it governs the phase dispatches within
      TASK-116: park in `task-116`'s worktree and do not switch away mid-dispatch.
- [ ] **Execution mode is the DEFAULT (interactive root, main-push available)** — verified
      2026-09-04: the root checkout is interactive and on `main`. Worktrees therefore live
      at `.worktrees/task-116`, post-merge closures land as root commits, and the
      background-job substitutes do **not** apply. If a session resuming this runbook finds
      itself in a background job, switch to the background-job mode's three substitutes and
      note the switch here.

## Concurrency & conflict doctrine

- **Hotspots:** `.claude-plugin/marketplace.json` and every `plugin.json` (the version
  bump — guaranteed conflict with any other concurrent released-surface PR);
  `pdlc/scripts/plant.mjs` and `test/pdlc.test.mjs` (this task's core, and the file
  TASK-95 would also touch — TASK-95 is not in this sweep and must not be started
  concurrently); `docs/wiki/*` pins; `README.md` / `CLAUDE.md`.
- **Paused tasks are not live lanes:** none currently.
- Reconcile by what the branch carries: a **pin-carrying branch** (its own commits
  referenced by re-pins it carries — this branch WILL be one, since it re-pins wiki notes
  to its own commits) **merges `origin/main` in**; squash, rebase, and force-push all
  rewrite hashes and stale every carried pin, so its PR also lands as a merge commit. A
  **pin-free branch rebases.** Take main's side for anything you didn't deliberately
  change.
- **Honest re-pins only — a merge-in never justifies a pin bump** (pin = merge commit
  empties the freshness probe's range by construction). Classify every stale/conflicted
  pin via the plan loop: read `git diff <old-pin>..<merge-commit> -- <sources>`, mark
  **RE-PIN-ONLY** or **NEEDS-REVIEW**, and amend prose BEFORE bumping.
- After every history move: re-run gates AND the freshness probe **unconditionally** —
  never gated on whether `docs/wiki/` changed.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work; push immediately** (`git push -u origin task-116-local-only-planting`);
  never force-push a claim. A rejected push means you lost the race: fetch, re-read the
  board and `specs/`; if another session holds TASK-116 or spec 060, STOP and surface it.
- Verify the PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree.

## Operator checkpoints (do not proceed silently)

- **Runbook sign-off** — the lane and the hand-authored-specs escape line above are draft
  until the operator flips the status line.
- **Tier escalation** — none planned. TASK-116 runs at `defaultTier`. Escalating to
  `opus` requires a checkpoint recorded here before dispatch.
- **The default-mode question is a one-way-ish door and belongs to the operator, not the
  implementer.** AC #5 says bootstrap ASKS and RECOMMENDS. If the implementer finds
  itself wanting to change which mode is the DEFAULT (today: tracked planting), that is a
  runbook amendment plus an operator ping — not a decision note in a spec artifact.
- **Softening any gate this runbook enumerates** — at plan, implement, or merge time —
  is a runbook amendment plus an operator ping. Amend the file, note why, tell the
  operator. Specifically flagged: the released-surface version bump, the note-budget
  overflow on `test-suite-catalog-plugins-gates.md`, and the atomic claim.

## Done means

- TASK-116 **Done on the board via its own merged PR**, moved there by
  `spec-bridge:sync`'s derived plan (never a hand-set `-s Done` on a linked task).
- The card still carries its **Spec marker** at sweep end (re-run the links check).
- `specs/060-local-only-planting/` contains real `spec.md` + `plan.md` + `tasks.md`.
- All eight ACs checked, with the tier/model/served-model note recorded on the task.
- Every project gate green **on main**: bare `node --test`, `scripts/check-docs.mjs`,
  `check-version-bump.mjs`, and the wiki freshness gate — the last re-run **after** the
  re-pin commit exists (cascade).
- Grounding fresh: `pdlc-plugin`, `pdlc-grounding-block`,
  `test-suite-catalog-plugins-gates` (and `installer` if touched) re-pinned honestly, each
  classified RE-PIN-ONLY or NEEDS-REVIEW against its own diff.
- `git worktree list` shows no stale sweep worktrees; `task-116-*` branch deleted after a
  verified merge.
- This runbook's execution log complete and its status flipped to **done**.

## Execution log

| Task | Tier / model | Model served | Spec | Phases | PR | Merge sha | Tokens/cost | Date |
|---|---|---|---|---|---|---|---|---|
| TASK-116 | sonnet / `cc/claude-sonnet-5[1m]` | _pending_ | 060 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
