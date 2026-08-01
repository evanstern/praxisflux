# refactor-triage — run praxis-2026-07-31-18-47-56

- **Scope:** range `f3abebe..origin/main` (origin/main = 54fcdf4 at run time) — the
  2026-07-31 board-cost-test sweep: PRs #108–#118, v0.45.0→v0.51.0 (TASK-74..80, 85,
  89, 90 under cost instrumentation). 103 commits, 83 files, +2,414/−279.
- **Mode:** (a) range, interactive **operator walk** (dispositions given 2026-07-31 via
  grouped triage questions; per-finding rationale below). Scope confirmed with the
  operator at run start (no `--range` argument was passed; the never-triaged just-merged
  sweep made range mode the evident intent, and the operator chose it over whole-repo).
- **Evaluation engine:** team-review (installed) orchestrated as a self-review — report:
  `docs/reviews/team-review-praxis-2026-07-31-18-47-56.md` (proven by the engine's
  output gate; tracked copy committed on this run's branch). Team: 2 seniors (sweep
  doctrine stack, opus-class; triage skill + tests + planted blocks), 2 scouts
  (wiki re-pin honesty; merge-train process hygiene), + lead intent-drift pass against
  the intent record.
- **Intent record found (range mode):** `docs/design/board-cost-test-runbook.md`
  (status done, operator sign-off 2026-07-31 at PR #108), specs
  `specs/039-*`..`specs/047-*` (all real, all closed), pinned `docs/wiki/` notes
  re-pinned at e48e00c. Nothing missing; the intent-drift pass ran undegraded.
- **Prior art:** checked `refactor-triage-praxis-2026-07-31-11-12-22.md` and the two
  2026-07-27 records. Two carries: this morning's **F7** (step-5 detail asymmetry,
  deferred as "re-evaluate at the next sweep-skill hardening") — re-evaluated below
  (PA-F7); this morning's **W1 rationale** (pre-emptive headroom trimming is churn) —
  applied to finding 12g. All other findings fresh; no overturns.

## Dispositions (every finding; accept / reject / defer + rationale)

Finding numbers are the evaluation report's "What could be improved" numbering;
12a–12i are its batched minor-residue sub-items.

