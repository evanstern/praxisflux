# 052 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Schema, read/write, validate

- [x] Read `spec-bridge/gates/bridge.mjs` in full and record in Notes: every consumer of
      `findLinkedTasks`, and the exact per-task shape each one uses
- [x] Read `lib/cli.mjs`, `lib/dates.mjs`, and one existing chassis module for house style
      (header-comment depth, export shape, error handling)
- [x] Create `lib/board-mirror.mjs` with the schema documented in the header comment,
      including the explicit note that `generatedAt` is excluded from `--check`'s byte
      comparison
- [x] Implement `readMirror(root)`: `null` when absent; **throws** on malformed JSON and on
      an unknown `schema` integer
- [x] Implement `writeMirror(root, mirror)`: explicit schema key order, 2-space indent,
      trailing newline, `links` sorted by a natural-id comparator
- [x] Implement the natural-id comparator and test it on `TASK-9`/`TASK-10` and
      `TASK-6.2`/`TASK-6.10` (real board shapes — dotted subtask ids exist)
- [x] Implement unknown-key round-tripping: unrecognized top-level and per-link keys survive
      a read→write cycle unchanged
- [x] Implement `validateMirror(mirror)` covering: missing required field, wrong type,
      duplicate `id`, duplicate `specDir`, non-monotonic `acs` index
- [x] `test/board-mirror.test.mjs` — cover ACs 2, 3, 4 (including the throw assertions, not
      just absence)
- [x] Commit

## Phase 2 — Move the parser, prove nothing broke

- [ ] Move `parseLinkedTask` and the `backlog/tasks/*.md` scan from
      `spec-bridge/gates/bridge.mjs` into `lib/board-mirror.mjs` — **move, never copy**
      (two parsers will drift; that is the risk this phase exists to eliminate)
- [ ] Re-export from `bridge.mjs`:
      `export { parseLinkedTask, findLinkedTasks } from "../lib/board-mirror.mjs";`
      using the same relative form `bridge.mjs` already uses for `spec-derive.mjs`
- [ ] Grep every import site of both symbols across the repo and confirm each still resolves
      (`gates/cli.mjs`, tests, any downstream reference)
