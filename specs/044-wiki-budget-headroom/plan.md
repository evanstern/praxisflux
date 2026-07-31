# 044-wiki-budget-headroom — plan

**Constitution:** none ratified — planning against docs/corpus-spec.md (the split and
budget rules live there), docs/wiki/INDEX.md, and the grounding docs, per sweep
doctrine's absent-constitution rule.

## Approach

Wiki-only, three surgical moves. Read docs/corpus-spec.md's "summary-style split"
section FIRST and follow it exactly.

1. **R1 — split:** `test-suite-catalog-plugins.md` catalogs plugin-gate and
   cross-plugin-seam test files. Natural cleave: **plugin-gate suites** vs
   **cross-plugin-seam suites** (or another split the file's own structure suggests —
   the implementer picks the seam the corpus-spec's rules favor and records the choice
   in the PR). The original becomes the summary note pointing at the split-out
   sibling(s); every bullet lands in exactly one home; `sources:` divide so each
   note's sources are exactly the test files it catalogs; INDEX.md gains the new
   note(s); wikilinks from test-suite-catalog (the repo-tooling half) re-checked.
2. **R2 — trim:** reword pdlc-refactor-triage's `description:` under ~480 chars,
   keeping: post-sweep debt evaluator, four entry modes, team-review engine,
   dispositions in a tracked record, accepted findings carded. Regenerate CAPSULES.md
   (`node grounding-wiki/scripts/capsules.mjs . docs/wiki`) in the same slice.
3. **R3 — de-specify:** in the same note's Handing-off prose, replace restated sweep
   specifics (skill-version claims etc.) with prose that delegates to [[pdlc-sweep]];
   verify nothing else in the note grounds claims outside its sources.
4. **Re-pins:** every edited note re-pinned to the editing commit; the split notes
   pinned fresh. No lockstep churn (no version bump) — sibling notes untouched.
5. **Gates:** node --test (the wiki roll-up test may assert note counts — check
   test/ for catalog/corpus tests and update expectations ONLY if a test hardcodes
   the note list), check-docs, freshness, capsules budgets — green in worktree.

## Risks

- TASK-76 depends on the post-split layout — record the final note names in the PR
  body so 76's dispatch can cite them.
- INDEX/CAPSULES are hotspots with lane A's in-flight tasks — none of them touch wiki
  content notes, so conflicts should be nil; reconcile at merge if main moves.
