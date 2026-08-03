# 049 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Split design and measurement

- [ ] Measure current bodies with the gate's own definition (frontmatter excluded) for
      `pdlc-sweep-history.md` and record the number in this file's Notes section
- [ ] Read `docs/corpus-spec.md`'s summary-style split rule and
      `docs/wiki/test-suite-catalog-plugins.md` + its two children as the in-repo pattern
- [ ] Choose the split point and child names; record the choice and its arithmetic
      (projected body sizes WITH the three new entries included) in the Notes section
- [ ] Confirm `pdlc-sweep-history` is retained as the parent's name, and enumerate every
      inbound `[[pdlc-sweep-history]]` link that must keep resolving
- [ ] Commit the recorded design (spec-dir note only; no wiki edits yet)

## Phase 2 — Perform the split

- [ ] Create the child notes with honest frontmatter — `name`, `description` (≤500 chars),
      `kind`, `sources`, `verified_against`
- [ ] Move existing release entries into the children verbatim; the parent keeps its
      framing paragraph, a release→child index, and the superseded-conventions summary
- [ ] Add reciprocal wikilinks: parent → each child, each child → parent, and
      child ↔ sibling where a release entry references another's content
- [ ] Verify every body ≤8,000 and every capsule ≤500 via the gate
- [ ] Commit the split with no content change to any release entry (a pure move, so the
      backfill diff in Phase 3 is readable)

## Phase 3 — Backfill 0.48.0 / 0.50.0 / 0.51.0

- [ ] Derive the 0.48.0 entry (background-job / no-main-push execution mode) from the
      sweep SKILL.md diff for that release plus
      `docs/design/board-cost-test-runbook.md`; cite the field evidence
- [ ] Derive the 0.50.0 entry (two-track landing reference) from
      `specs/046-two-track-landing-rule/`; cite the field evidence
- [ ] Derive the 0.51.0 entry (hand-authored-specs hatch + gate-softening-requires-
      amendment) from `specs/045-sweep-hand-authored-specs-hatch/`; cite the field
      evidence
- [ ] Confirm `docs/wiki/pdlc-sweep.md:92-97`'s claim is now TRUE — the history corpus
      carries per-release detail through 0.51.0
- [ ] Verify R1's headroom requirement: the parent and the newest child each retain
      ≥1,200 chars of room; if not, revisit the Phase 1 split point
- [ ] Commit the backfill

## Phase 4 — Hub note sources, regeneration, and the zero-warn gate

- [ ] Give `docs/wiki/test-suite-catalog-plugins.md` real sources (preferred) or an
      explicit index-kind marking; record the choice and rationale in the Notes section
- [ ] Regenerate `INDEX.md` and `CAPSULES.md` — never hand-edit
- [ ] Re-pin every note this branch touched to this branch's own commits, only after the
      commit that wrote the prose
- [ ] `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` exits 0 with **zero warns**
- [ ] `node --test` and `node scripts/check-docs.mjs` green
- [ ] Confirm no released surface changed (no marketplace bump, no skill `version:` edit)
- [ ] Read both link directions by hand — the gate only warns on broken wikilinks
- [ ] Commit; PR opens only after every box above is ticked

## Notes

(Implementers append measurements and recorded decisions here — this section is part of
the phase handoff artifact set.)
