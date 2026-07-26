# 010-bootstrap-dogfood — plan

1. Read pdlc/scripts/plant.mjs + its tests (invocation, peers, markers, idempotence,
   force semantics) and pdlc/skills/bootstrap/SKILL.md; check tracked .handoff residue.
2. R1: gitignore .handoff/ (+ untrack residue if any).
3. R2: plant with backlog peer; before/after CLAUDE.md diff (STOP on any non-append);
   second run proves idempotence; check-docs green; record the absent-Spec-Kit finding.
4. R3: team-review self-review begin → finish from the worktree; record run id + exits.
5. R4: wiki re-pins per gate; gates green; board finalize; PR; serial merge vs TASK-34
   (smaller first — likely this one).
