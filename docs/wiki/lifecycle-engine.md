---
name: lifecycle-engine
description: lib/lifecycle.mjs — the "status cannot exceed proven artifacts" engine; ordered states, artifact-to-filename maps, and disk-derived evidence checks
kind: component
sources:
  - lib/lifecycle.mjs
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# Lifecycle engine

`lib/lifecycle.mjs` is the chassis implementation of praxisflux's core honesty rule: a
declared status may never outrank the artifacts on disk that prove it. It was generalized
from educate's `progress.mjs` so that every plugin can share the mechanism while keeping
its own vocabulary (educate: scaffolded…done; research: branch → analyzed → rendered).

## How it works

Two exports, both zero-dependency beyond `node:fs`/`node:path`:

- `computeArtifacts(dir, artifactFiles)` — given a map of artifact keys to filenames,
  returns `{ key: boolean }` by testing `existsSync(join(dir, file))` for each entry.
  This is how evidence is derived: an artifact "exists" iff its file is on disk.
- `createLifecycle({ states, artifacts, requires = {} })` — builds a checker from three
  declarations:
  - `states`: an ordered array of status names; array index is the rank.
  - `artifacts`: `{ key: filename }` — the artifact-to-filename map.
  - `requires`: `{ state: [artifactKey, ...] }` — artifacts that must exist once an item
    is **at or beyond** that state.

`createLifecycle` returns `{ states, artifacts, rank, compute, check }`, where `rank` is
a `Map` from state name to index and `compute(dir)` is `computeArtifacts` curried over
the declared artifacts.

`check(dir, status, extraRequires = {})` returns an array of problem strings; empty means
consistent. Its algorithm:

1. If `status` is not in `rank`, return a single "unknown status" problem naming the
   expected states.
2. Compute which artifacts are present in `dir`.
3. Merge `extraRequires` into `requires` — this lets a caller add dynamically required
   artifacts (e.g. a delegated build adds handoff artifacts) keyed the same way.
4. Collapse all in-force requirements (states whose rank is at or below the item's
   status rank) into a `requiredBy` map from artifact key to the **earliest** state that
   demands it, so a key required by several states is reported at most once.
5. For each required-but-absent key, emit
   `status=<status> implies '<state>' but required artifact '<key>' (<filename>) is missing on disk`.

Requirements attached to states *later* than the current status are skipped ("not yet in
force"), so the engine only ever flags statuses that claim more than the disk proves —
it never demands future artifacts early.

## Connections

- Part of the shared [[chassis]]; vendored into plugin `dist/` trees by
  [[build-and-release]].
- Together with [[gate-runner]] it implements [[gates-convention]]: plugins declare
  states/artifacts/requires in their gate modules (e.g. the [[educate-plugin]] DoD gate
  builds its checker with `createLifecycle`) and the gate runner turns `check` problems
  into blocking Stop-hook failures.
- Evidence files it checks are typically planted or produced through flows described in
  [[skill-patterns]].
- Exercised by the [[test-suite]].

## Operational notes

- No environment variables or configuration files; everything is passed in by the caller.
- Purely read-only: it inspects the filesystem via `existsSync` and never writes. Any
  `--sync`-style mutation lives in the calling plugin's scripts, not here.
- Failure mode is data, not exit codes: `check` returns problem strings and callers
  decide whether to warn, block, or exit non-zero.
- An unknown status short-circuits — no artifact checks run in that case.
