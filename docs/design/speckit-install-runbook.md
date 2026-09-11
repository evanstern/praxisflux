# Spec Kit install — sweep runbook (2026-09-11)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — merging serially, treating merge conflicts as routine. Direction
is decided; do not re-litigate it: the TASK-0128 card (operator-approved mid-sweep
2026-09-10) wins. Plan-of-record is the board; this file carries only ordering, doctrine,
and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-09-11 — operator replied
"Approved: all four" to the itemized list: (1) the lane (TASK-0128, branch
`task-0128-speckit-install`, spec 067, sonnet default); (2) the spec-067 hand-authored
escape line (the last use of the precedent); (3) the opus escalation for the
doctrine phase only (`cc/claude-opus-5[1m]`, fallback `cc/claude-opus-4-8[1m]`);
(4) the constitution default — record absence, card ratification as follow-up.
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

## Read first (in this order)

1. The TASK-0128 card — the operator finding and approval that produced this task.
2. `docs/releasing.md` — version-bump rules; this task touches released surface
   (`pdlc/skills/sweep/SKILL.md`).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. `backlog task view TASK-0128 --plain`.

## State when this runbook was written (2026-09-11)

- **Done already:** specs 001–066 merged; TASK-0125 (dispatch gap, PR #144) is the
  latest merge. Root at `427273d`.
- **In flight in other sessions (do not duplicate; expect their merges):** none —
  board shows no In Progress tasks.
- **Paused — untouched:** none (no In Progress task carries the `paused` label).
- **Queued (this runbook's scope):** TASK-0128 only.

## Execution lanes (dependency-ordered; parallelize within a lane)

**Lane 1 — the whole sweep:**
- **TASK-0128 (sonnet · model `cc/claude-sonnet-5[1m]`, no fallback declared for this
  tier — default tier: the judgment calls are settled by the card and this runbook;
  installation, template reconciliation, and verification are work-to-a-written-spec)**
  — install Spec Kit tooling (`specify init --here --integration claude`, CLI already
  on PATH at `~/.local/bin/specify`), reconcile its templates with the house spec
  format (specs 001–066), ratify-or-record the constitution, verify spec-bridge
  derivation against a tool-generated spec dir, and retire the escape line from sweep
  doctrine.
  **Tier note for the doctrine slice:** AC #4 edits `pdlc/skills/sweep/SKILL.md`
  (cross-surface doctrine prose). Precedent (TASK-86/87/88) dispatched SKILL.md prose
  edits to the opus tier. Opus is `escalation: true` in `.claude/model-tiers.json`, so
  that dispatch needs an operator checkpoint. **Proposed:** the doctrine phase alone
  dispatches at **opus** (`cc/claude-opus-5[1m]`, fallback `cc/claude-opus-4-8[1m]`);
  all other phases at sonnet. Operator sign-off on this runbook IS that recorded
  checkpoint — signing it sanctions the opus dispatch for the doctrine phase only.

Tiers and their model IDs come from **`.claude/model-tiers.json`** — `tiers.mjs --root .
--check` exited 0 before these lanes were authored (no regeneration; session safe to
dispatch). Model IDs here are in this host's 9router form (`cc/…[1m]`); bare IDs and
aliases are rejected in agent-def frontmatter on this host.

Record the model tier + explicit model ID + rubric justification on the board task at
dispatch, and the served model from the first dispatch transcript before any sibling
dispatch (`Dispatch: tier=<tier> pinned=<model-id> served=<model-id>`).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent.** No `scripts/check-merge-drift.mjs` in this repo; the
  raw git commands (fetch + ff-pull root, branch-vs-origin/main diff before diagnosing
  breakage) stand.
- `node --test` — the full suite, green before PR.
- `node scripts/check-docs.mjs` — docs-in-sync gate (also run by pre-commit/pre-push
  hooks and the repo Stop hook).
- `node scripts/sync-version.mjs --check` — versions consistent.
- `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` — wiki freshness; this PR
  touches `pdlc/skills/sweep/SKILL.md`, which is a pinned source for
  `docs/wiki/pdlc-sweep.md` (and the sweep-history notes), so a same-PR honest re-pin
  pass over the staled notes is required: classify each against
  `git diff <old-pin>..HEAD -- <sources>` as RE-PIN-ONLY vs NEEDS-REVIEW; amend prose
  before bumping where NEEDS-REVIEW.
- **Released-surface version bumps (docs/releasing.md):** the PR edits
  `pdlc/skills/sweep/SKILL.md`, so it must bump that skill's own `version:`
  (currently 0.23.0) and the marketplace version (currently 0.64.0). CI enforces.
- **PR merges as a merge commit, never squash** (repo-wide rule; this branch will
  carry wiki re-pins referencing its own commits, so it is pin-carrying).

## Per-task artifacts required before PR

- [ ] `specs/067-speckit-install/` carries a real `spec.md` (problem + requirements
      mapped to the card's 4 ACs), `plan.md` (the constitution is absent/unratified —
      state that plainly and plan against `docs/wiki/` + CLAUDE.md; note the irony is
      the point: this task ends that state), and `tasks.md` (phased checkboxes the
      bridge derives from), committed on the task's branch. A claim stub reserves the
      number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link`
      against the stub), and phase ACs are seeded from tasks.md (link update mode)
      before implementation dispatch.
- **Escape lines (operator-signed only):** TASK-0128: hand-authored spec set per host
  precedent (specs 052–066) — **the last one**: Spec Kit is not installed until this
  task lands, so spec 067 itself is authored by hand; signing this runbook signs this
  line. After this task merges, the precedent is retired and future runbooks carry
  "none" here.
- **Host additions:**
  - `specify init` must run with `--here` against the repo root **inside the task
    worktree**, and its output reviewed before commit: it may write `.claude/commands/`
    entries and `.specify/`; it must NOT clobber `.claude/agents/*`,
    `.claude/model-tiers.json`, or `CLAUDE.md`. Diff before staging; take the house
    side for anything it tries to overwrite.
  - Template reconciliation is **edit-in-place of `.specify/templates/`** to match the
    house format (board-task header; no escape-line header; phased tasks.md the bridge
    derives from) — never the reverse (no reformatting of specs 001–066).
  - Bridge verification is a **real check**: generate a spec dir with the installed
    tooling (scratch or the 067 dir itself), run the bridge derivation against it, and
    record the result in the spec dir or on the card.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/skills/sweep/SKILL.md` (doctrine edit), `docs/wiki/pdlc-sweep*.md`
  (re-pins), `.claude-plugin/marketplace.json` (version bump — every concurrent PR
  bumps it; smallest merges first, later ones re-bump after merge-in). No other
  session is live, so exposure is low; the rules stand anyway.
- **Paused tasks are not live lanes** — none exist; if one appears, never claim,
  rebase, or clean its branches/worktrees.
- Reconcile by what the branch carries: this branch is **pin-carrying** (wiki re-pins
  referencing its own commits) → **merge `origin/main` in**, never rebase or squash;
  the PR lands as a merge commit. Take main's side for anything not deliberately
  changed.
- **Honest re-pins only** — a merge-in never justifies a pin bump; classify every
  staled pin against the main-side diff over the note's sources (RE-PIN-ONLY vs
  NEEDS-REVIEW) before bumping.
- After every history move: re-run gates AND the freshness probe unconditionally.
- **Claim before work:** the branch's FIRST commit claims TASK-0128 — card →
  In Progress, `specs/067-speckit-install/` stub, `spec-bridge:link` against the stub —
  then push immediately (`git push -u origin task-0128-speckit-install`); never
  force-push a claim. Rejected push → fetch, re-read board and `specs/`; task or
  number taken → STOP and surface; unrelated rejection → merge `origin/main` in and
  re-push plain.
- Verify the PR merged (`gh api … --jq .merged`) before deleting branch/worktree.

## Operator checkpoints (do not proceed silently)

- **Runbook sign-off** (this document): carries three decisions at once — the lane,
  the escape line for spec 067, and the opus escalation for the doctrine phase.
- **Constitution ratify-or-skip (AC #3):** `specify init` scaffolds a constitution
  template. Ratifying one is a policy decision the operator owns. **Default proposed:**
  record its absence explicitly in `.specify/memory/` ("unratified — planning runs
  against docs/wiki + CLAUDE.md per house rule") and card ratification as a follow-up
  question, not silently fill the template. If the operator wants it ratified in this
  PR, say so at sign-off.
- Lane amendments: amend this file, note why, tell the operator.

## Done means

TASK-0128 Done on the board via `spec-bridge:sync` after its single merged PR;
`.specify/` present on `main` with reconciled templates; `/speckit.*` commands
available; constitution state explicitly recorded; bridge derivation verified against a
tool-generated dir; the escape-line precedent retired in `pdlc/skills/sweep/SKILL.md`
with skill + marketplace versions bumped; all four project gates green on `main`; wiki
pins current over the touched sources; `git worktree list` clean; this log complete and
status flipped to done.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while
a task is in flight its row carries the phases dispatched/completed, updated at each
dispatch boundary; the closing note on merge replaces or absorbs it. `tokens/cost`
carries best-effort actuals from the harness/transcript.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-09-11 | TASK-0128 | — | — | ph1 ~103k, ph2+3 ~147k subagent tokens | phases: 1-3 done (f7cecdc, b8fa70b, bfd04b0; both dispatches served=claude-sonnet-5); 4 dispatched (opus) |
