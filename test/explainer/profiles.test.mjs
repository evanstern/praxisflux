// Phase 2: the four core profiles + `new` end to end.
//
// Covers:
//   - every core/profiles/<kind>/profile.json validates against
//     lib/profile.schema.json;
//   - every page_types[].guide file it points at actually exists;
//   - every suggested_patterns/suggested_diagrams name resolves to a real
//     core/patterns|diagrams/<name>/ folder;
//   - every skeleton.contents.json validates against contents.schema.json
//     (lib/contents.mjs's validateContents — schema + cross-references);
//   - `explainer.mjs new demo --kind <k>` then `explainer.mjs build --dir
//     docs/explainers/demo`, for all four kinds, inside a fresh temp git
//     repo, exits 0 and actually writes dist/demo.html ('s "produces a
//     buildable skeleton").

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { validateContents } from "../../explainer/scripts/lib/contents.mjs";
import { validate as validateSchema } from "../../explainer/scripts/lib/schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const CLI = path.join(PLUGIN_ROOT, "scripts", "explainer.mjs");
const PROFILES_ROOT = path.join(PLUGIN_ROOT, "core", "profiles");
const PROFILE_SCHEMA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "explainer", "scripts", "lib", "profile.schema.json"), "utf8")
);

const KINDS = ["pr-explainer", "architecture-site", "decision-briefing", "onboarding"];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ------------------------------------------------------- static shape tests

for (const kind of KINDS) {
  const dir = path.join(PROFILES_ROOT, kind);

  test(`${kind}: profile.json validates against profile.schema.json`, () => {
    const profile = readJson(path.join(dir, "profile.json"));
    const errors = validateSchema(profile, PROFILE_SCHEMA);
    assert.deepEqual(errors, []);
    assert.equal(profile.id, kind);
  });

  test(`${kind}: every profile includes a "start-here" kickoff page type`, () => {
    const profile = readJson(path.join(dir, "profile.json"));
    assert.ok(profile.page_types.some((pt) => pt.id === "start-here"));
  });

  test(`${kind}: every page_types[].guide file exists and is <= 40 lines`, () => {
    const profile = readJson(path.join(dir, "profile.json"));
    for (const pt of profile.page_types) {
      const guidePath = path.join(dir, pt.guide);
      assert.ok(fs.existsSync(guidePath), `${kind}: missing guide ${pt.guide}`);
      const lineCount = fs.readFileSync(guidePath, "utf8").split("\n").length;
      assert.ok(lineCount <= 40, `${kind}/${pt.guide}: ${lineCount} lines (> 40)`);
    }
  });

  test(`${kind}: every suggested pattern/diagram exists in core`, () => {
    const profile = readJson(path.join(dir, "profile.json"));
    for (const pt of profile.page_types) {
      for (const name of pt.suggested_patterns) {
        const patternDir = path.join(PLUGIN_ROOT, "core", "patterns", name);
        assert.ok(fs.existsSync(patternDir), `${kind}/${pt.id}: no core/patterns/${name}/`);
        assert.ok(
          fs.existsSync(path.join(patternDir, `${name}.css`)),
          `${kind}/${pt.id}: core/patterns/${name}/${name}.css missing`
        );
      }
      for (const name of pt.suggested_diagrams) {
        const diagramDir = path.join(PLUGIN_ROOT, "core", "diagrams", name);
        assert.ok(fs.existsSync(diagramDir), `${kind}/${pt.id}: no core/diagrams/${name}/`);
        assert.ok(
          fs.existsSync(path.join(diagramDir, "render.mjs")),
          `${kind}/${pt.id}: core/diagrams/${name}/render.mjs missing`
        );
      }
    }
  });

  test(`${kind}: default_sources are pre-selected in the where-to-look interview round, plus a free-form Other`, () => {
    const profile = readJson(path.join(dir, "profile.json"));
    const whereToLook = profile.interview.find((q) => q.id === "where-to-look");
    assert.ok(whereToLook, `${kind}: no "where-to-look" interview question`);
    assert.equal(whereToLook.multiSelect, true);
    assert.equal(
      whereToLook.options.filter((o) => o.default).length,
      profile.default_sources.length
    );
    assert.ok(whereToLook.options.some((o) => o.freeform === true && o.label === "Other"));
    assert.ok(whereToLook.options.length <= 4, `${kind}: AskUserQuestion takes at most 4 options`);
    assert.equal(profile.default_sources[0].kind, "wiki", `${kind}: the grounding wiki is the first source consulted`);
  });

  test(`${kind}: skeleton.contents.json validates against contents.schema.json`, () => {
    const skeleton = readJson(path.join(dir, "skeleton.contents.json"));
    const errors = validateContents(skeleton);
    assert.deepEqual(errors, []);
    assert.equal(skeleton.kind, kind);
    assert.equal(skeleton.brand, "neutral");
  });

  test(`${kind}: skeleton page order covers every page_types id, in a sensible start -> reference order`, () => {
    const profile = readJson(path.join(dir, "profile.json"));
    const skeleton = readJson(path.join(dir, "skeleton.contents.json"));
    const profileIds = profile.page_types.map((pt) => pt.id);
    const skeletonTypes = skeleton.pages.map((p) => p.type);
    assert.deepEqual(skeletonTypes, profileIds);
    assert.equal(skeleton.pages[0].type, "start-here");
  });
}

