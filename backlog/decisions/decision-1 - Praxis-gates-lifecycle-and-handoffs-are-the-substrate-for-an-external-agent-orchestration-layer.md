---
id: decision-1
title: >-
  Praxis gates, lifecycle, and handoffs are the substrate for an external
  agent-orchestration layer
date: '2026-07-10 19:50'
status: Proposed
---
## Context

Praxis has converged on a workflow with explicit stages, evidence-derived state, and blocking
gates. Three design decisions — made for plugin-composition reasons — turn out to be exactly the
properties an external orchestration layer (n8n, Temporal, GitHub Actions, or an Agent SDK
harness) needs to run this flow with headless agents and humans in the middle:

1. **State is derived from artifacts, never asserted.** `lib/lifecycle.mjs` and
   `lib/spec-derive.mjs` are pure, stateless reads: files on disk → status. An orchestrator's
   condition node never has to trust an agent's claim that it finished — it re-derives the state
   from the checkout. This is the hardest problem in agent orchestration, and the repo's central
   invariant ("status can't exceed proven artifacts") already solves it.
2. **The gates are already extracted behind a versioned contract.** TASK-16 shipped
   `scripts/run-gates.mjs` + the composite action (`docs/consuming-gates.md`): named gates,
   documented inputs, exit codes 0/1/2, zero dependencies, runnable against any checkout.
   Bonus: gate failure messages are authored to be consumed by a model (Stop-hook stderr becomes
   the message Claude sees; each failure line names its fix) — so an orchestration retry loop is
   native: agent step → gate node → on failure, feed the gate's stderr back as the corrective
   prompt.
3. **Plugins compose only through files + envelopes, never direct calls.** The handoff protocol
   (`lib/handoff.mjs`, `docs/handoff-protocol.md`) is a message queue in all but transport:
   `id`, `kind: request|response`, `from`/`to`, `ref` correlation. Swap the gitignored
   `.handoff/` directory for a webhook/queue and the semantics carry unchanged; the
   "transient payload, durable evidence" rule already says what belongs in the orchestrator's
   message vs. in git.

**The human-in-the-middle seam is already designed in.** `spec-derive.mjs` deliberately stops at
`Done-eligible`: the derivation proves eligibility, a separate actor promotes to `Done`, and the
spec-bridge gate blocks any `Done` lacking the derivation. That seam *is* an approval node — the
state machine has a hole shaped like a human. Likewise, a failing wiki-freshness gate isn't an
error state in an orchestrated flow; it's the trigger for a `wiki-update` agent step, which is
the self-documentation guarantee.

**What is honestly not primed yet:**

- The skills assume an interactive Claude Code session (plugin install, Stop hooks, a human in
  the chat). Each would become a headless agent node (`claude -p` / Agent SDK) with a container
  and a git checkout; no skill has yet been proven to run to completion non-interactively.
- Every run needs a real git workspace (all state lives in git). n8n has no native worktree
  concept — a small execution service (container per run: checkout, branch, push, PR) would sit
  between n8n and the repo, with n8n owning only sequencing and human touchpoints. GitHub
  Actions environment-protection rules give checkout + approval gates natively and we already
  ship a composite action — the shortest path to a demo, even if n8n is the better long-term
  home for rich human interaction.
- TASK-17 (`@praxis/gates` on npm) is the enabler for gates-as-a-node in any CI/orchestrator;
  its contract is already frozen in `docs/consuming-gates.md`.

## Decision

Treat the praxis chassis (gates + lifecycle + handoff envelope) as the substrate for an external
orchestration layer implementing human-in-the-middle, self-documenting, spec-driven development.
Extraction order, when this work is committed:

1. **TASK-17** — publish `@praxis/gates` so gates are callable via `npx` from any orchestrator
   node (contract unchanged).
2. **Headless skill-runner contract** — prove one skill runs to completion non-interactively
   (input files → output files → meaningful exit). This de-risks the whole idea and is the first
   real engineering unknown.
3. **Handoff transport adapter** — same envelope, pluggable transport, so `.handoff/` and a
   queue are interchangeable.

**Pilot:** the spec-bridge flow (spec → plan → tasks → analyze → `Done-eligible` → *human
approves* → `Done`) — the cleanest spec-driven-with-approval story. Second act: the
educate→build→educate round trip, demonstrating request/response correlation (`handoff.specd` /
`handoff.returned` / `handoff.foldedIn`) and evidence-gated fold-in across two agents.

## Consequences

- The gate contract (`docs/consuming-gates.md`) becomes the load-bearing interface for any
  orchestrator; changes to gate names, inputs, or exit codes are breaking changes to more than
  CI.
- Skills should trend toward headless-runnable: no mid-skill reliance on interactive
  clarification that an orchestrated run can't supply; human input becomes an explicit
  artifact/approval, not a chat turn.
- The handoff envelope (`id`/`kind`/`from`/`to`/`ref`) should stay transport-agnostic; nothing
  new may assume `.handoff/` is a local directory.
- No orchestration work is committed by this record — it captures the assessment and the
  extraction path so the analysis isn't lost. Concrete work (headless runner spike, transport
  adapter, pilot flow) requires its own approved Backlog tasks; TASK-17 already exists.

