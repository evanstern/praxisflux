// The version-bump gate: released surface can't change without the marketplace version
// increasing, a released tag can't be reused, and an edited skill must bump its own version.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  semverParse, semverGt, releasedSurface, skillDirOf, evaluate, frontmatterVersion,
} from "../scripts/check-version-bump.mjs";

const SRCS = ["./educate", "./research"];

test("semver: parse and strict increase", () => {
  assert.deepEqual(semverParse("1.2.3"), [1, 2, 3]);
  assert.equal(semverParse("1.2"), null);
  assert.equal(semverParse("v1.2.3"), null);
  assert.ok(semverGt("0.2.0", "0.1.9"));
  assert.ok(semverGt("1.0.0", "0.9.9"));
  assert.ok(!semverGt("0.1.0", "0.1.0"));
  assert.ok(!semverGt("0.1.0", "0.2.0"));
});

test("released surface: plugin dirs, lib, scripts, marketplace — not docs/backlog/test", () => {
  for (const f of ["educate/skills/lesson/SKILL.md", "lib/markdown.mjs", "scripts/build.mjs", ".claude-plugin/marketplace.json"])
    assert.ok(releasedSurface(f, SRCS), f);
  for (const f of ["docs/releasing.md", "backlog/tasks/task-13.md", "test/wiki.test.mjs", ".github/workflows/ci.yml", "README.md", "CLAUDE.md", ".githooks/pre-push"])
    assert.ok(!releasedSurface(f, SRCS), f);
});

test("skillDirOf: maps files to their skill dir", () => {
  assert.equal(skillDirOf("educate/skills/lesson/SKILL.md", SRCS), "educate/skills/lesson");
  assert.equal(skillDirOf("educate/skills/lesson/scripts/progress.mjs", SRCS), "educate/skills/lesson");
  assert.equal(skillDirOf("educate/gates/deck.mjs", SRCS), null);
  assert.equal(skillDirOf("docs/skill-patterns.md", SRCS), null);
});

test("frontmatterVersion reads the version: key", () => {
  assert.equal(frontmatterVersion("---\nname: x\nversion: 0.1.0\n---\nbody"), "0.1.0");
  assert.equal(frontmatterVersion("---\nname: x\n---\nbody"), null);
  assert.equal(frontmatterVersion(null), null);
});

const base = { pluginSrcs: SRCS, baseVersion: "0.1.0", headVersion: "0.1.0", tagExists: false, skills: [] };

test("evaluate: docs/backlog-only diff is exempt — no bump required", () => {
  assert.deepEqual(evaluate({ ...base, changedFiles: ["docs/releasing.md", "backlog/tasks/task-13.md"] }), []);
});

test("evaluate: released surface without a bump fails", () => {
  const errs = evaluate({ ...base, changedFiles: ["lib/markdown.mjs"] });
  assert.equal(errs.length, 1);
  assert.match(errs[0], /did not increase/);
});

test("evaluate: released surface with a semver increase passes", () => {
  assert.deepEqual(evaluate({ ...base, changedFiles: ["lib/markdown.mjs"], headVersion: "0.2.0" }), []);
});

test("evaluate: a decreased or equal version is not a bump", () => {
  assert.match(evaluate({ ...base, changedFiles: ["lib/x.mjs"], headVersion: "0.0.9" })[0], /did not increase/);
});

test("evaluate: reusing an already-released tag fails", () => {
  const errs = evaluate({ ...base, changedFiles: ["lib/x.mjs"], headVersion: "0.2.0", tagExists: true });
  assert.match(errs[0], /already released/);
});

test("evaluate: skill edited without bumping its version fails; with bump passes", () => {
  const skill = { dir: "educate/skills/lesson", headExists: true, baseVersion: "0.1.0", headVersion: "0.1.0" };
  const files = ["educate/skills/lesson/SKILL.md"];
  const errs = evaluate({ ...base, changedFiles: files, headVersion: "0.2.0", skills: [skill] });
  assert.equal(errs.length, 1);
  assert.match(errs[0], /SKILL\.md version did not increase/);
  assert.deepEqual(
    evaluate({ ...base, changedFiles: files, headVersion: "0.2.0", skills: [{ ...skill, headVersion: "0.1.1" }] }),
    [],
  );
});

