// 4-layer lookup and overlay.
//
// Resolution order for patterns/<n>, diagrams/<k>, profiles/<k>, brand/<b>.css
// and rules/<id>.json:
//   1. the artifact folder;
//   2. the repo's .claude/explainer/;
//   3. each installed pack, in `packs` order;
//   4. ${CLAUDE_PLUGIN_ROOT}/core/.
// First match wins. A match that shadows a core item of the same name is
// reported `overridden` (visible in the build report, ). A pack listed in
// `packs` whose folder can't be found is reported, never an error.

import fs from "node:fs";
import path from "node:path";

// patterns/diagrams/profiles are folders (they hold several files each);
// brand/rules are single files, named by id.
const FOLDER_CATEGORIES = new Set(["patterns", "diagrams", "profiles"]);
const FILE_CATEGORY_EXT = { brand: ".css", rules: ".json" };

function candidatePath(root, category, name) {
  if (FOLDER_CATEGORIES.has(category)) return path.join(root, category, name);
  const ext = FILE_CATEGORY_EXT[category];
  if (!ext) throw new Error(`lookup: unknown category "${category}"`);
  return path.join(root, category, `${name}${ext}`);
}

function existsSafe(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * Resolves the installed-plugins cache root that holds sibling pack plugins,
 * so `packs: ["<team>-explainer-pack"]` can be found by plugin name. Default,
 * two directories up from this plugin's own root (the plugin
 * sits at <cache>/<marketplace-or-plugin-dir>/explainer, so its
 * siblings — other installed plugins — live two levels up). Overridable via
 * EXPLAINER_PACKS_ROOT so tests don't depend on a real installed-plugins
 * cache.
 */
export function resolvePacksRoot({ pluginRoot, packsRoot } = {}) {
  if (packsRoot) return packsRoot;
  if (process.env.EXPLAINER_PACKS_ROOT) return process.env.EXPLAINER_PACKS_ROOT;
  if (!pluginRoot) throw new Error("lookup: pluginRoot or packsRoot is required to resolve packs");
  return path.resolve(pluginRoot, "..", "..");
}

function listDirs(root) {
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(root, d.name));
  } catch {
    return [];
  }
}

/**
 * Finds a pack plugin's root directory under the packs root by plugin name.
 * This is a *scan*, not a strict join, because an installed-plugins cache
 * commonly nests a plugin one level under a marketplace folder
 * (<cache>/<marketplace>/<plugin-name>) rather than flatly
 * (<cache>/<plugin-name>) — call this a "cache scan". Bounded to
 * depth 2 under packsRoot, so it stays cheap and never walks a plugin's own
 * contents.
 */
function findPackRoot(packsRoot, packName) {
  const direct = path.join(packsRoot, packName);
  if (existsSafe(direct)) return direct;
  for (const child of listDirs(packsRoot)) {
    const nested = path.join(child, packName);
    if (existsSafe(nested)) return nested;
  }
  return null;
}

/**
 * Builds a lookup bound to one build's context. `packs` is the ordered list
 * of pack plugin names from the merged project config (contents.mjs).
 */
export function createLookup({ artifactDir, repoRoot, packs = [], pluginRoot, packsRoot } = {}) {
  if (!pluginRoot) throw new Error("lookup: pluginRoot is required");

  const resolvedPacksRoot = resolvePacksRoot({ pluginRoot, packsRoot });
  const missingPacks = new Set();

  const layers = [];
  if (artifactDir) layers.push({ id: "artifact", root: artifactDir });
  if (repoRoot) layers.push({ id: "repo", root: path.join(repoRoot, ".claude", "explainer") });
  for (const packName of packs) {
    const root = findPackRoot(resolvedPacksRoot, packName);
    if (root) {
      layers.push({ id: `pack:${packName}`, root, packName });
    } else {
      missingPacks.add(packName);
    }
  }
  const coreLayer = { id: "core", root: path.join(pluginRoot, "core") };
  layers.push(coreLayer);

  const overrides = [];

  function resolve(category, name) {
    let match = null;
    for (const layer of layers) {
      const candidate = candidatePath(layer.root, category, name);
      if (existsSafe(candidate)) {
        match = { category, name, layer: layer.id, path: candidate, found: true };
        break;
      }
    }

    if (!match) {
      return { category, name, found: false, layer: null, path: null };
    }

    if (match.layer !== "core") {
      const coreCandidate = candidatePath(coreLayer.root, category, name);
      if (existsSafe(coreCandidate)) {
        match.overridden = true;
        overrides.push({ category, name, layer: match.layer, shadows: "core" });
      }
    }

    return match;
  }

  function report() {
    return { overrides: [...overrides], missingPacks: [...missingPacks] };
  }

  return { resolve, report, layers, packsRoot: resolvedPacksRoot };
}
