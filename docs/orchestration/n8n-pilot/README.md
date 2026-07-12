# n8n pilot — the spec-bridge flow as an orchestrated pipeline

TASK-22's deliverable: the praxisflux workflow running under an external orchestrator with
humans only at the decision points. This directory is the complete, reproducible pilot.

## Architecture: three tiers, two processes

```
 n8n (Docker, :5678)                     runner.mjs (host, :8787)
 ┌──────────────────────────────┐        ┌─────────────────────────────────┐
 │ Trigger (webhook)            │        │ /checkout   tier 1 deterministic │
 │  → Checkout ─────────────────┼──HTTP──▶ /gate       tier 1 deterministic │
 │  → Gate 0 → Proven?          │        │ /reconcile  tier 1 deterministic │
 │     ├─ fail → Reconcile      │        │ /agent      tier 2 model         │
 │     │    → Gate R → fail →   │        │ /notify ┐   tier 3 human's       │
 │     │      Agent 1 → Gate1 … │        │ /finish ┘   landing points       │
 │  → Notify → Await Approval   │        └─────────────────────────────────┘
 │  → Finish (merge)            │
 └──────────────────────────────┘
```

- **n8n owns sequencing and the human touchpoint only.** It never shells into a repo; every
  step is an HTTP call to the runner. The Wait node is the tier-3 seam: the workflow
  physically cannot reach `/finish` without a human posting to the resume URL with
  `approvedBy`.
- **The runner owns the host toolchain** (claude CLI, backlog, git, node) behind whitelisted
  endpoints. `/checkout` gives each run either a scratch fixture (`lagging`/`exceeds`/
  `done-eligible`) or — for a real repo — an **isolated per-run git worktree** on a fresh
  `pilot/<runId>` branch: the target's own checkout is never touched, humans switching
  branches there mid-run are non-events, and concurrent runs coexist (`test-isolation.sh`
  is the repro). `/finish` merges the run's branch into the target's main — approval
  literally is the merge — refusing loudly (worktree kept for inspection) if the target
  isn't on a clean main.
- **Bookkeeping failures never reach the model.** On a Gate 0 failure the workflow tries
  `/reconcile` first — spec-bridge `plan`'s own emitted `backlog task edit` lines executed
  verbatim (anything else in plan's stdout is refused, and a non-empty re-plan is reported
  honestly, never retried) — then re-gates at `Gate R`; only a still-failing gate escalates
  to the agent rounds. Pure-sync rounds cost $0: `test-reconcile.sh` proves the `exceeds`
  and `done-eligible` fixtures complete gate-FAIL → reconcile → gate-PASS with zero
  `/agent` calls.
- **The corrective loop is the gate's stderr, verbatim.** `Reconciled?`/`Proven N?` routing
  a still-failing gate's text into the next agent's `correction` field is the praxisflux Stop-hook pattern lifted into the
  orchestrator: gates already speak model. Bounded twice in the workflow shape, and the
  runner hard-caps agent rounds at 3 per run.
- **Verification is by artifacts, never by the agent's word** (docs/headless-runner.md):
  `/gate` = spec-bridge `plan` prints nothing AND `check` exits 0 with no lag warnings.

## Run it

```sh
# 1. the runner (host)
node runner.mjs 8787 &

# 2. n8n (Docker) + import + activate
docker run -d --name n8n-pilot -p 5678:5678 -e N8N_SECURE_COOKIE=false \
  -e N8N_RUNNERS_ENABLED=true -e N8N_ENCRYPTION_KEY=praxisflux-pilot \
  -v "$PWD":/pilot n8nio/n8n
docker exec n8n-pilot n8n import:workflow --input=/pilot/workflow.json
docker exec n8n-pilot n8n update:workflow --id praxisfluxpilot1 --active=true
docker restart n8n-pilot

# 3a. forced-failure scenario (scratch fixture whose board lies)
curl -X POST localhost:5678/webhook/pilot -H 'content-type: application/json' \
  -d '{"fixture":"exceeds"}'

# 3b. real-work scenario (a repo with a linked Spec Kit spec; agent implements)
curl -X POST localhost:5678/webhook/pilot -H 'content-type: application/json' \
  -d '{"target":"/path/to/repo","prompt":"Implement the next unchecked task in <specdir>/tasks.md per the spec... then /spec-bridge:sync"}'

# 4. approve: runner.log prints "APPROVAL NEEDED <runId>: curl ..." — a human runs it
```

`runner.log` is the run log; `run-log.md` preserves the pilot's actual first runs.

## Honest limitations (findings feed docs/orchestration/findings.md)

- The runner inherits the dev machine's permissions and plugins (see the additive-permissions
  finding in `docs/headless-runner.md`); production shape is the runner *inside* a container
  image that packs the toolchain + plugins and nothing else.
- The spec-bridge gate proves the **board**; it does not review the **code**. That's what
  the human approval is for — n8n's execution view shows each gate/agent payload for exactly
  that review.
- n8n's Wait-resume URL carries a signature but no authn beyond it; fine on localhost,
  needs a proper approval surface (Slack/form + auth) beyond the pilot.
