# 038 — plan

Doctrine-text change, the largest of the sweep-skill series: two skill files, a
wiki split, and board cross-references. No code, no new tests.

1. **`pdlc/skills/sweep/SKILL.md`** (step numbering stays stable throughout):
   - Step 2 (claim): the claim commit gains the link — board card → In Progress
     AND the spec number's directory stub AND the `Spec:` marker on the card
     (spec-bridge:link, marker-only against the stub) — stating why: the bridge's
     Stop gate must be armed from the branch's first commit, because the gate
     armed after the spec cycle is disarmed by exactly the mistake it exists to
     catch.
   - Step 3 (spec cycle): expand from one sentence to the claim step's mechanical
     register — name `spec.md`, `plan.md`, `tasks.md`; say what makes each real
     (spec: problem + requirements mapped to the card's ACs; plan: how, against
     the host constitution — or, when the constitution is absent or unratified,
     say so in plan.md and plan against the project's grounding docs, never
     treating the step as ceremony; tasks: phased checkboxes the bridge derives
     from); all committed on the claimed branch before implementation.
   - Step 4: repurpose (same number) — complete the link: seed/refresh phase ACs
     from tasks.md via link's update mode; verify the claim's marker survived.
   - Output gate: add the R4 clause (operator-blessed wording, verbatim from the
     spec).
   - Phase 1 item 3 (per-PR gates enumeration): add the R5 doctrine sentence —
     Lane-0/precondition rulings that change the per-task loop land as checkable
     lines in the runbook's gate section.
   - Frontmatter `version:` 0.12.0 → 0.13.0.
2. **`pdlc/skills/sweep/templates/runbook.md`**: new section **"Per-task
   artifacts required before PR"** between "Per-PR gates" and "Concurrency &
   conflict doctrine": the spec+plan+tasks-or-escape-line rule as checkable
   lines, with `{{...}}` slots for host additions; a comment line noting Lane-0
   rulings that alter the loop belong here as lines, not prose.
3. **Board cross-refs (backlog CLI, in the worktree):** append-note on TASK-79
   ("inverse card TASK-84 shipped R4's escape-line gate — your hatch becomes an
   instance of it; verified non-contradictory") and on TASK-84 (mirror). TASK-79
   otherwise untouched.
4. **Release plumbing:** `node scripts/sync-version.mjs 0.44.0` (next free if
   main moved).
5. **Wiki (same PR):** `docs/wiki/pdlc-sweep.md` NEEDS-REVIEW against the diff;
   at 7,999/8,000 the additions force a **summary-style split** per
   docs/corpus-spec.md — recommended cut: move the per-release "Since …" history
   paragraphs into a new `pdlc-sweep-history` note ([[pdlc-sweep]] keeps the
   current-doctrine description + a link), both notes pinned to the doctrine
   commit, INDEX.md + CAPSULES.md updated in the same slice. Lockstep stamps
   stale ~11 siblings → classify against diffs (expect RE-PIN-ONLY), re-pin via
   repin.mjs.
6. **Gates before PR:** `node --test`, `node scripts/check-docs.mjs`,
   `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`,
   `node scripts/check-version-bump.mjs`. Per this task's own R3/R4 (and the
   runbook's gate line): no PR until specs/038-*/ carries real spec+plan+tasks
   and the link is armed — both already true at dispatch time.

Constitution note: host has no `.specify/`; hand-authored spec per recorded
precedent (runbook, Per-PR gates) — the R1 text this plan ships is what makes
that statement mandatory in future plans.
