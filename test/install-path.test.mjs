// install-path.test.mjs — the marketplace install path, end to end.
//
// The suite's biggest structural bet: each plugin carries a committed `lib -> ../lib` symlink,
// and installing from the marketplace dereferences it into a real directory inside the cached
// copy — so a plugin's Stop hook must work from a tree that no longer sits beside repo-root
// lib/. Nothing exercised that path: unit tests import gates in-process, and the hook wiring
// (hooks.json -> gate.sh -> stop.mjs) had never been spawned the way Claude Code spawns it.
//
// This file converts the bet into a checked invariant. For every plugin that ships
// hooks/hooks.json it: (1) simulates a marketplace install — copy the plugin, dereference the
// lib symlink the way the cache does, assert no symlink survives; (2) spawns the EXACT Stop
// command from hooks.json (${CLAUDE_PLUGIN_ROOT} substituted, fake hook JSON on stdin) against
// a clean fixture — exit 0 proves the dereferenced import chain loads and runs; (3) spawns it
// against a fixture that violates the plugin's invariant — exit 2 with the gate's message on
// stderr proves the gate actually evaluates through the spawn path (not a vacuous pass); and
// (4) re-spawns the tripping fixture with stop_hook_active: true — exit 0 proves the loop
// guard holds through the shim, not just in evaluate()'s unit tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const marketplace = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));

