#!/usr/bin/env node
// scripts/orient.mjs — deterministic Phase 1 orientation facts for a target repo. Read-only on
// the target; writes nothing anywhere. Exists so every review starts from the same evidence
// (layout, size per directory, test weight, recent activity) instead of ad-hoc shell pipelines.
//
//   node scripts/orient.mjs <target-repo>
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { runAsCli } from "../lib/cli.mjs";

const SRC = new Set([".go", ".py", ".ts", ".tsx", ".js", ".jsx", ".rs", ".mjs", ".java", ".rb", ".c", ".h", ".cpp", ".swift", ".kt", ".cs", ".sh"]);
const SKIP = new Set(["node_modules", "dist", "vendor", "target", ".git", ".worktrees", "__pycache__", ".venv", "venv"]);
const isTest = (p) => /(^|\/)(tests?|e2e|__tests__|spec)\//.test(p) || /(_test\.|\.test\.|\.spec\.|^test_)/.test(p.split("/").pop());

function walk(dir, base, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else if (SRC.has(extname(e.name))) {
      const rel = p.slice(base.length + 1);
      let lines = 0;
      try { lines = readFileSync(p, "utf8").split("\n").length; } catch { /* unreadable: count as 0 */ }
      acc.push({ rel, lines, test: isTest(rel) });
    }
  }
}

if (runAsCli(import.meta.url)) {
  const target = resolve(process.argv[2] || ".");
  statSync(target);
  const files = [];
  walk(target, target, files);

  const byDir = new Map();
  for (const f of files.filter((x) => !x.test)) {
    const dir = f.rel.includes("/") ? f.rel.split("/").slice(0, 2).join("/") : "(root)";
    byDir.set(dir, (byDir.get(dir) || 0) + f.lines);
  }
  const src = files.filter((f) => !f.test), tests = files.filter((f) => f.test);

  console.log(`# orientation: ${target}`);
  console.log(`source: ${src.length} files, ${src.reduce((a, f) => a + f.lines, 0)} lines | tests: ${tests.length} files, ${tests.reduce((a, f) => a + f.lines, 0)} lines`);
  console.log(`\n## lines by directory (non-test)`);
  for (const [d, n] of [...byDir].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${String(n).padStart(7)}  ${d}`);
  console.log(`\n## top-level entries`);
  console.log("  " + readdirSync(target).filter((n) => !n.startsWith(".")).join("  "));
  try {
    console.log(`\n## recent commits`);
    console.log(execFileSync("git", ["-C", target, "log", "--oneline", "-5"], { encoding: "utf8" }).trim().replace(/^/gm, "  "));
  } catch { console.log("  (not a git repo)"); }
}
