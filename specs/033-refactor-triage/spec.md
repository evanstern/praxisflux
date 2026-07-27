# 033-refactor-triage — pdlc skill: eval merged work, card debt tasks onto the board

Board: TASK-72 · Direction: the TASK-72 card (commit 010a529, operator-approved carding
2026-07-27 of the design agreed the same day); sweep runbook
`docs/design/refactor-triage-runbook.md`, signed off 2026-07-27. The design is decided —
this spec instantiates it, it does not reopen it.

## The seam being closed

After a sweep merges a body of work (and periodically between sweeps), nobody owns
evaluating the merged result for tech debt and drift, triaging what's worth fixing, and
landing the accepted items back on the board as sweepable tasks. This skill closes the
loop: sweep → refactor-triage → debt tasks → next sweep. It lives in pdlc because pdlc
is the orchestrator plugin — the only place invoking sibling skills (team-review, the
backlog CLI) is architecturally allowed; domain plugins compose only through files +
gates. team-review is UNCHANGED: its lens parameter already carries arbitrary framing,
so it becomes this skill's evaluation engine as-is.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — new skill `pdlc/skills/refactor-triage/SKILL.md` (frontmatter
name/version/description; description is the trigger surface) in the
precondition-gate → phases → output-gate shape per `docs/skill-patterns.md`.

R2 (AC #2) — three entry modes, named in the skill: (a) **range** — `--range xxx..yyy`,
the post-sweep case; (b) **whole-repo** — periodic, no range; (c) **headless** — args
carry the scope plus a DECLARED triage policy (e.g. auto-accept ≥ severity N) in place
of conversation.

R3 (AC #3) — Evaluate phase orchestrates `team-review:team-review` when the plugin is
installed, passing the framing through its existing lens parameter (range mode: "drift
and tech debt since <range>; clobbered design decisions, slap-dash conflict
resolutions"). When team-review is absent, degrade gracefully to the skill's own inline
eval pass over the same scope. team-review itself gets zero changes.

R4 (AC #4) — range mode adds an **intent-drift pass** team-review cannot do: diff the
range against the intent record — the sweep runbook, each merged PR's spec, and the
pinned `docs/wiki/` notes covering the touched sources; drift = merged code
contradicting what those artifacts say was decided.

R5 (AC #5) — Triage phase walks every finding with the operator — accept / reject /
defer, each with a one-line rationale — and writes a TRACKED triage record (prior art
for the location and keying: `docs/reviews/`, run-id-keyed so same-day runs never
collide) so the next run never re-litigates a disposition. Headless mode applies the
declared policy and records policy + per-finding dispositions in the same record.

R6 (AC #6) — Execute phase turns each ACCEPTED finding into a backlog task via the
`backlog` CLI (never hand-edited files), citing its finding (report path +
file:line evidence) in the task body, labeled (e.g. `debt`) and dependency-noted so it
is immediately sweepable.

R7 (AC #7) — output gate (prose, the pdlc precedent — bootstrap and sweep ship no Stop
hook): no created task without a finding it cites; no "triage done" without BOTH the
evaluation report and the tracked triage record existing on disk. Status can never
exceed artifacts.

R8 (AC #8) — `pdlc/skills/sweep/SKILL.md`'s Handing off section names refactor-triage
as the post-sweep review step (its `version:` bumps with the edit).

R9 (AC #9) — release mechanics: marketplace lockstep 0.39.0 → 0.40.0, new skill
`version:` 0.1.0, sweep skill version bump; `node --test` green; wiki freshness +
`scripts/check-docs.mjs` pass (new wiki note for the skill, INDEX + CAPSULES current,
staled pins honestly re-pinned).

## Non-goals

- No changes to team-review (no commit-range mechanics on orient.mjs — a possible
  evidence-backed follow-up, not this task).
- No split of eval-orchestration vs triage-to-board into two skills (start as one).
- No Stop hook / machine gate for pdlc (prose output gate per plugin precedent).
