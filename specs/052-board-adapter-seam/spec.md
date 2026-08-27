# 052 — The board mirror: one tracked interface for every ticketing system

Board task: **TASK-109** · epic: **TASK-108** · design of record:
`docs/design/board-provider-seam.md` · governing ruling: **operator ruling, 2026-08-27 —
unify the mirror for ALL board types, not just Jira**

## Problem

`spec-bridge`'s honesty gate reads the board as **files on disk**. `findLinkedTasks(root)`
(`spec-bridge/gates/bridge.mjs:264`) does `readdirSync(join(root, "backlog", "tasks"))`,
parses each `.md`, and returns `{ id, status, specDir, acs, file }`. Every consumer —
`checkBridge`, `verifyBridge`, `planBridge`, `bridgeGate` — is built on that one function.

This is why the gate works in CI: it needs nothing but `node` and a working tree.

It is also why the gate **cannot see a Jira board**. Jira is an HTTP resource behind auth,
reachable only through the Atlassian **MCP tools**, which are model-callable only: no Node
script can invoke them, and CI holds no Atlassian credentials. Under Jira,
`findLinkedTasks` finds no `backlog/tasks/` and returns `[]`.

Worse, the failure is **silent**. `bridgeGate.resolveRoots` keys on `hasChild("backlog")`
(`bridge.mjs:561`), so a Jira-only host resolves **zero roots**, the gate reports no
problems, and the Stop hook passes. The suite's central promise — "a status can never
exceed the artifacts that prove it", enforced *impossibly-in-CI* per `CLAUDE.md` — quietly
becomes unenforced for that host, with no message saying so.

## Requirements

### R1 — A tracked mirror file with a versioned schema

`.board/links.json` at the project root, **tracked in git** (it is evidence, not transport
— contrast `.handoff/`, which is gitignored). Shape:

```json
{
  "schema": 1,
  "provider": "backlog",
  "generatedAt": "2026-08-27T14:02:11.000Z",
  "links": [
    {
      "id": "TASK-109",
      "status": "In Progress",
      "specDir": "specs/052-board-adapter-seam",
      "acs": [ { "index": 1, "checked": true,  "text": "Spec phase: Seam" },
               { "index": 2, "checked": false, "text": "Spec phase: Projector" } ],
      "observedAt": "2026-08-27T14:02:11.000Z",
      "observedSha": "2e45816"
    }
  ]
}
```

- `id`, `status`, `specDir`, `acs` are **exactly** `findLinkedTasks`' current per-task shape
  minus `file`. This is the whole point: the verdict engine's input is unchanged in
  substance, so spec 053 swaps the input without touching the logic.
- `observedAt` / `observedSha` exist for providers whose projection needs a model. A
  deterministic provider MAY set them; nothing requires it to.
- `schema` is an integer. An unknown `schema` is a **hard error**, never a silent
  best-effort parse — this is the fail-closed rule from `docs/wiki/gates-convention.md`.
- Unknown top-level or per-link keys are **preserved on read and rewritten on write**, so a
  future provider can add fields without this version destroying them.

### R2 — `lib/board-mirror.mjs`: read, write, validate

A new chassis module. Zero dependencies, pure Node, no network (`lib/README.md` convention).
It exports:

- `readMirror(root)` → `{ schema, provider, generatedAt, links, ...rest }`, or `null` when
  `.board/links.json` is absent. **Malformed JSON, or a `schema` this version does not know,
  throws** — a broken mirror is a blocking problem, never an empty board.
- `writeMirror(root, mirror)` → writes deterministically: stable key order, `links` sorted by
  `id` using the same natural ordering the board uses (`TASK-9` before `TASK-10`), trailing
  newline. Determinism is not cosmetic — R5's `--check` compares bytes.
- `validateMirror(mirror)` → `string[]` of human-readable problems, empty when valid. Checks
  every required field's presence and type, `acs` index monotonicity, and that no two links
  share an `id` or a `specDir` (one card per spec dir is the bridge's existing contract, per
  `spec-bridge/skills/link/SKILL.md` — "never create a second one").

### R3 — Staleness is data the gate can read

`mirrorStaleness(root, mirror, { headSha })` → `{ stale, reason }`. A mirror is stale when:

- `observedSha` on any link is **not an ancestor of** `HEAD` (the mirror was observed on a
  history this working tree no longer contains), or
