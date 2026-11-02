#!/usr/bin/env node
// sync-lib.mjs — stamp each plugin's vendored copy of repo-root lib/ (TASK-0147). The
// Claude desktop app's marketplace sync extracts the repo without symlink support, writing
// the old `<plugin>/lib -> ../lib` symlink as a 6-byte text file containing "../lib" — every
// `../lib/…` import then fails with ERR_MODULE_NOT_FOUND. Fix: each plugin carries a real,
// committed copy of lib/ instead of a symlink. Repo-root lib/ stays canonical; this script
// re-stamps the copies, and test/sync-lib.test.mjs fails the suite on drift.
//
//   node scripts/sync-lib.mjs           # overwrite every <plugin>/lib from repo-root lib/
//   node scripts/sync-lib.mjs --check   # exit 1 and list drift instead of writing
import { cpSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Plugin dirs (repo-relative, no leading "./") from marketplace.json's `source`. */
export function plugins(root = repo) {
  const mp = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
  return mp.plugins.map((p) => p.source.replace(/^\.\//, ""));
}

/** Every file under `dir`, as paths relative to `dir`. */
function filesUnder(dir, base = dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) filesUnder(p, base, acc);
    else acc.push(relative(base, p));
  }
  return acc;
}

/** Compare each `<plugin>/lib` against repo-root `lib/`: missing/extra files or byte
 *  mismatches. Empty array = every plugin's copy is exactly in sync. */
export function driftReport(root = repo) {
  const problems = [];
  const canonical = join(root, "lib");
  const canonicalFiles = new Set(filesUnder(canonical));
  for (const plugin of plugins(root)) {
    const lib = join(root, plugin, "lib");
    let stat;
    try { stat = statSync(lib); } catch { problems.push(`${plugin}/lib: missing`); continue; }
    if (!stat.isDirectory()) { problems.push(`${plugin}/lib: not a real directory (run: node scripts/sync-lib.mjs)`); continue; }
    const theirs = new Set(filesUnder(lib));
    for (const f of canonicalFiles) if (!theirs.has(f)) problems.push(`${plugin}/lib: missing ${f} (run: node scripts/sync-lib.mjs)`);
    for (const f of theirs) if (!canonicalFiles.has(f)) problems.push(`${plugin}/lib: stale extra file ${f} (run: node scripts/sync-lib.mjs)`);
    for (const f of canonicalFiles) {
      if (!theirs.has(f)) continue;
      if (!readFileSync(join(canonical, f)).equals(readFileSync(join(lib, f))))
        problems.push(`${plugin}/lib/${f}: drifted from lib/${f} (run: node scripts/sync-lib.mjs)`);
    }
  }
  return problems;
}

/** Overwrite every `<plugin>/lib` with a fresh copy of repo-root `lib/` (symlink, file, or
 *  stale dir — all removed first). */
export function syncLib(root = repo) {
  const canonical = join(root, "lib");
  for (const plugin of plugins(root)) {
    const lib = join(root, plugin, "lib");
    rmSync(lib, { recursive: true, force: true });
    cpSync(canonical, lib, { recursive: true });
  }
}

if (runAsCli(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const problems = driftReport();
    for (const p of problems) console.error(p);
    if (problems.length) process.exit(1);
    console.log("plugin lib/ copies in sync");
  } else {
    syncLib();
    console.log(`synced lib/ into ${plugins().length} plugins`);
  }
}
