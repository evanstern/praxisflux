# 022-educate-check-convergence — plan

1. Read `educate/scripts/wiki.mjs` (single-topic check/sync branches, topicVaults),
   `educate/gates/dod.mjs` (decksStandardForEveryLesson + isDelegated),
   `educate/templates/CLAUDE.md` (the two literal ${CLAUDE_PLUGIN_ROOT} command
   blocks), `educate/skills/start/SKILL.md` (plant instructions), and
   `lib/template.mjs` (the render helper start could use).
2. R1: guard the named-topic --check with the same vault-count test syncTopicWiki
   uses; vault-less → distinct "no vaults" verdict, exit 0, message consistent with
   sync's skipped. Keep --all --check behavior unchanged.
3. R2: dod.mjs — treat decksStandardForEveryLesson with the same array tolerance as
   isDelegated (empty array ⇒ not required), preserving current truthy/object
   behavior.
4. R3: rewrite the planted command blocks so a user project can run them as written —
   plant-time resolution of the plugin root (educate's start knows its own root) or an
   installed-context-valid invocation; verify against the install-path e2e shape.
5. R4: start SKILL.md instructs placeholder substitution (or switches the copy to a
   template.mjs render), so {{PROJECT_NAME}} never survives a plant.
6. Tests: vault-less single-topic check converges (exit 0 + verdict); dod empty-array
   fixture; template plant leaves no unresolved placeholder/undefined-var commands.
7. Versions: educate skill bump(s) + `node scripts/sync-version.mjs <next>`; wiki
   re-verify + re-pin `educate-plugin` (+ lockstep stales); CAPSULES if description
   changed.
8. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
