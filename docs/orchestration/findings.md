# Orchestrator findings — n8n vs GitHub Actions vs Temporal

Input for the orchestration story (decision-1 → TASK-20 → TASK-22). Judged against what the
pilot actually needed: sequencing, a gate-failure corrective loop, a durable human pause,
and host-toolchain execution.

## What the pilot proved (n8n, local Docker, 2026-07-10/11)

- **Sequencing + branching**: trivially good. The gate ladder (IF on `pass`, failure text
  routed into the next agent's correction) took one JSON file and zero custom code inside n8n.
- **Durable human pause**: the Wait node is a real primitive — the execution parks
  indefinitely, survives with a signed resume URL, and the workflow structurally cannot
  proceed without the human's POST. This is the feature GHA and cron-style runners fake.
- **Execution visibility**: the execution view shows every node's input/output — the gate's
  failure text feeding the agent is *inspectable*, which is precisely what a human approving
  the run wants to read.
- **Friction found**: CLI import quirks (workflow `id` required, import deactivates, restart
  to register webhooks); expressions are stringly-typed and unversioned; a true retry *loop*
  is awkward (the pilot uses a fixed-depth ladder + a runner-side hard cap, which is arguably
  more auditable anyway); everything host-side still had to live in our own runner service —
  n8n contributed sequencing and the pause, not execution.

## The comparison, honestly

| need | n8n | GitHub Actions | Temporal |
|---|---|---|---|
| sequencing/branching | visual, easy | YAML, easy | code, easy |
| human approval pause | **native (Wait node)** | environments (repo-level, coarse) | native (signals), build your own UI |
| corrective retry loop | fixed ladder or awkward cycles | job-level re-run only | **natural (code loop)** |
| host/toolchain execution | BYO runner service | **native (self-hosted runner)** | BYO worker (same as our runner) |
| run visibility for the approver | **excellent UI** | logs | good UI, dev-oriented |
| durability across restarts | good (DB-backed) | n/a (jobs timeout) | **excellent** |
| ops weight for one person | one container | zero (hosted) | server + workers |

## Read on it

- **n8n earns its place at exactly one seam: the human touchpoint.** Rich pause/resume,
  approval-friendly visibility, cheap to run. As a *general* orchestrator it mostly
  delegated: our runner did the real work, and the praxisflux gates did the real deciding.
- **GHA remains the shortest path for repo-shaped flows** (it already runs the gates in CI;
  environments give coarse approvals), but its approval and pause primitives are much
  weaker — no mid-flow corrective loop without contortions.
- **Temporal is where this goes if the loops get serious** — a real programming model for
  retries/compensation and industrial durability — at the cost of running it and writing
  workers. The runner service we built *is* the worker shape Temporal would want.
- **A cost optimization the pilot deliberately skipped**: pure board-sync rounds (scenarios
  1 and 3) went through the agent node (~$0.6/round) for workflow uniformity — but sync is
  now `plan | sh`, a tier-1 operation. A deterministic "reconcile" endpoint on the runner
  would handle every no-creative-work round for free, reserving the model for rounds that
  author something. The pilot proves the seam exists; wiring it is a one-endpoint change.
- **The load-bearing insight is orchestrator-independence**: because state is derived from
  artifacts and gates speak model, the praxisflux flow ported to n8n with a ~150-line generic
  runner and one JSON file. Nothing in the chassis knows n8n exists. Swapping orchestrators
  is a transport decision, not an architecture decision — exactly what decision-1 bet on.
