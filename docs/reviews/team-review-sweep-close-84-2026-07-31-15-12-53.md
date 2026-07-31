# praxisflux — team review (range 9d5b81d..f3abebe: the 2026-07-30/31 sweeps, PRs #99–#106)

**Lens:** drift and tech debt since `9d5b81d..origin/main` — clobbered design decisions,
slap-dash conflict resolutions, spec requirements quietly dropped, doctrine
self-contradiction after four stacked edits of the same step, SKILL/template parity,
wiki-split residue. Team: 1 senior (doctrine coherence), 2 scouts (wiki-split residue;
range process hygiene), plus the lead's intent-drift pass against the runbooks, specs
035–038, and pinned wiki notes.

**TL;DR:** The two sweeps merged clean: every spec requirement traced to shipped text
with nothing dropped or weakened, process hygiene is exemplary (specs complete, board
derived-Done, lockstep exact at 0.44.0, logs carry real token actuals), and the
pdlc-sweep wiki split is sound with honest pins throughout. The debt that remains is
*seam* debt from stacking four edits into the same two files: one real
SKILL↔template contradiction (execution-log cadence — it silently breaks the
phase-scoped resumability guarantee spec 036 shipped), one pre-existing sentence that
now leaks an unsanctioned skip path ("non-trivial"), and an Output gate that still
can't see a *lost* link marker. All are one-clause fixes. The single biggest watch item:
steps 2 and 5 have grown into ~30-line giants — the detail asymmetry TASK-84 diagnosed
has been relocated, not eliminated.

## What we like

- **Spec fidelity end to end.** All of 035 R1–R3, 036 R1–R3, 037 R1–R3, 038 R1–R7
  verified present in shipped text (e.g. explicit-ID rule `pdlc/skills/sweep/SKILL.md:88-94`;
  phase handoff artifact set `SKILL.md:198-202`; escape-line Output gate `SKILL.md:329-333`;
  per-task artifacts section `pdlc/skills/sweep/templates/runbook.md:62-86`).
- **The causal register survived the stacking** — every new rule states its mechanism at
  the point of use ("disarmed by exactly the skip it exists to catch", `SKILL.md:147-149`;
  "no later step reads narrative back", `SKILL.md:102-103`), so the three cost levers read
  as one argument.
- **Step-numbering stability (038 R2) held** — checked against real referents in
  `backlog/tasks/task-57*`, `task-58*`, `task-46*`, `docs/wiki/pdlc-sweep-history.md:113-117`;
  zero stale step references in `docs/wiki/`, `docs/design/`, `pdlc/`.
