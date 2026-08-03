# Gates + doctrine board sweep (TASK-93..98, 100, 101) — sweep runbook (2026-08-02)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: the **board cards win**
(TASK-93..98 carry their own evidence from refactor-triage run
`praxis-2026-07-31-18-47-56`; TASK-100 and TASK-101 carry field cases observed
2026-08-01/02). Plan-of-record is the board; this file carries only ordering, doctrine,
and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-08-02 (lanes approved **as
authored** — all five, tiers as pinned, all eight hand-authored-spec escape lines signed;
checkpoints 2, 3 and 4 answered at sign-off and recorded as gate lines below, not prose)
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

**Self-editing note (this sweep edits the sweep skill it runs under):** TASK-97, TASK-98
and TASK-96 all edit `pdlc/skills/sweep/SKILL.md`. The executing orchestrator follows the
doctrine as it stands **at execution time** (sweep skill 0.18.0, marketplace v0.52.0) and
reads its tier pins from THIS runbook, not from anything those tasks land. Their fixes
bind FUTURE sweeps once merged.

## Read first (in this order)

1. `backlog task view TASK-<n> --plain` for the task in hand — the direction source. Each
   card embeds its own citations; TASK-93..98 additionally cite
   `docs/reviews/team-review-praxis-2026-07-31-18-47-56.md` and
   `docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md`.
2. `docs/design/bootstrap-tier-rubric-runbook.md` — the immediately preceding sweep
   (TASK-91, PR #122, v0.52.0) and the precedent for this repo's hand-authored-spec escape
   line; `docs/design/board-cost-test-runbook.md` for the 2026-07-31 dispatch-mechanism
   field case TASK-97 is about.
3. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect `pdlc-sweep`,
   `pdlc-sweep-history`, `pdlc-plugin`, `pdlc-refactor-triage`, `spec-bridge-plugin`,
   `gates-convention`, `test-suite-catalog-plugins-gates`, `overview`,
   `gates-consumption-surface`. Never bulk-load the corpus.
4. `docs/releasing.md` (bump rules); `docs/principles.md` (artifact-grounded action,
   one-TASK-one-PR); `docs/skill-patterns.md` §4-5 (the gates convention TASK-100 extends).
5. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-08-02, main @ `1cc7f4e`, v0.52.0, sweep skill 0.18.0)

- **Execution mode: interactive (root main-push available).** Verified 2026-08-02 by
  pushing board commits `99cda00` + `1cc7f4e` to `origin/main` from the root checkout.
  Therefore the DEFAULT loop applies throughout: task worktrees at `.worktrees/task-<N>`
  (gitignored, `.gitignore:6`); `backlog`/`spec-bridge` commands run **from the root** on
  `main`; post-merge closures (tasks.md tick, `spec-bridge:sync`, the log row) land as
  **direct board commits on `main`**, not riding the next branch. Do **not** inherit the
  background-job substitutions the 2026-07-30/31 runbooks used.
  *(This line is what TASK-98 AC #3 asks the sweep template to gain — recorded here by
  hand until that fix lands.)*
