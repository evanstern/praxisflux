# 049 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Split design and measurement

- [x] Measure current bodies with the gate's own definition (frontmatter excluded) for
      `pdlc-sweep-history.md` and record the number in this file's Notes section
- [x] Read `docs/corpus-spec.md`'s summary-style split rule and
      `docs/wiki/test-suite-catalog-plugins.md` + its two children as the in-repo pattern
- [x] Choose the split point and child names; record the choice and its arithmetic
      (projected body sizes WITH the three new entries included) in the Notes section
- [x] Confirm `pdlc-sweep-history` is retained as the parent's name, and enumerate every
      inbound `[[pdlc-sweep-history]]` link that must keep resolving
- [x] Commit the recorded design (spec-dir note only; no wiki edits yet)

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

### Phase 1 — measurement and split design

**Measurement method.** The gate's own body definition lives in
`grounding-wiki/gates/capsules.mjs` — `noteBody(text)` strips everything through the closing
`---` of frontmatter and returns the rest verbatim; `NOTE_BODY_BUDGET = 8000`. Measured by
importing that function directly (not by eye), confirming the spec's stated figure:

| note | body chars (frontmatter excluded) |
|---|---|
| `docs/wiki/pdlc-sweep-history.md` | **7992** / 8000 (matches spec.md's "7,992 of 8,000, measured 2026-08-02") |
| `docs/wiki/test-suite-catalog-plugins.md` (TASK-78 parent, pattern reference) | 1317 |
| `docs/wiki/test-suite-catalog-plugins-gates.md` (TASK-78 child) | 6959 |
| `docs/wiki/test-suite-catalog-plugins-pipeline.md` (TASK-78 child) | 2688 |

The TASK-78 parent is a thin index (title + 2-item child summary + Connections section);
the pattern this task follows for its own parent.

**Release-paragraph inventory.** `pdlc-sweep-history.md`'s body is: a title + framing
paragraph (408 chars) + `## Release by release` heading (21 chars) + 12 release paragraphs
(one per "Since X.Y.Z", blank-line-delimited, verified by direct string split — not an eyeball
estimate):

| release | chars | release | chars |
|---|---|---|---|
| 0.12.1 | 718 | 0.40.0 | 263 |
| 0.14.0 | 260 | 0.41.0 | 572 |
| 0.25.0 | 402 | 0.42.0 | 857 |
| 0.27.0 | 639 | 0.43.0 | 833 |
| 0.28.0 | 800 | 0.44.0 | 1017 |
| 0.34.0 | 523 | 0.47.0 | 655 |

Sum of all 12 release paragraphs: **7539 chars** (408 preamble + 21 heading + 24 separator
chars ≈ 7992 total, reconciles with the measured body).

**Chosen split: 2 children, chronological, split point before 0.43.0** (plan.md's proposed
shape, split point is the implementer's call per plan.md). Confirmed 2 children clear the
corpus-spec "≥~1,500 chars of substance" minimum-content counter-rule with margin, so no
3rd child is needed.

- **`pdlc-sweep-history.md`** (parent, name retained) — title + framing paragraph (408,
  unchanged) + new `## Children` section (one-paragraph summary + `[[wikilink]]` per child,
  TASK-78-style, ~700 est.) + new `## Superseded conventions` summary (the cross-release
  supersession threads: 0.27.0's mechanical re-pin superseded by 0.28.0's honest-re-pin
  classifier; 0.34.0 reconciling drift; ~1200 est.) + `## Connections` (~250 est.).
  **Projected: ~2600 chars.** Headroom vs. 8000 cap: **~5400** (well over the 1200 floor).
- **`pdlc-sweep-history-early.md`** (child) — releases 0.12.1 through 0.42.0 (9 paragraphs,
  **5034 chars**, moved verbatim) + new title/intro + back-link to parent (~300 est.).
  **Projected: ~5334 chars.** Headroom: ~2666. (R1's headroom floor doesn't bind this
  child — it isn't the newest — but it clears it anyway.)
- **`pdlc-sweep-history-recent.md`** (child, receives the backfill) — releases 0.43.0,
  0.44.0, 0.47.0 (3 paragraphs, **2505 chars**, moved verbatim) + new title/intro + back-link
  (~300 est.) **+ the three backfilled entries (0.48.0, 0.50.0, 0.51.0)**.
  Sized the new entries against the existing paragraph range (260–1017 chars,
  mean 628): central estimate 3 × ~750 = **2250**; worst-case bound uses the largest
  existing paragraph (1017) for all three: 3 × 1017 ≈ **3150**.
  - Central-estimate projected body: 2505 + 300 + 2250 = **5055**. Headroom: **2945**.
  - Worst-case projected body: 2505 + 300 + 3150 = **5955**. Headroom: **2045**.
  Both clear R1's ≥1200-char floor with margin (worst case leaves ~1.7× the required
  headroom). **If Phase 3's actual entries land above the worst-case bound (>1017 chars
  each, unusually long even against 0.44.0's four-fix entry), Phase 3 must re-measure with
  the gate before committing and revisit this split if headroom drops under 1200** — the
  arithmetic here is a projection, not a substitute for the gate re-run plan.md already
  requires.

**Naming/parent retention:** `pdlc-sweep-history` stays the parent's filename/frontmatter
`name`. Confirmed no rename.

**Inbound `[[pdlc-sweep-history]]` wikilinks across `docs/wiki/`** (must keep resolving;
found by grep across `docs/wiki/*.md`, restricted to actual `[[...]]` link syntax):

1. `docs/wiki/pdlc-sweep.md:98` — the false-promise cross-reference this task fixes
   ("… — `[[pdlc-sweep-history]]` carries the …"). Prose link, hand-maintained.
2. `docs/wiki/INDEX.md:36` — generated (`CAPSULES.md`/`INDEX.md` regeneration in Phase 4
   will re-derive this line from the parent's frontmatter; not hand-edited).
3. `docs/wiki/CAPSULES.md:75` — generated, same as above.

No other `docs/wiki/*.md` note links to it. (Non-wiki prose mentions in `specs/`,
`docs/design/`, etc. are out of scope — R2 only requires wikilinks within `docs/wiki/` to
resolve.)

**Contradictions/findings vs. spec.md and plan.md:** none. Plan.md explicitly leaves the
split point to the implementer and only requires the arithmetic prove out — it does. The
2-child chronological shape plan.md proposed is arithmetically sufficient; a 3rd child is
not needed. One adjustment from plan.md's illustrative split (which didn't fix a point):
this measurement puts the boundary **before 0.43.0** rather than at a different point,
specifically because 0.44.0 (1017 chars, the single largest existing paragraph) is heavy
enough that including it in `-recent` alongside worst-case-sized new entries would leave
recent's headroom at ~1238 — technically over the 1200 floor but too close for comfort
against estimate error. Moving the boundary one release earlier buys ~800 chars of extra
safety margin for a negligible cost to `-early`'s (already ample) headroom.
