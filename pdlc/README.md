# pdlc — bootstrap a project for the praxis development lifecycle, then run it

The suite-level installer plus the lifecycle's orchestrator. Two skills:
`bootstrap` stamps a **new or existing** folder as a PDLC project; `sweep` runs a set of
that project's board tasks through the whole lifecycle automatically.

`bootstrap`:

- Plants the always-on grounding into the project's `CLAUDE.md` — the praxisflux loop, each
  plugin's role and entry skill, the gates principle, the `.handoff/` transport — inside
  `<!-- pdlc:grounding BEGIN/END -->` markers, so an existing `CLAUDE.md` is appended to,
  never clobbered, and updates refresh the block wholesale (drift is diffed and confirmed,
  never silently overwritten).
- Gitignores `.handoff/` and stamps a `.pdlc` sentinel recording the plugin version and peer
  choices (the marker `installMode` keys fresh vs. update on).
- Treats **Backlog.md** and **GitHub Spec Kit** as officially supported peer utilities:
  recommends installing them when their CLIs are absent; when present, asks the user to opt
  in and, on opt-in, runs their init (`backlog init` / `specify init`, skipping when
  `backlog/` or `.specify/` already exist) and plants their convention blocks.

Deterministic planting lives in `scripts/plant.mjs` (chassis: `lib/installer.mjs`,
`lib/template.mjs`); the skill supplies the judgment around it. Phase separation holds:
bootstrap sets the table and hands off to `wiki-build`, `spec-bridge:link`, and
`codebase-to-course` — it never invokes them.

```
/pdlc:bootstrap          # fresh install, or idempotent update after a plugin upgrade
```

`sweep` — the board-sweep orchestrator. Given a set of board tasks (ids, a label, or a
synthesis doc naming them), it **authors a dependency-laned runbook** — develop-parallel /
merge-serial lanes, model tiers per the host rubric, the project's per-PR gates enumerated,
concurrency doctrine for repos with other agents live, operator checkpoints, done-means —
commits it to `docs/design/<slug>-runbook.md`, and stops for operator sign-off. Given an
**existing signed-off runbook**, it executes: per task, spec → `spec-bridge:link` → worktree
→ delegated implementation → PR → serial merge → re-ground, logging each landing in the
runbook so a fresh session can resume the sweep from the runbook + board alone. A runbook is
an instruction-bearing artifact, so the adopt path refuses one that isn't verifiably
signed-off, committed, and board-backed.

```
/pdlc:sweep TASK-12 TASK-13 TASK-15            # author the runbook, stop at sign-off
/pdlc:sweep docs/design/payments-runbook.md    # adopt + execute a signed-off runbook
```

No lifecycle of its own, so no Stop hook — the plugins it wires in bring their own gates
(and `sweep` defers to the host project's own gates per task).
