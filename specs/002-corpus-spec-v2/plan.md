# 002-corpus-spec-v2 — plan

1. **Amend `docs/corpus-spec.md`** (single file, prose contract):
   - Retitle to spec v2; add a "v2 additions" changelog block.
   - New section "How consumers load a corpus" (R1) after "Corpus layout".
   - New section "The capsule tier and CAPSULES.md" (R2) — budget, generated-artifact
     semantics, drift discipline.
   - New section "Note size budget and summary-style splits" (R3).
   - Add the `##`-addressability rule to "Note core" (R4).
   - Update layout block to show optional `CAPSULES.md`; update guardrail 4 (R5).
2. **Re-verify + re-pin `docs/wiki/grounded-corpus-spec.md`** against the amended spec
   (content update to describe v2, new `verified_against`) — same PR (R6).
3. **Per-task course** `docs/courses/TASK-48/` per `docs/task-courses.md`, course gate
   green (R6).
4. **Gates:** `node --test`, `node scripts/check-docs.mjs`,
   `node scripts/run-gates.mjs --gates wiki-freshness,course`. Docs-only diff — no
   version bump.
5. PR → serial merge → re-ground (spec-bridge sync, board Done).

Risks: capsule/cap numbers are medium-confidence (analysis) — spec states them as v2
defaults; TASK-49/50 surface pushback through the operator checkpoint, not silent edits.