test("evaluate: a skill gaining its first version counts as bumped; missing version fails", () => {
  const files = ["educate/skills/lesson/SKILL.md"];
  const adopted = { dir: "educate/skills/lesson", headExists: true, baseVersion: null, headVersion: "0.1.0" };
  assert.deepEqual(evaluate({ ...base, changedFiles: files, headVersion: "0.2.0", skills: [adopted] }), []);
  const missing = { ...adopted, headVersion: null };
  assert.match(evaluate({ ...base, changedFiles: files, headVersion: "0.2.0", skills: [missing] })[0], /no semver `version:`/);
});

test("evaluate: a deleted skill is not checked", () => {
  const gone = { dir: "educate/skills/lesson", headExists: false, baseVersion: "0.1.0", headVersion: null };
  assert.deepEqual(
    evaluate({ ...base, changedFiles: ["educate/skills/lesson/SKILL.md"], headVersion: "0.2.0", skills: [gone] }),
    [],
  );
});

// ---------- end-to-end: the git wrapper over a throwaway repo ----------

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-version-bump.mjs");

function run(cwd, ...args) {
  try {
    return { status: 0, out: execFileSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" }) };
  } catch (e) {
    return { status: e.status, out: `${e.stdout}${e.stderr}` };
  }
}

function sh(cwd, ...args) {
  execFileSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
}

test("end-to-end: exempt diff passes, surface diff needs a bump, tag reuse fails", () => {
  const repo = mkdtempSync(join(tmpdir(), "praxisflux-bump-"));
  try {
    sh(repo, "init", "-q", "-b", "main");
    mkdirSync(join(repo, ".claude-plugin"), { recursive: true });
    mkdirSync(join(repo, "alpha", "skills", "hello"), { recursive: true });
    mkdirSync(join(repo, "docs"), { recursive: true });
    const mp = (v) => JSON.stringify({ name: "t", version: v, plugins: [{ name: "alpha", source: "./alpha" }] });
    writeFileSync(join(repo, ".claude-plugin", "marketplace.json"), mp("0.1.0"));
    writeFileSync(join(repo, "alpha", "skills", "hello", "SKILL.md"), "---\nname: hello\nversion: 0.1.0\n---\nhi\n");
    writeFileSync(join(repo, "docs", "notes.md"), "n\n");
    sh(repo, "add", "-A"); sh(repo, "commit", "-q", "-m", "base");

    // docs-only change → exempt
    sh(repo, "checkout", "-q", "-b", "feature");
    writeFileSync(join(repo, "docs", "notes.md"), "more\n");
    sh(repo, "add", "-A"); sh(repo, "commit", "-q", "-m", "docs");
    assert.equal(run(repo, "--base", "main").status, 0);

    // skill edit, no bumps → both failures reported
    writeFileSync(join(repo, "alpha", "skills", "hello", "SKILL.md"), "---\nname: hello\nversion: 0.1.0\n---\nedited\n");
    sh(repo, "add", "-A"); sh(repo, "commit", "-q", "-m", "skill edit");
    const fail = run(repo, "--base", "main");
    assert.equal(fail.status, 1);
    assert.match(fail.out, /marketplace version did not increase/);
    assert.match(fail.out, /SKILL\.md version did not increase/);

    // bump marketplace + skill → passes
    writeFileSync(join(repo, ".claude-plugin", "marketplace.json"), mp("0.2.0"));
    writeFileSync(join(repo, "alpha", "skills", "hello", "SKILL.md"), "---\nname: hello\nversion: 0.1.1\n---\nedited\n");
    sh(repo, "add", "-A"); sh(repo, "commit", "-q", "-m", "bump");
    const ok = run(repo, "--base", "main");
    assert.equal(ok.status, 0);
    assert.match(ok.out, /0\.1\.0 → 0\.2\.0/);

    // tag already exists → refuse to reuse
    sh(repo, "tag", "v0.2.0");
    assert.match(run(repo, "--base", "main").out, /already released/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
