# 041-pdlc-enumeration-drift — plan

**Constitution:** none ratified in this repo — planning against the grounding docs
(docs/principles.md, docs/releasing.md, docs/wiki/overview.md, docs/wiki/pdlc-plugin.md)
per sweep doctrine's absent-constitution rule.

## Approach

One consistency pass over five surfaces, then a re-plant and a wiki re-verification.

1. **Template first (R1):** amend the pdlc bullet in `pdlc/templates/CLAUDE.md` to name
   bootstrap, sweep, AND refactor-triage with one-line roles, matching pdlc/README.md's
   "Three skills" framing.
2. **Install surface (R2):** `pdlc/.claude-plugin/plugin.json` description names the
   third skill; keywords gain `triage`/`debt`. Note: `.claude-plugin/marketplace.json`
   is GENERATED — regenerate via the repo's marketplace script (`node
   scripts/gen-marketplace.mjs` or as `scripts/` names it; the pre-commit hook checks
   sync), never hand-edit the mirror.
3. **Root README (R3):** the pdlc role cell gains all three verbs at the same altitude
   as sibling rows; record the style decision (role cells enumerate entry skills,
   one clause each) as a line in this spec dir's spec.md §R3 or the PR body.
4. **Re-plant (R4a):** run pdlc:bootstrap's update path against this repo so the
   planted block header stamps the current version. **Caution (standing operator
   convention):** the existing block may carry deliberate hand edits — diff the block
   against the old template render first; relocate any hand edits outside the block or
   fold them intentionally; never clobber silently.
5. **Wiki (R4b):** `docs/wiki/overview.md` is NEEDS-REVIEW by construction (its prose
   is known-wrong about pdlc's shape): amend the pdlc sentences against the shipped
   reality, then re-pin; regenerate CAPSULES.md if its description changes.
   `docs/wiki/pdlc-plugin.md` already enumerates three skills (verify, likely
   RE-PIN-ONLY or untouched). Lockstep stamps → classify siblings.
6. **Release (R5):** pdlc's plugin surface changed → marketplace bump via
   `node scripts/sync-version.mjs <next-free>` at merge-readiness. The bootstrap
   skill's `version:` bumps if its planted template changed (it did — the template is
   the bootstrap skill's surface).
7. **Gates:** node --test (plant tests cover the template), check-docs (README/CLAUDE
   sync check will exercise the re-plant), freshness, version-bump — green in
   worktree, re-run after every history move.

## Risks

- TASK-85 lands on the same template file next — keep the pdlc-bullet hunk tight.
- The re-plant touches this repo's CLAUDE.md, which check-docs pins against README —
  run check-docs after the re-plant, not just at the end.
