# Board close-out under cost instrumentation (TASK-74..80, 85, 89, 90) — sweep runbook (2026-07-31)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: the ten board cards
win (each carries its own finding citation — the 2026-07-27 and 2026-07-31 refactor-triage
records, the infinitynode.media sweep observation for TASK-85). Plan-of-record is the
board; this file carries only ordering, doctrine, and the log.

**This sweep is additionally a cost experiment:** it is the first full multi-task sweep
run since the TASK-86..88 cost levers landed (model-ID pinning, phase-scoped dispatch,
turn-hygiene, tokens/cost logging, lane-boundary session ends), and the operator has
asked for an end-of-sweep token/cost analysis against the sweep-dat-board baseline (see
"Cost instrumentation" below — the baseline numbers are embedded there so the comparison
survives any one session).

**Status:** signed-off · operator sign-off on lanes: 2026-07-31 (PR #108 review — lanes as authored, sonnet pins on TASK-76/78, and TASK-77 close-as-not-needed all approved)
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

**Bootstrap note (this sweep edits the sweep skill itself, again):** the executing
orchestrator follows the doctrine as it stands at execution time (sweep skill 0.13.0,
v0.44.0) — including every TASK-86..88 cost lever. TASK-89/90/79/85's fixes bind FUTURE
sweeps once merged, but where a fix is a pure operational choice, apply it now rather
than demonstrating the failure being fixed: keep the in-flight execution-log row updated
at each dispatch boundary (89/F1), record the fallback model that actually served each
dispatch (89/F4), and follow the background-job substitute steps recorded below (90).

## Read first (in this order)

1. The ten task cards (`backlog task view TASK-<n> --plain`) — direction source; each
   Description embeds its finding citation and fix shape.
2. `docs/reviews/refactor-triage-praxis-2026-07-31-11-12-22.md` and
   `docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md` — the triage records
   that produced most of these cards.
3. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect
   `pdlc-sweep` (sources = the two files lane A edits), `pdlc-refactor-triage`
   (sources = the file lane B edits), `overview` (TASK-74 re-verifies it),
   `test-suite-catalog-plugins` (TASK-78 splits it, TASK-76 appends to it).
   `docs/releasing.md` (bump rules); `docs/task-courses.md` (per-feature — not
   triggered).
4. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-07-31, main @ b98fcea, v0.44.0, sweep skill 0.13.0)

