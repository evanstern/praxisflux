// Generator execution.
//
// Built-ins — today just `git-manifest`, a port of root `specs/arch/
// gen_manifest.py` — run first and need no approval. Command generators run
// only once approved (lib/approvals.mjs); an unapproved or changed one stops
// the whole build with `needs approval: <id> <cmd>`, never a partial
// run. Every declared generator's JSON output is cached at
// dist/gen/<id>.json for lib/includes.mjs's x-include and the build
// report to read — "cached" means *persisted*, not memoized: every build
// re-runs every generator (: "every build re-runs").
//
// Judgment calls (noted  "Deviations"):
//   - `generators[id].timeout` has no stated unit; this
//     build treats it as seconds (matching a human-authored contents.json
//     value like the spec's own example, `"timeout": 60`), not ms.
//   - A failing generator stops the whole run immediately (like page
//     expansion's per-page aggregation, generators run in `contents.json`
//     declaration order, but unlike it, they do not keep running every
//     remaining generator to report every failure at once) — a command
//     generator can have side effects, so running every declared generator
//     even after one has already failed didn't seem like the right default.

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { computeFingerprint, isApproved, loadApprovals, resolveGeneratorCwd } from "./approvals.mjs";

const DEFAULT_RANGE = "origin/master...HEAD";
const DEFAULT_TIMEOUT_SECONDS = 30;

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

// --- git-manifest builtin (port of specs/arch/gen_manifest.py) -------------

/**
 * Compiles one bucket `match` glob to a RegExp. Built-ins only (no npm glob
 * library): `**` matches across path segments (and also matches zero
 * segments when immediately followed by a `/`), a lone `*` matches within
 * one segment, `?` matches one non-separator character, and every other
 * regex metacharacter is escaped.
 */
export function globToRegExp(glob) {
  let re = "";
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 3;
        } else {
          re += ".*";
          i += 2;
        }
      } else {
        re += "[^/]*";
        i += 1;
      }
    } else if (c === "?") {
      re += "[^/]";
      i += 1;
    } else if ("\\^$.+{}()|[]".includes(c)) {
      re += `\\${c}`;
      i += 1;
    } else {
      re += c;
      i += 1;
    }
  }
  return new RegExp(`^${re}$`);
}

/** First bucket (in declared order) whose match[] covers `filePath`, or null. */
export function bucketFor(filePath, buckets) {
  for (const bucket of buckets) {
    if ((bucket.match || []).some((glob) => globToRegExp(glob).test(filePath))) return bucket.id;
  }
  return null;
}

/** True when `filePath` matches any glob in `excludeGlobs` (same glob dialect as `buckets[].match`). */
function isExcluded(filePath, excludeGlobs) {
  return excludeGlobs.some((glob) => globToRegExp(glob).test(filePath));
}

/**
 * Runs the `git-manifest` builtin: `git diff --name-status <range>` in
 * `repoRoot`, bucketing every changed path via `buckets[].match` globs —
 * first matching bucket wins, same as the ported Python's if/elif chain. An
 * unmatched path is a build error, exactly as the original `gen_manifest.py`
 * (`bucket_for` raising `ValueError`). Returns `{ files: [{path, status,
 * bucket}], counts: { <bucketId>: n } }` — the shape the `file-map` pattern
 * consumes.
 *
 * Every excluded path is dropped *before* bucket matching ever runs on it —
 * it is never counted as unmatched, and never appears in `files`/`counts`.
 * Two exclude sources, both optional, combine:
 *   - **The artifact's own folder, always.** `artifactDir` (relative to
 *     `repoRoot`) is auto-excluded as `<relPath>/**` — a `/explain` run that
 *     commits its own `docs/explainers/<name>/` source inside the same PR
 *     range it's reporting on must never see its own source flagged as an
 *     unmatched (or even matched) changed path (behavioural-run
 *     fix: re-running `check` right after that commit was landing
 *     `no bucket matched "docs/explainers/<name>/contents.json"`).
 *   - **`config.exclude: [<glob>, ...]`**, for any other self-generated path
 *     a project wants dropped the same way.
 */
