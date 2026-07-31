# 040-refactor-triage-hardening — spec

**Board task:** TASK-75 · **Finding source:** refactor-triage run praxis-2026-07-27-16-07-29
(group B; report §improved 2–4); triage record
docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md; evaluation report
docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

## Problem

`pdlc/skills/refactor-triage/SKILL.md` (0.1.0) over-promises and under-specifies on
four seams, all manifested or latent on its first live run:

1. It asserts team-review lands a tracked report at `docs/reviews/` on self-review —
   true only for team-review ≥0.39.0 (copy-on-finish, TASK-70) on the default path;
   older engine versions strand the report in gitignored `.handoff/` (manifested live:
   engine cache 0.36.0, the lead copied manually).
2. It promises "both tracked" (triage record + evaluation report) but the output gate
   only enforces the triage record; inline-degraded mode names no report home.
3. Headless mode has doctrine but no syntax — no policy argument named, only two of
   three mode examples in pdlc/README.md, no headless-vs-operator detection rule.
4. `run-id` is undefined when team-review didn't run (inline-degraded mode).

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1) — tracked-copy check with fallback:** the Evaluate phase states a
  version-independent check — if no tracked copy of the evaluation report landed at
  `docs/reviews/`, copy the proven report there and commit it. No coupling to any
  team-review version.
- **R2 (AC #2) — headless syntax:** a named policy argument for headless mode, a third
  README example showing it, and a stated detection rule (headless vs operator-present).
- **R3 (AC #3) — run-id rule:** run-id = team-review's run id when the engine ran;
  else `<repo>-<ISO-stamp>` minted at triage start (degraded mode). Stated in the
  skill where run-id is introduced.
- **R4 (AC #4) — output gate honesty:** the output gate enforces the evaluation
  report's trackedness too, or the "both tracked" promise is dropped from the skill's
  contract prose.
- **R5 (AC #5) — release mechanics:** refactor-triage skill `version:` 0.1.0 → 0.2.0 +
  marketplace lockstep bump per docs/releasing.md; gates green.

## Non-goals

- TASK-80's last-run-at high-water mark (next in this lane, same file/record surface) —
  do not pre-implement; keep the run-id/record prose it will build on clean.
- No behavior change to team-review itself (its copy-on-finish stays as-is).

## Done means

All five ACs checked on TASK-75; the skill's promises match what its gate enforces on
every path (engine present/absent, operator/headless); PR merged with bumps.