| # | Finding (evidence) | Disposition | Rationale | Task |
|---|--------------------|-------------|-----------|------|
| 1 | Model-pinning doctrine still teaches the falsified Agent-tool `model` param path; agent-def + served-model-verification mechanism is runbook-local (SKILL.md:197-198 vs board-cost-test-runbook.md:301-308) | **accept** | Re-creates this morning's accepted-F4 shape one generation later; next sweep on a fresh host silently burns session-model rates | TASK-97 |
| 2 | opus-implementer.md pins the fallback claude-opus-4-8 as if it were the tier; no pointer back to the claude-opus-5 primary (.claude/agents/opus-implementer.md:4 vs runbook:68) | **accept** | Silent forever-fallback once Opus 5 becomes available; same card as 1 (same mechanism, same PR) | TASK-97 |
| 3 | Wiki promise broken: pdlc-sweep.md:92-97 says history carries per-release detail for 0.48.0/0.50.0/0.51.0 — history ends at 0.47.0, body at 7,991/8,000; TASK-90's "reviewed-no-amend" classification missed a 25-line source addition | **accept** | The run's one true broken promise; backfill forces the summary-style split TASK-78 just demonstrated | TASK-93 |
| 4 | Output gate is the only mode-modified surface without a back-pointer (SKILL.md:356-358 names it; :378-391 unstitched; no wrap-up-PR sequencing stated) | **accept** | One clause; a fresh background-job session at sweep end has no stated vehicle for the gate's demands | TASK-98 |
| 5 | Hand-authored-specs hatch temporally impossible in author mode (SKILL.md:38-41 demands a runbook that doesn't exist at gate time) | **accept** | Fails the file's own resume-from-artifacts test; one clause | TASK-98 |
| 6 | Execution mode is ambient — no artifact records interactive vs background-job (template state snapshot lacks the line, templates/runbook.md:21-28) | **accept** | Mixed-rights successor sessions inherit unexplained riding-closures; one template line | TASK-98 |
| 7 | No-main-push degradation clause in three places (SKILL.md:352-358, :360-363 incl. two-track gloss, template :85-87) — unrequested addition 046 R4 warned against | **accept** | Version-planted into N hosts; next mode change strands stale prose everywhere; dedup after the mode text settles | TASK-96 |
| 8 | Root CLAUDE.md block v0.45.0 lacks the two-track rule the repo lives by (CLAUDE.md:96 vs template :82-88) | **accept** | Declared 046 non-goal (recorded residue, not a violation) — carded so the window closes rather than fossilizes | TASK-96 |
| 9 | 047 test deepening pins only pre-range prose — none of the new 040/042/039/043/045 clauses is test-pinned; title still says "all three entry modes" with four merged (test/pdlc.test.mjs:97) | **accept** | Gut the new doctrine and 254 tests stay green; spec-compliant but the spec's premise didn't land | TASK-95 |
| 10 | Mode (d) claims `last-run-at` is "the machine-findable line every record carries" (SKILL.md:69-70) — false for all pre-0.3.0 records | **accept** | One-clause rewording; this run's record (below) moots the bootstrap problem but not the false claim | TASK-94 |
| 11 | Range-aware orient.mjs still advertised as a live follow-up (refactor-triage SKILL.md:26-27, wiki :81) after TASK-77 closed it not-needed | **accept** | Closed decisions must not read as live options; one-clause trims | TASK-94 |
| 12a | TASK-77 frontmatter `status: Done` for not-done work | **reject** | Notes + runbook escape line already carry the truth; a `not-needed` label convention needs doctrine to mean anything — churn without it | — |
| 12b | Cost table rows sum to $214.59 vs claimed $214.60 (runbook:290-294) | **reject** | One cent of rounding in a best-effort ledger; amending a done runbook for it is churn | — |
| 12c | action.yml:7 example comment pins @v0.4.0, seven-plus releases stale | **accept** | The enumeration-drift shape TASK-74 just fixed elsewhere; rides the trims card | TASK-94 |
| 12d | Agent defs landed via wrap-up PR without a runbook amendment (scope creep by TASK-79's own rule) | **reject** | Retrospective; well-explained in the cost analysis; the forward fix is TASK-97 | — |
| 12e | Runbook labels the session-boundary lever "(cost lever, applied)" (:218) while its own verdict says "NOT applied" (:315) | **reject** | Historical record; the analysis section is unambiguous about what actually happened | — |
| 12f | test-suite-catalog-plugins.md has `sources: []` — freshness unverifiable (the gate's one warn) | **accept** | Decorative pin defeats the gate's purpose; rides the wiki card | TASK-93 |
| 12g | pdlc-sweep.md capsule at 496/500 chars | **reject** | Prior art W1 (this morning): the budget gate enforces the cap; pre-emptive trimming is churn | — |
| 12h | Mode parentheticals inserted as unwrapped conflict-dodging one-liners (SKILL.md:149-153, :252) | **accept** | Incidental rider on the mode-stitching card — same lines being edited anyway | TASK-98 |
| 12i | test/pdlc.test.mjs:39 keeps the key-order-pinned regex shape 047 removed as substandard next door | **accept** | Half-applied standard; rides the test card | TASK-95 |
| PA-F7 | Step 5 grew again (~40 lines, three verbatim cost anecdotes) — this morning's deferred watch item, due for re-evaluation at "the next sweep-skill hardening" (which cards 97/98 are) | **defer** (again) | Operator: the morning's rationale holds — restructure risk for no current failure; a trim rider would grow TASK-97's scope. Watch stands; re-evaluate at the next hardening | — |

## Accepted → board

- **TASK-97** — agent-def dispatch doctrine (findings 1, 2). Labels: `debt`, `pdlc-sweep`.
- **TASK-98** — background-job mode stitching (findings 4, 5, 6, 12h). Labels: `debt`,
  `pdlc-sweep`. Depends on TASK-97 (same two files → serial merge order).
- **TASK-93** — pdlc-sweep-history backfill + split; hub-note sources (findings 3, 12f).
  Labels: `debt`, `wiki`. Wiki-only, no bump.
- **TASK-94** — drift trims: closed-decision residue + stale example pin (findings 10,
  11, 12c). Labels: `debt`, `pdlc-refactor-triage`.
- **TASK-95** — test-pin the 039–047 doctrine (findings 9, 12i). Labels: `debt`,
  `tests`. Depends on TASK-97, TASK-98, TASK-94 (anchors pin the settled prose —
  the runbook-authoring precedent). Test-only, no bump.
- **TASK-96** — root-block replant + degradation-clause dedup (findings 7, 8). Labels:
  `debt`, `grounding`. Depends on TASK-98 (the mode text it dedupes must settle).

Every card cites this record and the evaluation report with file:line evidence, carries
per-finding ACs, and is immediately sweepable (`pdlc:sweep` over label `debt`, or ids
TASK-93..98; lane shape: 97→98→96 serial ∥ 93 ∥ 94, then 95 after 97/98/94).

**Renumbering note (2026-08-01):** this run originally carded TASK-91..96. Before
this record's PR merged, `main` took TASK-91 (pdlc:bootstrap model-tier rubric) and
TASK-92 (worktree discipline) for unrelated cards, so **this run's 91 and 92 were
recreated as TASK-97 and TASK-98** with their content verbatim; 93–96 kept their
numbers, and every dependency and reference above was repointed. Original creation
timestamps (2026-07-31 20:03 / 20:04) are recorded in the new cards' descriptions.

## Deferred / rejected residue

Deferred: PA-F7 (watch item, second deferral — re-evaluate at the next sweep-skill
hardening). Rejected: 12a, 12b, 12d, 12e, 12g (rationale above; 12g by W1 prior art).
No board residue for any of these, per doctrine.

## High-water mark

last-run-at: 54fcdf4c63b78afd73a8aa4c8488a20571fe5063
