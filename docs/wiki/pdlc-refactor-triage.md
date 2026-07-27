---
name: pdlc-refactor-triage
description: The pdlc:refactor-triage skill — the post-sweep (and periodic) debt evaluator: sweep → refactor-triage → debt tasks → next sweep; three entry modes (range, whole-repo, headless with a declared triage policy), team-review orchestrated as the evaluation engine via its lens (inline pass when absent), a range-only intent-drift pass against runbook + specs + pinned wiki notes, accept/reject/defer dispositions in a tracked run-id-keyed record, accepted findings carded as cited, labeled backlog tasks.
kind: component
sources:
  - pdlc/skills/refactor-triage/SKILL.md
verified_against: 3bc4899531e62df1b3f0442fec753bf30023f8b0
---

# pdlc:refactor-triage — evaluate merged work, card the debt

`skills/refactor-triage/SKILL.md` — the third skill of the [[pdlc-plugin]], added in
0.40.0 (TASK-72) — closes the seam nothing else owned: after a sweep merges a body of
work (and periodically between sweeps), evaluate the merged result for tech debt and
intent drift, triage the findings, and land accepted items back on the board as
sweepable tasks — **sweep → refactor-triage → debt tasks → next sweep**. It lives in
pdlc because pdlc is the orchestrator plugin, the only place invoking sibling skills
(`team-review:team-review`, the `backlog` CLI) is architecturally allowed —
[[skill-patterns]]' phase separation holds for domain plugins, which compose only
through files + gates. The [[team-review-plugin]] is deliberately **unchanged**: its
lens parameter already carries arbitrary framing, so it serves as the evaluation engine
as-is.

Gate → four phases → gate:

- **Precondition gate:** a git repo (findings are file:line against real commits); a
  `backlog/` board — no board means nothing to execute onto, a hard stop naming
  `pdlc:bootstrap`/`backlog init` as what must run first; range mode requires the range
  to resolve (`git rev-list --count <from>..<to>`) — an unresolvable range stops, never
  silently falls back to whole-repo — and expects the intent record (sweep runbook under
  `docs/design/`, merged PR specs under `specs/`, pinned `docs/wiki/` notes), degrading
  per missing piece only declaredly.
- **Scope** — three entry modes: **(a) range** (`--range xxx..yyy`, the post-sweep case,
  unlocking the intent-drift pass), **(b) whole-repo** (periodic, no range), **(c)
  headless/harness** — args carry the scope plus a **declared triage policy** (e.g.
  "auto-accept severity ≥ high, defer the rest") in place of conversation; no declared
  policy → refuse to run headless, and the policy is recorded verbatim in the triage
  record.
- **Evaluate** — when team-review is installed, orchestrate it with the framing in the
  lens (range mode: *"drift and tech debt since `<range>`; clobbered design decisions,
  slap-dash conflict resolutions"*); on a self-review its gate already lands the proven
  report at tracked `docs/reviews/team-review-<run-id>.md`, which becomes this skill's
  evaluation report. When absent, a declared inline eval pass over the same scope.
  **Range mode adds an intent-drift pass team-review cannot do:** diff the range against
  the intent record — the sweep runbook, each merged PR's spec, the pinned wiki notes
  whose sources the range touched; drift = merged code contradicting what those
  artifacts say was decided. Every finding needs file:line evidence or it never enters
  triage.
- **Triage** — walk **every** finding with the operator: accept / reject / defer, a
  one-line rationale each, prior records consulted so no disposition is re-litigated;
  the **tracked triage record** lands at `docs/reviews/refactor-triage-<run-id>.md`
  (run-id-keyed so same-day runs never collide — team-review's precedent) carrying
  scope, mode, report path, policy-or-operator provenance, and one line per finding.
  Headless applies the declared policy and leaves the same paper trail.
- **Execute** — each **accepted** finding becomes a backlog task via the `backlog` CLI
  (never hand-edited board files), citing its finding (report path + file:line) in the
  body, labeled (e.g. `debt`), dependency-noted — immediately sweepable. Rejected and
  deferred items live in the record only.
- **Output gate** (prose, the pdlc precedent — no Stop hook): no created task without a
  finding it cites; no "triage done" without BOTH the evaluation report and the tracked
  triage record on disk; every finding disposed with rationale; the board shows exactly
  the accepted set. Status can never exceed artifacts ([[gates-convention]]).

Handing off suggests, never starts, the natural next step: a sweep ([[pdlc-sweep]])
over the new debt tasks — whose own Handing off (skill 0.9.0) names refactor-triage as
the post-sweep review step, closing the cycle.

Explicit non-goals (from the TASK-72 card): no team-review changes (commit-range
mechanics on its `orient.mjs` would be an evidence-backed follow-up), and no split of
eval-orchestration from triage-to-board into two skills — one skill until harness use
proves eval-only runs are wanted.
