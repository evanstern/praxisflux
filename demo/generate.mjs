#!/usr/bin/env node
// generate.mjs — the PDLC demo rig's deterministic replay engine (specs/034-demo-rig).
//
// Materializes the throwaway demo project (praxis-pet, a tiny tamagotchi CLI) as a REAL
// git repo whose history IS the demo: one tag per lifecycle stage (stage-0 bare app →
// stage-1 grounded → stage-2 planned → stage-3 swept → stage-4 triaged). Every artifact
// was captured ONCE from genuine plugin runs into demo/fixtures/; this script only
// replays those fixtures — it never re-runs the plugins.
//
//   node demo/generate.mjs [--dir <path>]        generate (refuses to touch an existing dir)
//   node demo/generate.mjs --reset [--dir ...]   wipe + regenerate
//   node demo/generate.mjs --stage N [--dir ...] checkout tag stage-N in the generated repo
//   node demo/generate.mjs --check [--dir ...]   per-stage gate matrix (checkout each stage,
//                                                run its gates via scripts/run-gates.mjs /
//                                                the app's own `node --test`)
//   node demo/generate.mjs --remote <owner/repo|url> [--dir ...]
//                                                force-push replayed refs to the presenter's
//                                                scratch sandbox — presenter tooling ONLY:
//                                                default off, refused when CI is set
//   node demo/generate.mjs --snapshot N --from <dir>
//                                                (capture tooling) copy a capture tree into
//                                                demo/fixtures/stage-N/, .fxt-encoding JS
//
// Determinism (R1/R8): author+committer identity and a fixed date ladder (baseDate +
// i*stepSeconds per commit) are pinned by this script, user/system gitconfig is disabled
// (GIT_CONFIG_GLOBAL=null, GIT_CONFIG_NOSYSTEM=1), and file bytes come verbatim from
// fixtures — so regenerated history is hash-identical across runs AND machines, which is
// what keeps the wiki pins captured in the fixtures resolving against replayed history.
//
// Isolation (the runbook's hard rule): the demo repo lives OUTSIDE the praxisflux
// checkout (default: <os-tmpdir>/praxisflux-demo). Every git command runs with an
// explicit cwd inside the demo repo and a scrubbed environment (GIT_DIR/GIT_WORK_TREE/
// GIT_INDEX_FILE removed); a target inside the checkout is refused outright, and --reset
// only ever wipes a directory carrying this rig's own marker (.git/praxisflux-demo-rig).
//
// Fixture encoding: fixtures are the stage trees verbatim, EXCEPT that .js/.mjs/.cjs
// files are stored with a `.fxt` suffix (stripped on materialize). Bare `node --test`
// in the praxisflux repo discovers every test-shaped file recursively — the suffix keeps
// the demo app's suite out of the host repo's suite while fixtures stay reviewable text.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { devNull } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";

const RIG_ROOT = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(RIG_ROOT, "..");
const FIXTURES = join(RIG_ROOT, "fixtures");
const MARKER = "praxisflux-demo-rig";
const FXT = ".fxt";
const JS_RE = /\.(mjs|cjs|js)$/;

const die = (msg) => { console.error(`demo/generate.mjs: ${msg}`); process.exit(2); };

/* ── manifest ──────────────────────────────────────────────────────────── */

function loadManifest() {
  return JSON.parse(readFileSync(join(FIXTURES, "manifest.json"), "utf8"));
}

/* ── git plumbing: explicit cwd, scrubbed + pinned environment ─────────── */

function gitEnv(manifest, dateIndex = null) {
  const env = { ...process.env };
  delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.GIT_INDEX_FILE;
  env.GIT_CONFIG_GLOBAL = devNull;
  env.GIT_CONFIG_NOSYSTEM = "1";
  env.GIT_AUTHOR_NAME = manifest.identity.name;
  env.GIT_AUTHOR_EMAIL = manifest.identity.email;
  env.GIT_COMMITTER_NAME = manifest.identity.name;
  env.GIT_COMMITTER_EMAIL = manifest.identity.email;
  if (dateIndex !== null) {
    const t = new Date(new Date(manifest.baseDate).getTime() + dateIndex * manifest.stepSeconds * 1000);
    env.GIT_AUTHOR_DATE = t.toISOString();
    env.GIT_COMMITTER_DATE = t.toISOString();
  }
  return env;
}

