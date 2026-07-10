---
name: gates-convention
description: The cross-cutting pattern that a declared status can never exceed the on-disk artifacts that prove it, enforced by lifecycle declarations plus a Stop hook.
kind: pattern
sources:
  - docs/skill-patterns.md
  - lib/lifecycle.mjs
  - lib/gate-runner.mjs
verified_against: 54964eac9c3ecc9c8e7f1b0e5563ded19d8d1ef9
---

# Gates convention

praxis's central integrity rule: **a status can't exceed the artifacts that prove it**. Every
plugin that tracks progress declares an ordered lifecycle and the disk evidence each state
requires; a Stop hook makes the declaration binding by refusing to let the model finish while
any item's status outruns its evidence. The convention is documented in `docs/skill-patterns.md`
(sections 4-5) and implemented by the two chassis modules below.

## How it works

**Lifecycle declarations** (`lib/lifecycle.mjs`). `createLifecycle({ states, artifacts, requires })`
takes an ordered array of status names (index = rank), a map of artifact keys to filenames, and a
map of state to required artifact keys. `computeArtifacts(dir, artifactFiles)` derives presence
booleans from disk with `existsSync`. The returned `check(dir, status, extraRequires)` collapses
all in-force requirements to the earliest state demanding each key, then reports a problem string
for every required artifact missing on disk — e.g. `status=done implies 'built' but required
artifact 'spec' (SPEC.md) is missing on disk`. `extraRequires` lets a caller add dynamically
required artifacts, such as handoff evidence for a delegated build. Vocabulary stays per-plugin
(educate: scaffolded…done; research: branch → analyzed → rendered); only the mechanism is shared.

**Stop-hook enforcement** (`lib/gate-runner.mjs`). A gate is
`{ name, resolveRoots(startDir) -> string[], check(root) -> problems[], warn?(root) -> notices[] }`.
The pure core `evaluate(input, gates)` returns `{ block, message, warnings }`; the harness
`runStopHook({ gates })` reads the Stop-hook JSON from stdin and exits 0 (allow) or 2 (block,
problems on stderr). Key behaviors:

- Honors `stop_hook_active: true` — never blocks a second time, preventing loops.
- The start directory is `CLAUDE_PROJECT_DIR`, else the hook input's `cwd`, else `process.cwd()`.
- **A gate that resolves no roots is a no-op** — the hook never fires outside its own project
  type, so each plugin ships its own hook and gates compose additively across installed plugins.
- A crashing `check` becomes a blocking problem naming the gate and root; `warn` notices are
  best-effort, surfaced on stderr, and never block (used for freshness reminders).

**Directory convention** (uniform across plugins, per `docs/skill-patterns.md` section 5):

- `<plugin>/gates/` — read-only verification logic (the "is this valid?" checkers) and any
  skill-invoked gate CLI. **gates/ never writes to disk.**
- `<plugin>/scripts/` — operational entrypoints only: the Stop-hook shim (`gate.sh`) plus its
  entry (`stop.mjs`), and any state-mutating tracker CLI (educate's `progress.mjs`).

Gate scripts live once in the plugin, referenced as `${CLAUDE_PLUGIN_ROOT}/…` — never copied
into the user's project. The `gate.sh` shims resolve `node` via `command -v` with a
login-shell fallback (Stop hooks run in a minimal non-login shell where nvm/volta/Homebrew
paths may be absent) and exit 0 when node is unavailable — a missing runtime never blocks Stop.

**Judgment steps need evidence plus durable residue, never a bare flag.** Educate's return leg
requires both `handoff.foldedIn` in `progress.json` *and* a `## Post-build` section on disk, so
the most-skipped step can't be rubber-stamped by setting a boolean.

## Connections

- Implemented by [[lifecycle-engine]] (the status-vs-evidence checker) and [[gate-runner]]
  (the Stop-hook harness), both part of the [[chassis]].
- Instantiated in [[research-plugin]], [[educate-plugin]], [[grounding-wiki-plugin]],
  [[codebase-to-course-plugin]], and [[spec-bridge-plugin]] (whose whole premise is this rule
  applied to Spec Kit artifacts), each with its own state vocabulary and gates.
- Two more instances of "artifacts prove status": codebase-to-course's versioned chrome
  (the course gate fails fossilized chrome stamps) and the repo's own release pipeline
  (CI refuses released-surface diffs whose version didn't bump — see [[build-and-release]]).
- Roots resolve via [[project-root]] helpers (`findRootUpwards` / `findRootsDownwards`).
- The wider skill shape (precondition gate → work → output gate) is described in
  [[skill-patterns]]; handoff evidence rules live in [[handoff-protocol]].
- Exercised by the [[test-suite]] (gate tests per plugin plus `evaluate` unit tests).

## Operational notes

- Stop-hook contract: stdin JSON `{ stop_hook_active, cwd, … }`; exit 0 allows the stop, exit 2
  blocks with stderr as the message the model sees.
- `CLAUDE_PROJECT_DIR`, when set, overrides the hook input's `cwd` as the search start.
- `readStdin` resolves to an empty string on a TTY, so a hook entry is safe to run by hand.
- Warnings never block: blocking problems win, otherwise warnings print to stderr and the hook
  still exits 0.
