# Bootstrap plants no model-tier rubric (TASK-91) — sweep runbook (2026-08-01)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground. Direction is decided; do not re-litigate it: the board card wins
(TASK-91 carries its own evidence — the sweep/bootstrap SKILL.md citations and the
2026-07-31 board-cost-test field case). Plan-of-record is the board; this file carries
only ordering, doctrine, and the log.

**Status:** done · completed 2026-08-01 (PR #122, merge `10bff49`, v0.52.0) · operator sign-off on lanes: 2026-08-01 (lane as authored, the
`opus-implementer` pin, and the hand-authored-specs escape line all approved; AC #1
answered **plant** with two added constraints, and the default IDs answered
**latest-generation** — both recorded as gate lines below, not prose)
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

**Bootstrap note (this sweep edits the sweep skill AND the bootstrap skill it runs
under):** the executing orchestrator follows the doctrine as it stands at execution time
(sweep skill 0.17.0, marketplace v0.51.0). TASK-91's fix binds FUTURE sweeps once merged;
this sweep still reads its own tier pins from the runbook below, not from anything the
task plants.

## Read first (in this order)

1. `backlog task view TASK-91 --plain` — direction source; its Description embeds the
   two SKILL.md citations and the 2026-07-31 "Agent tool model param silently ignored"
   field case.
2. `docs/design/board-cost-test-runbook.md` — the field provenance TASK-91 cites
   (TASK-74 row: the model param was ignored; pinning moved to
   `.claude/agents/opus-implementer.md` frontmatter). Also the precedent for this
   repo's hand-authored-spec escape line and background-job substitutions.
3. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect
   `pdlc-plugin` (sources = the bootstrap SKILL + template + plant.mjs this task
   edits), `pdlc-sweep` (sources = the sweep SKILL this task edits),
   `test-suite-catalog-plugins-gates` (catalogs `test/pdlc.test.mjs`), `overview`
   (sources the repo's own `CLAUDE.md`, which the re-plant touches).
4. `docs/releasing.md` (bump rules); `docs/principles.md` (artifact-grounded action —
   the principle the AC #1 recommendation below is argued from).
5. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-08-01, main @ e559591, v0.51.0, sweep skill 0.17.0)

- **Done already:** the board-cost-test sweep (TASK-74..80, 85, 89, 90; PRs #109–#118,
  v0.45.0–v0.51.0) closed 2026-07-31. TASK-91 was carded from it on 2026-08-01.
- **In flight in other sessions (do not duplicate; expect their merges):** none — the
  board shows no In Progress tasks.
- **Paused — untouched (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their
  branches/worktrees):** none.
- **Queued (this runbook's scope):** TASK-91 (sole task). Next free spec number at
  authoring: **048** (`specs/` holds 028–047); claim-before-work governs — re-check
  `origin/main:specs/` at claim time and renumber on collision.
- `git worktree list` shows the root only — no stale sweep worktrees to janitor.

## Execution lanes (dependency-ordered; parallelize within a lane)

Single-task sweep: **one lane, one task, one PR**. There is no parallelism to plan and
no serial-merge ordering to enforce — the lane exists so the tier pin, the gates, and
the log have their normal home. The task's internal breakdown (grounding template,
bootstrap skill, sweep skill, tests, re-plant, wiki) is tasks.md phases, never separate
PRs.

**Lane 1 — start immediately:**
- **TASK-91 (default implementer · model `claude-opus-4-8` via the pinned
  `opus-implementer` agent definition, fallback `claude-opus-5` if the subscription
  surfaces it — rubric justification: cross-surface doctrine prose with a genuine
  design choice (what bootstrap plants and where the sweep reads it from), touching two
  skill contracts, a planted always-on template, this repo's own planted block, and a
  test that pins the new contract; no mechanical pattern to copy, so this sits at the
  default implementer tier, not the sonnet mechanical tier)** — close the gap between
  what `pdlc:sweep` Phase 1 item 2 requires and what `pdlc:bootstrap` plants.

**Dispatch mechanics (2026-07-31 operator ruling — binding here):** dispatch through the
**`opus-implementer` agent type** (`.claude/agents/opus-implementer.md`, `model:
claude-opus-4-8` in frontmatter). Do NOT rely on the Agent tool's `model` parameter — it
was observed silently ignored in this harness on 2026-07-31, which is the same field case
TASK-91's AC #2 asks the fix to cite. Record on the board card at dispatch: tier + the
explicit model ID + the rubric justification + which model actually served.

Dispatch **phase-scoped**: one fresh implementer per tasks.md phase (grouping small
adjacent phases is the orchestrator's recorded call). The phase handoff artifact set is
the spec dir, tasks.md tick-state, and the branch's commits — nothing rides chat context.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-08-01: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: `git fetch origin && git pull --ff-only` at root before the
  task; the worktree cut from fresh `origin/main`.
- **Spec Kit: `.specify/` absent — host precedent stands for this sweep** (eight prior
  runbooks, board-clearing → board-cost-test): hand-authored
  `specs/048-<slug>/{spec,plan,tasks}.md`, linked in the claim commit, phase ACs seeded
  before implementation. Recorded as an operator-signed escape line below.
- `node --test` green in the worktree, and again after every history move.
- `node scripts/check-docs.mjs` — README.md/CLAUDE.md sync.
- Wiki freshness gate: `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`
  (hard v2: capsules ≤500 chars, note bodies ≤8,000, `CAPSULES.md` regenerated whenever
  any note's `description:` changes).
- **Version bump gate:** TASK-91 touches released surface (`pdlc/templates/CLAUDE.md`,
  `pdlc/skills/bootstrap/SKILL.md`, `pdlc/skills/sweep/SKILL.md`) → marketplace bump via
  `node scripts/sync-version.mjs <next>` at merge-readiness (0.51.0 → next free;
  readiness wins over prediction) **plus each edited skill's own `version:`** —
  bootstrap 0.8.0 → 0.9.0, sweep 0.17.0 → 0.18.0. `test/pdlc.test.mjs` alone would not
  bump; the rest of the task does.
- **Re-plant this repo's own PDLC grounding block in the same PR.** Editing
  `pdlc/templates/CLAUDE.md` drifts the block planted in praxis's own root `CLAUDE.md`.
  Re-plant it (`node pdlc/scripts/plant.mjs --root . --peer backlog --check` first, then
  for real with `--force` after diffing). **Standing operator convention: this repo's
  block may carry deliberate hand edits — diff against the old rendered template and
  relocate them, never clobber.** Note `spec-kit` is NOT an opted-in peer here.
- **Same-PR wiki re-pins (classify each against the actual diff, never mechanically):**
  `pdlc-plugin.md` (bootstrap SKILL + template + plant.mjs are its sources — expect
  NEEDS-REVIEW), `pdlc-sweep.md` (sweep SKILL — expect NEEDS-REVIEW),
  `test-suite-catalog-plugins-gates.md` (catalogs `test/pdlc.test.mjs` — NEEDS-REVIEW if
  the new test changes what that file pins), `overview.md` (sources the repo's root
  `CLAUDE.md`, which the re-plant edits — classify honestly). Version-stamp churn stales
  the lockstep siblings → stamp-only is RE-PIN-ONLY. Regenerate `CAPSULES.md` if any
  `description:` changes.
- NO per-task course (per-feature policy; not triggered). Merge commit, never squash
  (this branch is pin-carrying). One TASK, one PR; task-id-led commit subjects with the
  `Co-Authored-By: Claude` trailer.
- **Turn-hygiene block rides every implementer dispatch prompt:** batch independent
  reads/checks as parallel tool calls in one message; minimal between-call narration;
  run mechanical phases at lower reasoning effort.

## Per-task artifacts required before PR

Per-TASK obligations — the per-PR gates above are project machinery; this section is
what the scoped task must have produced. **No PR opens until each line below checks
true.** The sweep's Output gate re-checks the first two lines at the end.

- [ ] `specs/048-<slug>/` carries a real `spec.md` (problem + requirements mapped to the
      card's four ACs), `plan.md` (stating plainly that no ratified constitution exists
      and planning against the grounding docs — `docs/principles.md`, `docs/wiki/`,
      `CLAUDE.md`, `docs/releasing.md` — the standing case here), and `tasks.md` (phased
      checkboxes the bridge derives from), committed on the task's branch —
      hand-authored per host precedent, sanctioned by the escape line below. A claim
      stub reserves the number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link` against
      the stub), and phase ACs are seeded from tasks.md (link update mode) BEFORE
      implementation dispatch.
- [ ] **AC #1's design choice is recorded in `spec.md` with its rationale** — the card
      requires the choice (plant a rubric stub vs detect-and-tell) to be *recorded with
      its rationale*, so a spec that implements one without arguing against the other
      fails this line, not just the reviewer's taste.
- [ ] **AC #2's citation is literal:** whatever bootstrap teaches names the pinning
      mechanism that holds — an explicit model ID in an agent definition's frontmatter —
      **and cites the 2026-07-31 field case** where the dispatch-call `model` parameter
      was silently ignored. A fix that teaches frontmatter pinning without the citation
      leaves the next operator no reason to believe it.
- [ ] **AC #3 is a two-way contract:** `pdlc:sweep` Phase 1 item 2 must name the location
      bootstrap actually plants to, and bootstrap must plant there. Verify the two edits
      agree by reading them together, not separately.
- [ ] **Operator ruling A (sign-off 2026-08-01) — the rubric's model IDs are grounded in
      what the system actually exposes, never authored from memory.** The bootstrap skill
      must resolve the tier→model-ID table against the models genuinely available to the
      running harness/subscription at plant time (the `claude-api` skill is this repo's
      standing source for current model IDs; the harness's own agent-definition surface is
      the availability check), and must say what to do when a pinned ID is unavailable —
      that is what the fallback slot is for. A hard-coded table the skill never checks
      fails this line.
- [ ] **Operator ruling B (sign-off 2026-08-01) — refreshing the rubric later must be
      quick and easy, and the spec must name the refresh path explicitly.** The planted
      section sits inside the `pdlc:grounding` markers, where a hand edit reads as drift
      and a re-plant needs `--force`; the design must therefore resolve that tension
      rather than inherit it — either the block carries the rubric and re-running
      `pdlc:bootstrap` is documented as the one-step refresh (with the drift/consent path
      spelled out), or the block carries a pointer and the rubric lives in a
      freely-editable planted file outside the markers. Whichever is chosen, `spec.md`
      records the choice and the refresh procedure, and the bootstrap skill teaches it.
- [ ] **Operator ruling C (sign-off 2026-08-01) — default IDs are latest-generation:**
      default implementer tier `claude-opus-5`, mechanical tier `claude-sonnet-5`,
      documented fallback `claude-opus-4-8` for subscriptions that do not surface Opus 5.
      (Note the asymmetry, and do not "fix" it inline: THIS sweep still dispatches at
      `claude-opus-4-8` via the pinned agent def per the lane above — the rubric being
      planted is the downstream default, not a retroactive change to this run.)
- **Escape lines (operator-signed only):**
  - TASK-91: hand-authored `specs/048-<slug>/{spec,plan,tasks}.md` per this host's
    established no-`.specify/` precedent (eight prior sweep runbooks) — the artifacts
    themselves are still required in full; only the `specify` tooling is excused.
    — **Signed: pending operator sign-off (see checkpoint 1).**
- Host additions: board bookkeeping rides the task branch / the wrap-up PR (background
  job — see doctrine below), never a push to main.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/templates/CLAUDE.md`, `pdlc/skills/bootstrap/SKILL.md`,
  `pdlc/skills/sweep/SKILL.md`, `test/pdlc.test.mjs`, the repo's own root `CLAUDE.md`
  (re-plant), version-lockstep files (`.claude-plugin/marketplace.json`, every
  `plugin.json`, `action.yml`'s npx pin, edited skills' `version:`), and
  `docs/wiki/` INDEX + CAPSULES + the four notes named above. With one task in flight
  these are self-conflicts only — but a sibling session appearing on any of them makes
  the smaller PR merge first.
- **Paused tasks are not live lanes** (none at authoring; the rule stands if one
  appears).
- Reconcile by what the branch carries: this branch is **pin-carrying** (it re-pins wiki
  notes to its own commits) → **merge `origin/main` in**, never rebase/squash/force-push;
  its PR lands as a merge commit. Take main's side for anything you didn't deliberately
  change.
- **Honest re-pins only — a merge-in never justifies a pin bump.** Route every staled or
  conflicted pin through the wiki-update plan loop's classifier
  (`git diff <old-pin>..<merge-commit> -- <sources>` → RE-PIN-ONLY vs NEEDS-REVIEW, prose
  amended BEFORE bumping). The merge commit is the re-pin *target* once verified, never
  the *justification*.
- After every history move: re-run `node --test`, the gates, AND the freshness probe
  unconditionally — never gated on whether `docs/wiki/` changed.
- **Claim before work:** the FIRST commit of the task claims it — board card →
  In Progress + the `specs/048-<slug>/` stub + `spec-bridge:link` against that stub (the
  link rides the claim, arming the bridge gate from the branch's first commit). Push
  immediately (`git push -u origin <branch>`); never force-push a claim. Rejected push =
  race lost → fetch, re-read board and `specs/`; taken → STOP and surface; unrelated →
  merge `origin/main` in and re-push plain.
- Verify merged (`gh api … --jq .merged`) before deleting any branch/worktree; never
  delete+recreate a closed PR's head branch.
- **Background-job execution pattern (this orchestrator runs as a background job; the
  recorded precedents are the 2026-07-30/31 runbooks, doctrined by TASK-90):** the task
  worktree lives at **`.worktrees/task-91`** — the operator's ratified path (TASK-92,
  2026-08-01: all branch work in a worktree under the gitignored `<repo-root>/.worktrees/`,
  root checkout stays on `main`), **not** the `.claude/worktrees/` harness-isolation path the
  sweep skill's background-job mode names; board and spec commands run inside that worktree;
  post-merge closures (tasks.md ticks, `spec-bridge:sync`, this file's log row and status
  flip) have no next task's branch to ride — with one task in scope they land via the
  **wrap-up PR**.
- **Orchestrator session boundaries (cost lever):** with a single lane there is no lane
  boundary to end on; if the task's phases run long, ending the session after the PR
  opens and resuming from this runbook + the board is the cheaper path.

## Operator checkpoints (do not proceed silently)

1. **Sign-off on the lane, the opus pin, and the hand-authored-specs escape line** (all
   three above). Escalation mid-sweep is a checkpoint.
2. **AC #1's design choice — plant vs detect-and-tell (binds at sign-off).** Author's
   recommendation: **plant a compact model-tier rubric section in the grounding block**
   (`pdlc/templates/CLAUDE.md`, inside the `pdlc:grounding` markers so it refreshes on
   every re-plant), carrying a starter tier→model-ID table and the frontmatter-pinned
   agent-definition mechanism. Rationale, argued from `docs/principles.md`:
   artifact-grounded action says a decision living only in a chat turn did not happen —
   a bootstrap-time verbal notice is exactly that, and it evaporates the moment the
   bootstrap session ends, leaving the sweep three tasks later with the same missing
   source. A planted section is durable, re-plantable, greppable, and gives sweep's
   Phase 1 item 2 a real location to name (AC #3). The cost is real and should be
   weighed: the grounding block is always-on context in every session of every
   bootstrapped project, so the section must stay tight — a table and two sentences,
   not a treatise. The operator may instead order detect-and-tell (cheaper context,
   weaker durability) or a hybrid (plant the pointer, author the rubric elsewhere).
3. **The planted rubric's default model IDs are a policy the operator owns, not the
   implementer.** Whatever tiers ship in the stub become every downstream project's
   starting default. Confirm the ID set at sign-off (the working proposal: a default
   implementer tier at `claude-opus-4-8`, a mechanical tier at `claude-sonnet-5`, and an
   explicit fallback slot — matching this repo's own `.claude/agents/` pins).
4. If any session claims TASK-91 or spec number 048 mid-sweep → STOP and surface.
5. Tier/model escalations; lane amendments (amend this file, note why, tell the
   operator). Softening any gate enumerated above is a runbook amendment plus an
   operator ping — never an implementer decision note buried in a spec artifact.

## Done means

- TASK-91 is **Done on the board via its own merged PR**, moved there by
  `spec-bridge:sync`'s derived plan (never a hand-set `-s Done` on a linked task), with
  all four ACs checked.
- The card still carries its Spec marker at sweep end (re-run the `spec-bridge` links
  check).
- `specs/048-<slug>/` contains a real `spec.md` + `plan.md` + `tasks.md`, all ticked.
- On `main`: `node --test` green, `node scripts/check-docs.mjs` green, wiki freshness
  gate green, the marketplace version bumped in lockstep with both edited skills'
  `version:` fields, and this repo's own planted `CLAUDE.md` block re-planted and
  reporting `unchanged` under `plant.mjs --check`.
- `git worktree list` shows no stale sweep worktrees; the `task-91-*` branch is deleted.
- This file's execution log is complete and its status is flipped to **done**.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while
a task is in flight its row carries the phases dispatched/completed (e.g.
`phases: 1-2 done, 3 dispatched`), updated at each dispatch boundary, so a resuming
session can see where within the task the last one stopped; the closing note on merge
replaces or absorbs it. `tokens/cost` carries best-effort actuals from the
harness/transcript, so future runbook authoring budgets against real numbers.

**Dispatch grouping (orchestrator's recorded call, 2026-08-01):** tasks.md has five phases;
they dispatch as **three** implementers rather than five. Phases 1+2 group because the bootstrap
skill must describe exactly what the template section says — one agent seeing both writes them
consistently. Phases 3+4 group because the test phase pins the sweep edit, so the agent that
writes the assertion should be the one that read the clause. Phase 5 (re-plant, bump, re-ground)
dispatches alone: it is mechanical against settled prose, and its wiki re-pins are classified by
the orchestrator afterward. Default remains one-per-phase; this is the exception, recorded.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-08-01 | TASK-91 | [#122](https://github.com/evanstern/praxisflux/pull/122) | `10bff49` | ~264k subagent tokens across 3 dispatches (59k / 82k / 124k; 69 tool calls total) | Done. All 5 phases; opus-implementer served `claude-opus-4-8` on every dispatch (frontmatter pin — the Agent `model` param was not used). Grouping 5 phases → 3 implementers (recorded above). v0.51.0 → v0.52.0; bootstrap 0.9.0, sweep 0.18.0. 15 wiki notes re-pinned (3 NEEDS-REVIEW with prose amended, 12 RE-PIN-ONLY stamp churn). **Finding:** phases 1-2 reported '254 pass, 0 fail' and ticked `node --test green` while 4 notes were staled and the freshness gate was red — caught by the next phase, corrected in tasks.md, and carded as TASK-100 (high) for a real gate. |
