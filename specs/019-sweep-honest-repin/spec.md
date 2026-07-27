# 019-sweep-honest-repin — post-merge-in re-pins must read the diff they cover

Board: TASK-58 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0, immediately post-TASK-57); carded 6c053c2; executed
under `docs/design/downstream-bugfix-runbook.md` (Lane A, first).

## The failure the doctrine causes

TASK-57's amendment (sweep `SKILL.md` step 7 + concurrency doctrine;
`templates/runbook.md` reconcile bullet) tells the executor to merge `origin/main` into
a pin-carrying branch and *mechanically re-pin conflicted pins to the merge commit* —
with no requirement to re-verify the note's prose against the main-side diff. The
freshness gate checks `git log <pin>..HEAD -- <sources>`
(`grounding-wiki/gates/freshness.mjs:78`), so pin = merge-commit empties that range BY
CONSTRUCTION. Live scenario: a sibling PR lands on main changing a source of note N
carried on the branch; the branch merges main in; the executor re-pins N per doctrine;
the gate goes green; the PR merges with N contradicting the code. This directly
contradicts `grounding-wiki/skills/wiki-update/SKILL.md` ("never bump a pin without
reading the diff; a dishonest pin is worse than a stale note"). The unconditional
post-history-move probe added by the same commit does not help — it passes once the pin
is bumped.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `pdlc/skills/sweep/SKILL.md` + `pdlc/skills/sweep/templates/runbook.md`:
post-merge-in staleness routes through the **wiki-update plan loop** — every stale or
conflicted pin is classified against the main-side diff (`git diff <old-pin>..<merge>`
over the note's sources) as RE-PIN-ONLY (stamp/no-op diffs) vs NEEDS-REVIEW (prose must
be re-verified before any bump). The merge commit remains the *target* of an honest
re-pin; it must never be the *justification* for one.

R2 (AC #2) — no sentence in either file instructs bumping a pin without reading the
covered diff. The mechanical "re-pin conflicted pins to the merge commit" phrasing is
rewritten wherever it appears (step 7, doctrine bullets, template mirror). The doctrine
also states the safe procedure for downstream hosts that inherited the TASK-57
convention (promptworld records the same merge-in-and-repin rule).

R3 (AC #3) — `docs/wiki/pdlc-sweep.md` re-grounded to the amended doctrine (re-verify
prose, re-pin; CAPSULES regen if its description changes). Versions per
`docs/releasing.md`: sweep SKILL.md `version:` bump (behavior-visible doctrine change —
minor) + marketplace `scripts/sync-version.mjs` to the next free.

## Non-goals

- Changing the freshness gate's mechanics (`grounding-wiki/gates/freshness.mjs`) —
  that's TASK-59 (spec 020), a separate lane.
- Any promptworld-side edit (their sibling card is TASK-162 there).
- Re-litigating merge-over-rebase for pin-carrying branches — TASK-57's split stands;
  only the *re-pin honesty* leg changes.
