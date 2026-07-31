# praxisflux — team review (range f3abebe..origin/main: the board-cost-test sweep, PRs #108–#118)

**Lens:** drift and tech debt since `f3abebe..origin/main` — clobbered design decisions,
slap-dash conflict resolutions, spec requirements quietly dropped, doctrine
self-contradiction after stacked edits of the same files, SKILL↔template parity, wiki
re-pin honesty, board/spec bookkeeping hygiene across the serial merge train, and
specifically whether TASK-89/90's debt fixes (themselves products of this morning's
refactor-triage) landed as specified. Team: 2 seniors (sweep doctrine stack; triage
skill + tests + planted blocks), 2 scouts (wiki re-pin honesty; merge-train process
hygiene), plus the lead's intent-drift pass against the runbook
(`docs/design/board-cost-test-runbook.md`), specs 039–047, and the pinned wiki notes.

**TL;DR:** The sweep merged clean and closed honestly: all seven TASK-89 fixes survived
three subsequent stacked edits of the same two files, no spec requirement was dropped or
weakened anywhere in 039–047, the board/specs/versions/log bookkeeping is the cleanest
train reviewed so far, wiki pins are provably honest, and the cost experiment delivered
its deliverable — $214.60 vs the $1,192.57 baseline, with brutally honest lever
verdicts. The one debt that matters is recursive: **the discovery that made the cost win
possible — model pinning works only via `.claude/agents/` agent definitions with
served-model verification, because the Agent tool's `model` param is silently ignored —
remains runbook-local while the sweep SKILL still teaches the falsified param path**
(`pdlc/skills/sweep/SKILL.md:197-198`). That is the exact "doctrine-shaped ruling stays
runbook-local" shape this morning's triage carded as F4; the sweep closed by re-creating
it, uncarded. The rest is seam debt: an Output gate unstitched from the background-job
mode, an author-mode-impossible precondition hatch, a broken wiki promise (the history
note is three releases behind at 7,991/8,000 chars — its budget cliff), and a test
deepening that pins none of the range's new doctrine.

## What we like

