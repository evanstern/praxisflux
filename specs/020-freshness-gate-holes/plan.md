# 020-freshness-gate-holes — plan

1. Read `grounding-wiki/gates/freshness.mjs` (parseSourcesBlock, the per-note git-log
   loop) and `grounding-wiki/gates/capsules.mjs` (header render + byte-compare), plus
   `lib/markdown.mjs` parseFrontmatter for the sanctioned frontmatter dialect.
2. R1: in the per-note check, `existsSync` each resolved source path first; a missing
   path is a blocking problem naming note + path. Wire it as a finding, not a warn.
3. R2: extend sources parsing to accept the inline-array form — prefer delegating to /
   aligning with parseFrontmatter so both dialects share one truth. A note with inline
   sources must then staleness-check exactly like a block-list note.
4. R3: normalize corpusDir (relative to root, no trailing slash) before embedding in
   the CAPSULES header and before the regenerate-and-compare; confirm regenerating
   with `/abs/path/docs/wiki/` and `docs/wiki` produce byte-identical files. Handle
   pre-fix headers without false-blocking (regeneration guidance, not hand-edit
   accusation).
5. R4: regression tests in the wiki-gates test file: missing-source fixture blocks;
   inline-array fixture staleness-checks; corpusDir spelling variants compare equal.
6. Versions: bump edited skill version(s) + `node scripts/sync-version.mjs <next>`;
   wiki re-verify + re-pin `grounding-wiki-plugin` (+ lockstep stales); CAPSULES regen
   if descriptions changed.
7. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
