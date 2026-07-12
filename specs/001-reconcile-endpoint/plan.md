# Plan — 001-reconcile-endpoint

1. **Runner** (`runner.mjs`): `reconcile({ runId })` —
   - `spawnSync` node `SPEC_CLI plan .` in `run.dir`; split stdout lines; `#`-prefixed
     lines are context (keep them in the report), lines starting `backlog task edit ` are
     commands, anything else non-empty → throw.
   - Execute each command with `bash -c` in `run.dir` (plan emits shell-quoted lines for
     verbatim use), collecting them into `ran`.
   - Re-run plan; `planEmpty` = exit 0 and empty stdout. Log one line per phase.
   - Register in `HANDLERS` as `/reconcile`.
2. **Workflow** (`workflow.json`): new HTTP node `Reconcile` + IF `Reconciled?` between
   `Proven 0?`'s false branch and `Agent 1`: Gate 0 fail → Reconcile → Gate R (reuse a new
   gate call) → pass → Notify Human; fail → Agent 1 (correction = Gate R failure text).
   Re-import + restart n8n.
3. **Proof**: `test-reconcile.sh` — own runner on a random port, both fixtures:
   checkout → gate (expect FAIL) → reconcile → gate (expect PASS), asserting no `claude`
   process was ever spawned (the runner log has no `agent` lines for the run).
4. **Docs**: README ladder description + run-log addendum.
