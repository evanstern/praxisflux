# pdlc — bootstrap a project for the praxis development lifecycle

The suite-level installer. One skill, `bootstrap`, stamps a **new or existing** folder as a
PDLC project:

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

No lifecycle of its own, so no Stop hook — the plugins it wires in bring their own gates.
