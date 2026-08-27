# 052 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Schema, read/write, validate

- [ ] Read `spec-bridge/gates/bridge.mjs` in full and record in Notes: every consumer of
      `findLinkedTasks`, and the exact per-task shape each one uses
- [ ] Read `lib/cli.mjs`, `lib/dates.mjs`, and one existing chassis module for house style
      (header-comment depth, export shape, error handling)
- [ ] Create `lib/board-mirror.mjs` with the schema documented in the header comment,
      including the explicit note that `generatedAt` is excluded from `--check`'s byte
      comparison
- [ ] Implement `readMirror(root)`: `null` when absent; **throws** on malformed JSON and on
      an unknown `schema` integer
- [ ] Implement `writeMirror(root, mirror)`: explicit schema key order, 2-space indent,
      trailing newline, `links` sorted by a natural-id comparator
- [ ] Implement the natural-id comparator and test it on `TASK-9`/`TASK-10` and
      `TASK-6.2`/`TASK-6.10` (real board shapes — dotted subtask ids exist)
- [ ] Implement unknown-key round-tripping: unrecognized top-level and per-link keys survive
      a read→write cycle unchanged
- [ ] Implement `validateMirror(mirror)` covering: missing required field, wrong type,
      duplicate `id`, duplicate `specDir`, non-monotonic `acs` index
- [ ] `test/board-mirror.test.mjs` — cover ACs 2, 3, 4 (including the throw assertions, not
      just absence)
- [ ] Commit

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