- `observedSha` is absent **and** the provider is declared as needing a model (R4's
  `requiresSync: true`).

The ancestry test uses `git merge-base --is-ancestor` via `spawnSync` — the same mechanism
`grounding-wiki`'s freshness gate already uses for pins. Outside a git repo, or when the sha
is unknown to this repo, staleness is **`true` with a stated reason** (fail closed).

### R4 — A provider registry, with `backlog` as the first projector

`providers` maps a provider name to `{ requiresSync, project }`:

- `requiresSync: false` — the projection is deterministic and can be recomputed by `node`
  alone. `project(root)` returns the `links` array.
- `requiresSync: true` — the projection needs a model (MCP). `project` is `null`; refresh is
  a skill's job, and `--check` can only assess staleness, never recompute.

`backlog` ships as `{ requiresSync: false, project }` where `project(root)` is
**`findLinkedTasks`' parsing logic, moved to the chassis**. The parser moves rather than
being duplicated: `parseLinkedTask` and the `backlog/tasks/*.md` scan relocate from
`spec-bridge/gates/bridge.mjs` into this module, and `bridge.mjs` re-exports them so no
existing caller or test breaks.

### R5 — `--check` mechanizes drift for deterministic providers

`node lib/board-mirror.mjs --check --root <dir>` (dual-use CLI via `lib/cli.mjs`, the
chassis convention):

- provider `requiresSync: false` → **recompute** the projection, write it to a buffer, and
  compare **byte-for-byte** against the on-disk mirror. Any difference exits nonzero and
  prints a unified-diff-style summary naming the drifted ids. This is what makes a
  hand-edited Backlog mirror impossible to sneak past CI.
- provider `requiresSync: true` → cannot recompute; run `validateMirror` + `mirrorStaleness`
  and exit nonzero on invalid or stale.
- No mirror at all → exit **0** with a stated "no mirror; nothing to check" line. A project
  that has not adopted the seam is not in violation of it.

Exit codes follow the repo's gate convention: `0` clean, `1` findings, `2` env error
(unreadable root, unknown provider).

### R6 — Backlog.md hosts see zero behavior change

This spec adds a module and moves a parser. It changes **no verdict, no message, and no
planned command**. `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, and
`test/phase-status.test.mjs` must pass **unmodified** — that is the acceptance evidence, not
a claim in prose.

## Non-goals

- **Does not** change `bridge.mjs`'s inputs. Reading the mirror instead of the directory is
  spec **053**. This spec only makes the mirror exist and be trustworthy.
- **Does not** add the Jira provider. That is spec **056**.
- **Does not** put a network call anywhere in `lib/`. Ever.
- **Does not** make the mirror authoritative. It is a receipt; the provider is the plan of
  record.

## Acceptance criteria

1. `.board/links.json` schema documented in the module header and implemented as R1
   describes, with unknown keys round-tripping intact.
2. `readMirror` returns `null` for absent, and **throws** for malformed JSON or unknown
   `schema` — proven by a test asserting the throw, not the absence.
3. `writeMirror` is byte-deterministic: writing the same logical mirror twice produces
   identical bytes, and `links` sort naturally (`TASK-9` < `TASK-10`).
4. `validateMirror` catches each of: missing required field, wrong type, duplicate `id`,
   duplicate `specDir`, non-monotonic `acs` index.
5. `mirrorStaleness` returns `stale: true` with a reason for a non-ancestor `observedSha`,
   an absent sha on a `requiresSync` provider, and a non-git root.
6. The `backlog` projector reproduces, for this very repo, a mirror whose `links` match
   `findLinkedTasks(".")` entry-for-entry on `id`, `status`, `specDir`, and `acs`.
7. `parseLinkedTask` and the tasks-dir scan live in `lib/board-mirror.mjs`, and
   `bridge.mjs` re-exports them; every existing import site still resolves.
8. `--check` exits nonzero on a hand-edited Backlog mirror (test mutates one status and
   asserts the failure names that id), exits 0 on a freshly written one, and exits 0 with
   the stated line when no mirror exists.
9. `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, `test/phase-status.test.mjs`
   pass **with no edits to those files**.
10. A new `test/board-mirror.test.mjs` covers ACs 2–8, and `docs/wiki/` is re-pinned for
    every note whose `sources:` this change touches (`chassis`, `spec-bridge-plugin`, and
    any note listing `lib/` or `bridge.mjs`).
