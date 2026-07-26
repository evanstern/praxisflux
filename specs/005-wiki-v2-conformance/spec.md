# 005-wiki-v2-conformance — docs/wiki adopts the corpus-spec v2 tiers

Board: TASK-50 · Sweep: `docs/design/wiki-token-economy-runbook.md` (Lane 3) ·
Contract: `docs/corpus-spec.md` v2 · Tooling: TASK-49's `grounding-wiki/gates/capsules.mjs`
+ `grounding-wiki/scripts/capsules.mjs` (merged in PR #59 — read both first).

## Problem

The repo's own grounding wiki (`docs/wiki/`, 25 notes) predates spec v2: several
`description:` capsules exceed the 500-char budget, `build-and-release.md` is 11,742
chars (3,742 over the body budget — the freshness gate's current warn), and no
`CAPSULES.md` exists, so enforcement stays warn-only. Adoption is the point of this
task: once `CAPSULES.md` lands, the gate turns hard — so conformance and adoption must
land together, green.

## Requirements

### R1 — Capsule conformance

Every `docs/wiki/*.md` note description ≤500 characters and **written for routing**
(what the note covers, when to load it). Measure all 25 first; rewrite the over-budget
ones (do not blindly truncate — re-read the note body and write an honest capsule).
A capsule rewrite is a content change to the note: re-pin honestly (two-step) since
`description` lives in the note but pins govern `sources:` — pins only need bumping if
`sources:` files changed, which they don't for a pure capsule rewrite; no re-pin needed
for capsule-only edits. (Pins re-verify content against sources; the capsule is ours.)

### R2 — Body-budget conformance (split build-and-release.md)

- `build-and-release.md` splits **summary-style** per v2: move coherent subtopics into
  new child notes (each ≥1,500 chars of substance; judged by content, not arithmetic —
  likely 1–2 children, e.g. the npm-package/composite-action consumption surface or
  the release pipeline mechanics). The parent keeps a one-paragraph summary + wikilink
  per child; children link back; each child carries its own correct `sources:` subset
  and a fresh `verified_against` (verify the claims you move!), `kind:`, and a routing
  capsule.
- `INDEX.md` gains one line per child under the right section (additive only).
- Checkpoint bound (operator-approved): if conformance turns out to require splitting
  more than ~3 notes or a non-additive INDEX restructure, STOP and report — don't
  proceed.
- Re-measure every other note; any within budget stays untouched.

### R3 — Adoption: generate CAPSULES.md

- `node grounding-wiki/scripts/capsules.mjs <worktree-root> docs/wiki` generates
  `docs/wiki/CAPSULES.md` as the LAST content step (its header pins the corpus commit;
  regenerate after any subsequent note edit — the gate's regenerate-and-compare will
  catch drift). After this lands, the freshness gate enforces budgets hard: the whole
  corpus must be conformant in the same PR.

### R4 — Prove

- `node scripts/run-gates.mjs --gates wiki-freshness` — green with ZERO v2-budget
  warnings (adopted + conformant).
- `node --test`, `node scripts/check-docs.mjs`, course gate on `docs/courses/TASK-50/`.
- Docs-only diff (docs/wiki, docs/courses, backlog, specs): NO version bumps.

## Non-goals

- No tooling changes (grounding-wiki/, lib/, scripts/ are off-limits).
- No corpus-spec edits; a budget that can't be met honestly → STOP and report.
- No runbook edits (docs/design/ is the orchestrator's).

## Acceptance

Maps to TASK-50's board ACs: #1 capsules within budget (R1), #2 no over-cap bodies +
split done (R2), #3 CAPSULES.md generated + INDEX updated (R3), #4 gates green (R4).
