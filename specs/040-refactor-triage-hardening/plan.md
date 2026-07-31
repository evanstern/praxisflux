# 040-refactor-triage-hardening — plan

**Constitution:** none ratified in this repo — planning against the grounding docs
(docs/principles.md, docs/releasing.md, docs/wiki/pdlc-refactor-triage.md, the pdlc
README) per sweep doctrine's absent-constitution rule.

## Approach

One skill file plus its README examples; four point fixes as skill 0.2.0.

1. **R1 — Evaluate phase, landing check:** replace the version-coupled assertion
   ("team-review lands a tracked report…") with a check-plus-fallback: after the
   engine (or inline pass) finishes, verify a tracked copy exists at
   `docs/reviews/team-review-<run-id>.md`; if not, copy the proven report from the
   transport to that path and commit it in the same slice. Inline-degraded mode names
   the same home.
2. **R2 — headless syntax:** name the policy argument (follow the skill's existing
   arg conventions — e.g. `policy: <accept|reject|defer rules>` passed with the
   invocation), add the third example to pdlc/README.md's mode list, and state the
   detection rule (headless = invoked with a declared policy and no interactive
   operator; operator-present otherwise).
3. **R3 — run-id rule:** one sentence where run-id first appears: engine ran → its
   run id; engine absent → `<repo>-<ISO-stamp>` minted at triage start. Both modes
   key the triage record filename.
4. **R4 — output gate:** extend the gate's checklist to require the evaluation
   report's tracked copy (path above) whenever an evaluation ran — keeping the "both
   tracked" promise honest rather than dropping it (preferred: the promise is the
   skill's value).
5. **Release:** skill `version:` → 0.2.0; `node scripts/sync-version.mjs <next-free>`
   at merge-readiness. Same-PR wiki: `docs/wiki/pdlc-refactor-triage.md` is
   NEEDS-REVIEW (its sources include the skill file) — re-verify prose against the
   diff; description near 499/500 budget: do NOT grow it (TASK-78 trims it later this
   lane); regenerate CAPSULES.md only if the description changes. Lockstep stamps →
   classify siblings (expect RE-PIN-ONLY).
6. **Gates:** node --test, check-docs, freshness, version-bump — green in worktree,
   re-run after every history move.

## Risks

- Lane B stacks TASK-80 (same file, same record surface) next — keep the run-id/record
  prose modular so 80's last-run-at addition lands as an insertion, not a rewrite.
- The wiki note's capsule budget is one adjective from the limit; any description
  change must shrink, not grow.
