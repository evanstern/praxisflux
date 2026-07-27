# 024-gate-exit-contracts — plan

1. Read `scripts/run-gates.mjs` (arg parsing, the names.map execution inside the
   try/catch, exit-code paths), `docs/consuming-gates.md` (the 0/1/2 contract prose),
   `scripts/stop-docs.mjs` (repo derivation + root comparison), and
   `lib/gate-runner.mjs` (resolveRoots catch vs check catch).
2. R1: restructure run-gates so usage validation (unknown/empty gate names, root
   checks) completes inside the usage try/catch, and gate execution happens outside
   it — a throwing gate is caught by a separate handler that reports the gate name +
   error and exits 1. Confirm consuming-gates.md's wording still describes behavior;
   amend minimally if the crash case needs naming.
3. R2: stop-docs — realpath both `repo` and `startDir` (existing paths only; fall
   back gracefully when startDir doesn't exist), compare with `=== repo ||
   startsWith(repo + path.sep)`.
4. R3: gate-runner — replace `catch { roots = []; }` with the blocking-problem shape
   used for a crashing check (problem naming the gate + error, so the Stop hook
   blocks loudly instead of no-opping).
5. Regression tests: CLI run with an injected throwing gate exits 1 (not 2) — extend
   the run-gates test file's fixture registry hook or drive via a corrupted fixture;
   stop-docs comparison unit (symlinked launch matches, `praxis-anything` sibling
   does not); gate-runner resolveRoots-throw surfaces a problem.
6. Versions: `node scripts/sync-version.mjs <next>` (released surface: scripts/ +
   lib/). Wiki re-verify + re-pin `gate-runner`, `gates-consumption-surface`,
   `test-suite` (+ lockstep stales); CAPSULES if descriptions changed.
7. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
