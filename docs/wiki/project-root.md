---
name: project-root
description: Chassis module that locates project roots by walking the filesystem — upward for favored-home layouts, downward for drop-anywhere sentinel layouts.
kind: component
sources:
  - lib/project-root.mjs
verified_against: 5206515c5f118a291cfddcf01870a219ee28c3d9
---

# Project Root

`lib/project-root.mjs` answers "where is the project this gate should apply to?" for gate code
and scripts. It exists because the suite has two placement models: educate-style projects live
in one favored home folder (find it by walking **up** from the cwd), while research-style vaults
are drop-anywhere and a tree may contain several of them (find them all by walking **down**).
Zero-dependency; what counts as "a root" is delegated to a caller-supplied marker function.

## How it works

Four exports:

- `hasChild(name)` — a marker-function factory. Returns `(dir) => existsSync(join(dir, name))`,
  i.e. "this directory is a root if it contains a child file/dir named `name`". Plugins use
  this to define their sentinel (for example a `topics/` child marks an educate home).

- `hasAnyChild(...names)` — combines markers: `(dir) => names.some((n) => hasChild(n)(dir))`,
  true when **any** named child is present. One definition composed from `hasChild`, so a
  caller needing "either sentinel marks a project" (e.g. [[spec-bridge-plugin]]'s Stop hook
  and its CLI, which resolve `.board` OR `backlog` and must never disagree with each other
  about what a project is) shares it instead of duplicating the predicate inline at each call
  site.

- `findRootUpwards(startDir, markerFn)` — resolves `startDir` to an absolute path and walks
  parent-by-parent (`dirname`) until `markerFn(dir)` is truthy, returning that absolute
  directory. Returns `null` once the filesystem root (from `path.parse().root`) is reached
  without a match. The filesystem root itself is still tested before giving up. This serves
  the **favored-home** model: exactly one root, somewhere above you.

- `findRootsDownwards(startDir, markerFn, { skip, maxDepth = 8 })` — depth-first walk from
  `startDir` collecting every directory where `markerFn` is truthy. Serves the
  **drop-anywhere sentinel** model: any number of roots at or below the start. Behavior
  details:
  - A matched directory is pushed and **not descended into** — a vault owns its subtree, so
    nested matches inside it are deliberately invisible.
  - `startDir` itself is tested first (depth 0) and, if it matches, is the sole result.
  - The default `skip` predicate prunes hidden directories (name starts with `.`) and
    `node_modules`; callers can substitute their own.
  - The walk is bounded by `maxDepth` (default 8 levels below the start) and swallows
    `readdirSync` errors (unreadable directories are silently skipped).
  - Returns an array of absolute paths; an empty array means "no such project here".

## Connections

This module feeds root resolution in [[gate-runner]]: each gate's `resolveRoots(startDir)`
implementation is typically a thin wrapper over `findRootUpwards` or `findRootsDownwards` with
a plugin-specific `hasChild` (or `hasAnyChild`) marker, per [[gates-convention]]. It ships
inside every plugin as part of the [[chassis]] and is exercised by the [[test-suite]].
Consumers include the gates of [[research-plugin]], [[grounding-wiki-plugin]],
[[educate-plugin]], and [[spec-bridge-plugin]] (`hasAnyChild(".board", "backlog")`, both at
its Stop hook and its CLI).

## Operational notes

- No environment variables of its own; the start directory comes from the caller (the gate
  runner derives it from `CLAUDE_PROJECT_DIR` or hook input).
- `findRootsDownwards` returning `[]` is the normal "not my kind of project" signal that lets
  a gate no-op.
- The `maxDepth` bound and skip list keep the downward walk cheap on large trees, but a root
  buried deeper than 8 levels (or inside a hidden/`node_modules` directory) will not be found
  unless the caller overrides the defaults.
