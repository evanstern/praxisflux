# pdlc — bootstrap a project for the praxis development lifecycle, then run it

The suite-level installer plus the lifecycle's orchestrator. Three skills:
`bootstrap` stamps a **new or existing** folder as a PDLC project; `sweep` runs a set of
that project's board tasks through the whole lifecycle automatically; `refactor-triage`
closes the loop after a sweep — evaluate the merged work for debt and drift, triage the
findings, and card accepted items back onto the board as sweepable tasks.

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

`refactor-triage` — the post-sweep (and periodic) debt evaluator: sweep → refactor-triage
→ debt tasks → next sweep. Three entry modes — a commit **range** (post-sweep), **whole-repo**
(periodic), or **headless** with a declared triage policy in place of conversation. It
orchestrates `team-review:team-review` as the evaluation engine when installed (the range
and drift framing ride in through the lens; an inline eval pass when absent — team-review
itself is unchanged), and range mode adds an intent-drift pass against the sweep runbook,
merged PR specs, and pinned `docs/wiki/` notes. Every finding gets an accept / reject /
defer disposition with rationale in a tracked triage record
(`docs/reviews/refactor-triage-<run-id>.md`); accepted findings become labeled,
finding-citing backlog tasks via the CLI — immediately sweepable.

```
/pdlc:refactor-triage --range v0.38.0..v0.39.0   # post-sweep: triage the merged range
/pdlc:refactor-triage                            # periodic whole-repo debt pass
/pdlc:refactor-triage --range v0.38.0..v0.39.0 --policy "accept sev≥high, defer rest"   # headless: declared policy, no operator
```

No lifecycle of its own, so no Stop hook — the plugins it wires in bring their own gates
(and `sweep` defers to the host project's own gates per task; `refactor-triage` ships a
prose output gate: no created task without a cited finding, no "triage done" without the
report + triage record on disk).
