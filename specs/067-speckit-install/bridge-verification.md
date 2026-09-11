# 067 — bridge verification

Real check, per AC #2: a spec dir generated from the reconciled `.specify/templates/`
(placeholders filled with plausible filler, exactly as `/speckit.specify`/`/speckit.tasks`
would leave them mid-generation) was run through the bridge's own derivation code path.

## Command

```
node spec-bridge/gates/cli.mjs state /tmp/scratch-spec
```

`/tmp/scratch-spec/spec.md` and `/tmp/scratch-spec/tasks.md` were built by copying the
reconciled `spec-template.md` and `tasks-template.md` and substituting their `[###]` /
`[FEATURE NAME]` / `[NUMBER]` / `[DATE]` / runbook-path placeholders — no structural edits,
so the checked-in template shape is exactly what was derived.

## Derived phases (from the JSON `phases` array)

```json
[
  { "name": "Setup (Shared Infrastructure)", "done": 0, "total": 3 },
  { "name": "Foundational (Blocking Prerequisites)", "done": 0, "total": 6 },
  { "name": "User Story 1 - [Title] (Priority: P1) 🎯 MVP", "done": 0, "total": 8 },
  { "name": "User Story 2 - [Title] (Priority: P2)", "done": 0, "total": 6 },
  { "name": "User Story 3 - [Title] (Priority: P3)", "done": 0, "total": 5 },
  { "name": "Phase N: Polish & Cross-Cutting Concerns", "done": 0, "total": 6 }
]
```

`status: "In Progress"`, `stage: "planning"`, `tasksTotal: 34`, `tasksDone: 0` — all derived,
none hand-set. Each `##` heading in the reconciled `tasks-template.md` became a named phase
with its own checkbox count via `parsePhaseList`/`deriveSpecState`; nothing needed template
edits beyond the house header line to parse.

## Verdict

**Pass.** The reconciled templates produce spec/tasks files that `cli.mjs state` derives
into named phases with correct per-phase box counts, with no change to spec-bridge derivation
code — confirming AC #2's "tasks.md produces phased checkbox sections the bridge derives
from" holds for the house-header-reconciled templates. The scratch dir
(`/tmp/scratch-spec/`) was outside `specs/` and has been removed; this file is the retained
verification artifact.
