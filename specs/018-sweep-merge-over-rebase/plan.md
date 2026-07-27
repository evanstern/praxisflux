# 018-sweep-merge-over-rebase — plan

1. Re-read the sweep doctrine sites: SKILL.md Execute step 7 + "Concurrency doctrine"
   section; templates/runbook.md "Concurrency & conflict doctrine" section. Inventory
   every sentence that assumes rebase-only reconcile (step 7, the "on conflict" bullet,
   "two hotspot-heavy PRs", "sibling sessions rebase main", the runbook's mirror
   bullets, the merge-drift `pr` "after every rebase" phrasing).
2. R1: rewrite doctrine as a pin-carrying / pin-free split — merge origin/main into
   pin-carrying branches, re-pin conflicts to the merge commit, name
   squash/rebase/force-push as the three pin-breaking moves; keep rebase for pin-free
   branches. Update every dependent sentence from step 1's inventory, in both files.
3. R2: prescribe the freshness probe directly after every history move, unconditional
   (not gated on docs/wiki/ having changed), in both files.
4. R3: sweep SKILL.md version 0.5.0 → 0.6.0; `node scripts/sync-version.mjs 0.27.0`;
   wiki-update re-pin pdlc-plugin (+ lockstep stales from sync-version); CAPSULES only
   if the note description changes.
5. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board finalized;
   PR.
