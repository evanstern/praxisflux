# 017-plant-name-override — plan

1. Read plant.mjs post-TASK-53 (name derivation site, sentinel/drift semantics) + tests.
2. R1: --name flag; worktree-aware derivation (gitdir: parse → primary basename);
   fallback basename; tests incl. the worktree round-trip (plant in worktree, --check
   from primary = unchanged).
3. R2: SKILL.md documents flag + derivation. R3: versions + wiki re-pin.
4. Orchestrator: finalize, PR, serial merge; sweep close after 56/55.