- [ ] Run `node --test` — **`test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, and
      `test/phase-status.test.mjs` must pass with zero edits to those files** (AC #9). A
      failure here means the move is wrong; fix the move, never the test
- [ ] Record in Notes: what moved, what re-exports, and the test-count before/after
- [ ] Commit

## Phase 3 — Staleness, provider registry, the Backlog projector

- [ ] Read `grounding-wiki/gates/` freshness implementation and record the exact git
      invocation shape it uses for ancestry (argv, `shell: false`, failure handling)
- [ ] Implement `mirrorStaleness(root, mirror, { headSha })` with the three fail-closed
      cases: non-ancestor sha, absent sha on a `requiresSync` provider, non-git root
- [ ] Implement the `providers` registry as a module-level object literal;
      `backlog: { requiresSync: false, project: projectBacklog }`
- [ ] Implement `projectBacklog(root)` on the moved parser — returns the `links` array
- [ ] Confirm no `if (provider === "...")` branch exists anywhere: the `requiresSync` flag
      and a null `project` carry the distinction
- [ ] Tests for AC #5 (all three staleness cases) and AC #6 (projector matches
      `findLinkedTasks(".")` entry-for-entry on `id`, `status`, `specDir`, `acs`)
- [ ] Commit

## Phase 4 — The `--check` CLI, dogfood, and re-ground

- [ ] Implement the CLI via `lib/cli.mjs`'s `runAsCli` guard:
      `node lib/board-mirror.mjs --check --root <dir>`
- [ ] `requiresSync: false` → recompute and compare bytes with `generatedAt` normalized on
      both sides; nonzero exit names the drifted ids
- [ ] `requiresSync: true` → validate + staleness only (cannot recompute)
- [ ] No mirror → exit **0** with the stated "no mirror; nothing to check" line
- [ ] Exit codes: `0` clean, `1` findings, `2` env error — matching
      `spec-bridge/gates/cli.mjs`'s convention and output shape
- [ ] Tests for AC #8: nonzero after a one-status hand edit (assert the message names that
      id), 0 on freshly written, 0 when absent
- [ ] **Dogfood:** generate this repo's own `.board/links.json` and verify it against
      `findLinkedTasks(".")`; commit the generated mirror
- [ ] Bump the marketplace version (`lib/` is released surface) and run
      `node scripts/sync-version.mjs` to stamp the rest
- [ ] Re-pin every `docs/wiki/` note whose `sources:` this change touches — at minimum
      `chassis`, `spec-bridge-plugin`; classify each pin **RE-PIN-ONLY** or **NEEDS-REVIEW**
      per the sweep's honest-re-pins rule and amend prose before bumping where needed
- [ ] Update `docs/wiki/INDEX.md` if a new note was added; run
      `node scripts/check-docs.mjs`
- [ ] All four project gates green: `node --test`, `check-docs.mjs`,
      `sync-version.mjs --check`, and `grounding-wiki/gates/cli.mjs freshness . docs/wiki`
- [ ] Commit

## Notes

(Implementers append findings here — decisions, reproductions, and the records the phases
above ask for. This section is the phase-to-phase handoff artifact; nothing rides chat.)

### Phase 1 (implementer: sonnet tier, cc/claude-sonnet-5[1m])

**`findLinkedTasks` consumers in `spec-bridge/gates/bridge.mjs`** (all in this one file;
`gates/cli.mjs` calls `checkBridge`/`verifyBridge`/`planBridge`, never `findLinkedTasks`
directly):
- `checkBridge(root, ...)` — iterates `findLinkedTasks(root)`, uses `task.id`, `task.status`,
  `task.specDir`, `task.acs` (via `derived`/`verdict`/`shortfall`); does not use `task.file`.
- `verifyBridge(root, ...)` — same iteration; uses `task.id`, `task.specDir`, and
  `phaseBoxes` derived from `task.specDir` — does not touch `task.acs` or `task.file`
  directly (phase boxes come from `deriveSpecState`, not from the task).
- `planBridge(root)` — same iteration; uses `task.id`, `task.status`, `task.acs` (via
  `planLinkedTask`) and `task.specDir`. Does not use `task.file`.
- Per-task shape actually consumed everywhere: `{ id, status, specDir, acs }` — exactly R1/R2's
  claim that `file` is the only field the mirror's `links[]` entry drops.
- `parseLinkedTask(raw)` returns `{ id, status, specDir, acs }` (no `file`); `findLinkedTasks`
  is the one place that adds `file: join(dir, name)` before pushing. This confirms Phase 2's
  move is a straight relocation — no other bridge.mjs code depends on `file`.

**House style taken from `lib/cli.mjs`, `lib/dates.mjs`, `lib/project-root.mjs`,
`spec-bridge/gates/bridge.mjs`, `spec-bridge/gates/cli.mjs`:** file-header block comment
explaining the module's one job and its non-obvious invariants; named exports only (no default
export anywhere in `lib/`); small pure functions; errors as thrown `Error` with a message
naming the offending path/value, never a bare string throw; dual-use CLI modules gate their
CLI body behind `runAsCli(import.meta.url)`. Followed all of these in `board-mirror.mjs`
(the CLI body itself is Phase 4's job, not this phase's — this module currently exports no
CLI at all).

**Deviations / choices not spelled out verbatim in the spec:**
- Exported `mirrorPath(root)` (returns `<root>/.board/links.json`) even though the spec only
  names `readMirror`/`writeMirror`/`validateMirror` — it's a one-line helper used internally by
  both read and write, and Phase 3 (staleness) / Phase 4 (`--check` CLI) will need the same
  path, so it's exported rather than duplicated three times across the module.
- `readMirror`'s unknown-schema check is `parsed?.schema !== CURRENT_SCHEMA` (strict equality
  against `1`), not a range/floor check — R1 says "an unknown schema is a hard error", and with
  exactly one schema version defined so far, "unknown" == "not exactly 1". If a future schema
  bump needs migration-on-read instead of hard-reject, that's a deliberate decision for whoever
  adds schema 2, not inferable from this spec.
- `validateMirror`'s "missing required field" and "wrong type" checks share one `req()` helper
  that reports both as the same message shape (`"<field>: expected <type>, got <actual>"`),
  since AC #4 doesn't require distinct message text for the two cases — only that both are
  caught.
- `orderedObject()` (the key-ordering helper behind `writeMirror`'s determinism) preserves
  unknown keys in their **original enumeration order** appended after the known keys, rather
  than alphabetizing them. This is what makes unknown-key round-tripping automatic (nothing
  strips or reorders keys `readMirror` didn't put there) without needing separate
  round-trip-preserving logic.

**For Phase 2 (the move):** `board-mirror.mjs` currently has no `parseLinkedTask` or
`findLinkedTasks` — those still live only in `bridge.mjs`. Phase 2 moves them into this file
and adds the re-export line to `bridge.mjs`. No naming collision to worry about: this phase's
exports are `CURRENT_SCHEMA`, `mirrorPath`, `compareIds`, `readMirror`, `writeMirror`,
`validateMirror` — none of which exist in `bridge.mjs` today.

**Test count:** baseline 449 passing (per dispatch brief) → 458 passing after this phase (9
new tests in `test/board-mirror.test.mjs`), 0 failing. `node scripts/check-docs.mjs` initially
failed (`README.md: chassis module 'board-mirror' ... is not named in the chassis section`) —
fixed by adding `board-mirror` to the `## Shared chassis (lib/)` list in `README.md`
(check-docs enforces this list is in sync with `lib/`, and it fails the same way for any new
chassis module, not something specific to this spec). Left `docs/wiki/` untouched per the
dispatch brief — that re-pin is explicitly Phase 4's job.

**Confirmed for later phases:** the dispatch brief's NUL-byte warning on
`spec-bridge/gates/bridge.mjs` is real and reproduced here. Plain `grep -n "MARKER"
spec-bridge/gates/bridge.mjs` prints **nothing at all** and exits `1` (not even a "binary file
matches" notice) — it looks exactly like "no match", not "grep skipped this file". `grep -na`
finds the NUL byte at line 217 (inside `memoizeRun`'s `command.join(" ")` — an actual NUL
character embedded in that source line, not a display artifact) and `grep -na "MARKER"`
correctly returns both real matches (lines 258, 270). **Phase 2 must use `grep -a`/`grep -na`
for every import-site grep of `parseLinkedTask`/`findLinkedTasks`** — plain `grep` against this
file will silently under-report and could let a broken re-export ship undetected.
