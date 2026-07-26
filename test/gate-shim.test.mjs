// gate-shim.test.mjs — the node-missing path of every shipped Stop-hook shim.
//
// Local Stop hooks are advisory by design: gate.sh must never block Stop over a missing
// runtime. But "advisory" must not mean "invisible" — when node can't be resolved the shim
// emits a ONE-TIME stderr notice (deduped by a sentinel file under TMPDIR, shared across
// all praxisflux plugins) and still exits 0. This spawns each catalog-registered plugin's
// gate.sh the way Claude Code does, with an empty PATH and a SHELL whose login probe finds
// nothing, and proves: notice once, silence after, exit 0 always.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const marketplace = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));

// Same catalog-derived coverage rule as install-path.test.mjs: every registered plugin
// that ships hooks/hooks.json ships a gate.sh shim, and its node-missing path is tested.
const HOOK_PLUGINS = marketplace.plugins
  .filter((p) => existsSync(join(repo, p.source, "hooks", "hooks.json")))
  .map((p) => ({ name: p.name, dir: join(repo, p.source.replace(/^\.\//, "")) }));

const SENTINEL = "praxisflux-gate-node-missing.notified";
const NOTICE = /node not found on PATH/;

/** Spawn gate.sh with node unresolvable: PATH is an empty dir (builtins still work) and
 *  SHELL is /bin/false so the login-shell fallback probe yields nothing. TMPDIR steers the
 *  one-time sentinel into the fixture. */
function spawnNodeless(pluginDir, fakeTmp, emptyPath) {
  return spawnSync("/bin/bash", [join(pluginDir, "scripts", "gate.sh")], {
    input: JSON.stringify({ hook_event_name: "Stop", stop_hook_active: false, cwd: fakeTmp }),
    encoding: "utf8",
    env: { PATH: emptyPath, SHELL: "/bin/false", TMPDIR: fakeTmp, CLAUDE_PLUGIN_ROOT: pluginDir },
  });
}

for (const plugin of HOOK_PLUGINS) {
  test(`gate shim [${plugin.name}]: node missing — one-time stderr notice, sentinel dedupe, always exit 0`, (t) => {
    const fakeTmp = mkdtempSync(join(tmpdir(), `praxisflux-nodeless-${plugin.name}-`));
    const emptyPath = join(fakeTmp, "empty-bin");
    mkdirSync(emptyPath);
    t.after(() => rmSync(fakeTmp, { recursive: true, force: true }));

    // First run: non-blocking (exit 0), but not silent — the notice lands on stderr and
    // the sentinel is written.
    let r = spawnNodeless(plugin.dir, fakeTmp, emptyPath);
    assert.equal(r.status, 0, `node-missing must never block Stop; stderr: ${r.stderr}`);
    assert.match(r.stderr, NOTICE, "first nodeless run must emit the notice");
    assert.ok(existsSync(join(fakeTmp, SENTINEL)), "the one-time sentinel must be created");

    // Second run: the sentinel dedupes — no notice again, still exit 0.
    r = spawnNodeless(plugin.dir, fakeTmp, emptyPath);
    assert.equal(r.status, 0, `second nodeless run must still allow the stop; stderr: ${r.stderr}`);
    assert.doesNotMatch(r.stderr, NOTICE, "the notice must appear once per TMPDIR, not every turn");
  });
}

test("gate shim: the sentinel is suite-wide — a second plugin's shim stays quiet too", (t) => {
  assert.ok(HOOK_PLUGINS.length >= 2, "needs at least two Stop-hook plugins");
  const [a, b] = HOOK_PLUGINS;
  const fakeTmp = mkdtempSync(join(tmpdir(), "praxisflux-nodeless-shared-"));
  const emptyPath = join(fakeTmp, "empty-bin");
  mkdirSync(emptyPath);
  t.after(() => rmSync(fakeTmp, { recursive: true, force: true }));

  assert.match(spawnNodeless(a.dir, fakeTmp, emptyPath).stderr, NOTICE);
  assert.doesNotMatch(spawnNodeless(b.dir, fakeTmp, emptyPath).stderr, NOTICE,
    "one turn runs every installed plugin's hook — the shared sentinel must keep it to one notice");
});
