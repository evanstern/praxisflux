# 050 — implementation plan

## Constitution check

**This project has no ratified constitution.** `.specify/` is absent (this repo authors
its Spec Kit artifacts by hand under the sweep runbook's operator-signed escape line), so
there is no `constitution.md` to check against. Stating that plainly is the required
substitute — the plan step is not ceremony, so it is checked against the project's actual
grounding instead:

| Grounding doc | What it binds here |
|---|---|
| `docs/wiki/gates-convention.md` | `gates/` never writes to disk; a crashing check becomes a blocking problem, never a silent no-op; roots resolve via `project-root` helpers |
| `docs/skill-patterns.md` §4-5 | the `gates/` vs `scripts/` split; the lifecycle-declaration pattern |
| `docs/wiki/spec-bridge-plugin.md` | one-way derivation: the spec dir is the source of truth, the board is the derived view |
| `CLAUDE.md` | hooks are advisory/opt-in; CI is the authoritative enforcement point |
| `docs/principles.md` | artifact-grounded action — status can never exceed proven artifacts |
| `docs/releasing.md` | released surface ⇒ marketplace bump + edited skill `version:` |

**Conflict found and resolved — state it, do not paper over it.** `CLAUDE.md` says Stop
hooks are *advisory*, while ruling A (c) says this check **blocks**. These are reconciled,
not in tension: the existing `checkBridge` already blocks through the Stop hook today
(`exceeds` → exit 2), so "advisory" describes the hook's *optionality* (it may not be
installed; CI is what guarantees enforcement), not a promise that it never blocks. The new
check adopts exactly the existing posture — blocking where present, guaranteed only in CI.
Record this reading in the shipped doc so the next reader does not re-derive it.

## Approach

### Where the code goes

- `spec-bridge/gates/bridge.mjs` — the new pure evaluator plus its wiring into
  `checkBridge`. Keep the evaluator **pure and separately exported** (like
  `vocabularyProfile` and `planLinkedTask` already are) so tests can drive it without a
  subprocess, and so the Stop hook and the CLI verb share one implementation.
- `spec-bridge/gates/cli.mjs` — the new `verify` verb (R4).
- `spec-bridge/README.md` — the config key.
- `.spec-bridge.json` at the repo root — R7's dogfooding declaration.
- `test/spec-bridge.test.mjs` — the pins.
- `docs/skill-patterns.md`, `docs/wiki/gates-convention.md` — the doctrine.

### Config parsing follows the existing precedent exactly

`loadBridgeConfig` already swallows a malformed file and returns `{}`; `vocabularyProfile`
already returns `null` on absent/malformed/rename-free config. Mirror that shape: a
`projectGates` parser that returns `null` unless at least one validly-shaped gate entry
exists. **Everything downstream must branch on that null the way the vocabulary code
does**, which is what makes R1's byte-identical parity provable rather than hoped for.

### Executing declared commands

- Use `node:child_process` `spawnSync` with **`shell: false` and an argv array**, not a
  shell string — no interpolation, no injection surface. That means the config's
  `command` must be stored or parsed as argv. Prefer declaring it as an array
  (`"command": ["node", "--test"]`) and accept a string only if the implementer confirms a
  safe split; record the choice.
- Run each command with `cwd` = the resolved project root.
- A nonzero exit is a red gate. A command that **cannot execute at all** (ENOENT, spawn
  error) is a **blocking problem naming the gate and the reason** — never treated as
  green. This is the `gate-runner` contract applied one level down.
- Time-box each command and treat a timeout as red-with-reason, so a hung gate cannot
  wedge every Stop.

### Cost containment (the R4 decision)

Recommended: evaluate `required` commands only when some linked task is Done-eligible.
The implementer must **measure** rather than assume — record in the phase notes what an
ordinary Stop costs before and after. If the measurement contradicts the recommendation,
that finding outranks the recommendation; record it and pick accordingly.

### The message AC #1 demands

The blocking message must name **phase, box, and failing gate**. `parseTasks` already
returns per-phase names and counts but **not the individual box texts** — check whether it
does before assuming. If box text is not available, extending the parser to carry it is
in scope (it is what AC #1 requires); doing so must not change any existing derived value,
and the existing `parseTasks` tests must stay green unmodified.

## Risks

- **Silent behavior change for consumers.** The whole feature must be inert without
  config. The parity tests are not optional polish — they are the proof.
- **Extending `parseTasks` is a shared-surface change.** `lib/spec-derive.mjs` feeds both
  the gate and the sync planner. Additive only; never change existing return fields.
- **Recursion hazard.** If a host declares a gate command that itself triggers the Stop
  hook, the hook could re-enter. `runStopHook` already honors `stop_hook_active`, but the
  declared commands run as subprocesses — confirm no path re-enters, and document that
  hosts must not declare a command that invokes the bridge gate.
- **This branch is pin-carrying** (it re-pins `gates-convention.md` and
  `spec-bridge-plugin.md`): merge `origin/main` in, never rebase or squash; the PR lands
  as a merge commit.

## Verification

In the worktree, and again after every history move:

```
node --test
node scripts/check-docs.mjs
node scripts/sync-version.mjs --check
node grounding-wiki/gates/cli.mjs freshness . docs/wiki
node spec-bridge/gates/cli.mjs check .
```

Plus the new `verify` verb against this repo's own `.spec-bridge.json` — the feature must
pass on the repo that produced its field case.
