# 052 — implementation plan

## Constitution check

**This project has no ratified constitution.** `.specify/` is absent — this repo authors its
Spec Kit artifacts by hand under the sweep runbook's operator-signed escape line
(`pdlc/skills/sweep/SKILL.md`, precondition gate item 1). Stating that plainly is the
required substitute; the plan is checked against the project's actual grounding:

| Grounding doc | What it binds here |
|---|---|
| `docs/design/board-provider-seam.md` | the design of record; its five invariants bind every phase |
| `docs/principles.md` P1 | the mirror is an artifact; staleness must be checkable, not asserted |
| `docs/skill-patterns.md` §5 | `gates/` = read-only checkers · `scripts/` = operational entrypoints · `lib/` = shared chassis |
| `docs/wiki/gates-convention.md` | **fail closed** — a crashing or unparseable check is a blocking problem, never a silent no-op |
| `docs/wiki/chassis.md` | zero-dependency, vendored at build time; `lib/cli.mjs` for dual-use modules |
| `docs/corpus-spec.md` | notes pin `verified_against`; touching `lib/` stales the chassis notes |
| `docs/releasing.md` | `lib/` is **released surface** ⇒ this PR must bump the marketplace version |

**No convention tension to resolve.** Unlike spec 051 (which had to decide where a
`PreToolUse` hook lives), everything here has an established home: a shared module goes in
`lib/`, its dual-use CLI rides `lib/cli.mjs`, and its tests go in `test/`.

## Approach

### Move the parser; do not duplicate it

The single largest correctness risk is **two parsers drifting**. `parseLinkedTask` currently
lives in `bridge.mjs:243` and is the only reader of a Backlog task file. Copying it into the
chassis would create a second definition that silently diverges the first time either is
patched.

So: **move it, then re-export.** `lib/board-mirror.mjs` owns `parseLinkedTask` and the
tasks-dir scan; `bridge.mjs` gets

```js
export { parseLinkedTask, findLinkedTasks } from "../lib/board-mirror.mjs";
```

Every existing import site — `gates/cli.mjs`, `test/spec-bridge.test.mjs`, anything
downstream — keeps resolving. AC #7 is satisfied structurally rather than by discipline, and
AC #9 (existing tests pass unedited) becomes the mechanical proof that the move was faithful.

Check the symlink shape before assuming the import path: plugins reach `lib/` via a
spec-sanctioned symlink (`docs/wiki/chassis.md`, TASK-15), which is why `bridge.mjs` already
imports `../lib/spec-derive.mjs`. Use the same relative form.

### Determinism is a testable property, not an intention

R5's `--check` compares **bytes**, so `writeMirror` must be deterministic to the byte.
Concretely:

- `JSON.stringify` with an **explicit key order**, not object-insertion order — build the
  output object field by field in schema order.
- 2-space indent, trailing newline (match the repo's existing JSON: `.spec-bridge.json`,
  `.pdlc`).
- `links` sorted by **natural** id order. `TASK-9` must precede `TASK-10`, and `TASK-6.2`
  must precede `TASK-6.10`. String sort gets this wrong. Write the comparator explicitly and
  test it against those exact pairs — the board really does have dotted ids
  (`TASK-1.2`, `TASK-6.6`, `TASK-35.1`).
- `generatedAt` is a timestamp, so it is **excluded from the byte comparison**: `--check`
  compares the recomputed mirror against the on-disk one with `generatedAt` normalized on
  both sides. Say this in the module header — a reader who assumes a full-file diff will be
  confused by the first passing check.

Use `lib/dates.mjs` for timestamps rather than inlining `new Date().toISOString()` — the
chassis already centralizes this (`docs/wiki/chassis-utilities.md`).

### Staleness borrows the freshness gate's mechanism

Do not invent an ancestry check. `grounding-wiki`'s freshness gate already answers "is this
pin reachable from HEAD" with `git` via `spawnSync`. Read that implementation first
(`grounding-wiki/gates/`) and mirror its shape: `shell: false`, argv array, and a
**fail-closed** default when git is unavailable or the sha is unknown.

The three fail-closed cases R3 names are the ones that bite in practice:

1. sha not an ancestor — the mirror was observed on rewritten or foreign history;
2. sha absent on a `requiresSync` provider — a Jira mirror with no receipt is not evidence;
3. not a git repo — no ancestry answer exists, so no honest claim of freshness exists.

### The provider registry stays a plain object

Two providers, one of which does not exist yet, does not justify a class hierarchy or a
plugin-loading mechanism. A module-level object literal keyed by provider name, exported so
spec 056 adds `jira` by adding one key:

```js
export const providers = {
  backlog: { requiresSync: false, project: projectBacklog },
};
```

`requiresSync: true` providers have `project: null` — the *type* is what tells `--check` it
cannot recompute. No `if (provider === "jira")` anywhere.

### Exit codes and the CLI

`lib/cli.mjs`'s `runAsCli` guard (symlink-safe — that is why it exists, per
`docs/wiki/chassis-utilities.md`). Codes per the repo's gate convention: `0` clean, `1`
findings, `2` env error. Match `spec-bridge/gates/cli.mjs`'s output shape so the two read
alike.

## Phasing rationale

Four phases, each a dispatch unit with a real artifact boundary:

1. **Schema + read/write/validate** — the file format and its guards, no projector yet.
   Testable in isolation against fixtures.
2. **The move** — relocate the parser, re-export, prove the existing suite passes unedited.
   Deliberately its own phase: it is the highest-risk, lowest-creativity slice, and a
   failure here must not be tangled with new-feature failures.
3. **Staleness + registry + projector** — the git ancestry check and `backlog`'s projection.
4. **The `--check` CLI + dogfood** — the CLI, then generate this repo's own mirror and
   verify it against `findLinkedTasks(".")`.

Phase 2 before phase 3 is deliberate: the projector in phase 3 *uses* the moved parser, so
the move must already be proven when it lands.

## Risks

| Risk | Mitigation |
|---|---|
| The moved parser subtly changes behavior | AC #9: the three existing test files pass **unedited**. Do not touch them; if one fails, the move is wrong, not the test. |
| Natural sort gets dotted ids wrong | Explicit comparator + tests on `TASK-9/TASK-10` and `TASK-6.2/TASK-6.10`, taken from the real board. |
| `generatedAt` makes `--check` always fail | Normalize it on both sides before comparing; state this in the header. |
| `lib/` is released surface | Bump the marketplace version in this PR (`docs/releasing.md`); `scripts/sync-version.mjs` stamps the rest. |
| Chassis wiki notes go stale | Same-PR re-pin per AC #10; the `wiki-freshness` gate is `redByConstruction` in `.spec-bridge.json`, so it is legitimately red until that commit — and must be green by Done. |

## Verification

- `node --test` green (the repo's `tests` project gate).
- `node scripts/check-docs.mjs` green.
- `node scripts/sync-version.mjs --check` green.
- `node lib/board-mirror.mjs --check --root .` green on a freshly generated mirror, and
  nonzero after a deliberate one-character edit to it.
- `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` green **by Done** (red mid-PR is
  sanctioned and declared).