function git(cwd, args, manifest, dateIndex = null) {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: gitEnv(manifest, dateIndex) }).trimEnd();
}

/* ── fixture trees ─────────────────────────────────────────────────────── */

/** Walk a fixture subdir into { repoRelPath → absoluteFixturePath }, stripping .fxt. */
function loadTree(fromDir) {
  const root = join(FIXTURES, fromDir);
  if (!existsSync(root)) die(`fixture dir missing: ${root}`);
  const tree = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const abs = join(dir, name);
      if (statSync(abs).isDirectory()) { walk(abs); continue; }
      let rel = relative(root, abs).split(sep).join("/");
      if (rel.endsWith(FXT)) rel = rel.slice(0, -FXT.length);
      tree.set(rel, abs);
    }
  };
  walk(root);
  return tree;
}

/** Does repo-relative path `rel` fall under any of the sync prefixes? "" means everything;
 *  a prefix matches its exact path or anything under it as a directory. */
function underPrefixes(rel, prefixes) {
  return prefixes.some((p) => {
    if (p === "") return true;
    const dir = p.endsWith("/") ? p : `${p}/`;
    return rel === p.replace(/\/$/, "") || rel.startsWith(dir);
  });
}

/** All tracked-shape files currently in the demo repo (everything except .git/). */
function targetFiles(target) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (dir === target && name === ".git") continue;
      const abs = join(dir, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else out.push(relative(target, abs).split(sep).join("/"));
    }
  };
  walk(target);
  return out;
}

/** Sync the demo repo's working tree to `tree` under `prefixes`: copy in matching fixture
 *  files, delete matching files the tree no longer has. */
function syncTree(target, tree, prefixes) {
  for (const rel of targetFiles(target)) {
    if (underPrefixes(rel, prefixes) && !tree.has(rel)) rmSync(join(target, rel));
  }
  for (const [rel, src] of tree) {
    if (!underPrefixes(rel, prefixes)) continue;
    const dest = join(target, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, readFileSync(src));
  }
}

/* ── generation ────────────────────────────────────────────────────────── */

function assertOutsideCheckout(target) {
  const rel = relative(REPO_ROOT, resolve(target));
  if (rel === "" || !rel.startsWith(".."))
    die(`target ${target} is inside the praxisflux checkout — the demo repo must live outside it`);
}

function generate(target, manifest, { reset }) {
  assertOutsideCheckout(target);
  if (existsSync(target)) {
    if (!reset) die(`${target} already exists — pass --reset to wipe and regenerate`);
    if (!existsSync(join(target, ".git", MARKER)) && readdirSync(target).length > 0)
      die(`${target} exists but doesn't look like a generated demo repo (no .git/${MARKER}) — refusing to wipe it`);
    rmSync(target, { recursive: true, force: true });
  }
  mkdirSync(target, { recursive: true });
  git(target, ["init", "-q", "-b", "main"], manifest);
  writeFileSync(join(target, ".git", MARKER), "generated by praxisflux demo/generate.mjs — safe to wipe\n");

  const hashes = new Map(); // ladder label → commit hash
  let i = 0; // date-ladder index: one slot per atomic commit
  const commitAll = (message, label) => {
    git(target, ["add", "-A"], manifest);
    git(target, ["commit", "-q", "-m", message], manifest, i++);
    hashes.set(label, git(target, ["rev-parse", "HEAD"], manifest));
  };

  for (const step of manifest.ladder) {
    const tree = loadTree(step.from);
    if (step.pr) {
      const { number, branch, title } = step.pr;
      const owner = manifest.sandbox.split("/")[0];
      git(target, ["checkout", "-q", "-b", branch], manifest);
      syncTree(target, tree, step.sync);
      commitAll(step.message, `${step.label}:commit`);
      git(target, ["checkout", "-q", "main"], manifest);
      git(target, ["merge", "-q", "--no-ff", "-m", `Merge pull request #${number} from ${owner}/${branch}\n\n${title}`, branch], manifest, i++);
      hashes.set(`${step.label}:merge`, git(target, ["rev-parse", "HEAD"], manifest));
    } else {
      syncTree(target, tree, step.sync);
      commitAll(step.message, step.label);
    }
    if (step.tag) git(target, ["tag", step.tag], manifest);
  }

  // demo-live-base: where the live demo task's genuine PR targets on the sandbox — the
  // board/spec state the live thread starts from (R3/R4). Local branch; pushed by --remote.
  if (hashes.has("stage-2")) git(target, ["branch", "-f", "demo-live-base", "stage-2"], manifest);

  console.log(`generated ${target}`);
  for (const [label, hash] of hashes) console.log(`  ${label} ${hash}`);
  return hashes;
}

