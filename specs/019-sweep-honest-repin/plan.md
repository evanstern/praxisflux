# 019-sweep-honest-repin — plan

1. Inventory every re-pin instruction in `pdlc/skills/sweep/SKILL.md` and
   `pdlc/skills/sweep/templates/runbook.md`: step 7's reconcile text, the "Reconcile by
   what the branch carries" doctrine bullet, and any dependent sentence that says or
   implies "re-pin to the merge commit" without a read-the-diff requirement.
2. R1: rewrite those sites to route through the wiki-update plan loop — classify each
   stale/conflicted pin against the main-side diff over the note's sources:
   RE-PIN-ONLY vs NEEDS-REVIEW (re-verify prose first). Keep the merge commit as the
   re-pin target; remove it as the justification.
3. R2: sweep both files for any remaining bump-without-reading text; add the
   downstream-host paragraph (hosts that inherited the TASK-57 convention apply the
   same classify-then-pin procedure).
4. R3: bump sweep SKILL.md `version:`; `node scripts/sync-version.mjs <next>`;
   re-verify + re-pin `docs/wiki/pdlc-sweep.md`; CAPSULES regen if the description
   changed.
5. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board finalized;
   PR.
