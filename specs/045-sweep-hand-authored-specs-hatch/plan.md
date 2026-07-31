# 045-sweep-hand-authored-specs-hatch — plan

**Constitution:** none ratified — planning against docs/principles.md,
docs/wiki/pdlc-sweep.md, and TASK-84's shipped Output-gate wording (SKILL.md 0.15.0),
per sweep doctrine's absent-constitution rule.

## Approach

One file substantively (`pdlc/skills/sweep/SKILL.md`, now 0.15.0 after TASK-90), plus
at most a one-parenthetical template touch.

1. **R1 — precondition gate item 1:** amend "Missing either → stop" to carve the
   recorded-precedent case: `.specify/` absent is acceptable when the host has an
   established hand-authored-specs precedent AND the runbook records it as an
   operator-signed escape line in its "Per-task artifacts required before PR" section
   (covering the sweep's scoped tasks); the sweep then authors
   specs/NNN/{spec,plan,tasks}.md by hand, and the Output gate's existing
   artifacts-or-escape-line clause enforces exactly as written. Add a sentence making
   the one-mechanism rule explicit (the hatch IS an escape-line instance — cite
   TASK-84's "never as a second mechanism" clause rather than restating it).
   Optionally add the parenthetical "(a host-precedent sanction is one instance of
   this line)" to the template's escape-line slot if it isn't already implied there —
   check first; TASK-89 already carried template parity work.
2. **R2 — amendment rule:** in "Operator checkpoints — never proceed silently past"
   (or the concurrency doctrine, whichever reads naturally), add: any softening of a
   gate the signed-off runbook enumerates — at plan time, implement time, or merge
   time — is a runbook amendment (edit the file, note why, ping the operator), never
   a decision note inside a spec artifact; cite the specs/033 field case in one
   clause.
3. **R3 — release:** sweep skill 0.15.0 → 0.16.0 (the card's old "0.10.0" label is
   stale — labels are not reservations); `node scripts/sync-version.mjs <next free
   minor vs origin/main>` at merge-readiness (expect 0.50.0 or next free; TASK-78 and
   TASK-85 are in flight — on tag rejection re-sync to next free and re-pin, sibling
   precedent). Re-verify `docs/wiki/pdlc-sweep.md` (NEEDS-REVIEW; body ~6,365/8,000 —
   room for a one-line mention; overflow to pdlc-sweep-history only within its tight
   budget). Lockstep stamps → classify siblings (expect RE-PIN-ONLY).
4. **Gates:** node --test, check-docs, freshness, version-bump — green in worktree;
   re-run after any history move.

## Risks

- TASK-85 concurrently adds one reference line to this same file (two-track rule
  reference) — keep hunks minimal; the serial merge reconciles.
- Keep the precondition-gate hunk tight: the gate item also carries the merge-drift
  probe text; don't reflow it.
