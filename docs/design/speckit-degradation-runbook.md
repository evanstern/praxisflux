# Spec Kit degradation hardening (TASK-84) — sweep runbook (2026-07-30)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground. Direction is decided; do not re-litigate it: the board card
(TASK-84, carded d65c235) IS the synthesis — it carries the live incident
(infinitynode.media debt sweep, 2026-07-28: two tasks shipped claim-stub-only specs and
were hand-moved to Done, undetected end to end), the five-cause diagnosis, and seven ACs.
Plan-of-record is the board; this file carries only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-31 (PR #104 review; AC #4 wording blessed as recommended; model pin gains the opus-4.8 fallback)
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

**Bootstrap note (this sweep edits the sweep skill itself):** the executing orchestrator
follows the doctrine as it stands at execution time (sweep 0.12.0 / v0.43.0) — including
the cost levers TASK-86..88 just landed (explicit model ID on every dispatch,
phase-scoped implementers, turn-hygiene block, tokens/cost log, lane-boundary session
ends). TASK-84's own fixes (link inside the claim commit, artifact-named step 3, the
runbook's per-task-artifacts section, the widened Output gate) bind FUTURE sweeps once
merged — but where a fix is a pure operational choice, apply it to this sweep too rather
than demonstrating the failure being fixed: name the spec artifacts in the spec-cycle
commit, and do not let this sweep's own PR open without spec+plan+tasks in specs/038-*.

## Read first (in this order)

1. The task card (`backlog task view TASK-84 --plain`) — direction source; its
   Description is the full diagnosis (detail asymmetry; gate armed too late; template
   slot missing; Output gate blind; operator rulings recorded as prose). NOTE: the
   SKILL.md line numbers it cites (122-142, 143-144, 145) predate the 0.10.0–0.12.0
   step-5/step-10 growth — locate by content, not line.
2. TASK-79 (`backlog task view TASK-79 --plain`) — the INVERSE card this task must not
   contradict (79 widens what's permitted when `.specify/` is absent; 84 narrows what
   goes unnoticed when it's present or the full cycle was chosen). AC #6 requires
   cross-referencing and a non-contradiction check; TASK-79 stays UNIMPLEMENTED.
3. `docs/wiki/CAPSULES.md` for orientation; `docs/wiki/pdlc-sweep.md` just-in-time (its
   sources are exactly the two files under edit). `docs/releasing.md` (bump rules);
   `docs/task-courses.md` (per-feature — not triggered).
4. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-07-30, main @ 57a036c, v0.43.0, sweep skill 0.12.0)

- **Done already:** sweep-cost-levers sweep — TASK-86 (#100, v0.41.0), TASK-87 (#101,
  v0.42.0), TASK-88 (#102, v0.43.0), closed via #103; runbook
  docs/design/sweep-cost-levers-runbook.md status done.
- **In flight in other sessions (do not duplicate; expect their merges):** none — board
  shows no In Progress tasks.
- **Paused — untouched (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their
  branches/worktrees):** none.
- **Queued (this runbook's scope):** TASK-84 only.

## Execution lanes (dependency-ordered)

**Lane 1 (the only lane) — TASK-84:**
- **TASK-84 (default implementer · model `claude-opus-5`, fallback `claude-opus-4-8`
  where the executing subscription lacks Opus 5 (operator ruling 2026-07-31 — the Agent
  `opus` param resolves to the subscription's available Opus; record which actually ran
  in the dispatch note and the log), Agent param `opus` — doctrine
  prose on a procedural skill, no code; the most intricate of the sweep-skill edits
  (seven ACs, a step restructure, a template section, an Output-gate widening, a
  non-contradiction proof against TASK-79) but still prose against a precise spec;
  escalation to `claude-fable-5` is an operator checkpoint, not a default)** —
  per the card's ACs:
  1. step 3 states required artifacts by name (spec.md, plan.md, tasks.md) with the
     claim step's mechanical specificity, incl. absent/unratified-constitution handling;
  2. `spec-bridge:link` moves INTO the claim commit (step 2), arming the bridge's Stop
     gate from the branch's first commit;
  3. templates/runbook.md gains a "Per-task artifacts required before PR" section;
  4. Output gate adds: every scoped task's specs/NNN-*/ contains spec+plan+tasks OR the
     runbook records an operator-signed escape hatch — worded to compose with TASK-79's
     future hand-authored-specs hatch, not contradict it;
  5. doctrine sentence: a precondition/Lane-0 decision that changes the per-task loop
     is written as a checkable line in the runbook's gate section, never only prose;
  6. TASK-79 ↔ TASK-84 cross-referenced on both cards; fixes verified non-contradictory
     (79 remains To Do — do NOT implement its hatch);
  7. skill 0.12.0 → 0.13.0 + marketplace 0.43.0 → 0.44.0; pdlc-sweep wiki note
     re-verified; gates green.

**Phase-scoped dispatch plan (orchestrator's recorded grouping call):** tasks.md will
carry Spec / Implement / Prove phases as usual; dispatch Implement as one implementer
(the seven ACs interlock — splitting them risks contradictory prose) and Prove's wiki
work as a second fresh implementer IF the first ends heavy; otherwise one dispatch
covers both, recorded in the log's notes slot either way.

**Model pinning is mandatory at every dispatch:** pass `opus` explicitly on the Agent
call; record tier + model ID + justification on the board task at dispatch. The pinned
ID is `claude-opus-5` with recorded fallback `claude-opus-4-8` when Opus 5 is
unavailable in the executing subscription (operator ruling 2026-07-31) — pinning is
about never inheriting the session model, not about failing a dispatch the
subscription can serve one price-equivalent step down; record the model that actually
served the dispatch.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-30: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only at root; worktree cut from fresh `origin/main`.
- **Spec Kit: `.specify/` absent — host precedent stands** (six prior runbooks):
  hand-authored `specs/NNN-slug/{spec,plan,tasks}.md` + `spec-bridge:link` BEFORE
  implementation. Next free number at authoring: **038**; check `origin/main:specs/`
  at claim; renumber on collision.
- **Per-task artifacts required before PR (the rule this sweep is shipping, applied to
  itself):** no PR opens for TASK-84 until `specs/038-*/spec.md`, `plan.md`, and
  `tasks.md` exist with content (not stubs) and the spec is linked to the card.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate
  (`node grounding-wiki/gates/cli.mjs freshness . docs/wiki`; hard v2: capsules ≤500
  chars, bodies ≤8,000, CAPSULES.md regenerated with any `description:` change).
- **Version bump gate:** touches `pdlc/` → `node scripts/sync-version.mjs 0.44.0` at
  merge-readiness (next free if main moved) + sweep skill `version:` → 0.13.0 (minor).
- **Same-PR wiki re-pins:** `docs/wiki/pdlc-sweep.md` is NEEDS-REVIEW (sources = the two
  edited files) — and it sits at 7,999/8,000 body budget, so TASK-84's additions will
  NOT fit by tightening alone: expect a **summary-style split** per docs/corpus-spec.md
  (e.g. execution-loop detail into a linked sibling note), INDEX/CAPSULES updated in the
  same slice. Lockstep stamps stale ~11 siblings → classify against diffs (expect
  RE-PIN-ONLY).
- NO per-task courses. Merge commits only (pin-carrying branch); one TASK one PR;
  task-id-led commit subjects with the Co-Authored-By trailer.
- **Turn-hygiene block rides every implementer dispatch prompt** (0.12.0 doctrine):
  batched parallel calls; minimal narration; mechanical phases at lower effort.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/skills/sweep/SKILL.md` + `pdlc/skills/sweep/templates/runbook.md`
  (same files TASK-79 will someday edit — 79 must stay unclaimed while this runs);
  version lockstep files; `docs/wiki/pdlc-sweep.md` + INDEX + CAPSULES (split lands
  here).
- Single lane, so cross-lane rules are moot; the standing doctrine (pin-carrying branch
  merges `origin/main` in, never rebase/squash; honest re-pins classified against the
  main-side diff; gates + freshness re-run after every history move; claim-before-work
  with immediate push; rejected push = race lost → re-read board and specs/, STOP if
  taken; verify merged before deleting; board/spec files added specifically, never
  `backlog/` wholesale) all binds as written in the sweep skill.
- **Background-job execution pattern** (this orchestrator runs as a background job):
  task worktrees at `.claude/worktrees/task-84` (harness isolation; `EnterWorktree`
  path-switch), board closure + runbook log rows ride the next branch — here, a small
  sweep-close PR — since background jobs never push main directly.

## Operator checkpoints (do not proceed silently)

- **AC #4 wording vs TASK-79 (settled at sign-off, not mid-lane):** the Output-gate
  escape hatch must be phrased so TASK-79's future "hand-authored specs when `.specify/`
  is absent" hatch slots in as one INSTANCE of the recorded-in-runbook escape mechanism,
  not a second competing mechanism. Author's recommendation: the gate demands
  "spec+plan+tasks present OR a runbook-recorded, operator-signed escape line naming the
  task and what stands in for the artifacts" — 79 later makes the host-precedent case a
  standard instance of that line. Operator may bless this wording or supply their own at
  sign-off; the answer binds the implementer.
  → **Blessed at sign-off (operator, 2026-07-31): the recommended wording stands
  verbatim. Same ruling added the model-pin fallback: `claude-opus-4-8` when
  `claude-opus-5` is unavailable in the executing subscription.**
- If any session claims TASK-79 mid-sweep → STOP and surface (same-file collision).
- Tier/model escalation (e.g. to `claude-fable-5` if the seven-AC interlock defeats the
  opus implementer); lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-84 Done on the board via spec-bridge:sync, through its own merged, version-bumped
PR (v0.44.0, skill 0.13.0); specs/038-*/ carries real spec+plan+tasks; TASK-79 and
TASK-84 cards cross-referenced, 79 still To Do and untouched otherwise; `node --test`,
`check-docs`, and the wiki freshness gate green on main; `docs/wiki/pdlc-sweep.md`
re-verified (split if needed, budgets green); no stale sweep worktrees; this file's log
complete and status flipped to done.

## Execution log

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
