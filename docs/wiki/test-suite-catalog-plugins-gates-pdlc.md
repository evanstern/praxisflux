---
name: test-suite-catalog-plugins-gates-pdlc
description: Per-file coverage of pdlc's own gate suites — the plant/tiers surface (test/pdlc.test.mjs, including the planted-block drift gate wired into ci.yml) and the two opt-in PreToolUse hooks (test/root-guard-hook.test.mjs, test/root-guard-scan.test.mjs, test/read-size-gate.test.mjs). Split summary-style from test-suite-catalog-plugins-gates, whose remaining files it still catalogs directly.
kind: pattern
sources:
  - test/pdlc.test.mjs
  - test/root-guard-hook.test.mjs
  - test/root-guard-scan.test.mjs
  - test/read-size-gate.test.mjs
verified_against: 9b410267ee638ee2d16e8dc4aba28e29808ccf54
---

# Test suite — per-file coverage catalog (pdlc's own gates)

Split summary-style out of [[test-suite-catalog-plugins-gates]]: `pdlc.test.mjs` is that
note's single largest and fastest-growing file (specs 047/048/051/054/060/066 have each
added to it), and its sibling hook suites test features `pdlc.test.mjs` itself plants.
One bullet per `test/*.test.mjs` file:

- `test/pdlc.test.mjs` — pdlc's plant surface (`pdlc/scripts/plant.mjs`): plugin
  registration + bootstrap SKILL frontmatter (spec 047); template markers carrying the 101
  principles (`docs/principles.md`); `renderGrounding` token substitution, non-opted peer
  blocks stripped; the model-tier rubric (spec 048) — `## Model tiers` inside the grounding
  markers before peer blocks, the agent-def `model:` pin authoritative, IDs resolved
  against the live harness (`claude-api`) — and its tier **config** surface
  (`pdlc/scripts/tiers.mjs`, TASK-106): open tier map, generated `model:` equal to the
  config, named schema rejections; planting fresh/append/idempotent, peer-change drift,
  `--check` writing nothing and exiting 1 — one drifted/`--force` contract covers the
  CLAUDE.md block and a hand-authored tier def; the `peersOmitted` trace (one stderr notice
  per omitted peer, legacy sentinels readable); the `resolveProjectName` ladder (override >
  recorded > worktree > basename); the `jira` peer (spec 054) — three-member `PEERS` with a
  `backlog`/`jira` mutual-exclusion throw, `pdlc:peer:jira` render/strip via `--peer jira`
  plus its zero-`backlog `-string grep guard, and the unchanged-sentinel-schema check proven
  **differentially** against a baseline plant rather than a hardcoded key list (so it stays
  honest as later specs add non-peer axes); opt-in root-guard planting (spec 051) —
  `--hook root-guard` copies BOTH hook files into `.claude/hooks/` and merges the two
  `PreToolUse` entries into `.claude/settings.json`, idempotent, preserving pre-existing
  hooks, unknown-hook rejection; the refactor-triage skill shape (spec 033/047) —
  `parseFrontmatter` frontmatter plus the full phase skeleton (a gutted phase fails loud),
  phase-content anchors (triage-record path, `board:create`-routed Execute, team-review lens),
  three entry modes + declared-policy headless rule, sweep's Handing off naming
  refactor-triage, and a cross-plugin test that refactor-triage and team-review spell
  `docs/reviews/team-review-<run-id>.md` identically; and **local-only planting mode**
  (spec 060) — `excludeSet({ peers, hooks })`'s always-on lines plus exactly-scoped
  peer/hook additions; `ensureExclude` writing + idempotence, the `.git`-as-worktree-
  pointer-file case (resolves to the real gitdir), and the no-`.git` degradation (never
  throws); `plant --local-only` writing the scoped set and leaving `.gitignore` absent vs.
  tracked mode staying byte-for-byte unchanged; the R3 write-**order** assertion via
  nanosecond mtimes (exclude lands before `CLAUDE.md`/the sentinel — not merely present by
  the time `plant()` returns) plus the companion `git status --porcelain` empty check; the
  `localOnly` sentinel field (absent-tolerant, byte/mtime-stable no-op re-plants, legacy
  sentinels left untouched); and mode-switch drift — its own `modeSwitch` field
  (`none`/`drifted`/`applied`), diagnosable apart from `claudeMd`, an unconfirmed switch
  leaving the sentinel AND `--check` provably unmoved, `--force` as the only path to
  `applied`, proven both directions (tracked→local-only and back) and through the real CLI;
  and the **planted-block drift gate** (spec 066) — the four tests that make `--check`'s
  long-standing exit code *mean* something: a **wiring** assertion that `ci.yml` still runs `plant.mjs --root . --peer backlog --check` (mutation-tested — deleting
  the step fails it), since nothing invoked the check before and that is how this repo ran a
  `v0.57.0` block against a `v0.63.1` marketplace; the drifted/clean pair spawning the real
  CLI (`plantCli`, so fixtures are planted at the *live* version — a `--version`-less CLI
  would otherwise read the stamp alone as drift) and asserting exit 1 vs 0, all four elements
  of the new stderr fix line (`DRIFTED`, `pdlc:bootstrap`, `DIFF`, `--force`, "OUTSIDE the
  markers" — [[gates-convention]]'s half-a-gate rule), and that `--check` neither repairs the
  edited block nor advances the sentinel; the **version-bump-alone** drift (planted 9.9.9,
  checked at 9.9.10 ⇒ `drifted`, sentinel unmoved) that justifies the CI placement over the
  per-commit path; and the **CI-checkout** case — the tracked artifacts copied into a
  randomly-named `.git`-less dir still report the `.pdlc`-recorded `projectName` and exit 0,
  so `actions/checkout`'s renamed directory cannot fire the gate spuriously.
- `test/root-guard-scan.test.mjs` — the quote-state shell scanner (spec 051) as a pure
  function: separators bound only OUTSIDE quotes; single/double, ANSI-C and locale runs,
  escapes, line continuation; the Co-Authored-By trailer → FOUR tokens (message ONE);
  command-position detection; fail-closed on unbalanced input.
- `test/root-guard-hook.test.mjs` — the planted root-guard hook over its `PreToolUse`
  stdin contract (spec 051), every hazard BOTH ways: newline, `)`, `'`, `"`, `;`, `|`,
  backtick each ALLOWED `backlog/`-scoped and still BLOCKED out of scope; heredocs,
  cross-repo jurisdiction, the content false-positive, unparseable-implies-unexecutable,
  the deny set.
- `test/read-size-gate.test.mjs` — the planted read-size-gate hook (spec 064), end-to-end
  spawn per case over its `PreToolUse` stdin contract: over-threshold `pre-read`/`pre-bash`
  deny asserted on the exact current `hookSpecificOutput.permissionDecision` schema path
  with an obsolete-schema negative control (a top-level `decision: block` fixture must NOT
  count as a deny); every exemption (path prefixes, offset/limit, piped/redirected bash,
  `PRAXIS_READ_GATE_OFF=1`); under-threshold allow; config precedence (env over
  `.claude/read-size-gate.json` over the 500-line default).

## Connections

- Parent (and sibling — it keeps its own remaining files directly):
  [[test-suite-catalog-plugins-gates]].
- Grandparent: [[test-suite-catalog-plugins]] — the plugin-half entry point.
- `pdlc.test.mjs` pins the [[pdlc-plugin]] plant surface, including its local-only
  planting mode and [[installer]]'s `ensureExclude`.
