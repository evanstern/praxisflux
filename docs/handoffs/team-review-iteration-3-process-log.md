# Process log — team-review run on /Users/evanstern/Claude/Code/praxis

## Run record

- Skill: `/Users/evanstern/.claude/skills/team-review/SKILL.md` (v0.3.0), followed phase by phase.
- Run id: `praxis-2026-07-23-04-51-15` (target git @ e2a99b9)
- Report path: `/Users/evanstern/.claude/skills/team-review-workspace/iteration-3/eval-1-praxis-fresh-eyes/with_skill/outputs/review.md`
- Gate outcome: **finish PASSED** — "report proven"; all sections present, citations resolve,
  target byte-for-byte untouched since `begin`.

## Helper scripts run

1. `scripts/run.mjs begin /Users/evanstern/Claude/Code/praxis --report <outputs>/review.md`
   → opened run `praxis-2026-07-23-04-51-15`.
2. `scripts/orient.mjs <target>` → 79 source files / 15,354 lines (19 test files / 1,927 lines);
   flagged that ~10k lines are `docs/courses` HTML, so effective code ≈ 5k lines → sized team at
   2 seniors + 2 scouts per the skill's table.
3. `scripts/run.mjs finish praxis-2026-07-23-04-51-15` → passed on first attempt.

## Phases

- **Precondition gate:** target confirmed readable, whole-repo ask, lens captured from the user's
  stated goal (chassis readiness for a new team-review plugin) — no inference needed.
- **Phase 1 (lead orientation):** ran orient.mjs; personally read `docs/skill-patterns.md`,
  `scripts/sync-shared.mjs`, `.claude-plugin/marketplace.json`, and the README — formed the
  independent thesis (paved road built for artifact-producing plugins; prose-only checklist;
  registry duplication) before dispatching. Announced findings + team before dispatch.
- **Phase 2 (fan-out):** dispatch-mode rule honored — running as a subagent, so teammates were
  launched as four concurrent `claude -p` processes foreground-waited in a single shell call
  (`& ... & wait`, one 10-minute-capped Bash call), not background Agent children:
  - **Senior A** — `sonnet`, tools `Read,Glob,Grep` — beat: shared chassis (`lib/`), repo scripts,
    dist packaging, tests; readiness for an 8th plugin. Returned ~1,350 words.
  - **Senior B** — `sonnet`, same tools — beat: plugin corpus as ecosystem (educate, spec-bridge,
    pdlc deep; rest skimmed), docs-vs-code verification, best-template question.
  - **Scout C** — `haiku` — beat: user-facing surface (README, manifests, SKILL.mds, hooks wiring).
  - **Scout D** — `haiku` — beat: tests, hygiene, repo weight, CI/release machinery.
  All four exited rc=0; total wall time ≈ 10 minutes (senior B was last, ~9 min).
- **Phase 3 (relay/spot-check):** digests recorded per report. Five disputed claims spot-checked
  against the repo by the lead (see below).
- **Phase 4 (synthesis):** selective consolidated report written to the run's report path in the
  skill's required structure; refuted claims noted in-report where a reader might otherwise act
  on them (dist/, description drift).

## Anomalies and what went wrong

1. **Senior B recursively invoked the team-review skill itself.** The skill is installed globally
   in `~/.claude/skills`, so the headless `claude -p` teammate matched its own prompt ("architecture
   review") to the skill and ran a full nested engagement — its own run record under the
   scratchpad's `.handoff/team-review/runs/`, its own sub-team, its own gate — writing a 13KB
   consolidated report to a scratchpad file and printing only a TL;DR to stdout. Notably it wrote
   files despite `--allowedTools "Read,Glob,Grep"` (allowedTools pre-approves rather than
   restricts in this setup). Impact: none on the target (my finish gate independently confirmed
   the repo untouched); the nested report covered exactly the requested beat and was used as
   Senior B's input after verification. Lesson for the skill: teammate prompts should say
   "do NOT invoke the team-review skill; report inline to stdout".
2. **Stale files from a prior attempt** (senior-report.md, scout-report.md, ~00:33) were present
   in the scratchpad; avoided by using fresh per-agent filenames and ignoring the old ones.
3. **Word-count alarm** on Senior B's 187-word stdout triggered the investigation that uncovered
   anomaly 1 — the real report was on disk.

## Spot-check verdicts (lead vs. agents)

- **Refuted (Scout D):** "grounding-wiki Stop hooks already registered" — false; grounding-wiki
  has no `hooks/` and no `gate.sh` (Senior B was right). Carried into the report as an
  improvement item.
- **Refuted (Scout C):** codebase-to-course description drift between marketplace.json and
  plugin.json — false; strings are byte-identical.
- **Refuted (Scout C):** `dist/` committed as version-control noise — false; `dist/` is
  gitignored and untracked.
- **Refuted (Scout C, partial):** "skill versioning has no gate" — `check-version-bump.mjs`
  enforces per-skill semver bumps on PRs (Scout D was right).
- **Confirmed (Senior A):** `gen-marketplace.mjs` only re-syncs already-registered entries
  (`.map()` over `mp.plugins`) and silently ignores an unregistered plugin dir — the
  skill-patterns checklist's "or run gen-marketplace.mjs" phrasing is a doc/code mismatch.
  Promoted to improvement #1 in the report.
