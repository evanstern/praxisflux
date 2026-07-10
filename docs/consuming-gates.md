# Consuming praxis gates from another repo

praxis's gates — "status can't exceed proven artifacts" — are enforceable in repos that don't
carry praxis itself. There are two enforcement points, deliberately split the same way praxis
splits them for its own development:

- **Locally / interactively**: the installed plugins' Stop hooks run the gates as you work.
  These float with plugin updates and are advisory.
- **In CI**: the composite GitHub Action runs the same gates at a **pinned release**. CI is
  authoritative. Pin drift between local and CI is fine by design.

## The action

```yaml
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0        # wiki-freshness resolves pins through git history
      - uses: evanstern/praxis@v0.4.0
        with:
          gates: spec-bridge, wiki-freshness
```

GitHub fetches the praxis tree at the pinned tag onto the runner and the action runs
`scripts/run-gates.mjs` from it against your workspace — no install step, no dependencies
(the gates are zero-dependency Node, and every runner ships node). Upgrade by bumping the
tag; Dependabot's `github-actions` ecosystem automates that.

### Inputs

| input        | default       | meaning |
|--------------|---------------|---------|
| `gates`      | *(required)*  | Comma-separated: `spec-bridge`, `wiki-freshness`, `course`. An unknown name fails the build — gates never skip silently. |
| `path`       | `.`           | Repository root to check, relative to the workspace. |
| `wiki-dir`   | `docs/wiki`   | Grounded-corpus directory for `wiki-freshness`. |
| `course-dir` | `docs/course` | Built course directory for the `course` gate. |

### The gates

- **`spec-bridge`** — every Backlog task linked to a Spec Kit spec dir carries a status its
  spec artifacts prove (needs a `backlog/` dir; passes trivially with zero linked tasks).
- **`wiki-freshness`** — every `docs/wiki` note is fresh against its `verified_against` pin
  (needs full git history: `fetch-depth: 0`; a shallow clone fails with exactly that fix).
- **`course`** — a built codebase-to-course course passes its output gate (self-contained,
  quizzes/translations per module, current chrome stamp).

## The contract

Gate names, inputs, and exit codes (0 all pass · 1 any gate failed · 2 usage error) are
praxis's versioned consumer interface, released and semver-bumped like everything else
(`docs/releasing.md`); each failure line names its fix. You can also invoke the runner
directly from any praxis checkout:

```sh
node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness --path /path/to/repo
```

## Planned: `@praxis/gates` on npm

The action's internals will move to an npm package (`npx @praxis/gates …`) so non-GitHub CI
and one-off local use get the same surface — with **no change** to the `uses:` line above.
The migration path is documented in Backlog **TASK-17**; the contract in this file is what
that migration preserves.
