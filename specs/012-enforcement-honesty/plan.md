# 012-enforcement-honesty — plan

1. Audit: every <plugin>/hooks/ dir (who wires Stop hooks); how gate.sh ships and
   whether sync-shared.mjs owns it; the current check-docs README census; the exact
   stale count/scaffold sentences.
2. R2 table column from the audit; R1 framing in README/CLAUDE(hand-written part)/
   consuming-gates.
3. R3 gate.sh one-time stderr notice (POSIX, non-blocking, sentinel-deduped) in the
   canonical source + synced copies.
4. R4 census check in check-docs + fixtures; fix the seven-vs-nine drift.
5. R5 versions (0.20.0), wiki re-pins, CAPSULES regen if needed; gates green.
6. Orchestrator: finalize; PR; merge; then tail TASK-38.