- **Process hygiene:** specs 035–038 fully ticked and content-real; cards 84/86/87/88
  Done via spec-bridge:sync with all ACs checked and dispatch records (tier + model ID,
  incl. the operator's opus-4.8 fallback ruling); TASK-79 untouched but cross-referenced
  both ways with the non-contradiction recorded; version lockstep exact
  (marketplace = 9 plugin.json = action.yml pin = 0.44.0; sweep skill 0.13.0); commit
  discipline clean (task-id subjects, Co-Authored-By trailers).
- **The wiki split is textbook:** `docs/wiki/pdlc-sweep.md` (6,100 body / 496 capsule) +
  `docs/wiki/pdlc-sweep-history.md` (7,703 / 487), zero duplicated lines, reciprocal
  wikilinks resolve, INDEX/CAPSULES regenerated and verbatim-matched, both pinned to the
  doctrine commit 32f2320; 11 sibling re-pins spot-verified stamp-only (honest
  RE-PIN-ONLY).

## What could be improved

1. **SKILL↔template contradiction: execution-log cadence.** SKILL step 10 instructs one
   log line at merge (`SKILL.md:241-242`); the template requires the in-flight row's
   notes updated at each dispatch boundary (`templates/runbook.md:149-153`) — which IS
   036 R3's resumability guarantee. Neither step 5 nor step 10 tells the orchestrator to
   touch the log mid-task, so a SKILL-canonical session degrades phase-scoped resumption
   to exactly the "lives only in chat" failure the intro forbids (`SKILL.md:13-15`). Fix:
   one clause in step 5 ("update the task's log row at each phase dispatch").
2. **"Non-trivial" leaks an unsanctioned skip path.** `SKILL.md:27-28` ("every
   non-trivial task still gets its own … cycle") predates 038; post-038 the only
   sanctioned substitute is the operator-signed escape line (`SKILL.md:329-333`). As
   written, a reader can skip the cycle for a "trivial" task with no escape line —
   the field case through the front door. Fix: drop "non-trivial" or append "trivial
   tasks skip only via the Output gate's escape line."
3. **Output gate blind to a lost link marker.** Step 4 verifies marker survival mid-task
   (`SKILL.md:177-182`, "other sessions move the board while branches sit") but the
   Output gate (`SKILL.md:328-336`) never re-checks that each scoped card still carries
   its Spec marker at sweep end; the template's end-check even scopes itself away from
   the link line (`templates/runbook.md:66-67`). Fix: one Output-gate clause.
4. **Model-ID pinning has no availability fallback (intent-drift, lead's pass).** The
   operator's 2026-07-31 ruling — `claude-opus-4-8` when `claude-opus-5` is unavailable
   in the executing subscription — is doctrine-shaped but recorded only in
   `docs/design/speckit-degradation-runbook.md`. Phase 1 item 2 (`SKILL.md:88-94`)
   requires an explicit ID with no fallback slot, so every future runbook author
   re-faces the same question. Fix: item 2 gains "record a fallback ID for
   subscription-unavailability; record which actually served the dispatch."
5. **Background-job execution pattern is proven precedent, not doctrine (intent-drift,
   lead's pass).** Both sweeps ran as background jobs and systematically deviated from
   doctrine that assumes an interactive main-push session: worktrees at
   `.claude/worktrees/` not `.worktrees/` (`SKILL.md:138`), post-merge ticks/sync riding
   the NEXT task's branch instead of root (`SKILL.md:232-236`), board/spec commands in
   the task worktree not root (`SKILL.md:243-244`), sweep-close via wrap-up PR. Recorded
   only in the two runbooks. Same shape as TASK-79's finding (de facto doctrine
   pretending to be exception) — either doctrine the pattern or name it a sanctioned
   host-mode.
6. **Escape-line anti-proliferation clause missing from the template.** SKILL carries
   "never as a second mechanism" (`SKILL.md:332-333`); the template's matching section
   (`templates/runbook.md:73-81`) lacks it — and the template is what a runbook author
   reads when tempted to invent a parallel hatch, with TASK-79 about to write into that
   exact slot.
7. **Detail asymmetry relocated (watch item).** Steps 2 (~30 lines) and 5 (~26 lines,
   three bold sub-doctrines) now dwarf steps 6/8/9 (3–7 lines); by the skill's own
   attention theory the merge-verify and re-ground steps read as advisory
   (`SKILL.md:183-208` vs `:209-240`). No fix now; next hardening should consider named
   sub-bullets for scanability.

## What should be removed

- **The doubled context-read rationale in step 5:** `SKILL.md:195-196` restated at
  `:207` — the "Same structural mechanism" cross-reference plus the ~300-token field
  case suffices.
- **The duplicated tier-note obligation:** Phase 1 item 2's closing sentence
  (`SKILL.md:93-94`) vs step 5's fuller "Record tier + model ID + justification"
  (`SKILL.md:189`) — make item 2 point at step 5's form.

## Stealing for later

- **Arm the gate at claim time, not first-use time** (`SKILL.md:147-149`) — a general
  safety-mechanism placement principle: a guard armed after the step it protects is
  disarmed by the skip it exists to catch.
- **Rulings-as-checkable-lines** (`SKILL.md:101-105`, slot at
  `templates/runbook.md:84-86`) — narrative is never read back; gate lines are.
- **The single-substitute escape line as a composition surface** — hardening written so
  the next widening (TASK-79) slots in as an instance, not a competitor.
- **Field cases as load-bearing citations** — real numbers (699 requests @ ~427k avg,
  $404; 172k→548k; ~300 output tokens/request) make cost doctrine falsifiable.
- **Current-doctrine / provenance-history note split** with reciprocal deferral of
  authority (`docs/wiki/pdlc-sweep.md` ↔ `docs/wiki/pdlc-sweep-history.md`).

## New ideas — toward the lens

- Fold fixes 1–3 + 6 + the two removals into ONE small doctrine-consistency task (they
  touch the same two files; one PR, skill 0.13.x) rather than four cards.
- Fix 4 (fallback slot) is a natural companion in the same PR — it edits Phase 1 item 2,
  which the removals already touch.
- Fix 5 (background-job mode) is its own card: it needs a decision (doctrine it, or
  sanction it as a named host-mode) and touches more than the two files (step 2, 9, 10 +
  possibly pdlc:bootstrap's planted grounding — adjacent to TASK-85's two-track rule).

## Questions for you

- Finding 5: should the background-job pattern become sweep doctrine (a named execution
  mode) or stay runbook-recorded precedent until a third occurrence?
- Finding 7 is a watch item by design — card it as deferred, or leave it to the next
  hardening's author?

## Refuted en route

- Process scout's wiki-budget concern (claimed 6,873/8,456 bytes) counted raw file bytes
  including frontmatter; the corpus budget counts body characters — actual 6,100/7,703,
  both green (wiki scout's independent measurement; freshness gate enforcing the budget
  passes on main).
- Runbook log figures (6,102/7,705) vs measured (6,100/7,703): 2-char drift from a
  pre-commit estimate — not a finding.

## Coverage

Senior deep-dive: `pdlc/skills/sweep/SKILL.md`, `templates/runbook.md`, specs 035–038,
step-reference sweep over `docs/wiki|design`, `pdlc/`. Scout A: the two split notes,
INDEX/CAPSULES, wikilinks, sibling pin spot-checks (pdlc-plugin,
gates-consumption-surface). Scout B: specs tick-state, board cards 79/84/86/87/88,
runbook logs, version lockstep, commit discipline. Lead: intent-drift diff of shipped
text vs runbook rulings and spec requirements. Not covered: code outside the range
(nothing in `lib/`, `scripts/`, or gates changed beyond version stamps — verified
stamp-only by scout A's pin diffs).
