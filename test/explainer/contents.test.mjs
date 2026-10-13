import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  loadContentsForBuild,
  loadProjectConfig,
  mergeProjectConfig,
  readContentsFile,
  validateContents,
  validateCrossReferences,
} from "../../explainer/scripts/lib/contents.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const MINI_ARTIFACT = path.join(FIXTURES, "mini-artifact");
const PROJECT_WITH_CONFIG = path.join(FIXTURES, "project-with-config");

function minimalContents(overrides = {}) {
  return {
    schema: 1,
    title: "Two Words",
    kind: "pr-explainer",
    brand: "fixture",
    groups: [{ id: "start", title: "Start here" }],
    pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
    terms: [],
    sources: [],
    ...overrides,
  };
}

test("mini-artifact fixture (3 groups, 5 pages) validates cleanly", () => {
  const doc = readContentsFile(MINI_ARTIFACT);
  const errors = validateContents(doc);
  assert.deepEqual(errors, []);
  assert.equal(doc.groups.length, 3);
  assert.equal(doc.pages.length, 5);
});

test("schema error: missing required top-level field is path-qualified", () => {
  const doc = minimalContents();
  delete doc.brand;
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e === "brand: required property missing"),
    `expected a "brand" error, got: ${JSON.stringify(errors)}`
  );
});

test("schema error: wrong type is reported with its path", () => {
  const doc = minimalContents({ groups: "not-an-array" });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e.startsWith("groups: expected type array")),
    `expected a groups type error, got: ${JSON.stringify(errors)}`
  );
});

test("schema error: title must be 2-4 words", () => {
  const doc = minimalContents({ title: "OneWord" });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e.startsWith("title: does not match pattern")),
    `expected a title pattern error, got: ${JSON.stringify(errors)}`
  );
});

test("schema error: unknown top-level property is rejected", () => {
  const doc = minimalContents({ bogus: true });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e === "bogus: unknown property"),
    `expected an unknown-property error, got: ${JSON.stringify(errors)}`
  );
});

test("schema error: a source must match exactly one of file|url shapes", () => {
  const doc = minimalContents({ sources: [{ id: "s-1", kind: "file" }] });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e.startsWith("sources[0]: must match exactly one schema")),
    `expected a sources oneOf error, got: ${JSON.stringify(errors)}`
  );
});

test("schema error: a generator must be either a command or a known builtin", () => {
  const doc = minimalContents({ generators: { thing: { nonsense: true } } });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e.startsWith("generators.thing: must match exactly one schema")),
    `expected a generators oneOf error, got: ${JSON.stringify(errors)}`
  );
});

test("cross-reference error: page references an unknown group", () => {
  const doc = minimalContents({
    pages: [{ id: "overview", title: "Overview", group: "ghost", type: "short-answer" }],
  });
  const errors = validateCrossReferences(doc);
  assert.deepEqual(errors, ['pages[0].group: unknown group "ghost"']);
});

test("cross-reference error: term.see references an unknown term", () => {
  const doc = minimalContents({
    terms: [{ key: "a", term: "A", def: "x", see: "nope" }],
  });
  const errors = validateCrossReferences(doc);
  assert.deepEqual(errors, ['terms[0].see: unknown term "nope"']);
});

test("cross-reference error: duplicate ids are flagged", () => {
  const doc = minimalContents({
    groups: [
      { id: "start", title: "Start here" },
      { id: "start", title: "Start here again" },
    ],
    pages: [],
  });
  const errors = validateCrossReferences(doc);
  assert.ok(errors.includes('groups[1].id: duplicate group id "start"'));
});

test("a diff source validates cleanly, with or without files", () => {
  const doc = minimalContents({
    sources: [
      { id: "s-this-pr", kind: "diff", range: "origin/master...HEAD", files: ["a/b.py"] },
      { id: "s-bare", kind: "diff", range: "main...HEAD" },
    ],
  });
  assert.deepEqual(validateContents(doc), []);
});

test("schema error: a diff source needs a non-empty range", () => {
  const doc = minimalContents({ sources: [{ id: "s-1", kind: "diff" }] });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e.startsWith("sources[0]: must match exactly one schema")),
    `expected a sources oneOf error, got: ${JSON.stringify(errors)}`
  );
});

test("a file source whose path is really a diff range is rejected, naming kind:\"diff\" as the fix", () => {
  const doc = minimalContents({ sources: [{ id: "s-1", kind: "file", path: "git diff main...HEAD" }] });
  const errors = validateContents(doc);
  assert.ok(
    errors.some((e) => e.includes('kind:"diff"')),
    `expected an error naming kind:"diff", got: ${JSON.stringify(errors)}`
  );
  // The schema's own pattern on file.path also rejects the shape directly.
  assert.ok(
    errors.some((e) => e.startsWith("sources[0]: must match exactly one schema")),
    `expected a sources oneOf error too, got: ${JSON.stringify(errors)}`
  );
});

test("a file source path with only whitespace (no range syntax) is still rejected", () => {
  const doc = minimalContents({ sources: [{ id: "s-1", kind: "file", path: "a/b c.py" }] });
  const errors = validateContents(doc);
  assert.ok(errors.some((e) => e.includes('kind:"diff"')));
});

test("a relative '../' file path is rejected by the same pattern", () => {
  const doc = minimalContents({ sources: [{ id: "s-1", kind: "file", path: "../outside/file.py" }] });
  const errors = validateContents(doc);
  assert.ok(errors.some((e) => e.includes('kind:"diff"')));
});

test("an ordinary file path with no whitespace or range syntax still validates cleanly", () => {
  const doc = minimalContents({ sources: [{ id: "s-1", kind: "file", path: "plugins/vcs/core.py", line: 120 }] });
  assert.deepEqual(validateContents(doc), []);
});

test("project config merges under the artifact's own contents.json (artifact wins)", () => {
  const { config } = loadProjectConfig({ repoRoot: PROJECT_WITH_CONFIG, startDir: PROJECT_WITH_CONFIG });
  assert.equal(config.brand, "neutral");

  const artifactDoc = readContentsFile(path.join(PROJECT_WITH_CONFIG, "docs", "explainers", "demo"));
  assert.equal(artifactDoc.brand, undefined);

  const { contents, packs } = mergeProjectConfig(artifactDoc, config);
  // Project config fills in brand, since the artifact didn't set one.
  assert.equal(contents.brand, "neutral");
  // repo.ref is the artifact's own and wins; repo.github only exists in the
  // project config, so it is filled in without clobbering the artifact's ref.
  assert.deepEqual(contents.repo, { github: "example-org/example", ref: "feature/x" });
  assert.deepEqual(contents.rules, { on: ["no-internal-codes"], off: ["rule.chart-data-table"] });
  assert.deepEqual(packs, ["team-pack", "missing-pack"]);
});

test("loadContentsForBuild runs the full pipeline and validates the merged result", () => {
  const artifactDir = path.join(PROJECT_WITH_CONFIG, "docs", "explainers", "demo");
  const result = loadContentsForBuild(artifactDir, { repoRoot: PROJECT_WITH_CONFIG });
  assert.deepEqual(result.errors, []);
  assert.equal(result.contents.brand, "neutral");
  assert.deepEqual(result.packs, ["team-pack", "missing-pack"]);
  assert.ok(result.projectConfigPath.endsWith(path.join(".claude", "explainer.json")));
});

test("readContentsFile throws a clear error when contents.json is missing", () => {
  assert.throws(() => readContentsFile(path.join(FIXTURES, "does-not-exist")), /not found/);
});
