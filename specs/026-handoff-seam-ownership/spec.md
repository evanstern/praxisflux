# 026-handoff-seam-ownership — the evidence the gate demands must have an owner

Board: TASK-63 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane D, second — works on the post-TASK-62
educate text at main ≥ 649adf8).

## The failures

1. **Nobody owns `handoff.returned`.** `educate/skills/lesson/SKILL.md` asserts the
   build plugin sets `handoff.returned=true` and status `built`, but
   `build/skills/implement/SKILL.md` contains no instruction to touch `progress.json` —
   it only writes the `.handoff/` response. A delegated build run in its own session
   therefore leaves the lesson at `spec-d` with `handoff.returned` unset, and
   `educate/gates/dod.mjs` blocks any status ≥ `built` forever.
2. **Loose-file doctrine contradictions.** The lesson SKILL names loose `HANDOFF.md` /
   `POST_BUILD_HANDOFF.md` lifecycle artifacts in one place while forbidding exactly
   those loose files in another; `educate/templates/CLAUDE.md` carries the same
   internal contradiction; and `educate/gates/dod.mjs` still derives
   `artifacts.handoff/postBuild` from those loose filenames on disk, blessing the
   drift.
3. **Dangling protocol refs.** `build/skills/implement/SKILL.md` and the lesson SKILL
   point at `docs/handoff-protocol.md`, which exists only at the praxisflux repo root —
   outside what the marketplace serves — so from a user project the pointer resolves
   to nothing.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — exactly ONE side of the seam owns the `progress.json` write
(`handoff.returned` + status), and that side's skill instructs it explicitly. The
choice is implementation judgment bounded by: build is skill-only BY DESIGN (no gates,
scripts, or hooks — the enforcement lives educate-side), and the owner must be a
session that actually has the lesson's `progress.json` in reach at return time. Record
the choice and rationale in the spec/PR. **Checkpoint: escalate to the operator only
if the chosen owner would require machinery that contradicts build's skill-only
doctrine.**

R2 (AC #2) — handoff artifact doctrine is `.handoff/`-only and internally consistent
across the lesson SKILL, the planted template, and `dod.mjs`'s artifact derivation:
either the loose-file names disappear from doctrine AND derivation (durable evidence
lives in `progress.json` + lesson files), or the loose files are re-legitimized
everywhere — one story, no contradiction. Prefer `.handoff/`-only per the repo's
handoff-protocol principle (transport gitignored, evidence in tracked state).

R3 (AC #3) — handoff-protocol doc references resolve from an installed plugin
context: ship the protocol (or a faithful pointer target) under the plugin roots the
marketplace serves, or rewrite the references to something that exists at install
time. `docs/handoff-protocol.md` at repo root stays the canonical source — avoid
divergence (a stamped copy per `scripts/sync-shared.mjs` shared-region conventions is
the paved road; check how lib/ sharing is stamped).

R4 (AC #4) — a delegated-build round trip is covered by a test or scripted fixture:
educate hands off → build returns (writing what R1 assigns it) → educate's DoD gate
passes at `built`. Extend the existing handoff-return-leg test surface.

Versions per `docs/releasing.md`: edited SKILL.md `version:` bumps (lesson and/or
implement as touched) + marketplace `sync-version` next free. Wiki: re-verify + re-pin
`docs/wiki/educate-plugin.md`, `docs/wiki/build-plugin.md`,
`docs/wiki/handoff-protocol.md` (+ lockstep stales); CAPSULES regen if descriptions
change.

## Non-goals

- TASK-62's educate fixes (merged — build on them).
- Changing the `.handoff/` transport itself (`lib/handoff.mjs`) — the seam's contract,
  not the transport, is broken.
- Giving build gates/scripts/hooks (its skill-only design is a settled decision — the
  capsule records it as the pdlc precedent).
