// Loads, merges, and validates contents.json.
//
// Pipeline: read contents.json -> find + read the nearest .claude/explainer.json
// project config -> merge the project config *under* the artifact's own
// contents.json (the artifact always wins) -> validate the merged document
// against contents.schema.json (lib/schema.mjs) -> check cross-references the
// schema can't express (unknown group/page/term references, ).
//
// `packs` (an ordered list of pack plugin names) lives only in the project
// config, never in contents.json itself, so it is returned alongside the
// validated contents rather than merged into it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validate as validateSchema } from "./schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, "contents.schema.json");

let cachedSchema = null;

export function loadSchema() {
  if (!cachedSchema) {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    cachedSchema = JSON.parse(raw);
  }
  return cachedSchema;
}

function readJson(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return undefined;
    throw new Error(`${filePath}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${filePath}: invalid JSON — ${err.message}`);
  }
}

/**
 * Reads <artifactDir>/contents.json. Throws if the file is missing or is not
 * valid JSON; schema/cross-reference problems are returned as errors instead
 * (see validateContents), so a single invocation can report every issue.
 */
export function readContentsFile(artifactDir) {
  const file = path.join(artifactDir, "contents.json");
  const doc = readJson(file);
  if (doc === undefined) {
    throw new Error(`${file}: not found`);
  }
  return doc;
}

function readProjectConfigAt(candidate) {
  const doc = readJson(candidate);
  if (doc === undefined) return undefined;
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`${candidate}: must be a JSON object`);
  }
  return doc;
}

/**
 * Finds the project's .claude/explainer.json. When `repoRoot` is known
 * (the normal case — the CLI resolves it via `git rev-parse --show-toplevel`),
 * it is checked directly: the repo root is the boundary, so there is nothing
 * to walk past. Without a known repo root (e.g. a test fixture with no git
 * repo) this falls back to walking upward from `startDir` for the nearest
 * .claude/explainer.json. Returns an empty config when none exists. Throws on
 * invalid JSON.
 */
export function loadProjectConfig({ repoRoot, startDir } = {}) {
  if (repoRoot) {
    const candidate = path.join(repoRoot, ".claude", "explainer.json");
    const doc = readProjectConfigAt(candidate);
    return doc === undefined ? { config: {}, path: null } : { config: doc, path: candidate };
  }

  let dir = path.resolve(startDir);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, ".claude", "explainer.json");
    const doc = readProjectConfigAt(candidate);
    if (doc !== undefined) return { config: doc, path: candidate };
    const parent = path.dirname(dir);
    if (parent === dir) return { config: {}, path: null };
    dir = parent;
  }
}

function dedupe(list) {
  return [...new Set(list)];
}

/**
 * Merges a project config *under* an artifact's own contents.json: the
 * artifact's own values always win; the project config only fills in what the
 * artifact left unset. `packs` is project-config-only and is returned
 * separately (it is not part of the contents.json schema).
 */
export function mergeProjectConfig(contents, projectConfig = {}) {
  const merged = { ...contents };

  if (merged.brand === undefined && projectConfig.brand !== undefined) {
    merged.brand = projectConfig.brand;
  }
  if (merged.voice === undefined && projectConfig.voice !== undefined) {
    merged.voice = projectConfig.voice;
  }
  if (projectConfig.repo || merged.repo) {
    merged.repo = { ...(projectConfig.repo || {}), ...(merged.repo || {}) };
  }

  const projectRules = projectConfig.rules || {};
  const ownRules = contents.rules || {};
  if (projectConfig.rules || contents.rules) {
    merged.rules = {
      off: dedupe([...(projectRules.off || []), ...(ownRules.off || [])]),
      on: dedupe([...(projectRules.on || []), ...(ownRules.on || [])]),
    };
  }

  const packs = Array.isArray(projectConfig.packs) ? projectConfig.packs : [];

  return { contents: merged, packs };
}

function pushAll(target, items) {
  for (const item of items) target.push(item);
}

// A `kind: "file"` source whose `path` has whitespace or a `..`/`...` range
// between refs (e.g. "git diff main...HEAD") is really a diff citation, not
// a file path — contents.schema.json's pattern on `file.path` already
// rejects this shape, but its oneOf failure alone just says "matched 0
// schemas" without naming the fix. This regex re-checks the same shape
// directly so the error below can say so in plain language.
const LOOKS_LIKE_DIFF_RANGE_RE = /\s|\.\./;

