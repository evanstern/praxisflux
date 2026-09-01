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

- [x] Move `parseLinkedTask` and the `backlog/tasks/*.md` scan from
      `spec-bridge/gates/bridge.mjs` into `lib/board-mirror.mjs` — **move, never copy**
      (two parsers will drift; that is the risk this phase exists to eliminate)
- [x] Re-export from `bridge.mjs`:
      `export { parseLinkedTask, findLinkedTasks } from "../lib/board-mirror.mjs";`
      using the same relative form `bridge.mjs` already uses for `spec-derive.mjs`
- [x] Grep every import site of both symbols across the repo and confirm each still resolves
      (`gates/cli.mjs`, tests, any downstream reference)
- [x] Run `node --test` — **`test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, and
      `test/phase-status.test.mjs` must pass with zero edits to those files** (AC #9). A
      failure here means the move is wrong; fix the move, never the test
- [x] Record in Notes: what moved, what re-exports, and the test-count before/after
- [x] Commit

## Phase 3 — Staleness, provider registry, the Backlog projector

- [x] Read `grounding-wiki/gates/` freshness implementation and record the exact git
      invocation shape it uses for ancestry (argv, `shell: false`, failure handling)
- [x] Implement `mirrorStaleness(root, mirror, { headSha })` with the three fail-closed
      cases: non-ancestor sha, absent sha on a `requiresSync` provider, non-git root
- [x] Implement the `providers` registry as a module-level object literal;
      `backlog: { requiresSync: false, project: projectBacklog }`
- [x] Implement `projectBacklog(root)` on the moved parser — returns the `links` array
- [x] Confirm no `if (provider === "...")` branch exists anywhere: the `requiresSync` flag
      and a null `project` carry the distinction
- [x] Tests for AC #5 (all three staleness cases) and AC #6 (projector matches
      `findLinkedTasks(".")` entry-for-entry on `id`, `status`, `specDir`, `acs`)
- [x] Commit

## Phase 4 — The `--check` CLI, dogfood, and re-ground

- [x] Implement the CLI via `lib/cli.mjs`'s `runAsCli` guard:
      `node lib/board-mirror.mjs --check --root <dir>`
- [x] `requiresSync: false` → recompute and compare bytes with `generatedAt` normalized on
      both sides; nonzero exit names the drifted ids
- [x] `requiresSync: true` → validate + staleness only (cannot recompute)
- [x] No mirror → exit **0** with the stated "no mirror; nothing to check" line
- [x] Exit codes: `0` clean, `1` findings, `2` env error — matching
      `spec-bridge/gates/cli.mjs`'s convention and output shape
- [x] Tests for AC #8: nonzero after a one-status hand edit (assert the message names that
      id), 0 on freshly written, 0 when absent
- [x] **Dogfood:** generate this repo's own `.board/links.json` and verify it against
      `findLinkedTasks(".")`; commit the generated mirror
- [x] Bump the marketplace version (`lib/` is released surface) and run
      `node scripts/sync-version.mjs` to stamp the rest
- [x] Re-pin every `docs/wiki/` note whose `sources:` this change touches — at minimum
      `chassis`, `spec-bridge-plugin`; classify each pin **RE-PIN-ONLY** or **NEEDS-REVIEW**
      per the sweep's honest-re-pins rule and amend prose before bumping where needed
- [x] Update `docs/wiki/INDEX.md` if a new note was added; run
      `node scripts/check-docs.mjs`
- [x] All four project gates green: `node --test`, `check-docs.mjs`,
      `sync-version.mjs --check`, and `grounding-wiki/gates/cli.mjs freshness . docs/wiki`
- [x] Commit

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

### Phase 2 (implementer: sonnet tier, cc/claude-sonnet-5[1m])

**What moved:** `MARKER` regex, `parseLinkedTask(raw)`, and `findLinkedTasks(root)` relocated
verbatim (byte-identical bodies) from `spec-bridge/gates/bridge.mjs` into
`lib/board-mirror.mjs`, appended after `evaluateProjectGates` with a section-header comment
explaining the move rationale (spec 052 phase 2, moved-not-copied). `bridge.mjs` no longer
defines either symbol.

**What re-exports:** `bridge.mjs` now does both an `import` (needed because `checkBridge`,
`verifyBridge`, and `planBridge` all call `findLinkedTasks(root)` internally — a bare
`export { x } from "mod"` re-export does NOT bind `x` as a local name in the re-exporting
module, so import-then-export was required, not optional) and an `export`:
```js
import { parseLinkedTask, findLinkedTasks } from "../lib/board-mirror.mjs";
// ...
export { parseLinkedTask, findLinkedTasks };
```
This uses the same relative form (`../lib/board-mirror.mjs`) `bridge.mjs` already used for
`spec-derive.mjs`/`project-root.mjs`. Also removed the now-unused `readdirSync` import from
`node:fs` in `bridge.mjs` (its only caller, `findLinkedTasks`, moved away; `existsSync` and
`readFileSync` are still used elsewhere in the file and were kept).

**Import-site sweep (AC #7):** `grep -na "parseLinkedTask\|findLinkedTasks"
spec-bridge/gates/bridge.mjs` (NUL-safe, per Phase 1's warning) shows only the new
import/export lines and the three internal call sites inside `checkBridge`/`verifyBridge`/
`planBridge` — no stray definitions left behind. Repo-wide `grep -rn` for both symbols found
exactly **one** external import site: `test/spec-bridge.test.mjs` imports both directly from
`../spec-bridge/gates/bridge.mjs` — still resolves via the re-export, unedited. `gates/cli.mjs`
does **not** import either symbol directly (only `checkBridge`/`loadBridgeConfig`/
`planBridge`/`verifyBridge`/`vocabularyProfile`), so it needed no change. `test/phase-status.test.mjs`
and `test/project-gates.test.mjs` import other bridge exports, not these two, and were
unaffected structurally.

**Test count:** 458 passing before this phase's edits (Phase 1's baseline) → **458 passing,
0 failing** after (same count — this phase moves code, adds no new tests; AC #9's three
protected files show an empty `git diff --stat`, confirmed untouched).

**For Phase 3:** `projectBacklog(root)` (the registry's `backlog` projector) can call the
now-chassis-resident `findLinkedTasks(root)` directly — it lives in the same module. No import
needed across files for that call.

### Phase 3 (implementer: sonnet tier, cc/claude-sonnet-5[1m])

**Git invocation shape matched (from `grounding-wiki/gates/repin-window.mjs:44-50`):** a local
`git(cwd, args)` helper wrapping `spawnSync("git", args, { cwd, encoding: "utf8" })` — argv
array (so there is no shell; `shell` is left at its default `false`, never a string command),
never throws (`r.error` and non-zero `status` both fold into failure, treated as *data* the
caller branches on, not an exception). `board-mirror.mjs`'s `runGit` follows the identical
shape but returns `{ status, out }` (keeping the raw exit code, not collapsing to a boolean
`ok`) because `mirrorStaleness` needs to distinguish exit `1` (`merge-base --is-ancestor`'s
"valid commits, not an ancestor") from every other nonzero/`error` case (invalid sha, not a
repo at all) — both are "unknown" to `repin-window.mjs`'s binary `ok`, but the spec's three
fail-closed cases require telling "not an ancestor" and "cannot verify" apart in the reason
string. No second convention invented: `spawnSync`, argv, `cwd`, `encoding: "utf8"`, swallow
`r.error` — all copied verbatim.

**`mirrorStaleness(root, mirror, { headSha = "HEAD" } = {})` implemented** in
`lib/board-mirror.mjs`. Ancestry: `git merge-base --is-ancestor <observedSha> <headSha>`; exit
`0` → ancestor (not stale), exit `1` → not an ancestor (stale, reason names the link id and
sha), anything else (`error`, exit `128` for an unknown/invalid sha, or no git repo at all) →
stale, reason says "cannot verify … (not a git repo, or the sha is unknown)". `headSha`
defaults to the literal string `"HEAD"` so a caller with the tree already checked out doesn't
need a separate `git rev-parse` call — git resolves `"HEAD"` itself given `cwd`.

**Requires-sync case:** a link with no `observedSha` is stale only when its provider is
`requiresSync: true`. Provider lookup is `providers[mirror.provider]`; an **unregistered**
provider name (there is no `jira` key yet — spec 056 is a non-goal here) defaults to
`requiresSync: true` (fail-closed: an unknown provider cannot be assumed safely
deterministic). The AC #5 test exercises this via `provider: "jira"` rather than waiting on
spec 056, since the fail-closed default already produces the exact same shape a real
`requiresSync: true` provider would.

**Registry + projector:** `providers = { backlog: { requiresSync: false, project:
projectBacklog } }` as a plain object literal. `projectBacklog(root)` = `findLinkedTasks(root)`
mapped to `{ id, status, specDir, acs }` (drops `file`). Confirmed no `if (provider ===
"...")` branch exists anywhere in `lib/board-mirror.mjs` — `grep -n 'provider ===\|===
"backlog"\|=== "jira"'` matches only a comment sentence (`... no \`if (provider === "...")\`
branch belongs anywhere.`), not code.

**Tests added** to `test/board-mirror.test.mjs` (7 new): the two ancestry directions
(non-ancestor → stale; ancestor → not stale) against a real two-commit git fixture built with
`execFileSync("git", ...)` in a tmpdir; absent-sha-on-requiresSync (stale) and
absent-sha-on-non-requiresSync (fine); non-git root (stale, "cannot verify"); the AC #6
parity test — `projectBacklog(".")` vs `findLinkedTasks(".")` on this repo's own real
`backlog/tasks/` (58 linked tasks at time of writing), asserted `deepEqual` after stripping
`file`; and a direct registry-shape assertion (`providers.backlog.requiresSync === false`,
`project` is a function).

**Test count:** 458 passing (Phase 2 baseline) → **465 passing, 0 failing** (7 new).

**Spec ambiguity and choice made:** R3/tasks.md say `mirrorStaleness(root, mirror, {
headSha })` without specifying a default. Chose `headSha = "HEAD"` as the default so a bare
`mirrorStaleness(root, mirror)` call still does something useful (checks against the
checked-out tree) rather than silently no-op'ing every link's ancestry check — this only
matters when a caller omits the option entirely, which the spec doesn't forbid.

**For Phase 4:** the CLI needs `providers[mirror.provider]` to decide `--check`'s branch
(`requiresSync: false` → recompute via `provider.project(root)` and byte-compare;
`requiresSync: true` → `validateMirror` + `mirrorStaleness` only, per R5). `mirrorStaleness`
is ready to call directly with a resolved `headSha` (e.g. from `git rev-parse HEAD`, or just
pass `"HEAD"` and let the default resolve it in-process). `projectBacklog(root)` is the value
to diff against the on-disk mirror for AC #8's hand-edit-detection test.

### Phase 4 (implementer: sonnet tier, cc/claude-sonnet-5[1m])

**Model identity:** no harness-provided evidence of my model identity — `cc/claude-sonnet-5[1m]`
is my own inference from the dispatch prompt's text (agent type `sonnet-implementer`, whose
frontmatter pins that model), not something the harness told me directly.

**CLI implemented** in `lib/board-mirror.mjs` (dual-use, `runAsCli` guard): extracted
`serializeMirror` out of `writeMirror` (pure, no disk I/O) so the CLI can byte-compare a
recomputed mirror against the on-disk one without writing anything. `--check --root <dir>`:
no mirror → exit 0, `"no mirror; nothing to check"`; readMirror throw (malformed/unknown
schema) → exit 1 (a broken artifact is a finding, not an env error); `validateMirror`
problems → exit 1; unregistered provider name → exit 2 (env error, per R5's explicit
"unreadable root, unknown provider" grouping — deliberately distinct from
`mirrorStaleness`'s own fail-closed default of treating an unknown provider as
`requiresSync:true`, which is a different function serving a different caller);
`requiresSync:true` → `mirrorStaleness` only; `requiresSync:false` → recompute via
`provider.project(root)`, serialize both mirrors with `generatedAt` normalized to `""`, and
byte-compare; on drift, names the changed ids (diffed on stripped `{id,status,specDir,acs}`
so unknown/observed-* fields on either side don't produce false positives in the *reported*
id list, even though the pass/fail verdict itself is the full-mirror byte compare per R5).

**Tests (AC #8):** 3 new in `test/board-mirror.test.mjs`, spawning the CLI as a real child
process (`execFileSync("node", [CLI, "--check", "--root", root])`) against a throwaway
project with one real Backlog task file (so `projectBacklog` has something to recompute) —
0 absent, 0 fresh, nonzero + names the id after a one-status hand edit. Suite 465 → 468.

**Dogfood:** generated this repo's own `.board/links.json` (58 links) via `projectBacklog(".")`
+ `writeMirror`; `node lib/board-mirror.mjs --check --root .` exits 0 clean against the
committed file. Confirmed the natural sort is why the on-disk file's first id (`TASK-27`) and
`projectBacklog(".")`'s raw (filename-lexical) order first id (`TASK-100`) differ — `writeMirror`
re-sorts naturally, `findLinkedTasks`/`projectBacklog` return readdir's lexical order; both are
"correct" for their own layer, and the CLI's byte-compare (which routes both sides through the
same serializer) confirmed they describe the same set.

**Version bump:** 0.58.0 → 0.59.0 (minor: new chassis module + new gate/CLI capability, per
`docs/releasing.md`'s bump-size table). `sync-version.mjs 0.59.0` stamped all 9 other
plugins' `plugin.json` plus `action.yml`'s npx pin in lockstep.

**Re-pin ledger** — 12 notes, all repinned to `4694352` (post-bump HEAD), freshness gate now
exit 0 (`OK: 40 note(s) fresh`):

| Note | Classification | Disposition |
|---|---|---|
| build-plugin | RE-PIN-ONLY | plugin.json version stamp only, no version literal quoted — repinned |
| codebase-to-course-plugin | RE-PIN-ONLY | same | repinned |
| educate-plugin | RE-PIN-ONLY | same | repinned |
| gates-consumption-surface | RE-PIN-ONLY | action.yml npx-pin stamp only | repinned |
| grounding-wiki-plugin | RE-PIN-ONLY | plugin.json version stamp only | repinned |
| research-plugin | RE-PIN-ONLY | same | repinned |
| build-and-release | NEEDS-REVIEW | quotes `v0.2.0`/`0.5.0` but as fixed **historical milestones** ("first release", "first to publish to npm"), unaffected by this bump — verified accurate, no prose change, repinned |
| pdlc-plugin | NEEDS-REVIEW | quotes only "lockstep with the marketplace version" (generic, no literal digit) — verified accurate, repinned |
| reorient-plugin | NEEDS-REVIEW | quotes `version: 0.5.0` — that's the **skill's own** version (independently tracked per `docs/releasing.md`), not the marketplace version this bump touched; skill dir untouched — verified accurate, repinned |
| team-review-plugin | NEEDS-REVIEW | quotes `version: 1.3.0` — same skill-version distinction as reorient — verified accurate, repinned |
| overview | NEEDS-REVIEW | source diff was README.md's chassis-module-list line (`+ board-mirror`); overview.md never itemizes `lib/` modules by name (that's `chassis.md`'s job) — verified accurate, no prose change, repinned |
| spec-bridge-plugin | NEEDS-REVIEW | source diff was Phase 2's parser move (`bridge.mjs` −40/+7) plus its own `plugin.json` bump — **prose amended**: added `lib/board-mirror.mjs` to `sources:` and a short clause noting `parseLinkedTask` now lives there (re-exported from `bridge.mjs`); see below for the budget resolution |

**`chassis` note did NOT go stale** despite the task item's "at minimum `chassis`,
`spec-bridge-plugin`" prediction — its `sources:` are `lib/README.md`, `scripts/build.mjs`,
`lib/toolkit/README.md`, none of which this task touched (the new-chassis-module mention
landed in repo-root `README.md`, a Phase 1 addition to `overview.md`'s source, not `chassis.md`'s).
Left `chassis.md` untouched since it is, in fact, still fresh.

**The two over-budget notes:**
- `spec-bridge-plugin.md` was already over its 8000-char body budget (8454, standing
  `size_budget_exempt` from TASK-104) and sits in scope twice (bridge.mjs's move, plugin.json's
  bump). Rather than stack a second exemption to cover the new move-clause prose, trimmed a
  redundant clause from Operational notes (the verify/Stop-hook relationship was already
  stated in the Project gates paragraph) — net result 8444 chars, 10 **under** the pre-edit
  figure despite the addition. Genuine trim, not a widened exemption.
- `test-suite-catalog-plugins-gates.md` stays over budget too (8231, standing TASK-103
  exemption) but was **not touched**: its `sources:` list does not include
  `test/board-mirror.test.mjs`, so adding the 3 new CLI tests didn't stale it, and cataloging
  those tests there isn't required by any gate or AC. Left alone rather than pushing an
  already-maxed note further over for an optional addition — flagging this as a known gap
  (board-mirror.test.mjs is uncatalogued in either test-suite-catalog note) for whoever does
  the TASK-95/103 split to pick up, not fixed here.

**Gates, final state:** `node --test` 468/468 (0 fail); `check-docs.mjs` clean; `sync-version.mjs
--check` → `all versions = 0.59.0`; `grounding-wiki/gates/cli.mjs freshness . docs/wiki` → exit 0,
`OK: 40 note(s) fresh` (the two size-budget WARNs above are pre-existing and non-blocking).
`test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, `test/phase-status.test.mjs`:
`git diff --stat` empty across the whole branch (AC #9 holds).

**Commits:** `19e7a67` (CLI + AC#8 tests), `edea9b8` (dogfood mirror), `4694352` (version bump),
`990b61f` (12-note re-ground). Did not push, open a PR, or run any `backlog` command — per the
dispatch brief, that's the orchestrator's job.

**Owed / left for the orchestrator:** none identified beyond the pre-existing, already-tracked
TASK-95/103 note-split debt (unaffected by this phase) and the uncatalogued
`test/board-mirror.test.mjs` noted above.
