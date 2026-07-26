# 007-team-review-self-review-gate — plan

1. Read team-review/scripts/run.mjs (begin/finish), team-review/gates/review.mjs
   (porcelain comparison), and the existing tests (run lifecycle, stop hook, checkReview).
2. R1: make .handoff/ residue invisible to the read-only check (ignore-in-comparison
   and/or snapshot-after-write); verify finish path too.
3. R2: self-review gitignore notice (WARN default; record the decision).
4. R3: regression test per the AC's three assertions.
5. R4: versions (team-review skill + marketplace 0.16.0); wiki re-pin
   team-review-plugin note two-step; CAPSULES.md regen if description changes.
6. Gates green; board finalize; PR; serial merge (orchestrator decides course
   obligation at merge time).
