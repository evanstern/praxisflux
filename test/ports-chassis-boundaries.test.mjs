// ports-chassis-boundaries.test.mjs — spec 073 R7: the five new chassis modules and the
// `pdlc` CLI import no network built-in, call no `fetch(`, and spawn no gh/glab/tea/
// backlog/rg/jq. The only spawned binary anywhere in the chassis is `git`
// (lib/credentials.mjs). A static source scan, not a sandbox — it proves the invariant holds
// today and catches a regression the moment it's typed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

// Exactly the files spec 073 R7 scopes this check to: the five new lib/*.mjs modules plus
// the driving-port CLI. Pre-existing modules (e.g. lib/structured-offload.mjs, which already
// calls fetch per spec 063) are deliberately out of scope — see plan.md "Open questions".
const CHASSIS_FILES = [
  "lib/port-registry.mjs",
  "lib/pdlc-config.mjs",
  "lib/receipts.mjs",
  "lib/contract-harness.mjs",
  "lib/credentials.mjs",
  "pdlc/scripts/pdlc.mjs",
];

const FORBIDDEN_NETWORK_IMPORT = /\bnode:(http|https|net|tls)\b/;
const FORBIDDEN_FETCH_CALL = /\bfetch\s*\(/;
const FORBIDDEN_TOOLS = ["gh", "glab", "tea", "backlog", "rg", "jq"];
const FORBIDDEN_TOOL_LITERAL = new RegExp(`["'](${FORBIDDEN_TOOLS.join("|")})["']`);

for (const rel of CHASSIS_FILES) {
  test(`boundary: ${rel} imports no node:http/https/net/tls`, () => {
    const src = readFileSync(join(repo, rel), "utf8");
    assert.doesNotMatch(src, FORBIDDEN_NETWORK_IMPORT, `${rel} must not import a network built-in`);
  });

  test(`boundary: ${rel} calls no fetch(`, () => {
    const src = readFileSync(join(repo, rel), "utf8");
    assert.doesNotMatch(src, FORBIDDEN_FETCH_CALL, `${rel} must not call fetch(`);
  });

  test(`boundary: ${rel} does not reference gh/glab/tea/backlog/rg/jq as a spawned command`, () => {
    const src = readFileSync(join(repo, rel), "utf8");
    assert.doesNotMatch(src, FORBIDDEN_TOOL_LITERAL, `${rel} must not spawn a forbidden tool`);
  });
}

test("boundary: the only binary any chassis file spawns is git (lib/credentials.mjs)", () => {
  const credentialsSrc = readFileSync(join(repo, "lib", "credentials.mjs"), "utf8");
  assert.match(credentialsSrc, /spawn\w*\(\s*"git"/, "expected lib/credentials.mjs to spawn \"git\"");

  const others = CHASSIS_FILES.filter((f) => f !== "lib/credentials.mjs");
  for (const rel of others) {
    const src = readFileSync(join(repo, rel), "utf8");
    assert.doesNotMatch(src, /\b(?:spawn|spawnSync|execFile|execFileSync|exec|execSync)\s*\(/, `${rel} must not spawn any process`);
  }
});
