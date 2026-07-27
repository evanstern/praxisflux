# 027-scripts-template-hygiene — plan

1. Read the touched surfaces: the five `*/hooks/hooks.json`, `scripts/new-plugin.mjs`
   (scaffold template + header contract), `scripts/build.mjs` (dist clean + argv
   parse), `scripts/check-version-bump.mjs` (frontmatterVersion/semver path),
   `scripts/check-docs.mjs` (count-claim census), `.claude/settings.json` (the
   correctly-quoted precedent), and the relevant test files (gate-shim, new-plugin,
   version-bump, build if present).
2. R1: quote the expansion in all five hooks.json + the scaffold; run the gate-shim
   and install-path e2e tests (they exercise the hook command line).
3. R2: build.mjs — scope the clean to the named target's dist dir when --plugin is
   given (full clean only for full builds); validate argv (missing value → usage,
   exit nonzero). Test: --plugin rebuild leaves sibling dist dirs + dist/npm intact;
   bare --plugin prints usage.
4. R3: new-plugin.mjs — update count-claim prose as part of scaffolding (reuse
   check-docs' census helpers if exported, else a targeted number-word/digit rewrite
   of "<N> plugins" claims in README.md), keeping the header contract true; add a
   count claim to the fixture README and assert scaffold→check-docs green.
5. R4: check-version-bump.mjs — a non-semver base skill version becomes a named
   failure ("<skill> base version <v> is not semver — fix the frontmatter"), never a
   skip; test both directions (non-semver base fails; semver base + valid bump
   passes unchanged).
6. Versions: `node scripts/sync-version.mjs <next free>` (verify via git tag -l;
   expect 0.36.0). No skill version bumps unless a SKILL.md changes.
7. Wiki re-ground: re-verify + re-pin build-and-release, release-pipeline,
   skill-patterns, gates-convention (+ whichever notes list hooks.json files as
   sources — check with the freshness gate); classify lockstep stales per the honest
   plan loop; CAPSULES regen if descriptions change. NOTE: build-and-release.md sits
   at 7999/8000 chars — if additions are needed, a summary-style split may be due
   (sanctioned by corpus-spec; keep it minimal).
8. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