// Coverage is derived from the catalog, not hand-listed: a plugin registered in
// marketplace.json that ships hooks/hooks.json is on the hook path and gets tested.
const HOOK_PLUGINS = marketplace.plugins
  .filter((p) => existsSync(join(repo, p.source, "hooks", "hooks.json")))
  .map((p) => ({ name: p.name, source: p.source.replace(/^\.\//, "") }));

/** Simulate a marketplace install: copy the plugin dir, then replace the marketplace-internal
 *  `lib` symlink with a real copy of the chassis — the same dereference the plugin cache (and
 *  scripts/build.mjs) performs. Returns the installed root. */
function installPlugin({ name, source }) {
  const dest = join(mkdtempSync(join(tmpdir(), `praxisflux-install-${name}-`)), name);
  cpSync(join(repo, source), dest, { recursive: true });
  const lib = join(dest, "lib");
  if (existsSync(lib) && lstatSync(lib).isSymbolicLink()) {
    rmSync(lib);
    cpSync(join(repo, "lib"), lib, { recursive: true });
  }
  return dest;
}

/** Every symlink left under `dir` (repo-relative paths) — an installed copy must have none. */
function symlinksUnder(dir, base = dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) acc.push(p.slice(base.length + 1));
    else if (e.isDirectory()) symlinksUnder(p, base, acc);
  }
  return acc;
}

/** Spawn the plugin's Stop hook exactly as Claude Code does: read the command out of
 *  hooks/hooks.json, substitute ${CLAUDE_PLUGIN_ROOT}, run it through bash with the hook
 *  JSON on stdin and CLAUDE_PROJECT_DIR/CLAUDE_PLUGIN_ROOT in the environment. */
function spawnStopHook(installed, projectDir, { stopHookActive = false } = {}) {
  const config = JSON.parse(readFileSync(join(installed, "hooks", "hooks.json"), "utf8"));
  const command = config.hooks?.Stop?.[0]?.hooks?.[0]?.command;
  assert.ok(
    command && command.includes("${CLAUDE_PLUGIN_ROOT}"),
    `${installed}: hooks.json must wire a Stop command rooted at \${CLAUDE_PLUGIN_ROOT}, got: ${command}`,
  );
  return spawnSync("bash", ["-c", command.replaceAll("${CLAUDE_PLUGIN_ROOT}", installed)], {
    input: JSON.stringify({ hook_event_name: "Stop", stop_hook_active: stopHookActive, cwd: projectDir }),
    encoding: "utf8",
    cwd: projectDir,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: installed, CLAUDE_PROJECT_DIR: projectDir },
  });
}

const fixtureDir = () => realpathSync(mkdtempSync(join(tmpdir(), "praxisflux-project-")));

// Per-plugin fixture that violates the plugin's one always-on invariant, plus the stderr
// signature proving the right gate produced the block.
const TRIPS = {
  educate: {
    fixture: (root) => {
      mkdirSync(join(root, "topics", "t"), { recursive: true });
      writeFileSync(
        join(root, "topics", "t", "progress.json"),
        JSON.stringify({ definitionOfDone: {}, lessons: [{ id: "101", status: "taught", artifacts: {} }] }),
      );
    },
    expect: /folder missing but status=taught/,
  },
  research: {
    fixture: (root) => {
      writeFileSync(join(root, ".research-vault"), "");
      writeFileSync(
        join(root, "page.html"),
        '<!doctype html><html><head><title>t</title><script src="https://cdn.example.com/x.js"></script></head><body></body></html>',
      );
    },
    expect: /external host/,
  },
  "spec-bridge": {
    fixture: (root) => {
      mkdirSync(join(root, "backlog", "tasks"), { recursive: true });
      mkdirSync(join(root, "specs", "001-a"), { recursive: true });
      writeFileSync(
        join(root, "backlog", "tasks", "task-1 - fixture.md"),
        "---\nid: TASK-1\ntitle: 'Fixture'\nstatus: Done\nassignee: []\n---\n\n## Description\n\nSpec: specs/001-a/\n",
      );
    },
    expect: /TASK-1/,
  },
  "team-review": {
    fixture: (root) => {
      const runs = join(root, ".handoff", "team-review", "runs");
      mkdirSync(runs, { recursive: true });
      writeFileSync(
        join(runs, "r1.json"),
        JSON.stringify({ id: "r1", state: "in-flight", target: root, report: join(dirname(root), "r1-report.md"), cwd: root }),
      );
    },
    expect: /report not written yet/,
  },
};

test("every Stop-hook plugin is covered: catalog-derived list is complete and has a tripping fixture", () => {
  const names = HOOK_PLUGINS.map((p) => p.name).sort();
  for (const expected of ["educate", "research", "spec-bridge", "team-review"])
    assert.ok(names.includes(expected), `${expected} no longer ships hooks/hooks.json — Stop enforcement silently lost?`);
  for (const name of names)
    assert.ok(
      TRIPS[name],
      `${name} ships hooks/hooks.json but has no tripping fixture in this test — add one so its install path stays covered`,
    );
});

for (const plugin of HOOK_PLUGINS) {
  test(`install path e2e [${plugin.name}]: dereferenced copy runs its Stop hook; gate fires and honors the loop guard`, () => {
    const installed = installPlugin(plugin);

    // The symlink bet, checked: the installed chassis is a real directory, and no symlink at
    // all survives the copy (a new one appearing would mean this simulation went stale).
    const lib = join(installed, "lib");
    assert.ok(lstatSync(lib).isDirectory() && !lstatSync(lib).isSymbolicLink(), "installed lib/ must be a real directory");
    assert.ok(existsSync(join(lib, "gate-runner.mjs")), "installed lib/ must contain the chassis");
    assert.deepEqual(symlinksUnder(installed), [], "an installed copy must contain no symlinks");

    // Clean project: no roots resolve, and — the load-bearing part — the whole chain
    // (gate.sh -> node -> stop.mjs -> ../lib from the dereferenced copy) runs to exit 0.
    // An unresolved import would exit 1 here, not 0.
    const clean = fixtureDir();
    let r = spawnStopHook(installed, clean);
    assert.equal(r.status, 0, `clean fixture must allow the stop; stderr: ${r.stderr}`);

    // Violating project: the gate evaluates through the spawn path and blocks with its message.
    const trip = fixtureDir();
    TRIPS[plugin.name].fixture(trip);
    r = spawnStopHook(installed, trip);
    assert.equal(r.status, 2, `tripping fixture must block the stop (got ${r.status}); stderr: ${r.stderr} stdout: ${r.stdout}`);
    assert.match(r.stderr, TRIPS[plugin.name].expect);

    // Same violation, second Stop of the loop: stop_hook_active must let the model finish.
    r = spawnStopHook(installed, trip, { stopHookActive: true });
    assert.equal(r.status, 0, `stop_hook_active: true must not re-block; stderr: ${r.stderr}`);
  });
}
