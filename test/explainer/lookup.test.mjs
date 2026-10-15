import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { createLookup } from "../../explainer/scripts/lib/lookup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures", "lookup");

function makeLookup(extra = {}) {
  return createLookup({
    artifactDir: path.join(FIXTURES, "artifact"),
    repoRoot: path.join(FIXTURES, "repo"),
    packs: ["team-pack", "missing-pack"],
    pluginRoot: path.join(FIXTURES, "plugin-root"),
    // Explicit, rather than relying on the pluginRoot/../.. default: that
    // default is exercised separately below (and by the real explainer.mjs
    // tree in cli.test.mjs). Keeping this fixture's packs/ alongside the
    // other layers makes the precedence tests easier to read.
    packsRoot: path.join(FIXTURES, "packs"),
    ...extra,
  });
}

test("artifact layer wins over everything, including core (overridden)", () => {
  const lookup = makeLookup();
  const result = lookup.resolve("patterns", "table");
  assert.equal(result.found, true);
  assert.equal(result.layer, "artifact");
  assert.equal(result.overridden, true);
  assert.equal(
    result.path,
    path.join(FIXTURES, "artifact", "patterns", "table")
  );
});

test("repo layer wins over packs and core (overridden)", () => {
  const lookup = makeLookup();
  const result = lookup.resolve("patterns", "callout");
  assert.equal(result.found, true);
  assert.equal(result.layer, "repo");
  assert.equal(result.overridden, true);
});

test("a pack-only item resolves from the pack layer and is not overridden", () => {
  const lookup = makeLookup();
  const result = lookup.resolve("patterns", "matrix");
  assert.equal(result.found, true);
  assert.equal(result.layer, "pack:team-pack");
  assert.equal(result.overridden, undefined);
});

test("core-only item resolves from core and is never marked overridden", () => {
  const lookup = makeLookup();
  const result = lookup.resolve("brand", "neutral");
  assert.equal(result.found, true);
  assert.equal(result.layer, "core");
  assert.equal(result.overridden, undefined);
});

test("a file-category item (rules) resolves by id + extension", () => {
  const lookup = makeLookup();
  const result = lookup.resolve("rules", "define-before-use");
  assert.equal(result.found, true);
  assert.equal(result.layer, "core");
  assert.ok(result.path.endsWith("define-before-use.json"));
});

test("an unresolvable item reports found: false, not a throw", () => {
  const lookup = makeLookup();
  const result = lookup.resolve("patterns", "does-not-exist-anywhere");
  assert.equal(result.found, false);
  assert.equal(result.path, null);
});

test("a listed-but-missing pack is reported, not an error", () => {
  const lookup = makeLookup();
  lookup.resolve("patterns", "callout"); // trigger at least one resolve
  const report = lookup.report();
  assert.deepEqual(report.missingPacks, ["missing-pack"]);
});

test("build report lists every override encountered", () => {
  const lookup = makeLookup();
  lookup.resolve("patterns", "table"); // artifact overrides core
  lookup.resolve("patterns", "callout"); // repo overrides core
  lookup.resolve("patterns", "matrix"); // pack-only, no override
  const report = lookup.report();
  assert.equal(report.overrides.length, 2);
  assert.ok(report.overrides.some((o) => o.name === "table" && o.layer === "artifact"));
  assert.ok(report.overrides.some((o) => o.name === "callout" && o.layer === "repo"));
});

test("EXPLAINER_PACKS_ROOT env var overrides the default packs root", () => {
  const previous = process.env.EXPLAINER_PACKS_ROOT;
  process.env.EXPLAINER_PACKS_ROOT = path.join(FIXTURES, "packs");
  try {
    const lookup = createLookup({
      artifactDir: path.join(FIXTURES, "artifact"),
      packs: ["team-pack"],
      pluginRoot: "/nonexistent/plugin-root",
    });
    const result = lookup.resolve("patterns", "matrix");
    assert.equal(result.found, true);
    assert.equal(result.layer, "pack:team-pack");
  } finally {
    if (previous === undefined) delete process.env.EXPLAINER_PACKS_ROOT;
    else process.env.EXPLAINER_PACKS_ROOT = previous;
  }
});

test("an explicit packsRoot option takes precedence over the env var", () => {
  const previous = process.env.EXPLAINER_PACKS_ROOT;
  process.env.EXPLAINER_PACKS_ROOT = "/nonexistent/env-root";
  try {
    const lookup = createLookup({
      artifactDir: path.join(FIXTURES, "artifact"),
      packs: ["team-pack"],
      pluginRoot: "/nonexistent/plugin-root",
      packsRoot: path.join(FIXTURES, "packs"),
    });
    const result = lookup.resolve("patterns", "matrix");
    assert.equal(result.found, true);
    assert.equal(result.layer, "pack:team-pack");
  } finally {
    if (previous === undefined) delete process.env.EXPLAINER_PACKS_ROOT;
    else process.env.EXPLAINER_PACKS_ROOT = previous;
  }
});

test("default packs root (pluginRoot/../..) scans one level for a plugin-cache-style layout", () => {
  // Mirrors a realistic installed-plugins cache: <cache>/<marketplace>/<plugin>.
  // explainer and its pack sit side by side under the same marketplace
  // folder, which itself sits two levels above explainer's own root.
  const realDefault = path.join(FIXTURES, "real-default", "cache");
  const pluginRoot = path.join(realDefault, "some-marketplace", "explainer");
  const lookup = createLookup({ packs: ["sibling-pack"], pluginRoot });
  assert.equal(lookup.packsRoot, path.resolve(pluginRoot, "..", ".."));
  const result = lookup.resolve("patterns", "widget");
  assert.equal(result.found, true);
  assert.equal(result.layer, "pack:sibling-pack");
});

test("without an artifactDir or repoRoot, only packs and core are consulted", () => {
  const lookup = createLookup({
    packs: ["team-pack"],
    pluginRoot: path.join(FIXTURES, "plugin-root"),
    packsRoot: path.join(FIXTURES, "packs"),
  });
  assert.deepEqual(
    lookup.layers.map((l) => l.id),
    ["pack:team-pack", "core"]
  );
  const result = lookup.resolve("patterns", "callout");
  assert.equal(result.found, true);
  assert.equal(result.layer, "core");
});