/**
 * Cross-reference checks the JSON Schema vocabulary can't express: every
 * page's group, and every term's `see`, must name something that exists
 * (— "Unknown group/page/term/source references are errors"). Also
 * catches duplicate ids, which would otherwise make a reference ambiguous,
 * and a `file` source whose `path` is actually a diff range.
 */
export function validateCrossReferences(contents) {
  const errors = [];
  const groups = Array.isArray(contents.groups) ? contents.groups : [];
  const pages = Array.isArray(contents.pages) ? contents.pages : [];
  const terms = Array.isArray(contents.terms) ? contents.terms : [];
  const sources = Array.isArray(contents.sources) ? contents.sources : [];

  const groupIds = new Set();
  groups.forEach((g, i) => {
    if (g && typeof g.id === "string") {
      if (groupIds.has(g.id)) errors.push(`groups[${i}].id: duplicate group id "${g.id}"`);
      groupIds.add(g.id);
    }
  });

  const pageIds = new Set();
  pages.forEach((pg, i) => {
    if (pg && typeof pg.id === "string") {
      if (pageIds.has(pg.id)) errors.push(`pages[${i}].id: duplicate page id "${pg.id}"`);
      pageIds.add(pg.id);
    }
    if (pg && typeof pg.group === "string" && !groupIds.has(pg.group)) {
      errors.push(`pages[${i}].group: unknown group "${pg.group}"`);
    }
  });

  const termKeys = new Set();
  terms.forEach((t, i) => {
    if (t && typeof t.key === "string") {
      if (termKeys.has(t.key)) errors.push(`terms[${i}].key: duplicate term key "${t.key}"`);
      termKeys.add(t.key);
    }
  });
  terms.forEach((t, i) => {
    if (t && typeof t.see === "string" && !termKeys.has(t.see)) {
      errors.push(`terms[${i}].see: unknown term "${t.see}"`);
    }
  });

  const sourceIds = new Set();
  sources.forEach((s, i) => {
    if (s && typeof s.id === "string") {
      if (sourceIds.has(s.id)) errors.push(`sources[${i}].id: duplicate source id "${s.id}"`);
      sourceIds.add(s.id);
    }
  });

  sources.forEach((s, i) => {
    if (s && s.kind === "file" && typeof s.path === "string" && LOOKS_LIKE_DIFF_RANGE_RE.test(s.path)) {
      errors.push(
        `sources[${i}].path: "${s.path}" has whitespace or a ".."/"..." range — that's a diff range, not a file path; use kind:"diff" with a "range" field instead`
      );
    }
  });

  return errors;
}

/**
 * Validates a (already merged) contents document against contents.schema.json
 * plus the cross-reference checks above. Returns a flat array of
 * path-qualified error strings; empty means valid.
 */
export function validateContents(contents) {
  const errors = [];
  pushAll(errors, validateSchema(contents, loadSchema()));
  // Cross-reference checks assume a sane shape; skip them when the schema
  // itself already rejected groups/pages/terms/sources, to avoid noise from
  // e.g. iterating a value that isn't actually an array.
  const shapeOk = ["groups", "pages", "terms", "sources"].every(
    (key) => contents[key] === undefined || Array.isArray(contents[key])
  );
  if (shapeOk) pushAll(errors, validateCrossReferences(contents));
  return errors;
}

/**
 * The full load pipeline for one artifact folder: read contents.json,
 * find + merge the nearest project config, and validate the result. Throws
 * only on read/parse failures (missing file, invalid JSON); schema and
 * cross-reference problems come back as `errors` so a caller can report every
 * issue from a single call instead of stopping at the first one.
 */
export function loadContentsForBuild(artifactDir, { repoRoot } = {}) {
  const raw = readContentsFile(artifactDir);
  const { config: projectConfig, path: projectConfigPath } = loadProjectConfig({
    repoRoot,
    startDir: artifactDir,
  });
  const { contents, packs } = mergeProjectConfig(raw, projectConfig);
  const errors = validateContents(contents);
  return { contents, packs, errors, projectConfigPath };
}
