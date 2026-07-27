# 028-replant-grounding — plan

1. In the worktree, run the pdlc plant in check mode against the worktree root to see
   what it reports (drifted vs update-pending; read `.pdlc` for the recorded template
   state and peers).
2. Render the OLD template (the version the sentinel records) and diff it against the
   current block to isolate hand edits from template drift. Also diff OLD render vs
   NEW (0.6.0) render to know exactly what the replant changes.
3. If hand edits exist: relocate them outside the block first (per the standing rule).
   Re-plant with the CLI (force only for confirmed template-version drift); verify the
   sentinel advanced and check mode is clean.
4. Verify the corrected Gates sentence is present in the block and the old overclaim
   is gone; confirm the non-block regions of CLAUDE.md are untouched.
5. Gates: node --test (pre-commit), check-docs.mjs, wiki freshness (re-pin any note
   the diff stales — plant artifacts are sources of pdlc-plugin only if listed).
6. Board finalized; PR (reason to approve: the always-on grounding every session in
   this repo reads changes its enforcement claims); merge; Done.
