# 003-wiki-capsules-enforcement — plan

1. Read how the freshness gate ships today (grounding-wiki plugin gates/, lib/ chassis
   modules, how wiki-freshness runs via scripts/run-gates.mjs and the plugin Stop hook).
2. Generator module + CLI (R1): render CAPSULES.md (header w/ generator + commit, INDEX
   order, line + capsule per note). Wire into wiki-build/wiki-update SKILL.md text.
3. Gate extension (R2): adoption keyed on CAPSULES.md presence; budget checks (500-char
   capsule, 8,000-char body, size_budget_exempt downgrade); regenerate-and-compare
   staleness; warn-only when unadopted.
4. Tests (R3): fixtures for adopted/unadopted corpora, exemption, determinism.
5. Versions (R4): wiki-build + wiki-update SKILL.md bumps; sync-version to next free.
6. Grounding (R5): re-pin grounding-wiki-plugin.md note (two-step); per-task course
   docs/courses/TASK-49; all gates green.
7. PR; serial merge vs TASK-51 (smaller first; second re-bumps after rebase).
