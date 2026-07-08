// project-root.mjs — locate a project root by walking the filesystem.
//
// Two shapes, because the suite has two placement models:
//   - educate lives in a favored home folder, marked by a child (e.g. `topics/`). Walk UP.
//   - research is drop-anywhere; a tree may contain several vaults. Find roots DOWN.
//
// Zero-dependency. Marker functions decide what "a root" means for each plugin.

import { existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname, parse } from "node:path";

/** A marker function: presence of a child file/dir named `name`. */
export function hasChild(name) {
  return (dir) => existsSync(join(dir, name));
}

/**
 * Walk up from `startDir` until `markerFn(dir)` is truthy. Returns the matching
 * directory (absolute) or null if the filesystem root is reached without a match.
 */
export function findRootUpwards(startDir, markerFn) {
  let dir = resolve(startDir);
  const { root: fsRoot } = parse(dir);
  for (;;) {
    if (markerFn(dir)) return dir;
    if (dir === fsRoot) return null;
    dir = dirname(dir);
  }
}

const defaultSkip = (name) => name.startsWith(".") || name === "node_modules";

/**
 * Find every directory at or under `startDir` for which `markerFn` is truthy.
 * Does not descend into a matched root (a vault owns its subtree) or into skipped
 * dirs (hidden / node_modules by default). Bounded by `maxDepth`.
 */
export function findRootsDownwards(startDir, markerFn, { skip = defaultSkip, maxDepth = 8 } = {}) {
  const roots = [];
  const walk = (dir, depth) => {
    if (markerFn(dir)) { roots.push(dir); return; } // matched → don't descend
    if (depth >= maxDepth) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || skip(e.name)) continue;
      walk(join(dir, e.name), depth + 1);
    }
  };
  walk(resolve(startDir), 0);
  return roots;
}
