# 039-sweep-doctrine-consistency — plan

**Constitution:** none ratified in this repo — planning against the grounding docs
instead (docs/principles.md, docs/releasing.md, docs/wiki/pdlc-sweep.md,
CLAUDE.md's PDLC block), per sweep doctrine's absent-constitution rule.

## Approach

Two files under edit, seven point fixes. Work in finding order F1→F4, F6, T1/T2 so
each diff hunk maps to one requirement and the reviewer can walk the card's list
against the diff.

1. **Locate by content, not line number** — the card cites SKILL.md line numbers from
   0.13.0; they will drift as edits land. Anchor on the quoted phrases.
2. **F1:** add the dispatch-boundary log-row clause to step 5 (where dispatch happens);
   rewrite step 10's "append one line at merge" to "the closing row update at merge —
   in-flight rows were maintained at each dispatch boundary (step 5)"; confirm the
   template's execution-log preamble states the identical cadence.
3. **F2:** in "What it does NOT do", drop "non-trivial" and route the exception: every
   scoped task gets the cycle, and the only sanctioned skip is the Output gate's
   operator-signed escape line.
4. **F3:** Output gate gains a clause: at sweep end, re-verify every scoped card still
   carries its Spec marker (`spec-bridge` links check) — other sessions move the board
   while branches sit. Template's "Done means" / per-task-artifacts end-check gains the
   matching line (today it scopes itself away from the link line).
5. **F4:** Phase 1 item 2 (tier/model pinning) gains the fallback slot: "record, next
   to the pinned ID, the fallback ID for subscription-unavailability and, at dispatch,
   which model actually served" — citing the 2026-07-31 operator ruling as the field
   case. Template lane-entry placeholder gains the fallback slot.
6. **F6:** copy the "never as a second mechanism" clause into the template's escape-line
   section verbatim-equivalent.
7. **T1/T2:** merge the doubled context-read rationale into one statement in step 5;
   keep the tier-note obligation in Phase 1 item 2 and make step 5 reference it
   ("record tier + model ID + justification on the board task" stays in exactly one
   normative home).
8. **Release:** sweep SKILL.md `version:` 0.13.0 → 0.14.0 (behavior-visible doctrine
   change, minor); `node scripts/sync-version.mjs <next-free>` at merge-readiness
   (0.45.0 if main hasn't moved). Re-verify `docs/wiki/pdlc-sweep.md` against the
   actual diff (NEEDS-REVIEW; capsule/description change → regenerate CAPSULES.md in
   the same slice); lockstep stamps stale ~11 siblings → classify (expect
   RE-PIN-ONLY).
9. **Gates:** `node --test`, `scripts/check-docs.mjs`,
   `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`, version-bump check —
   green in the worktree and re-run after every history move.

## Risks

- Lane A stacks two more edits (TASK-90, TASK-79) onto these files; keep hunks minimal
  so their merges stay clean.
- pdlc-sweep.md body budget: 6,102/8,000 after the TASK-84 split — the additions here
  are small; if budget threatens, history material overflows to pdlc-sweep-history.
