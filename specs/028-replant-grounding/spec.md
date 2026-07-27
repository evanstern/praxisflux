# 028-replant-grounding — the repo's own planted block must say what ships

Board: TASK-67 · Direction: follow-up flagged by TASK-60 (PR #89) during the
downstream-bugfix sweep (`docs/design/downstream-bugfix-runbook.md`, close row);
carding approved by the operator 2026-07-27.

## The staleness

TASK-60 corrected `pdlc/templates/CLAUDE.md`'s Gates rule to ship-reality
(spec-bridge / educate / research / reorient / team-review ship Stop hooks;
grounding-wiki's freshness gate is check scripts/CI, not a hook; build /
codebase-to-course / pdlc ship none) and bumped bootstrap to 0.6.0 — but re-planting
consuming projects is `pdlc:bootstrap`'s job and was out of that task's scope. This
repo's own root `CLAUDE.md` planted block therefore still tells sessions "Plugins ship
Stop hooks that enforce this" — a gate claim nothing installs for grounding-wiki.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — this repo's CLAUDE.md planted block matches the bootstrap 0.6.0 template
render: run the plant in check mode first, then re-plant so the check is clean and the
`.pdlc` sentinel advances to the 0.6.0 template state.

R2 (AC #2) — hand edits inside the block are deliberate (operator-established rule):
diff the current block against the OLD template render first; anything that is a hand
edit (not template-version drift) is preserved — relocated outside the block if the
replant would clobber it. `--force` is used only for confirmed template-version drift.

R3 (AC #3) — `check-docs.mjs` and the wiki freshness gate stay green; re-pin
`docs/wiki/pdlc-plugin.md` (or whichever notes list the plant artifacts/CLAUDE.md as
sources) only if the diff actually stales them.

## Non-goals

- Downstream hosts (promptworld, coda, hermes-praxis) — same refresh, their repos,
  their sessions; noted in the final summary.
- Any template content change (TASK-60 already shipped it) or version bump
  (CLAUDE.md and .pdlc are not released surface).
