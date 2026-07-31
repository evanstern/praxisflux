# refactor-triage — run praxis-2026-07-31-11-12-22

- **Scope:** range `9d5b81d..f3abebe` (origin/main at run time) — the two 2026-07-30/31
  sweeps: PRs #99–#106, v0.41.0→v0.44.0 (sweep-cost levers TASK-86..88 + Spec Kit
  degradation hardening TASK-84). 46 commits, 47 files, +1,373/−141.
- **Mode:** (a) range, interactive **operator walk** (dispositions given 2026-07-31 via
  grouped triage questions; per-finding rationale below).
- **Evaluation engine:** team-review (installed) orchestrated as a self-review —
  report: `docs/reviews/team-review-sweep-close-84-2026-07-31-15-12-53.md` (committed
  f0435e1). Team: 1 senior (doctrine coherence, opus), 2 scouts (wiki-split residue;
  range process hygiene, haiku), + lead intent-drift pass against the intent record.
- **Intent record found (range mode):** `docs/design/sweep-cost-levers-runbook.md`,
  `docs/design/speckit-degradation-runbook.md` (both status done), specs
  `specs/035-*`..`specs/038-*`, pinned notes `docs/wiki/pdlc-sweep.md` +
  `docs/wiki/pdlc-sweep-history.md` + 11 stamp-staled siblings.
- **Prior art:** no matching dispositions in
  `refactor-triage-praxis-2026-07-27-16-07-29.md` / `-17-33-15.md` — all findings fresh.

## Dispositions (every finding; accept / reject / defer + rationale)

| # | Finding (evidence) | Disposition | Rationale | Task |
|---|--------------------|-------------|-----------|------|
| F1 | SKILL↔template execution-log cadence contradiction (SKILL.md:241-242 vs templates/runbook.md:149-153) — breaks 036's phase-scoped resumability | **accept** | Real contradiction; one-clause fix; highest-value seam | TASK-89 |
| F2 | "non-trivial" qualifier leaks a cycle-skip with no escape line (SKILL.md:27-28 vs :329-333) | **accept** | Unsanctioned second skip mechanism; reproduces the 038 field case | TASK-89 |
| F3 | Output gate never re-checks Spec marker at sweep end (SKILL.md:328-336; templates/runbook.md:66-67) | **accept** | Completes 038's cause-4 fix; one clause | TASK-89 |
| F4 | Model-ID pinning lacks availability-fallback slot; operator's opus-4.8 ruling lives only in one runbook (SKILL.md:88-94; speckit-degradation-runbook.md) | **accept** | Doctrine-shaped ruling must not stay runbook-local; edits same lines as T2 | TASK-89 |
| F5 | Background-job execution pattern proven twice but undoctrined — worktree location (SKILL.md:138), root ticks (:232-236), root board commands (:243-244), wrap-up-PR closes | **accept** | Operator: card now; two occurrences suffice; same shape as TASK-79's precedent-pretending-to-be-exception | TASK-90 |
| F6 | "never as a second mechanism" clause missing from template escape-line section (templates/runbook.md:73-81 vs SKILL.md:332-333) | **accept** | Template is what runbook authors read; TASK-79 writes into that slot next | TASK-89 |
| F7 | Detail asymmetry relocated: steps 2/5 ~30/26 lines vs steps 6/8/9 at 3–7 (SKILL.md:183-208 vs :209-240) | **defer** | Senior rates it a watch item; re-evaluate at the next sweep-skill hardening — restructure has real regression risk for no current failure | — |
| T1 | Doubled context-read rationale in step 5 (SKILL.md:195-196 vs :207) | **accept** | Trim; the cross-reference + field case suffice | TASK-89 |
| T2 | Tier-note obligation stated twice (SKILL.md:93-94 vs :189) | **accept** | Trim; item 2 points at step 5's fuller form | TASK-89 |
| W1 | pdlc-sweep-history capsule at 487/500 chars — headroom pressure | **reject** | The budget gate already enforces the cap; pre-emptive trimming is churn | — |
| W2 | Sibling notes re-pin at release cadence (version-stamp coupling) | **reject** | Documented, honest, working as designed (RE-PIN-ONLY after reading each diff) | — |
| P2 | PR #99's runbook-authoring commit carries no gate notation | **reject** | Chronologically impossible — the runbook predates the gates it would record; later PRs record them | — |
| P1 | Wiki note budgets exceeded (6,873/8,456 "bytes") | **refuted in review** | Counted file bytes incl. frontmatter; budget counts body chars — actual 6,100/7,703, both green (independent scout measurement; freshness gate passing on main) | — |

## Accepted → board

- **TASK-89** — pdlc:sweep doctrine consistency after the 035-038 stack (F1, F2, F3,
  F4, F6, T1, T2 as one card — operator chose consolidation: same two files, one PR,
  seven one-clause fixes). Labels: `debt`, `pdlc-sweep`. Priority: medium.
- **TASK-90** — pdlc:sweep background-job execution mode (F5). Labels: `debt`,
  `pdlc-sweep`. Priority: medium. Depends on TASK-89 (same-file footprint → serial
  merge order). Cross-references TASK-85 (adjacent two-track rule; reconcile wording,
  don't implement).

Both cards cite this record and the evaluation report with file:line evidence, carry
per-finding ACs, and are immediately sweepable (`pdlc:sweep` over label `pdlc-sweep`
+ `debt`, or ids TASK-89..90).

## Deferred / rejected residue

Deferred: F7 (watch item — next hardening re-evaluates). Rejected: W1, W2, P2 (rationale
above). No board residue for any of these, per doctrine.
