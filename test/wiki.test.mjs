// Tests for educate's corpus-index roll-up (topics/<topic>/WIKI.md + topics/WIKI.md).
//   run: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  parseWikisTable, topicVaults, renderTopicWiki, renderProjectWiki, isStale, wikiStalenessWarnings,
} from "../educate/gates/wiki.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

// Build a fixture project: philosophy with a series vault (Arc, with an MOC) + a lesson vault.
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-wiki-"));
  const topics = join(root, "topics");
  const home = (wiki, about) =>
    `---\ntitle: Home\ntype: moc\nupdated: 2026-01-01\n---\n\n# Home\n\n## Wikis\n\n| Topic | About |\n| ----- | ----- |\n| [[${wiki}]] | ${about} |\n`;

  const series = join(topics, "philosophy", "research");
  mkdirSync(join(series, "Arc"), { recursive: true });
  writeFileSync(join(series, ".research-vault"), "");
  writeFileSync(join(series, "Home.md"), home("Arc", "the whole arc"));
  writeFileSync(join(series, "Arc", "Arc.md"), "---\ntitle: Arc\ntype: moc\n---\n"); // MOC → deep link resolves

  const lesson = join(topics, "philosophy", "101-socrates", "research");
  mkdirSync(lesson, { recursive: true });
  writeFileSync(join(lesson, ".research-vault"), "");
  writeFileSync(join(lesson, "Home.md"), home("Socrates", "the man")); // no MOC file → plain-text name
  return { root, topics, topicDir: join(topics, "philosophy") };
}

test("wiki: parseWikisTable reads the ## Wikis rows, skipping header/separator", () => {
  const rows = parseWikisTable("## Wikis\n\n| Topic | About |\n| --- | --- |\n| [[A]] | first |\n| [[B]] | second |\n");
  assert.deepEqual(rows, [{ topic: "A", about: "first" }, { topic: "B", about: "second" }]);
  assert.deepEqual(parseWikisTable("## Other\n| [[X]] | y |"), []); // only the Wikis section counts
});

test("wiki: topicVaults finds every vault, series first", () => {
  const { topicDir } = fixture();
  const vaults = topicVaults(topicDir);
  assert.equal(vaults.length, 2);
  assert.equal(vaults[0].scope, "series");
  assert.equal(vaults[1].scope, "101-socrates");
});

test("wiki: renderTopicWiki rolls up vaults with relative links and NO wikilinks", () => {
  const { topicDir } = fixture();
  const md = renderTopicWiki(topicDir, "philosophy", { date: "2026-07-07" });
  assert.ok(md.includes("| series | [research/Home.md](research/Home.md)"));
  assert.ok(md.includes("101-socrates/research/Home.md"));
  assert.ok(md.includes("[Arc](research/Arc/Arc.md)"));       // MOC exists → deep link
  assert.ok(md.includes("Socrates — the man"));                // no MOC → plain text
  assert.equal(md.includes("[["), false);                      // isolation: never emit wikilinks
});

test("wiki: renderProjectWiki lists topics that have vaults", () => {
  const { topics } = fixture();
  const md = renderProjectWiki(topics, { date: "2026-07-07" });
  assert.ok(md.includes("| philosophy | 2 | [philosophy/WIKI.md](philosophy/WIKI.md) |"));
});

test("wiki: isStale ignores the updated date; warnings fire on drift", () => {
  const { root, topics, topicDir } = fixture();
  const fresh = renderTopicWiki(topicDir, "philosophy", { date: "2026-07-07" });
  assert.equal(isStale(join(topicDir, "WIKI.md"), fresh), true);   // file missing → stale
  writeFileSync(join(topicDir, "WIKI.md"), fresh);
  writeFileSync(join(topics, "WIKI.md"), renderProjectWiki(topics, { date: "2026-07-07" }));
  // Re-rendering with a different date must NOT read as stale (date line is normalized out).
  assert.equal(isStale(join(topicDir, "WIKI.md"), renderTopicWiki(topicDir, "philosophy", { date: "2030-01-01" })), false);
  assert.deepEqual(wikiStalenessWarnings(root), []);               // both current → no warnings
});

// ---- the wiki CLI's check/sync contract (spawned, exit codes included) ----
const wikiCli = join(dirname(fileURLToPath(import.meta.url)), "..", "educate", "scripts", "wiki.mjs");
const runWiki = (root, ...args) =>
  spawnSync(process.execPath, [wikiCli, ...args, "--root", root], { encoding: "utf8" });

test("wiki CLI: vault-less single-topic --check converges with --sync (no permanent stale loop)", () => {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-wiki-cli-"));
  mkdirSync(join(root, "topics", "bare"), { recursive: true }); // a topic with NO research vaults

  // check: distinct no-vaults verdict at exit 0 — never "stale (run --sync)"
  let r = runWiki(root, "bare", "--check");
  assert.equal(r.status, 0, `vault-less check must exit 0; stdout: ${r.stdout} stderr: ${r.stderr}`);
  assert.match(r.stdout, /no research vaults/);
  assert.doesNotMatch(r.stdout, /stale/);

  // the full loop the old code never escaped: check → sync (skipped) → check, all exit 0
  r = runWiki(root, "bare", "--sync");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /skipped/); // the verdict the check guard must stay consistent with
  r = runWiki(root, "bare", "--check");
  assert.equal(r.status, 0, "post-sync re-check must stay converged");
});

test("wiki CLI: a vaulted topic still reports stale at exit 1, and --sync still fixes it", () => {
  const { root } = fixture(); // philosophy has vaults but no WIKI.md yet → genuinely stale
  let r = runWiki(root, "philosophy", "--check");
  assert.equal(r.status, 1, `stale vaulted topic must exit 1; stdout: ${r.stdout}`);
  assert.match(r.stdout, /stale \(run --sync\)/);
  r = runWiki(root, "philosophy", "--sync");
  assert.equal(r.status, 0);
  r = runWiki(root, "philosophy", "--check");
  assert.equal(r.status, 0, "the remedy the message names must actually converge");
});

test("gate-runner: warn notices surface without blocking", () => {
  const warnOnly = { name: "w", resolveRoots: () => ["/x"], check: () => [], warn: () => ["heads up"] };
  const r = evaluate({}, [warnOnly]);
  assert.equal(r.block, false);        // warnings never block
  assert.equal(r.warnings, "heads up");
});