/* ── per-stage gate matrix (--check) ───────────────────────────────────── */

function runGate(target, gate) {
  if (gate === "app-test") {
    const r = spawnSync(process.execPath, ["--test"], { cwd: target, encoding: "utf8", env: gitEnv(loadManifest()) });
    return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
  }
  const r = spawnSync(process.execPath, [join(REPO_ROOT, "scripts", "run-gates.mjs"), "--gates", gate, "--path", target],
    { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}

function check(target, manifest) {
  if (!existsSync(join(target, ".git"))) die(`${target} is not a generated demo repo — generate first`);
  let failed = 0;
  for (const stage of manifest.stages) {
    git(target, ["checkout", "-q", `refs/tags/${stage.tag}`], manifest);
    for (const gate of stage.gates) {
      const { ok, out } = runGate(target, gate);
      console.log(`[${stage.tag}] ${gate}: ${ok ? "PASS" : "FAIL"}`);
      if (!ok) { failed++; console.log(out.split("\n").map((l) => `    ${l}`).join("\n")); }
    }
  }
  git(target, ["checkout", "-q", "main"], manifest);
  console.log(failed ? `gate matrix: ${failed} FAILURE(S)` : "gate matrix: all stages green");
  return failed === 0;
}

/* ── sandbox force-push (--remote): presenter tooling, never CI ────────── */

function pushRemote(target, manifest, remote) {
  if (process.env.CI) die("--remote is presenter tooling and never runs in CI");
  const url = remote.includes(":") || remote.startsWith("http") ? remote : `git@github.com:${remote}.git`;
  const refs = ["+refs/heads/main:refs/heads/main", "+refs/heads/demo-live-base:refs/heads/demo-live-base",
    ...manifest.stages.map((s) => `+refs/tags/${s.tag}:refs/tags/${s.tag}`)];
  git(target, ["push", url, ...refs], manifest);
  console.log(`force-pushed main, demo-live-base and stage tags to ${url}`);
}

/* ── fixture snapshot (--snapshot N --from <dir>): capture tooling ─────── */

function snapshot(stageN, fromDir) {
  const src = resolve(fromDir);
  const dest = join(FIXTURES, `stage-${stageN}`);
  if (!existsSync(src)) die(`--from dir missing: ${src}`);
  rmSync(dest, { recursive: true, force: true });
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === ".git") continue;
      const abs = join(dir, name);
      const rel = relative(src, abs).split(sep).join("/");
      if (statSync(abs).isDirectory()) { walk(abs); continue; }
      if (rel.endsWith(FXT)) die(`capture tree contains a ${FXT} file (${rel}) — encoding would be ambiguous`);
      const out = join(dest, JS_RE.test(rel) ? `${rel}${FXT}` : rel);
      mkdirSync(dirname(out), { recursive: true });
      cpSync(abs, out);
    }
  };
  walk(src);
  console.log(`snapshotted ${src} → ${dest} (JS files ${FXT}-encoded)`);
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i !== -1 ? args[i + 1] : undefined; };

const manifest = loadManifest();
const target = resolve(opt("dir") ?? join(tmpdir(), "praxisflux-demo"));

if (flag("snapshot")) {
  snapshot(opt("snapshot"), opt("from") ?? die("--snapshot needs --from <capture dir>"));
} else if (opt("stage") !== undefined) {
  if (!existsSync(join(target, ".git"))) die(`${target} is not a generated demo repo — generate first`);
  git(target, ["checkout", "-q", `refs/tags/stage-${opt("stage")}`], manifest);
  console.log(`${target} now at stage-${opt("stage")} (detached HEAD; --stage N to move, or git checkout main)`);
} else if (flag("check") && existsSync(join(target, ".git")) && !flag("reset")) {
  process.exit(check(target, manifest) ? 0 : 1);
} else {
  generate(target, manifest, { reset: flag("reset") });
  if (flag("check")) process.exit(check(target, manifest) ? 0 : 1);
  if (opt("remote")) pushRemote(target, manifest, opt("remote"));
}
