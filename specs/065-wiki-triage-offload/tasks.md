# 065 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases. Push after every
phase's commit. Run the suite as bare `node --test`.

## Phase 1 — The triage-offload script and its tests

- [x] Add `grounding-wiki/scripts/triage-offload.mjs`: routes `planFreshness` REVIEW
      entries through `offload()` with the closed-enum + deciding_path schema; post-check
      that deciding_path appears in the entry's diff file list; conservative-bias prompt
      (uncertain → needs-review); JSON routing output; writes nothing; exit 0 always;
      unconfigured seam = every note falls back (byte-identical routing to today)
- [x] Add `test/triage-offload.test.mjs`: valid route honored; path-not-in-diff fallback;
      prose/wrong-enum fallback; no-config all-fallback; script writes nothing — all
      against stubs, no live model
- [x] Full suite green (`node --test`)
- [x] Commit and push

## Phase 2 — Skill wiring, versions, wiki

- [x] Wire the opt-in step into `grounding-wiki/skills/wiki-update/SKILL.md` (preamble to
      Work step 2 + the Hard rule's third-sanctioned-path sentence), bump the skill's
      `version:` to 0.3.0
- [x] Bump versions per `docs/releasing.md` (marketplace + plugin lockstep, 0.63.3)
- [x] Honest re-pin pass: amend `grounding-wiki-plugin` (offload step) and
      `test-suite-catalog` (new test file); classify version-churn staleness per diff;
      regenerate CAPSULES.md if any description changed
- [x] `node scripts/check-docs.mjs`, `gen-marketplace --check`, `sync-version --check`,
      freshness gate all green
- [x] Commit and push

## Phase 3 — The measurement (endpoint required)

- [x] Preflight: `curl http://localhost:11434/api/tags` answers and lists
      `deepseek-r1:latest`. If unreachable: STOP this phase, leave its boxes unticked,
      note the park on the board task, surface to the operator (runbook checkpoint 2
      ruling) — never fabricate a measurement
- [x] Reconstruct a REVIEW-heavy staleness window on a scratch clone/worktree (the
      #141/#142 version-bump window) and run seam-off (Claude classifies in-session —
      ground truth) and seam-on (`triage-offload.mjs` vs Ollama `deepseek-r1:latest`)
      over identical inputs
- [x] Write `docs/design/triage-offload-measurement.md`: tokens, wall-clock, fallback
      rate, misroute rate by direction, and an explicit second-consumer verdict
- [x] Commit and push
