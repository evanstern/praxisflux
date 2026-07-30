# 035 — plan

Doctrine-text change, two files plus release plumbing. No code, no tests to add
(`node --test` must stay green; no test pins the edited prose).

1. **`pdlc/skills/sweep/SKILL.md`**
   - Phase 1 item 2: extend "Model tier per task" to require an explicit model ID
     recorded next to each tier label, with the justification; state that a bare
     tier name is not a valid runbook entry because tier names have no mechanical
     resolution at dispatch time.
   - Step 5 (dispatch): add the instruction to pass the runbook's model ID
     explicitly on the dispatch call (Agent `model` param or the host's
     equivalent), never inheriting the session model, with the cost rationale
     (orchestrator sessions often run a price tier above the implementer intent).
   - Bump the skill's frontmatter `version:` 0.9.0 → 0.10.0 (minor).
2. **`pdlc/skills/sweep/templates/runbook.md`**
   - Lane-entry line gains the model-ID slot:
     `TASK-{{n}} ({{tier}} · model {{model-id}} — {{rubric justification}})`.
   - The "Record the model tier + rubric justification on each board task at
     dispatch" line extends to include the model ID.
3. **Release plumbing:** `node scripts/sync-version.mjs 0.41.0` (next free over
   main's 0.40.0 at authoring; take the next free number if main moved).
4. **Wiki re-verify (same PR):** `docs/wiki/pdlc-sweep.md` sources are exactly the
   two edited files → NEEDS-REVIEW: re-verify its prose against the diff, amend
   (dispatch description gains the pinned-model clause), re-pin to the branch
   commit carrying the doctrine; regenerate CAPSULES.md if `description:` changes.
5. **Gates before PR:** `node --test`, `node scripts/check-docs.mjs`, wiki
   freshness gate, `node scripts/check-version-bump.mjs`.

Constitution note: host has no `.specify/`; hand-authored spec per recorded
precedent (runbook, Per-PR gates).