test("profile.schema.json itself rejects an unknown top-level property", () => {
  const bad = { ...readJson(path.join(PROFILES_ROOT, "pr-explainer", "profile.json")), extra: true };
  const errors = validateSchema(bad, PROFILE_SCHEMA);
  assert.ok(errors.some((e) => /unknown property/.test(e)));
});

// ------------------------------------------------------------ `new` -> build

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", ...opts });
}

function initTempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-profiles-new-"));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  execFileSync("git", ["init", "-q"], { cwd: dir, env });
  fs.writeFileSync(path.join(dir, "README.md"), "# fixture repo\n");
  execFileSync("git", ["add", "README.md"], { cwd: dir, env });
  execFileSync("git", ["commit", "-q", "-m", "initial"], { cwd: dir, env });
  return dir;
}

for (const kind of KINDS) {
  test(`explainer.mjs new demo --kind ${kind}, then build, succeeds inside a fresh temp git repo`, () => {
    const repo = initTempGitRepo();
    try {
      const newResult = run(["new", "demo", "--kind", kind], { cwd: repo });
      assert.equal(newResult.status, 0, newResult.stderr);
      assert.match(newResult.stdout, /Created/);

      const artifactDir = path.join(repo, "docs", "explainers", "demo");
      assert.ok(fs.existsSync(path.join(artifactDir, "contents.json")));

      // Every authored page type (every page_types id except the two
      // build-generated ones) must have gotten a placeholder pages/<id>.html.
      const profile = readJson(path.join(PROFILES_ROOT, kind, "profile.json"));
      for (const pt of profile.page_types) {
        if (pt.id === "generated-terms" || pt.id === "generated-sources") continue;
        const pageFile = path.join(artifactDir, "pages", `${pt.id}.html`);
        assert.ok(fs.existsSync(pageFile), `${kind}: new didn't write a placeholder for "${pt.id}"`);
        assert.match(fs.readFileSync(pageFile, "utf8"), /TODO/);
      }

      const buildResult = run(["build", "--dir", artifactDir], { cwd: repo });
      assert.equal(buildResult.status, 0, `${kind}: build failed\n${buildResult.stdout}\n${buildResult.stderr}`);
      assert.ok(fs.existsSync(path.join(artifactDir, "dist", "demo.html")), `${kind}: dist/demo.html missing`);
      assert.ok(fs.existsSync(path.join(artifactDir, "dist", "build-report.md")));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
}
