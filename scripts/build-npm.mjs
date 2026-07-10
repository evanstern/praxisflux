#!/usr/bin/env node
// build-npm.mjs — assemble the npm package staging tree for the gate surface (@praxisflux/gates).
//
// The npm surface is the SAME runner action.yml uses (scripts/run-gates.mjs), carved out of
// the repo with its import graph intact: the runner, root lib/, each gate plugin's gates/
// dir, and the plugin-local `lib -> ../lib` symlinks materialized as real copies — npm
// refuses to pack symlinks, so the staging tree must contain none (enforced below: the build
// fails on any symlink in the output).
//
// package.json is GENERATED from .claude-plugin/marketplace.json, so the npm version is
// lockstep with the marketplace by construction — there is no second version file to sync.
// docs/consuming-gates.md (the versioned consumer contract) ships as the package README.
//
//   node scripts/build-npm.mjs [--out <dir>]     # default: dist/npm
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The published name — the praxisflux npm org was claimed for this (TASK-17 AC#1); the
 *  repo is expected to eventually rename to praxisflux to match. */
export const PACKAGE_NAME = "@praxisflux/gates";

/** Plugins whose gates the runner imports; each needs its lib symlink materialized. */
const GATE_PLUGINS = ["spec-bridge", "grounding-wiki", "codebase-to-course"];

/** Walk `dir` and return any symlinks found (repo-relative paths). */
function findSymlinks(dir, base = dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) out.push(p.slice(base.length + 1));
    else if (e.isDirectory()) out.push(...findSymlinks(p, base));
  }
  return out;
}

/** Build the staging tree at `out`; returns the generated package manifest. */
export function buildNpm(out) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "scripts"), { recursive: true });
  cpSync(join(repo, "scripts", "run-gates.mjs"), join(out, "scripts", "run-gates.mjs"));
  cpSync(join(repo, "lib"), join(out, "lib"), { recursive: true });
  for (const plugin of GATE_PLUGINS) {
    cpSync(join(repo, plugin, "gates"), join(out, plugin, "gates"), { recursive: true });
    cpSync(join(repo, "lib"), join(out, plugin, "lib"), { recursive: true });
  }
  // The course gate reaches into the skill's references for the shared validators.
  const validate = join("codebase-to-course", "skills", "codebase-to-course", "references", "validate.mjs");
  mkdirSync(dirname(join(out, validate)), { recursive: true });
  cpSync(join(repo, validate), join(out, validate));
  cpSync(join(repo, "LICENSE"), join(out, "LICENSE"));
  cpSync(join(repo, "docs", "consuming-gates.md"), join(out, "README.md"));

  const mp = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
  const pkg = {
    name: PACKAGE_NAME,
    version: mp.version,
    description:
      "praxis gate checks as a zero-dependency CLI (spec-bridge, wiki-freshness, course) — status can't exceed proven artifacts",
    license: "MIT",
    repository: { type: "git", url: "git+https://github.com/evanstern/praxis.git" },
    type: "module",
    bin: { "praxis-gates": "scripts/run-gates.mjs" },
    engines: { node: ">=18" },
  };
  writeFileSync(join(out, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  const links = findSymlinks(out);
  if (links.length)
    throw new Error(`staging tree contains symlinks npm cannot pack: ${links.join(", ")}`);
  return pkg;
}

if (runAsCli(import.meta.url)) {
  const i = process.argv.indexOf("--out");
  const out = i !== -1 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : join(repo, "dist", "npm");
  const pkg = buildNpm(out);
  console.log(`staged ${pkg.name}@${pkg.version} → ${out}`);
}
