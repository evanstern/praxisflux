# Tasks — 001-reconcile-endpoint

## Phase 1: Endpoint

- [ ] T001 `/reconcile` on the runner: plan → execute emitted `backlog task edit` lines verbatim (comments kept as context, anything else is an error) → re-plan; returns `{ ran, planEmpty }`; logged; no model ever
- [ ] T002 Workflow ladder: Gate 0 fail → Reconcile → re-gate → only then the model agent; imported and active in n8n

## Phase 2: Proven

- [ ] T003 `test-reconcile.sh`: self-contained proof that the `exceeds` and `done-eligible` fixtures complete gate-FAIL → reconcile → gate-PASS with zero model spend; pilot README + run-log updated
