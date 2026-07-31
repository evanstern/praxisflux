---
name: pdlc-refactor-triage
description: The pdlc:refactor-triage skill — the post-sweep (and periodic) debt evaluator: sweep → refactor-triage → debt tasks → next sweep; four entry modes (range, whole-repo, headless, since-last-triage); team-review is the evaluation engine via its lens (inline pass when absent); a range-only intent-drift pass vs runbook + specs + pinned wiki notes; accept/reject/defer dispositions in a tracked record; accepted findings carded as backlog tasks.
kind: component
sources:
  - pdlc/skills/refactor-triage/SKILL.md
verified_against: 253e0a979a77df83ef234ddc2bfb89e175da6ef6
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
- **Scope** — four entry modes: **(a) range** (`--range xxx..yyy`, the post-sweep case,
  unlocking the intent-drift pass), **(b) whole-repo** (periodic, no range), **(c)
  headless/harness** — args carry the scope plus a **declared triage policy** (passed
  as `--policy`, e.g.
  "auto-accept severity ≥ high, defer the rest") in place of conversation; no declared
  policy → refuse to run headless, and the policy is recorded verbatim in the triage
  record — and **(d) since last triage** (0.3.0, TASK-80), which resolves the range from
  history: the newest record's `last-run-at` high-water mark to `<id>..HEAD`, verifying
  the id and range resolve and **stopping (never guessing)** when there is no prior
  record, no `last-run-at` line, or an unresolvable id.
- **Evaluate** — when team-review is installed, orchestrate it with the framing in the
  lens (range mode: *"drift and tech debt since `<range>`; clobbered design decisions,
  slap-dash conflict resolutions"*). The evaluation report's tracked home is
  `docs/reviews/team-review-<run-id>.md` (run-id = team-review's run id when the engine
  ran, else `<repo>-<ISO-stamp>` minted at triage start) — verified after the pass, not
  assumed, since older engines strand the report in gitignored `.handoff/`; if no tracked
  copy landed, copy the proven report there and commit it (version-independent). When
  team-review is absent, a declared inline eval pass over the same scope writes to that
  same home.
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
  Headless applies the declared policy and leaves the same paper trail. The record also
  carries, exactly once, a machine-findable `last-run-at: <full 40-char commit id>`
  high-water mark — the scanned range's resolved right endpoint, or HEAD at scan time in
  whole-repo mode — that the Scope phase's since-last-triage entry reads to scope the next
  run (0.3.0, TASK-80).
- **Execute** — each **accepted** finding becomes a backlog task via the `backlog` CLI
  (never hand-edited board files), citing its finding (report path + file:line) in the
  body, labeled (e.g. `debt`), dependency-noted — immediately sweepable. Rejected and
  deferred items live in the record only.
- **Output gate** (prose, the pdlc precedent — no Stop hook): no created task without a
  finding it cites; no "triage done" without BOTH the evaluation report and the
  triage record tracked on disk (a report left in `.handoff/` is not tracked); every finding disposed with rationale; the board shows exactly
  the accepted set. Status can never exceed artifacts ([[gates-convention]]).

Handing off suggests, never starts, the natural next step: a sweep over the new debt
tasks, closing the cycle — [[pdlc-sweep]] documents its own Handing-off precedent for
naming refactor-triage as the post-sweep review step.

Explicit non-goals (from the TASK-72 card): no team-review changes (commit-range
mechanics on its `orient.mjs` would be an evidence-backed follow-up), and no split of
eval-orchestration from triage-to-board into two skills — one skill until harness use
proves eval-only runs are wanted.
