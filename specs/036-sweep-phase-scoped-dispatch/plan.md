# 036 — plan

Doctrine-text change on top of spec 035's merged step-5 rewrite. Two files plus
release plumbing; no code, no new tests.

1. **`pdlc/skills/sweep/SKILL.md`** — step 5 (dispatch), extending the text 035
   landed (explicit model ID clause stays untouched):
   - Prescribe one fresh implementer per tasks.md phase (or explicitly-grouped
     small phases — grouping is the orchestrator's recorded call), each
     dispatched with the runbook's pinned model and re-grounded from the spec
     artifacts + branch commits; state the rationale (context-re-read tax:
     every tool call re-pays the agent's full context, which in a long-lived
     implementer is mostly its own transcript — field case: one implementer,
     699 requests at ~427k average context vs a ~32k dispatch baseline).
   - Name the phase handoff artifact set: spec dir (spec.md/plan.md/tasks.md),
     tasks.md tick-state, branch commits. Nothing rides chat context between
     phases; if the next phase needs it, it lives in an artifact (tick the box,
     commit the slice, note deviations in the spec dir or on the board task).
   - Bump the skill's frontmatter `version:` 0.10.0 → 0.11.0 (minor).
2. **`pdlc/skills/sweep/templates/runbook.md`** — make multi-phase dispatch
   visible: extend the execution-log guidance (or lane entry) so a task row can
   record phases dispatched/completed (e.g. a `phases` note in the log row);
   keep it lightweight — one slot, not a second table.
3. **Release plumbing:** `node scripts/sync-version.mjs 0.42.0` (next free over
   main's 0.41.0 at authoring; take the next free number if main moved).
4. **Wiki re-verify (same PR):** `docs/wiki/pdlc-sweep.md` (sources = the two
   edited files) is NEEDS-REVIEW against the diff — its Execute/dispatch prose
   and the "Since 0.41.0" paragraph area gain the phase-scoped rule; mind the
   corpus budgets (capsule ≤500 chars, body ≤8,000). Regenerate CAPSULES.md if
   `description:` changes. Lockstep version stamps stale the 11 sibling notes
   again → RE-PIN-ONLY after reading the diffs.
5. **Gates before PR:** `node --test`, `node scripts/check-docs.mjs`,
   `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`,
   `node scripts/check-version-bump.mjs`.

Constitution note: host has no `.specify/`; hand-authored spec per recorded
precedent (runbook, Per-PR gates).