- **Done already:** the TASK-91 sweep (spec 048, PR #122, merge `10bff49`, v0.52.0) closed
  2026-08-01. TASK-100 was carded from its phase-1/2 field case; TASK-101 was carded
  2026-08-03 (board clock) from a downstream promptworld find.
- **In flight in other sessions (do not duplicate; expect their merges):** none — the
  board shows zero In Progress tasks at authoring.
- **Paused — untouched** (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their branches/worktrees):
  **none.**
- **Queued (this runbook's scope, in execution order):** TASK-93, TASK-100, TASK-101 →
  TASK-97, TASK-94 → TASK-98 → TASK-96 → TASK-95. That is the whole To Do column; nothing
  on the board is out of scope.
- **Spec numbers.** `specs/` on `origin/main` holds 029–048; next free at authoring is
  **049**. Provisional assignment below is a convenience, not a reservation —
  claim-before-work governs: re-check `origin/main:specs/` at claim time and renumber on
  collision.
- `git worktree list` shows the root only — no stale sweep worktrees to janitor.

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: **DEVELOP in parallel, MERGE serially.** Board-declared dependencies
(TASK-98→97; TASK-96→98; TASK-95→97,98,94) plus one shared hotspot
(`pdlc/skills/sweep/SKILL.md`, fought over by 97/98/96) force most of the ordering; the
lanes bound the rest.

**Why TASK-93 goes first rather than last.** `docs/wiki/pdlc-sweep-history.md` sits at
7,991/8,000 body chars. Every sweep-doctrine PR in this sweep (97, 98, 96) stales that
note and owes it an honest re-pin — which, for a release-history note, means *adding its
own release entry*. Three PRs each trying to add an entry to a note 9 chars under the cap
all fail the size budget. TASK-93's summary-style split is the contract-shaped work that
unblocks them: it lands the headroom first, then the doctrine chain consumes it.

**Lane 1 — start immediately, three parallel worktrees:**

- **TASK-93 (mechanical · model `claude-sonnet-5` via the pinned `sonnet-implementer`
  agent definition, fallback `claude-opus-4-8` — rubric justification: corpus hygiene
  worked to an existing pattern; TASK-78's summary-style split is the fresh in-repo
  precedent to copy, and the acceptance criteria are mechanically checkable by the
  freshness gate. No design choice, so the mechanical tier, not the default tier)** —
  backfill 0.48.0/0.50.0/0.51.0 into the sweep history via a summary-style split; give
  `test-suite-catalog-plugins.md` real sources. Wiki-only; **no version bump**.
  *Merges FIRST in this lane* — smallest PR, and its headroom is what Lanes 2–4 spend.
  → provisional `specs/049-wiki-sweep-history-backfill/`

- **TASK-100 (default implementer · model `claude-opus-4-8` via the pinned
  `opus-implementer` agent definition, fallback `claude-opus-5` if the subscription
  surfaces it — rubric justification: a genuine design call the card explicitly declines
  to make ("fix shape — not prescriptive; the spec decides"), extending this repo's
  central integrity rule into a new enforcement surface, with a red-by-construction
  carve-out that is easy to get subtly wrong. Design work → default tier)** — a gate so a
  ticked `tasks.md` checkbox cannot outrun a red project gate.
  → provisional `specs/050-tick-vs-red-gate/`

- **TASK-101 (default implementer · model `claude-opus-4-8` via the pinned
  `opus-implementer` agent definition, fallback `claude-opus-5` — rubric justification:
  AC #6 is an undecided one-way door about praxisflux's enforcement posture, and the fix
  is a shell-word parser whose failure mode is a fail-open gate. Design + security-shaped
  parsing → default tier, never mechanical)** — root-guard hook mis-blocks board commits
  on message text.
  → provisional `specs/051-root-guard-hook/`

**Lane 2 — after Lane 1's three PRs are merged and the root is ff-pulled:**

- **TASK-97 (default implementer · model per the `opus-implementer` def AS PINNED AT
  DISPATCH — see checkpoint 4; fallback the other of `claude-opus-4-8`/`claude-opus-5` —
  rubric justification: cross-surface doctrine prose correcting a falsified mechanism,
  touching the sweep skill contract, two agent definitions, and a pinned wiki note; no
  pattern to copy)** — doctrine the agent-def dispatch mechanism. **Merges before
  TASK-94** (it is the head of the sweep-SKILL hotspot chain).
  → provisional `specs/052-sweep-agent-def-dispatch/`

- **TASK-94 (mechanical · model `claude-sonnet-5` via `sonnet-implementer`, fallback
  `claude-opus-4-8` — rubric justification: three settled wording corrections plus one
  stale example pin, each with the exact target quoted on the card; the enumeration-drift
  shape TASK-74 already fixed next door supplies the pattern)** — closed-decision residue
  + stale example pin. Footprint is disjoint from TASK-97's, so develop in parallel;
  merge second in this lane.
  → provisional `specs/053-drift-trims/`

**Lane 3 — after TASK-97 merges (board dependency + same file):**

- **TASK-98 (default implementer · model per the `opus-implementer` def at dispatch,
  fallback as above — rubric justification: stitching three doctrine holes in the
  background-job mode, one of which (the author-mode hatch) is a temporal-impossibility
  argument about the skill's own precondition ordering; reasoning about the skill's
  control flow, not editing prose to a pattern)** — background-job mode stitching.
  → provisional `specs/054-sweep-background-job-stitching/`

**Lane 4 — after TASK-98 merges (board dependency + same file):**

- **TASK-96 (default implementer · model per the `opus-implementer` def at dispatch,
  fallback as above — rubric justification: a re-plant that must relocate deliberate hand
  edits rather than clobber them, plus a "one normative home" choice whose losing side is
  version-planted into N downstream hosts. Judgment throughout)** — re-plant the root
  `CLAUDE.md` block; collapse the no-main-push degradation clause to one home.
  → provisional `specs/055-grounding-replant-degradation-collapse/`

**Lane 5 — tail (droppable without breaking anything already merged):**

- **TASK-95 (mechanical · model `claude-sonnet-5` via `sonnet-implementer`, fallback
  `claude-opus-4-8` — rubric justification: adding anchors "in the existing 047 anchor
  style" to `test/pdlc.test.mjs`, over prose that has by then settled; the card names the
  style, the targets, and the count. Tests to a sibling standard = the mechanical tier's
  canonical case)** — pin the 039–047 doctrine (plus this sweep's new clauses) in
  `test/pdlc.test.mjs`. Board-declared last (deps: 97, 98, 94). Test-only; **no version
  bump**.
  → provisional `specs/056-tests-039-047-doctrine/`

**Dispatch mechanics (2026-07-31 operator ruling — binding here).** Dispatch through the
**agent type**, never the Agent tool's `model` parameter: `opus-implementer`
(`.claude/agents/opus-implementer.md`, currently `model: claude-opus-4-8`) or
`sonnet-implementer` (`.claude/agents/sonnet-implementer.md`, `model: claude-sonnet-5`).
The dispatch-call `model` param was observed silently ignored by this harness on
2026-07-31 — the same field case TASK-97 exists to doctrine. **Record on the board card at
dispatch:** tier + the explicit model ID + the rubric justification + **which model
actually served** (read it back from the transcript before sibling dispatches launch).

Dispatch **phase-scoped**: one fresh implementer per `tasks.md` phase (grouping small
adjacent phases is the orchestrator's recorded call). The phase handoff artifact set is
the spec dir, the `tasks.md` tick-state, and the branch's commits — **nothing rides chat
context**. Update the task's execution-log row at every dispatch boundary.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-08-02: no `scripts/check-merge-drift.mjs`;
  `scripts/` holds build, build-npm, check-docs, check-version-bump, gen-marketplace,
  new-plugin, run-gates, stop-docs, sync-shared, sync-version). Raw git doctrine stands:
  `git fetch origin && git pull --ff-only` at root before each task; every worktree cut
  from fresh `origin/main`.
- **Spec Kit: `.specify/` absent — host precedent stands for this sweep** (nine prior
  runbooks, board-clearing → bootstrap-tier-rubric): hand-authored
  `specs/NNN-<slug>/{spec,plan,tasks}.md`, linked in the claim commit, phase ACs seeded
  before implementation. Recorded as operator-signed escape lines below.
- `node --test` green in the worktree, **and again after every history move**. (The repo's
  `.githooks/pre-commit` already runs it, plus `gen-marketplace`, `sync-version --check`,
  and `check-docs`.)
- `node scripts/check-docs.mjs` — README.md/CLAUDE.md sync with the repo.
- Wiki freshness gate: `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` (hard v2:
  capsules ≤500 chars, note bodies ≤8,000, `CAPSULES.md` regenerated whenever any note's
  `description:` changes). **Baseline at authoring: 36 notes fresh, one WARN —
  `test-suite-catalog-plugins.md: no sources listed`. TASK-93 owns clearing that warn; no
  other task may leave a new one.**
- **Version bump gate** (`node scripts/check-version-bump.mjs`, mirrored by
  `.githooks/pre-push` and CI). Released surface = plugin dirs, `lib/`, `scripts/`,
  `.claude-plugin/`, `action.yml`. Per task:
  - TASK-93 (wiki only) — **no bump**. TASK-95 (`test/` only) — **no bump**.
  - TASK-100 → `spec-bridge/` (+ likely `lib/spec-derive.mjs`): marketplace bump **plus**
    the edited `spec-bridge` skill's own `version:` if a SKILL.md changes.
  - TASK-101 → `pdlc/` (new surface) + possibly `pdlc/templates/CLAUDE.md`: marketplace
    bump plus each edited skill's `version:`.
  - TASK-97 → sweep skill `0.18.0 → 0.19.0` + marketplace bump.
  - TASK-94 → refactor-triage skill `0.3.0 → 0.4.0` + `action.yml` + marketplace bump.
  - TASK-98 → sweep skill bump (from whatever 97 landed) + marketplace bump.
  - TASK-96 → `pdlc/templates/CLAUDE.md` + sweep skill (+ bootstrap `0.9.0 → …` if
    touched) + marketplace bump.
  - Bump via `node scripts/sync-version.mjs <next>` **at merge-readiness, not at claim** —
    readiness wins over prediction, because serial merges keep moving the floor
    (0.52.0 today).
- **Re-plant obligation:** any PR that edits `pdlc/templates/CLAUDE.md` drifts the block
  planted in praxis's own root `CLAUDE.md` and must re-plant **in the same PR**
  (`node pdlc/scripts/plant.mjs --root . --peer backlog --check` first, then for real with
  `--force` after diffing). **Standing operator convention: this repo's block carries
  deliberate hand edits — diff against the old rendered template and RELOCATE them, never
  clobber.** `spec-kit` is NOT an opted-in peer here. This binds TASK-96 by design and
  TASK-101 if its fix plants grounding text.
- **Same-PR wiki re-pins, classified against the actual diff — never mechanically**
  (`git diff <old-pin>..<HEAD> -- <sources>` → RE-PIN-ONLY vs NEEDS-REVIEW). Predicted
  owners:
  - TASK-93 → `pdlc-sweep-history.md` + its new child + `INDEX.md` + `CAPSULES.md` +
    `test-suite-catalog-plugins.md`.
  - TASK-97/98 → `pdlc-sweep.md` **(NEEDS-REVIEW, explicitly required by TASK-97 AC #3 —
    "amended, not stamp-only")** and `pdlc-sweep-history.md`.
  - TASK-96 → `pdlc-sweep.md`, `pdlc-plugin.md`, `overview.md` (sources the root
    `CLAUDE.md` the re-plant edits).
  - TASK-94 → `pdlc-refactor-triage.md`, `gates-consumption-surface.md` (sources
    `action.yml`).
  - TASK-100 → `spec-bridge-plugin.md`, `gates-convention.md` (sources
    `docs/skill-patterns.md`, `lib/lifecycle.mjs`, `lib/gate-runner.mjs`).
  - TASK-101 → `pdlc-plugin.md`; `gates-convention.md` if the hook lands as a new gate
    shape.
  - TASK-95 / any test-touching PR → `test-suite-catalog-plugins-gates.md` (catalogs
    `test/pdlc.test.mjs` and `test/spec-bridge.test.mjs`).
  Version-stamp churn across lockstep siblings is RE-PIN-ONLY. Regenerate `CAPSULES.md`
  whenever any `description:` changes.
- NO per-task course (this repo's standing policy is per-feature, on request; not
  triggered). **Merge commit, never squash** — every branch here is pin-carrying. One
  TASK, one PR; task-id-led commit subjects with the `Co-Authored-By: Claude` trailer; PR
  bodies end with the `🤖 Generated with Claude Code` trailer.
- **Turn-hygiene block rides every implementer dispatch prompt:** batch independent
  reads/checks as parallel tool calls in one message; minimal between-call narration; run
  mechanical phases at lower reasoning effort.

## Per-task artifacts required before PR

Per-TASK obligations — the per-PR gates above are project machinery; this section is what
every scoped task must have produced. **No PR opens for a task until each line below
checks true for it.** The sweep's Output gate re-checks the first two lines — spec
artifacts present AND the Spec marker still on the card — for every scoped task at the
end.

- [ ] `specs/NNN-<slug>/` carries a real `spec.md` (problem + requirements mapped to that
      card's ACs), `plan.md` (stating plainly that no ratified constitution exists and
      planning against the grounding docs — `docs/principles.md`, `docs/wiki/`,
      `CLAUDE.md`, `docs/releasing.md`, `docs/skill-patterns.md` — the standing case
      here), and `tasks.md` (phased checkboxes the bridge derives from), all committed on
      the task's branch **before any implementation dispatch**. A claim stub reserves the
      number; it satisfies nothing here. *(Field case this line exists for: two tasks of a
      twelve-task sweep shipped claim-stub `spec.md` only, and nothing noticed until a
      human did.)*
- [ ] The card carries its Spec marker from the **claim commit** (`spec-bridge:link`
      against the stub), and phase ACs are seeded from `tasks.md` (link update mode)
      BEFORE implementation dispatch.
- [ ] **Operator ruling A (sign-off 2026-08-02) — TASK-100's gate lives in the
      spec-bridge Stop gate, is host-declared, and BLOCKS.** The three questions the card
      left open are answered; the spec implements this shape and records the rationale,
      it does not re-open them:
      (a) **Home:** the spec-bridge gate (`spec-bridge/gates/bridge.mjs`), which already
      reads `tasks.md` and already blocks status-over-artifacts. Not a repo-local check
      script; not a second surface.
      (b) **Host-declared:** the host names its gate commands, and which of them are
      red-by-construction mid-PR, in **`.spec-bridge.json`** — alongside the existing
      `strictDone` and `statusVocabulary` opt-ins, and following their contract exactly:
      **absent or malformed config ⇒ behavior bit-for-bit unchanged**, so every consumer
      repo that does not opt in is unaffected. A test must pin that no-config parity, in
      the style of the existing `no statusVocabulary: … byte-identical` tests.
      (c) **Blocks, not warns:** an all-boxes-ticked (Done-eligible) spec while any
      declared *required* gate is red is a **blocking** finding — AC #3's wording stands.
      Mid-PR ticks over a gate the host declared red-by-construction stay allowed, which
      is what keeps phased work possible (AC #2).
      This repo then declares its own set: wiki freshness is the red-by-construction one
      (red from the source-touching commit until the re-pin commit); `node --test`,
      `check-docs`, and `sync-version --check` are required-green.
- [ ] **TASK-100 AC #5 is literal:** the shipped docs cite the 2026-08-01 field case
      verbatim — spec 048 phases 1-2, "254 pass, 0 fail" reported and ticked while four
      notes were staled and the freshness gate red. A fix without the citation leaves the
      next operator no reason to believe it.
- [ ] **Operator ruling B (sign-off 2026-08-02) — TASK-101 AC #6 is answered SHIP: pdlc
      ships the hardened root-guard hook, planted like the other peer artifacts.** The
      spec records the answer and its rationale (each host otherwise re-implements a
      raw-string git classifier and independently rediscovers this bug class — three
      manifestations already), and must additionally:
      - Name the hook **type** and own the precedent gap: praxisflux ships **zero**
        `PreToolUse` hooks today (verified 2026-08-02 — every shipped hook is a Stop hook
        through `lib/gate-runner.mjs`), so this is a new hook shape for the suite.
      - **Reconcile the posture change explicitly** with `CLAUDE.md`'s stated split ("the
        Stop hooks plugins ship are advisory/opt-in … CI is the authoritative enforcement
        point") — and amend that sentence in the same PR if the shipped hook makes it
        false. A new enforcement surface that leaves the always-on grounding describing
        the old posture is the exact drift TASK-96 is next door cleaning up.
      - Note the **promptworld copy's divergence** (AC #6's second clause) so the
        downstream host can tell what it is replacing.
- [ ] **TASK-101's parser fix is proven fail-closed, not just fail-open-fixed.** AC #5 is
      the load-bearing one: a test **per hazard character** (newline, `)`, quote,
      semicolon, pipe, backtick) proving a genuinely out-of-scope commit still blocks. A
      change that only makes the false-positive go away fails this line. The card's third
      manifestation (cross-repo `effDir` resolution + prose-content false-positive) is in
      the card's Implementation Notes and is in scope for the parse fix — the spec says
      explicitly whether it fixes both or defers one, and defers only with a reason.
- [ ] **TASK-93's split is summary-style per `docs/corpus-spec.md`**, following TASK-78's
      in-repo precedent: every resulting body ≤8,000 chars, every capsule ≤500,
      reciprocal wikilinks resolving, `INDEX.md` + `CAPSULES.md` regenerated (not
      hand-edited), and the freshness gate green with **zero** warns.
- [ ] **Every sweep-doctrine PR adds its own release entry to
      `docs/wiki/pdlc-sweep-history.md`** (TASK-97, TASK-98, TASK-96 — and TASK-101/100 if
      they change sweep-facing doctrine). This is the honest-re-pin obligation made
      checkable: the note's contract is release-by-release detail, so a PR that bumps its
      pin without adding its own release falsifies the note the same way the merge TASK-93
      is cleaning up did. *(TASK-93 lands the size headroom this line spends.)*
- [ ] **TASK-96's "one home" choice is recorded in `spec.md`** naming the home and what
      the other two locations become (pointer vs deleted), plus the re-plant diff evidence
      that hand edits were relocated rather than clobbered.
- [ ] **Escape lines (operator-signed only):**
  - **TASK-93, TASK-94, TASK-95, TASK-96, TASK-97, TASK-98, TASK-100, TASK-101** (all
    scoped tasks): hand-authored `specs/NNN-<slug>/{spec,plan,tasks}.md` per this host's
    established no-`.specify/` precedent (nine prior sweep runbooks). **The artifacts
    themselves are still required in full; only the `specify` tooling is excused.**
    — **Signed: operator, 2026-08-02.**
- [ ] **Operator ruling C (sign-off 2026-08-02) — the `opus-implementer` def stays pinned
      to `claude-opus-4-8` for this sweep.** TASK-97 records `claude-opus-5` as the
      documented **primary** and `claude-opus-4-8` as the subscription **fallback**, plus
      the condition for re-preferring the primary — but does **not** flip the `model:`
      line, because the subscription does not surface Opus 5 today. Every opus-tier
      dispatch in every lane therefore serves `claude-opus-4-8`; record the served model
      per task anyway, read back from the transcript.
- Host additions: **interactive execution mode** — board bookkeeping commits land direct
  on `main` from the root checkout (two-track landing); deliverable work lands by PR.
  Board/spec commands run from the root, never inside a worktree.

<!-- Lane-0/precondition rulings that change the per-task loop are written HERE as
     checkable lines, never only as prose in the state snapshot. -->

## Concurrency & conflict doctrine

- **Hotspots (actual paths):**
  - `pdlc/skills/sweep/SKILL.md` — TASK-97, 98, 96. **The** hotspot; lanes 2/3/4 are
    strictly serial because of it.
  - `pdlc/templates/CLAUDE.md` + the repo's own root `CLAUDE.md` — TASK-96, possibly
    TASK-101.
  - `test/pdlc.test.mjs` — TASK-95, possibly TASK-101; `test/spec-bridge.test.mjs` —
    TASK-100.
  - `docs/wiki/pdlc-sweep-history.md`, `docs/wiki/pdlc-sweep.md`, and the generated
    `docs/wiki/INDEX.md` + `docs/wiki/CAPSULES.md` — nearly every task. Regenerated files
    conflict textually on almost every parallel PR; **regenerate, never hand-merge**.
  - Version-lockstep files — `.claude-plugin/marketplace.json`, every `plugin.json`,
    `action.yml`'s npx pin, each edited skill's `version:`. Every released-surface PR
    touches them, so **every** serial merge in this sweep expects a lockstep conflict;
    resolve by re-running `node scripts/sync-version.mjs <next-free>` after the merge-in,
    never by hand-picking sides.
- **Paused tasks are not live lanes:** none at authoring; the rule stands if one appears
  (`paused` label set/cleared only via `backlog task edit --labels`, provenance in its
  append-notes — never claimed, rebased, or cleaned).
- Reconcile by what the branch carries: **every branch in this sweep is pin-carrying** (each
  re-pins wiki notes to its own commits) → **merge `origin/main` in**, never
  rebase/squash/force-push, and each PR lands as a **merge commit**. Take main's side for
  anything you didn't deliberately change.
- **Honest re-pins only — a merge-in never justifies a pin bump.** Setting pin = merge
  commit empties the freshness probe's `git log <pin>..HEAD -- <sources>` range *by
  construction*. Route every staled or conflicted pin through the wiki-update plan loop's
  classifier: read `git diff <old-pin>..<merge-commit> -- <sources>`, classify
  **RE-PIN-ONLY** (provably prose-safe — version stamps, no-op churn) vs **NEEDS-REVIEW**
  (re-verify and amend the note's prose BEFORE bumping). The merge commit is the re-pin
  *target* once verified, never the *justification*.
- After every history move (merge-in or rebase): re-run `node --test`, `check-docs`, the
  version-bump check, AND the freshness probe — **unconditionally**, never gated on
  whether `docs/wiki/` changed (pins reference sources outside the wiki).
- **Two hotspot-heavy PRs never merge within one re-ground cycle without a reconcile
  between them.** In Lane 1 that means: merge TASK-93 → ff-pull root → merge-in on the
  TASK-100 and TASK-101 branches → re-run gates → then merge the next.
- Conflicting with a sibling session's open PR → **the smaller PR merges first**,
  regardless of whose it is.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress (`backlog task edit TASK-<n> -s "In Progress" -a @claude`) **+** the
  `specs/NNN-<slug>/` stub **+** `spec-bridge:link` against that stub (the link rides the
  claim, arming the bridge gate from the branch's first commit). The branch is cut from
  `origin/main`, which does not contain the spec yet:
  `git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main`. Push immediately
  (`git push -u origin <branch>`); **never force-push a claim**.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`. If
  another session now holds that task or number → **STOP the lane and surface it to the
  operator**. Unrelated rejection (e.g. a board-notes push) with the task + number still
  free → fetch, **merge** `origin/main` into the claim branch, and re-push plain (the
  merge remedy stays executable under the never-force-push-a-claim rule; a rebase would
  not).
- Verify merged (`gh api repos/evanstern/praxisflux/pulls/<n> --jq .merged`) **before**
  deleting any branch or worktree; never delete+recreate a closed PR's head branch — open
  a fresh PR instead.
- **Board-edit hygiene** (this repo's own field findings): `git add` specific task files,
  never `backlog/` wholesale; **commit board edits in the same turn you make them** —
  concurrent sessions destroy uncommitted work in this checkout; repeated `--add-label`
  keeps only the last; never redirect a `backlog` write to `/dev/null` — read it back.
- **Session hygiene:** at each lane boundary the orchestrator SHOULD end its session and
  resume from this runbook + the board. Orchestrator context grows monotonically and the
  tail is the expensive part (field case: one main session grew 172k→548k; its last fifth
  cost as much as its first two-fifths).

## Operator checkpoints (do not proceed silently past)

**Checkpoints 1–4 were answered at sign-off (2026-08-02) and are CLOSED.** Their answers
are gate lines in "Per-task artifacts required before PR" above (rulings A, B, C) — that
is where a later step reads them back. Recorded here for provenance only; do not re-ask
them:

1. ~~Lane sign-off~~ → **approved as authored**, all five lanes, tiers as pinned, all
   eight escape lines signed.
2. ~~TASK-100's gate home and posture~~ → **spec-bridge gate, host-declared via
   `.spec-bridge.json`, blocks** (ruling A).
3. ~~TASK-101 ship vs document~~ → **ship the hook** (ruling B).
4. ~~`opus-implementer` primary model~~ → **stays `claude-opus-4-8`**; TASK-97 documents
   `claude-opus-5` as primary without flipping the pin (ruling C).

**Still live — do not proceed silently past:**

5. **TASK-96's "one home" choice** if the chosen home *removes* text from the planted
   `pdlc/templates/CLAUDE.md` block: that strands stale prose in every un-replanted
   downstream host, so surface the choice before implementing it (the card asks for a
   recorded choice; this is the case where recording is not enough).
6. **Any tier escalation** (record the rubric justification on the card), and **any lane
   drop, reorder, or resplit** — that is a runbook amendment: amend this file, note why,
   tell the operator.
7. **Softening any gate this runbook enumerates**, at plan, implement, or merge time — a
   runbook amendment plus an operator ping, never an implementer decision note buried in a
   spec artifact. *(Field case: `specs/033`'s plan.md relaxed a signed-off runbook's
   root-README gate to "only if check-docs demands", with no amendment.)*
8. **A rejected push on a claim** where another session now holds the task or the spec
   number — STOP the lane and surface it.

## Done means

- **All eight scoped tasks Done on the board via their own merged PRs** — TASK-93, 94, 95,
  96, 97, 98, 100, 101. The To Do column is empty.
- Every scoped card **still carries its Spec marker** at sweep end (re-run the
  `spec-bridge` links check — other sessions move the board while branches sit).
- Every scoped task's `specs/NNN-*/` contains a real `spec.md` + `plan.md` + `tasks.md`
  (hand-authored under the escape lines above; the tooling is excused, the artifacts are
  not).
- **Green on `main`:** `node --test`, `node scripts/check-docs.mjs`,
  `node scripts/sync-version.mjs --check`, `node scripts/check-version-bump.mjs`, and
  `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` — the last with **zero warns**
  (the `test-suite-catalog-plugins.md` no-sources warn cleared by TASK-93).
- Grounding fresh: every wiki pin current and **honestly** re-pinned (NEEDS-REVIEW notes
  amended, not stamped); `INDEX.md` + `CAPSULES.md` regenerated; `pdlc-sweep-history.md`
  carrying 0.48.0 through this sweep's last release.
- `git worktree list` shows the root only — no stale sweep worktrees; every merged branch
  deleted only after `gh api … --jq .merged` returned true.
- This file's execution log complete (one row per task, with PR, merge sha, best-effort
  tokens/cost, date) and its **Status flipped to `done`** with the closing summary.

Anything short of that is reported as exactly what remains, never rounded up.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while a
task is in flight its row carries the phases dispatched/completed (e.g.
`phases: 1-2 done, 3 dispatched`), updated at each dispatch boundary, so a resuming
session can see where within the task the last one stopped; the closing note on merge
replaces or absorbs it. `tokens/cost` carries best-effort actuals from the
harness/transcript, so future runbook authoring budgets against real numbers.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