- **Done already:** sweep-cost-levers sweep (TASK-86..88, PRs #100–#102, v0.41.0–0.43.0);
  speckit-degradation sweep (TASK-84, PR #105, v0.44.0); refactor-triage run
  praxis-2026-07-31-11-12-22 (PR #107) — carded TASK-89/90, deferred F7, cross-ref'd
  TASK-79.
- **In flight in other sessions (do not duplicate; expect their merges):** none — board
  shows no In Progress tasks.
- **Paused — untouched (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their
  branches/worktrees):** none.
- **Queued (this runbook's scope):** TASK-89 → 90 → 79 (lane A) ∥ TASK-75 → 80 → 78 → 76
  (lane B) ∥ TASK-74 → 85 (lane C); TASK-77 is decision-only (operator checkpoint, no
  PR). Stale worktree `.claude/worktrees/sweep-close-84` (previous job's, merged) —
  janitor-remove at execution start.

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — every released-surface task below
fights over the version-lockstep files, and lanes A and C both end in the sweep skill,
so merges are one at a time, smallest-first on conflict.

**Lane A — sweep-skill stack (serial; start immediately):**
- **TASK-89 (default implementer · model `claude-opus-5`, fallback `claude-opus-4-8`
  where the executing subscription lacks Opus 5 (operator ruling 2026-07-31; Agent param
  `opus`; record which model actually served) — seven interlocking one-clause doctrine
  fixes across SKILL.md + template; prose against a precise finding list, no code)** —
  log cadence, skip-path qualifier, lost-link Output gate, model fallback slot, template
  parity, trims.
- **TASK-90 (same tier/model/fallback — doctrine prose; hard-depends on 89, same two
  files)** — names the background-job/no-main-push execution mode (the pattern this very
  sweep runs under; its two recorded precedents are the 2026-07-30/31 runbooks).
- **TASK-79 (same tier/model/fallback — doctrine prose)** — hand-authored-specs escape
  hatch (implement AC #1 as an instance of the 0.13.0 escape line per the card's
  2026-07-31 cross-ref note, never a second mechanism) + runbook-gate-softening
  amendment rule.

**Lane B — refactor-triage + wiki-catalog stack (serial; start immediately, parallel
with A):**
- **TASK-75 (default implementer · `claude-opus-5`, fallback `claude-opus-4-8`, Agent
  param `opus` — skill-contract prose with a cross-plugin path contract; no code)** —
  refactor-triage 0.2.0: tracked-report fallback, headless policy syntax, run-id rule,
  'both tracked' enforcement.
- **TASK-80 (same tier/model — same skill file and record surface; builds on 75's
  run-id rule)** — last-run-at high-water mark + 'since last triage' scope entry.
- **TASK-78 (`claude-sonnet-5`, Agent param `sonnet` — mechanical corpus hygiene per
  docs/corpus-spec.md: a summary-style split, a description trim, a source-list fix;
  pattern exists, judgment is small; escalation to opus is an operator checkpoint)** —
  wiki budget headroom. MUST land before TASK-76: 76's catalog additions do not fit
  test-suite-catalog-plugins at 7,695/8,000. Also lands after 75/80 so its
  pdlc-refactor-triage description trim happens once, over their settled prose.
- **TASK-76 (`claude-sonnet-5`, Agent param `sonnet` — test-authoring to an existing
  sibling standard (test/new-plugin.test.mjs), mechanical; hard-depends on 75: the
  0.2.0 prose is what the tests pin)** — deepen refactor-triage/bootstrap SKILL tests;
  pin the docs/reviews path contract. Test-only → no version bump.

**Lane C — enumeration/grounding surfaces (serial; start immediately, parallel with
A/B):**
- **TASK-74 (default implementer · `claude-opus-5`, fallback `claude-opus-4-8`, Agent
  param `opus` — multi-surface consistency edit incl. a CLAUDE.md re-plant and a wiki
  re-verification)** — three-verb pdlc on every enumerating surface. Re-plant caution:
  this repo's CLAUDE.md block may carry deliberate hand edits — diff against the old
  template render and relocate them, never clobber (standing operator convention).
- **TASK-85 (same tier/model — grounding-template prose deriving a rule from an
  existing principle, plus a one-line sweep-skill reference)** — two-track landing
  rule planted by bootstrap. MERGE GATE: lands only after TASK-90 has merged (AC #3
  wording reconcile with the background-job mode 90 names) and after TASK-74 (same
  template file). Its sweep-SKILL touch reconciles with lane A via merge-in.

**Tail — no PR:**
- **TASK-77** — decision-only card (build orient.mjs --since or close as not-needed).
  Operator checkpoint at sign-off; the answer is recorded on the card and in the escape
  lines below, and the card closes (or stays) accordingly in the wrap-up.

Record the model tier + explicit model ID + rubric justification on each board task at
dispatch (one-way escalation only; escalations are operator checkpoints). Dispatch
phase-scoped per skill 0.13.0: default one fresh implementer per tasks.md phase;
grouping small adjacent phases is the orchestrator's recorded call (precedent: TASK-84
ran Implement+Prove as one dispatch, recorded in its log row).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-31: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only pull at root before each task; every worktree
  cut from fresh `origin/main`.
- **Spec Kit: `.specify/` absent — host precedent stands for the whole sweep** (seven
  prior runbooks, board-clearing → speckit-degradation): hand-authored
  `specs/NNN-slug/{spec,plan,tasks}.md`, link in the claim commit, phase ACs seeded
  before implementation. Next free number at authoring: **039**; claim-before-work
  governs numbers — check `origin/main:specs/` at claim time; renumber on collision.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate
  (`node grounding-wiki/gates/cli.mjs freshness . docs/wiki`; hard v2: capsules ≤500
  chars, bodies ≤8,000, CAPSULES.md regenerated with any `description:` change).
- **Version bump gate:** TASK-74, 75, 79, 80, 85, 89, 90 touch released surface →
  marketplace bump via `node scripts/sync-version.mjs <next>` at merge-readiness
  (0.44.0 → next free; readiness wins over prediction) + every edited skill's own
  `version:` (sweep 0.13.0→ at 89/90/79/85; refactor-triage → 0.2.0 at 75, next at 80;
  bootstrap's skill version at 74/85). TASK-76 (test/ only) and TASK-78 (docs/wiki
  only): **no bump**.
- **Same-PR wiki re-pins (NEEDS-REVIEW, classified against the actual diff):**
  `pdlc-sweep.md` for 89/90/79/85 (6,102/8,000 after the TASK-84 split — history
  material overflows to `pdlc-sweep-history`); `pdlc-refactor-triage.md` for 75/80/78;
  `overview.md` for 74; `test-suite-catalog-plugins.md` for 78 (split) and 76 (bullet).
  Version-stamp churn stales ~11 lockstep siblings → classify; stamp-only is
  RE-PIN-ONLY.
- NO per-task courses (per-feature policy). Merge commits only (every branch here is
  pin-carrying); one TASK one PR; task-id-led commit subjects with the Co-Authored-By
  trailer.
- **Turn-hygiene block rides every implementer dispatch prompt** (0.13.0 doctrine):
  batched parallel tool calls; minimal between-call narration; mechanical phases at
  lower reasoning effort.

## Per-task artifacts required before PR

Per-TASK obligations — the per-PR gates above are project machinery; this section is
what every scoped task must have produced. **No PR opens for a task until each line
below checks true for it.** The sweep's Output gate re-checks the first line for every
scoped task at the end.

- [ ] `specs/NNN-slug/` carries a real `spec.md` (problem + requirements mapped to the
      card's ACs), `plan.md` (stating plainly that no ratified constitution exists and
      planning against the grounding docs — the standing case here), and `tasks.md`
      (phased checkboxes the bridge derives from), committed on the task's branch —
      hand-authored per host precedent, which this line records as sanctioned for the
      whole sweep. A claim stub reserves the number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link`
      against the stub), and phase ACs are seeded from tasks.md (link update mode)
      before implementation dispatch.
- **Escape lines (operator-signed only):**
  - TASK-77: decision-only card — no spec dir, no branch, no PR; the recorded operator
    decision on the card stands in for the artifacts. — **Signed (operator, 2026-07-31,
    PR #108): close as not-needed** — two clean triage runs against the card's own
    evidence bar, zero observed hampers; re-card on a demonstrated hamper.
- Host additions: board bookkeeping rides task branches / the wrap-up PR (background
  job — see doctrine below), never a push to main.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/skills/sweep/SKILL.md` + `pdlc/skills/sweep/templates/runbook.md`
  (lane A ×3, then 85's reference line); `pdlc/templates/CLAUDE.md` (74, 85);
  `pdlc/skills/refactor-triage/SKILL.md` (75, 80); version-lockstep files
  (`.claude-plugin/marketplace.json`, every `plugin.json`, `action.yml` npx pin, edited
  skills' `version:`) — all seven released-surface PRs; `docs/wiki/` INDEX + CAPSULES +
  the four notes named above; root `README.md` and repo `CLAUDE.md` (74).
- **Paused tasks are not live lanes** (none at authoring; the rule stands if one
  appears).
- Reconcile by what the branch carries: every branch in this sweep is **pin-carrying**
  (each re-pins wiki notes to its own commits) → **merge `origin/main` in**, never
  rebase/squash; PRs land as merge commits. Take main's side for anything you didn't
  deliberately change.
- **Honest re-pins only — a merge-in never justifies a pin bump.** Route every staled
  or conflicted pin through the wiki-update plan loop's classifier
  (`git diff <old-pin>..<merge-commit> -- <sources>` → RE-PIN-ONLY vs NEEDS-REVIEW,
  prose amended BEFORE bumping). The merge commit is the re-pin *target* once verified,
  never the *justification*.
- After every history move: re-run gates AND the freshness probe unconditionally.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a reconcile
  between. Conflicting with a sibling session's open PR → smaller merges first.
- **Claim before work:** first commit = board card → In Progress + spec-number stub +
  `spec-bridge:link` (0.13.0: the link rides the claim, arming the bridge gate from the
  branch's first commit); push immediately; never force-push a claim. Rejected push =
  race lost → fetch, re-read board and specs/; taken → STOP the lane and surface;
  unrelated → merge `origin/main` in and re-push plain.
- Verify merged (`gh api … --jq .merged`) before deleting any branch/worktree; never
  delete+recreate a closed PR's head.
- **Background-job execution pattern (this orchestrator runs as a background job —
  the two recorded precedents are the 2026-07-30/31 runbooks; TASK-90 doctrines it):**
  task worktrees at `.claude/worktrees/task-<n>` (harness isolation; `EnterWorktree`
  path-switch); post-merge tasks.md ticks + `spec-bridge:sync` + this file's log rows
  ride the NEXT task's branch (board commands run inside the task worktree — the root
  board lags until merge); final closure (last syncs, runbook status flip, cost
  analysis) lands via a small **wrap-up PR**, since background jobs never push main.
- **Orchestrator session boundaries (cost lever, applied):** the orchestrator SHOULD
  end its session at each lane boundary and resume from this runbook + the board.

## Operator checkpoints (do not proceed silently)

1. **Sign-off on lanes AND the two sonnet pins** (TASK-76, TASK-78 at `claude-sonnet-5`
   — first sub-opus dispatches in this repo's sweeps; rubric above). Escalation
   mid-sweep is a checkpoint.
2. **TASK-77 decision (binds at sign-off):** author's recommendation — **close as
   not-needed**: the card's own evidence bar is "a triage run demonstrably hampered by
   orient.mjs's whole-repo-only view"; two runs have now completed unhampered
   (2026-07-27 at ~7k lines, 2026-07-31 range-scoped). Record the decision + citation
   on the card and close it in the wrap-up; re-card on a demonstrated hamper. Operator
   may instead keep it open (state the N-runs bar) or order the build.
   → **Approved at sign-off (operator, 2026-07-31, PR #108): close as not-needed, with
   the sonnet pins and lanes confirmed as authored.**
3. If any session claims a scoped task or spec number mid-sweep → STOP and surface.
4. Tier/model escalations (e.g. to `claude-fable-5`); lane amendments (amend this
   file, note why, tell the operator).

## Cost instrumentation (this sweep's extra deliverable)

The operator's framing: this sweep tests whether the TASK-86..88 levers actually moved
token utilization/cost. Baseline — the **sweep-dat-board** run (promptworld,
2026-07-29→30, session b129d47c), from its published analysis ("Anatomy of a $1,192
sweep", claude.ai artifact b869ffef-a3e5-4a6e-8b1b-9384aa826abe); numbers embedded here
so the comparison is session-portable:

- **Total $1,192.57** (list API rates, computed = billed): cache reads $876 (73%,
  1,326.6M tokens), cache writes $248 (21.7M), output $69 (2.1M); 4,060 requests.
- **Orchestrator $185; 14 implementer agents $1,007 (84%).** Worst implementer: 699
  requests, ~427k avg context, ~300 output tokens/request, $404 (a ~$0.45/tool-call
  context tax against a ~32k dispatch baseline).
- **Mechanism 2:** "Opus tier" dispatches inherited the Fable session model at 2× Opus
  unit price — Fable $967 across 1,831 reqs vs Sonnet $226 across 2,224 reqs.
- **Projection with all three levers: ~$350–450** for a comparable sweep (tier fix
  alone → ~$700).
- Already-observed lever effect (sweep-cost-levers log): TASK-86 implementer ~408k
  subagent tokens pre-levers vs TASK-87/88 at ~98k/~116k with levers applied; TASK-84
  at ~107k.

Obligations on this sweep:
- Every execution-log row carries best-effort tokens/cost actuals (harness/transcript),
  updated at each dispatch boundary while in flight.
- Orchestrator records its own session boundaries (context size at each end) in the log
  notes.
- **At sweep close, append a "Cost analysis" section to this file**: per-task and total
  actuals, orchestrator vs implementer split, model mix, normalized per-merged-PR
  comparison against the baseline above, and a verdict on each lever (model pin /
  phase-scoping / turn hygiene / session boundaries). Note the structural caveats
  honestly: different repo, prose-doctrine tasks vs code tasks, 9 PRs vs 14 dispatches.

## Done means

TASK-74, 75, 76, 78, 79, 80, 85, 89, 90 all Done on the board via `spec-bridge:sync`,
each through its own merged, version-bumped-where-released PR; TASK-77's operator
decision recorded on its card and the card closed (or explicitly kept, per the
decision); `specs/039..047` (as claimed) each real spec+plan+tasks, linked; `node
--test`, `check-docs`, and the wiki freshness gate green on main; the four named wiki
notes re-verified (not mechanically re-pinned), CAPSULES current; no stale sweep
worktrees (incl. the inherited `sweep-close-84`); this file's log complete with
tokens/cost actuals, the Cost analysis section appended, and status flipped to done.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while
a task is in flight its row carries the phases dispatched/completed, updated at each
dispatch boundary; the closing note on merge replaces or absorbs it. `tokens/cost`
carries best-effort actuals from the harness/transcript.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-07-31 | TASK-74 | #109 | e004e79 | implementer (claude-opus-4-8 via opus-implementer agent def) ~105k subagent tokens, 53 tool calls | three-verb enumeration on all surfaces + CLAUDE.md re-plant (pristine block, no hand edits); v0.45.0 + bootstrap skill 0.7.0; overview.md amended (NEEDS-REVIEW), 11 siblings RE-PIN-ONLY; single dispatch covered Implement+Prove. Dispatch-wiring note: Agent tool model param silently ignored (3 fable dispatches killed early); pinned via .claude/agents/opus-implementer.md, actual model verified from transcript |
| 2026-07-31 | TASK-75 | #110 | 0b23a14 | implementer (claude-opus-4-8 via opus-implementer agent def) ~137k subagent tokens, 71 tool calls | refactor-triage 0.2.0: tracked-copy fallback, --policy headless syntax, run-id rule, honest both-tracked; v0.46.0 (absorbed 0.45.0 collision); pdlc-refactor-triage NEEDS-REVIEW amended, 11 siblings RE-PIN-ONLY; carried TASK-74 board closure |
| 2026-07-31 | TASK-89 | #111 | da9e0d4 | implementer (claude-opus-4-8 via opus-implementer agent def) ~185k subagent tokens, 67 tool calls | seven 035-038 doctrine seams reconciled; sweep skill 0.14.0, v0.47.0 (re-targeted twice past sibling merges); pdlc-sweep + history NEEDS-REVIEW amended, 11 siblings RE-PIN-ONLY; carried runbook log union |
| 2026-07-31 | TASK-80 | #112 | bd5ce8f | implementer (claude-opus-4-8 via opus-implementer agent def) ~95k subagent tokens, 54 tool calls | last-run-at high-water mark + since-last-triage scope; refactor-triage 0.3.0, v0.48.0; pdlc-refactor-triage NEEDS-REVIEW amended (description shrank 499→487), 11 siblings RE-PIN-ONLY; carried TASK-89 row closure |
| 2026-07-31 | TASK-90 | — | — | in flight (implementation complete, reconciling with main) | phases: Spec+Implement+Prove done (opus-4-8, single dispatch); ~99k subagent tokens, 45 tool calls; background-job mode doctrined, sweep skill 0.15.0; re-targeting 0.48.0→0.49.0 |
| 2026-07-31 | TASK-75 | — | — | in flight (implementation complete, reconciling with main) | phases: Spec+Implement+Prove done (opus-4-8, single dispatch); ~137k subagent tokens, 71 tool calls; absorbed v0.45.0 collision → 0.46.0 |
| 2026-07-31 | TASK-80 | — | — | in flight (implementation complete, reconciling with main) | phases: Spec+Implement+Prove done (opus-4-8, single dispatch); ~95k subagent tokens, 54 tool calls; refactor-triage 0.3.0, absorbed 0.47.0 collision → 0.48.0 |
| 2026-07-31 | TASK-78 | — | — | in flight (implementation complete, reconciling with main) | phases: Spec+Implement+Prove done (claude-sonnet-5, single dispatch — first sonnet-tier); ~118k subagent tokens, 59 tool calls; wiki-only, no bump |
