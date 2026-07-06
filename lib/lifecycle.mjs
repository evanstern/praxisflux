// lifecycle.mjs — the "a status cannot exceed the artifacts that prove it" engine.
//
// Generalized from educate's progress.mjs. A plugin declares an ordered set of states, a map
// of artifact keys → filenames, and which artifacts each state requires. The engine derives
// the artifact map from disk and flags any item whose declared status outranks its evidence.
//
// Vocabulary stays per-plugin (educate: scaffolded…done; research: branch→analyzed→rendered);
// only the mechanism is shared.

import { existsSync } from "node:fs";
import { join } from "node:path";

/** Derive { key: bool } for each artifact by checking its filename on disk in `dir`. */
export function computeArtifacts(dir, artifactFiles) {
  const out = {};
  for (const [key, file] of Object.entries(artifactFiles)) out[key] = existsSync(join(dir, file));
  return out;
}

/**
 * Build a lifecycle checker.
 *   states:    ordered array of status names (index = rank)
 *   artifacts: { key: filename }
 *   requires:  { state: [artifactKey, …] } — artifacts that must exist on disk once an item
 *              is at or beyond that state.
 */
export function createLifecycle({ states, artifacts, requires = {} }) {
  const rank = new Map(states.map((s, i) => [s, i]));

  /**
   * Problems (strings) for an item at `status` living in `dir`. Empty array = consistent.
   * `extraRequires` lets a caller add dynamically-required artifacts (e.g. a delegated build
   * adds handoff artifacts) keyed the same way as `requires`.
   */
  const check = (dir, status, extraRequires = {}) => {
    const problems = [];
    const statusRank = rank.get(status);
    if (statusRank === undefined) {
      problems.push(`unknown status ${JSON.stringify(status)} (expected one of ${states.join(", ")})`);
      return problems;
    }
    const present = computeArtifacts(dir, artifacts);
    const merged = { ...requires };
    for (const [state, keys] of Object.entries(extraRequires)) {
      merged[state] = [...(merged[state] || []), ...keys];
    }
    // Collapse all in-force requirements to the earliest state demanding each artifact key,
    // so a key required by several states is reported at most once.
    const requiredBy = new Map(); // key -> state name (lowest rank in force)
    for (const [state, keys] of Object.entries(merged)) {
      const r = rank.get(state);
      if (r === undefined || r > statusRank) continue; // requirement not yet in force
      for (const key of keys) {
        const prev = requiredBy.get(key);
        if (prev === undefined || r < rank.get(prev)) requiredBy.set(key, state);
      }
    }
    for (const [key, state] of requiredBy) {
      if (!present[key]) {
        problems.push(`status=${status} implies '${state}' but required artifact '${key}' (${artifacts[key] || key}) is missing on disk`);
      }
    }
    return problems;
  };

  return { states, artifacts, rank, compute: (dir) => computeArtifacts(dir, artifacts), check };
}
