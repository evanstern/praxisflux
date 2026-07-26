# 012-enforcement-honesty — advisory-by-design gates, README truth, per-plugin enforcement surface

Board: TASK-40 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 3, last of the
README-touchers by design — 37/41/43 have merged; the story you document is final) ·
Direction: owner decision 2026-07-23 (team-review follow-up, in the task description).

## Problem

Local Stop gates are advisory/opt-in **by design**, but the docs read as if enforcement
arrives on install. The delivered tenet is: **gates make dishonest status expensive
locally and impossible in CI.** Also countable drift: the README intro/status text says
seven plugins (and still calls build "a scaffold" in the status blockquote TASK-37
deliberately left), while the catalog now registers nine; and `gate.sh` exits 0 in full
silence when `node` is missing.

## Requirements

### R1 — framing (AC #1)

README.md, CLAUDE.md (the hand-written orientation section — do NOT edit inside the
`pdlc:grounding` marked block), and docs/consuming-gates.md state plainly: local Stop
hooks are advisory/opt-in; CI (the composite action / @praxisflux/gates) is
authoritative; the tenet is dishonest-status-expensive-locally-impossible-in-CI.

### R2 — per-plugin enforcement column (AC #2)

The README plugin table gains an enforcement column matching each plugin's ACTUAL
wiring — audit every `<plugin>/hooks/` dir before writing a row: Stop-hook enforced
(the four plugins that wire Stop hooks) vs CLI/CI-gate-only (grounding-wiki,
codebase-to-course) vs skill-only/none (build, pdlc if accurate — verify, don't assume,
including this sweep's changes).

### R3 — gate.sh notice (AC #3)

Every shipped `gate.sh` (or the shared template it derives from — find how it's synced;
`scripts/sync-shared.mjs` may own it) emits a ONE-TIME non-blocking stderr notice when
`node` is missing instead of a fully silent exit 0. Non-blocking: still exit 0. One-time:
a cheap sentinel (e.g. a marker file in the hook's temp/state area) so every subsequent
turn isn't spammed. Keep POSIX-sh compatible.

### R4 — mechanical census in check-docs (AC #4)

`scripts/check-docs.mjs` checks the README's plugin count/enumeration against
`.claude-plugin/marketplace.json` (replacing or supplementing the backtick census —
read the current check first), so count drift becomes a gate failure, not a review
finding. Fix the current seven-vs-nine drift (intro + status blockquote) in the same
PR — the new check must pass on the fixed README and fail on the old one (prove via
test fixture, matching the existing check-docs test style).

### R5 — releasing + grounding

- Released surface: scripts/ + plugin hooks/gate.sh → marketplace
  `scripts/sync-version.mjs 0.20.0` (0.19.0 released). Skill versions only if SKILL.mds
  are edited (they shouldn't be).
- Tests: additive coverage for the census check (pass/fail fixtures) and, if
  practical, the gate.sh notice path (the install-path e2e tests exercise hooks —
  extend only if the existing harness makes it cheap; otherwise record why not).
- Wiki re-pins as the gate demands (expect overview + gates-convention + chassis notes
  whose sources include gate.sh/check-docs, plus lockstep stales); budgets hard;
  CAPSULES regen if descriptions change. No course (per-feature policy).

## Non-goals

Changing any gate's blocking behavior; adding hooks to plugins that ship none; the
docs/design-inputs rename (TASK-38).

## Acceptance

Board ACs #1–#4 map to R1–R4; R5 is hygiene.