- **All seven 039 fixes verified intact in the merged end-state** — F1 log cadence
  (`pdlc/skills/sweep/SKILL.md:217-220`, `:260-261`, `templates/runbook.md:155-160`),
  F2 skip-leak closed ("The only sanctioned skip is the Output gate's operator-signed
  escape line", `SKILL.md:28-30`), F3 Spec-marker re-check (`SKILL.md:380-383`), F4
  fallback-ID slot with the 2026-07-31 ruling cited (`SKILL.md:98-101`), F6 template
  "never as a second mechanism" clause (`templates/runbook.md:85-87`), T1/T2 trims.
  Later editors threaded around these hunks; the one real collision (79↔85 both
  stamping sweep 0.16.0) was resolved honestly with a 0.17.0 restamp.
- **Bookkeeping is exemplary.** Version lockstep exact at 0.51.0 across marketplace,
  all nine plugin.json files, and the `action.yml:40` pin; specs 039–047 all real, zero
  unticked boxes; every scoped card Done with its Spec marker, dispatch note (tier +
  model ID + served model), and content-real ACs; the execution log's ten rows verify
  against real merge shas; every non-merge commit carries the trailer.
- **TASK-77's not-needed closure is model residue**: operator decision, evidence bar,
  two counter-datapoints, and a re-card trigger on the card; a matching operator-signed
  escape line in the runbook (`board-cost-test-runbook.md:174-178`); no phantom spec dir.
- **Wiki pins are honest.** Freshness gate green (36 notes); all 13 re-pins in e48e00c
  point at the real merge commit; spot-checked stamp-only re-pins were provably
  version-bump-only; the TASK-78 split is clean (disjoint sources, reciprocal links,
  budgets green).
- **The cost analysis tells the truth against itself** — it records the $1.41 spent
  discovering the model-param failure, and "Orchestrator session boundaries: NOT
  applied — and it now dominates" (`board-cost-test-runbook.md:315-321`).
- **Gates green on main:** 254/254 tests, check-docs, wiki freshness, spec-bridge links.

## What could be improved

1. **Model-pinning doctrine still teaches the mechanism this sweep falsified.**
   `pdlc/skills/sweep/SKILL.md:197-198` prescribes "passing the runbook's explicit
   model ID on the dispatch call (the Agent tool's `model` param, or the host's
   equivalent)" — but the range's own field data proves that param is silently ignored
   and enum-rejects explicit IDs (`board-cost-test-runbook.md:301-308`). The working
   mechanism — committed `.claude/agents/{opus,sonnet}-implementer.md` defs with
   `model:` frontmatter, served model verified from the transcript before siblings
   launch — appears in no SKILL, no template, and not in `docs/wiki/pdlc-sweep.md`
   (`:71-73` still says only "explicit model IDs at dispatch"). Concrete failure: the
   next sweep on a fresh host follows step 5 verbatim and silently burns session-model
   rates again. This re-creates the accepted-F4 pattern from
   `docs/reviews/refactor-triage-praxis-2026-07-31-11-12-22.md` — the sweep's own
   triage lineage — one generation later.
2. **`opus-implementer.md` pins the fallback as if it were the tier.**
   `.claude/agents/opus-implementer.md:4` hard-codes `model: claude-opus-4-8` — the
   *fallback* per the runbook's tier table (`board-cost-test-runbook.md:68`) — and its
   description misattributes the choice to the never-inherit ruling rather than the
   day's subscription unavailability. Nothing (no doctrine line, no test) points back
   at the `claude-opus-5` primary; when Opus 5 becomes available, the def keeps
   dispatching 4-8 forever, silently.
3. **A wiki promise the merge made false.** `docs/wiki/pdlc-sweep.md:92-97` says
   "[[pdlc-sweep-history]] carries the per-release detail" for 0.48.0, 0.50.0, and
   0.51.0 — the history note's last entry is 0.47.0. Its body sits at 7,991/8,000
   chars, so the backfill forces a summary-style split; and TASK-90's log row
   classified the note "reviewed-no-amend" while its source gained a 25-line doctrine
   section — a re-pin classification that shouldn't have come out RE-PIN-ONLY-shaped.
4. **The Output gate is the only mode-modified surface without a back-pointer.** The
   background-job mode names it as its third touchpoint ("Sweep-close lands via a
   wrap-up PR (Output gate)", `SKILL.md:356-358`), and steps 2/9/10 all carry mode
   parentheticals — the gate (`SKILL.md:378-391`) carries none, and nothing says its
   checks are only satisfiable after the wrap-up PR merges. A fresh background-job
   session at sweep end has no stated vehicle for the closures the gate demands.
5. **The hand-authored-specs hatch is temporally impossible in author mode.**
   `SKILL.md:38-41` requires the runbook to record the escape line — but the
   precondition gate runs before Phase 1 authors any runbook. Adopt-mode works;
   author-mode on a `.specify/`-less host fails the file's own resume-from-artifacts
   test. Needs one clause covering the runbook-being-authored case.
6. **The execution mode is ambient, never recorded.** No SKILL or template line
   requires the runbook to state *which* execution mode (interactive vs
   background-job) the sweep runs under; a resuming session with main-push rights
   inherits riding-the-next-branch closures with no artifact explaining why. One
   "Execution mode:" line in the template's state snapshot
   (`templates/runbook.md:21-28`) closes it.
7. **The no-main-push degradation clause now lives in three places** — the mode
   bullets (`SKILL.md:352-358`), the composition sentence with its parenthetical
   restatement of the two-track rule (`SKILL.md:360-363`), and the planted block
   (`pdlc/templates/CLAUDE.md:85-87`). Spec 046 R4 warned "compose with that sentence,
   not duplicate it", and commit a7b544f admits the clause was an unrequested
   addition. The block is version-planted into N hosts: the next change to the mode's
   substitutes strands stale degradation prose in every un-replanted host.
8. **This repo's own planted block lacks the rule it lives by.** Root `CLAUDE.md:96`
   block is pinned v0.45.0 with no two-track bullet — a declared 046 non-goal, so
   recorded residue, not a violation — but the repo currently operates under a rule
   its own always-on grounding doesn't state, and no gate flags
   planted-block-lags-template. Card the replant so the window closes.
9. **The 047 test deepening pins only pre-range prose.** All three R2 anchors already
   existed at f3abebe; none of the new 040/042 clauses (`--policy` detection,
   tracked-copy fallback, `last-run-at`, mode (d)) nor any 039/043/045 sweep clause is
   pinned by any test — gut them and 254 tests stay green. And
   `test/pdlc.test.mjs:97` still says "all three entry modes" while the skill merged
   four in this same range (spec-compliant, since 047 capped its own scope — but the
   spec's premise "the deepened tests pin the 0.2.0/0.3.0 prose" is not what landed).
10. **Mode (d) is unusable against every existing record.** `SKILL.md:69-70` claims
    `last-run-at` is "the machine-findable line every record carries" — false for all
    three prior records (they predate PR #112). The STOP path handles it honestly, and
    the next record written under 0.3.0 moots the bootstrap problem, but the "every
    record carries" wording is false today.
11. **Stale advertisement of a closed follow-up.** `pdlc/skills/refactor-triage/SKILL.md:26-27`
    and `docs/wiki/pdlc-refactor-triage.md:81` still advertise "range-aware
    `orient.mjs`" as a possible follow-up; TASK-77 closed it as not-needed with a
    re-card trigger. One-clause trim keeps the record straight.
12. **Minor residue, batched:** TASK-77's frontmatter reads `status: Done` for
    not-done work (a `not-needed` label would make list-level state honest); the cost
    table rows sum to $214.59 vs the claimed $214.60; `action.yml:7`'s example comment
    still says `@v0.4.0`; the agent defs landed via wrap-up PR without a runbook
    amendment (scope creep by the sweep's own TASK-79 rule); the runbook labels the
    session-boundary lever "(cost lever, applied)" at `:218` while its own verdict
    says "NOT applied" at `:315`; `test-suite-catalog-plugins.md` has `sources: []`
    (staleness unverifiable — the gate's one warn); `pdlc-sweep.md`'s capsule has
    4 chars of headroom; step-2/9 mode parentheticals inserted as unwrapped
    conflict-dodging one-liners (`SKILL.md:149-153`, `:252`);
    `test/pdlc.test.mjs:39` keeps the key-order-pinned regex shape 047 R1 removed as
    substandard next door.

## What should be removed

- The parenthetical restatement of the two-track rule in `SKILL.md:360-361` (keep the
  reference, drop the gloss) — after the replant window closes (finding 8), collapse
  the degradation clause to one normative home.
- The orient.mjs follow-up advertisements (finding 11).
- Step 5's three verbatim cost anecdotes (`SKILL.md:196-226`) could compress to one
  citation each — noting this morning's triage already **deferred** the step-detail
  asymmetry as watch-item F7, and this range confirms the watch: the step grew again.

## Stealing for later

- **The consistency-then-equality test shape** (`test/pdlc.test.mjs:80-95`): extract
  every occurrence of a shared string contract from both files, assert each file
  internally consistent, then assert cross-file equality — portable to any prose-level
  contract between components.
- **`last-run-at` as a durable cursor**: full-40-char, fixed-prefix, exactly-once line
  with a STOP-never-guess consumer — a clean pattern for any artifact-chained pipeline.
- **The lever-verdict post-mortem format** (`board-cost-test-runbook.md:300-321`):
  per-lever WORKS/NOT-applied verdicts with counterfactual pricing, including what the
  discovery itself cost.
- **The honest re-pins classifier** ("the merge commit is the re-pin *target*, never
  the *justification*", `SKILL.md:287-299`) — though finding 3 shows the classifier is
  only as good as its per-note application.

## New ideas — toward closing the drift seam

1. **Doctrine the agent-def dispatch mechanism** (fixes 1+2 together): sweep SKILL
   Phase 1 item 2 + step 5 teach "pin via a committed agent definition; verify the
   served model from the transcript before siblings launch; the def's body states
   primary vs fallback provenance"; re-word the opus def. Reuses the existing F4
   fallback-slot text as the anchor point.
2. **History-note backfill + split** (fixes 3): add 0.48.0/0.50.0/0.51.0 entries via
   the summary-style split `docs/corpus-spec.md` already defines (TASK-78's pattern,
   fresh precedent in this very range).
3. **Mode stitching sweep** (fixes 4+5+6, one card): Output-gate parenthetical,
   author-mode hatch clause, template "Execution mode:" line — three one-clause edits
   in the same two files.
4. **Test-pinning of the range's doctrine** (fixes 9+10's wording): extend
   `test/pdlc.test.mjs` anchors to mode (d)/`last-run-at`/`--policy` and at least one
   043/045 sweep clause; fix the "three entry modes" title. Follows the 047 anchor
   pattern already in the file.
5. **Replant + dedup** (fixes 7+8, ordered after 3's merge): re-plant this repo's
   block (honoring the standing hand-edits convention), then collapse the degradation
   clause to one home.

## Questions for you

- Finding 2 pins policy you own: when the subscription gains `claude-opus-5`, should
  defs auto-prefer it (requiring a doctrine line about re-checking availability), or
  is 4-8-until-operator-says stable the intent?
- Finding 8's replant: 046 deliberately deferred it — card it now, or leave until the
  next bootstrap-touching task?