export function runGitManifest(config, { repoRoot, artifactDir } = {}) {
  if (!repoRoot) {
    throw new Error("git-manifest: no repo root available to run git diff in");
  }
  const range = config.range || DEFAULT_RANGE;
  const buckets = config.buckets || [];

  const excludeGlobs = Array.isArray(config.exclude) ? [...config.exclude] : [];
  if (artifactDir) {
    const relArtifactPath = path.relative(repoRoot, artifactDir).split(path.sep).join("/");
    if (relArtifactPath && !relArtifactPath.startsWith("..") && !path.isAbsolute(relArtifactPath)) {
      excludeGlobs.push(`${relArtifactPath}/**`);
    }
  }

  const result = spawnSync("git", ["diff", "--name-status", range], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error) {
    throw new Error(`git-manifest: failed to run git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`git-manifest: git diff --name-status ${range} failed: ${(result.stderr || "").trim()}`);
  }

  const files = [];
  const counts = {};
  for (const line of result.stdout.split("\n")) {
    if (!line.trim()) continue;
    const tab = line.indexOf("\t");
    const status = line.slice(0, tab);
    const filePath = line.slice(tab + 1);
    if (isExcluded(filePath, excludeGlobs)) continue;
    const bucket = bucketFor(filePath, buckets);
    if (!bucket) {
      throw new Error(`git-manifest: no bucket matched "${filePath}" (declare a bucket whose match[] covers it)`);
    }
    files.push({ path: filePath, status, bucket });
    counts[bucket] = (counts[bucket] || 0) + 1;
  }
  return { files, counts };
}

// --- command generators ------------------------------------------------------

/**
 * Runs one approved command generator (a shell command string) and parses
 * its stdout as JSON (: "stdout must be JSON"). `timeout` is honoured —
 * a generator that runs past it is killed and reported, never left hanging.
 */
export function runCommandGenerator(config, { cwd }) {
  const timeoutSeconds = config.timeout ?? DEFAULT_TIMEOUT_SECONDS;
  const result = spawnSync(config.cmd, {
    cwd,
    shell: true,
    encoding: "utf8",
    timeout: timeoutSeconds * 1000,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) {
    // Depending on platform/Node version, a timed-out spawnSync reports
    // either `result.signal` (below) or `result.error.code === "ETIMEDOUT"`
    // here — both mean the same thing: the generator was killed for running
    // past its timeout, not a failure to launch it at all.
    if (result.error.code === "ETIMEDOUT") {
      throw new Error(`"${config.cmd}" timed out after ${timeoutSeconds}s`);
    }
    throw new Error(`failed to run "${config.cmd}": ${result.error.message}`);
  }
  if (result.signal) {
    throw new Error(`"${config.cmd}" timed out after ${timeoutSeconds}s (killed with ${result.signal})`);
  }
  if (result.status !== 0) {
    throw new Error(`"${config.cmd}" exited ${result.status}: ${(result.stderr || "").trim()}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    throw new Error(`"${config.cmd}" did not print JSON on stdout: ${err.message}`);
  }
}

function writeGenOutput(artifactDir, id, jsonString) {
  const dir = path.join(artifactDir, "dist", "gen");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.json`);
  fs.writeFileSync(file, jsonString);
  return file;
}

/**
 * Runs every generator declared in `contents.generators`, in declared order.
 *Returns `{ ok: true, outputs: Map<id, value>, report: [...] }`
 * on success (`report` feeds the build report: id, kind, run time,
 * output hash, cache path), or `{ ok: false, errors: [...], needsApproval?:
 * { id, cmd } }` at the first failing/unapproved generator.
 */
export function runGenerators({ contents, artifactDir, repoRoot }) {
  const generators = contents.generators || {};
  const outputs = new Map();
  const report = [];

  for (const [id, config] of Object.entries(generators)) {
    const t0 = Date.now();

    if (config.builtin === "git-manifest") {
      let value;
      try {
        value = runGitManifest(config, { repoRoot: repoRoot || artifactDir, artifactDir });
      } catch (err) {
        return { ok: false, errors: [`generator "${id}" (git-manifest): ${err.message}`] };
      }
      const json = JSON.stringify(value);
      const outputPath = writeGenOutput(artifactDir, id, json);
      outputs.set(id, value);
      report.push({
        id,
        kind: "builtin",
        builtin: "git-manifest",
        ms: Date.now() - t0,
        hash: sha256Hex(json),
        outputPath,
      });
      continue;
    }

    const cwd = resolveGeneratorCwd({ cwd: config.cwd, repoRoot, artifactDir });
    const fingerprint = computeFingerprint({ cmd: config.cmd, cwd });
    const approvals = loadApprovals(artifactDir);
    if (!isApproved(approvals, id, fingerprint)) {
      return {
        ok: false,
        needsApproval: { id, cmd: config.cmd },
        errors: [`needs approval: ${id} ${config.cmd}`],
      };
    }

    let value;
    try {
      value = runCommandGenerator(config, { cwd });
    } catch (err) {
      return { ok: false, errors: [`generator "${id}" (${config.cmd}): ${err.message}`] };
    }
    const json = JSON.stringify(value);
    const outputPath = writeGenOutput(artifactDir, id, json);
    outputs.set(id, value);
    report.push({
      id,
      kind: "cmd",
      cmd: config.cmd,
      ms: Date.now() - t0,
      hash: sha256Hex(json),
      outputPath,
    });
  }

  return { ok: true, outputs, report };
}
