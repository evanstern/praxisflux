# 026-handoff-seam-ownership — plan

1. Read the seam end to end: `educate/skills/lesson/SKILL.md` (handoff + return
   sections), `build/skills/implement/SKILL.md`, `educate/gates/dod.mjs`
   (handoff.returned demand + loose-file artifact derivation),
   `educate/templates/CLAUDE.md` (post-TASK-62 render-planted version),
   `lib/handoff.mjs`, `docs/handoff-protocol.md` (root canonical), and
   `scripts/sync-shared.mjs` + existing stamped-region precedent.
2. R1: decide the owner. Default analysis: build's implement skill already writes the
   `.handoff/` response in the lesson project's transport — it has `progress.json` in
   reach and is the actor who KNOWS the build returned; educate's lesson skill is the
   actor who folds findings in. Choose one (leading candidate: build instructs the
   `progress.json` write as part of "return the handoff" — text-only, no machinery,
   skill-only-compatible; educate's SKILL then stops claiming the other side does it
   if the choice goes the other way). Record rationale in spec.md's R1 section.
3. R2: make the doctrine `.handoff/`-only everywhere — remove loose HANDOFF.md /
   POST_BUILD_HANDOFF.md as lifecycle artifacts from the lesson SKILL and template;
   change `dod.mjs`'s artifact derivation off the loose filenames (derive from
   progress.json / lesson dir state instead); keep messaging consistent.
4. R3: resolve the protocol refs — stamp a shared-region copy of the protocol under
   both plugin roots per sync-shared conventions (or rewrite refs to an
   install-context-valid target); wire the stamp check into the existing drift test.
5. R4: delegated round-trip test: fixture lesson at spec-d with a pending handoff →
   simulate build's return exactly as its SKILL instructs (transport response + the
   R1-assigned progress.json write) → educate DoD gate passes at built; regression:
   without the R1 write the gate still blocks (the old hole stays a hole if the
   instruction is skipped).
6. Versions: bump edited SKILL versions (lesson, implement); `node
   scripts/sync-version.mjs <next free>` (verify against git tag -l; expect 0.31.0+).
7. Wiki re-ground: educate-plugin, build-plugin, handoff-protocol notes re-verified
   against the diff, amended, re-pinned; lockstep stales classified per the honest
   plan loop; CAPSULES regen if descriptions change.
8. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
