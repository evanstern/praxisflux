# 037 — plan

Doctrine-text change on top of specs 035/036. Two files plus release plumbing;
no code, no new tests.

1. **`pdlc/skills/sweep/SKILL.md`**
   - Step 5 (dispatch): add the turn-hygiene block as dispatch-prompt doctrine —
     every implementer prompt carries: batched parallel tool calls for
     independent reads/checks; minimal between-call narration; mechanical phases
     at lower reasoning effort. Rationale in place (micro-turns re-pay the full
     context read; field case ~300 output tokens/request average on the
     expensive implementers). Keep 035's model-ID and 036's phase-scoped text
     untouched.
   - Orchestrator session boundaries: where the skill already frames the runbook
     as session-portable (intro and/or step 10 area), state the orchestrator
     SHOULD end its session at lane boundaries and resume from the runbook +
     board, as a cost prescription (monotonic context growth; field case
     172k→548k, the last fifth costing as much as the first two-fifths).
   - Bump the skill's frontmatter `version:` 0.11.0 → 0.12.0 (minor).
2. **`pdlc/skills/sweep/templates/runbook.md`**
   - Execution-log header becomes
     `| date | task | PR | merge | tokens/cost (best-effort) | notes |`
     with a one-line note that actuals come from the harness/transcript and
     exist so future runbooks budget against real numbers; keep 036's
     phases-in-notes guidance intact.
3. **Release plumbing:** `node scripts/sync-version.mjs 0.43.0` (next free over
   main's 0.42.0 at authoring; take the next free number if main moved).
4. **Wiki re-verify (same PR):** `docs/wiki/pdlc-sweep.md` NEEDS-REVIEW against
   the diff; budgets are tight (body 7,973/8,000 after 036) — trim/tighten or
   split summary-style per the corpus spec if the additions don't fit.
   Regenerate CAPSULES.md if `description:` changes. Lockstep stamps stale the
   11 siblings again → RE-PIN-ONLY after reading the diffs.
5. **Gates before PR:** `node --test`, `node scripts/check-docs.mjs`,
   `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`,
   `node scripts/check-version-bump.mjs`.

Constitution note: host has no `.specify/`; hand-authored spec per recorded
precedent (runbook, Per-PR gates).
