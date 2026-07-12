# 001-reconcile-endpoint — pure-sync pipeline rounds without a model

The n8n pilot runner (docs/orchestration/n8n-pilot/runner.mjs) currently escalates every
gate failure to the model agent (~$0.60/round), even when the failure is pure bookkeeping
that `spec-bridge plan` has already computed the fix for. Add a deterministic **reconcile**
station so the model becomes the escalation, not the default.

## Requirements

- **`POST /reconcile {runId}`** on the runner: run `spec-bridge plan` in the run's dir,
  execute its emitted `backlog task edit …` command lines **verbatim** (skip `#` comment
  lines), then re-run plan. Return `{ ran: [<commands>], planEmpty: bool }`. No model, no
  claude session, ever.
- **Safety**: only lines beginning `backlog task edit ` may be executed — anything else in
  plan's stdout is an error, not a command. A non-empty re-plan after execution is reported
  honestly (`planEmpty: false`), not retried.
- **Workflow ladder** (docs/orchestration/n8n-pilot/workflow.json): on Gate 0 failure, try
  **Reconcile** first, re-gate, and only escalate to the model agent if the gate still
  fails. The agent rounds and Give Up backstop keep their existing shape after that.
- **Proof at $0**: the `exceeds` and `done-eligible` scratch fixtures must complete
  end-to-end (gate FAIL → reconcile → gate PASS) with **zero model spend** — scripted as
  `test-reconcile.sh` in the pilot dir, self-contained like `test-isolation.sh`.
- Pilot README/run-log updated: the ladder diagram gains the reconcile station.

## Non-goals

Reconciling anything beyond spec-bridge board bookkeeping (wiki re-pins etc. stay out);
changing the gate or agent stations; touching the runner's isolation semantics.
