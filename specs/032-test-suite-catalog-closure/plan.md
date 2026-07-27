# 032-test-suite-catalog-closure — plan

1. Enumerate `test/*.test.mjs` in the worktree (execution-time set); diff against the
   catalog's `sources:`; record count + missing files in board notes.
2. Read each missing test file and write its one-bullet summary in the house style
   (what the file pins down, not how).
3. Split the catalog summary-style: pick the natural seam, create the sibling note
   (name it as the seam suggests, e.g. `test-suite-catalog-plugins`), move bullets +
   their sources accordingly, cross-link with `[[...]]`, keep each body ≤8000 chars
   with headroom (~7500 target so the next added test doesn't immediately re-split).
4. `INDEX.md`: add the new note's row next to the existing catalog row. Regenerate
   `CAPSULES.md` (descriptions changed/added) with
   `node grounding-wiki/scripts/capsules.mjs . docs/wiki`.
5. Pin both parts honestly: commit the content, then re-pin each note to the covering
   commit; `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` green.
6. Gates: node --test (pre-commit), check-docs.mjs, freshness. NO version bump
   (wiki-only); verify check-version-bump reports no bump required.
7. Board finalized (ACs checked, Done, final summary); PR (reason to approve: the
   corpus's coverage-tracking contract closes — invisible test drift ends); merge;
   re-ground; runbook close (this is the sweep's last task).
