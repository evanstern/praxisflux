#!/usr/bin/env node
// pdlc.mjs — the driving port: the `pdlc` CLI (spec 073 R5, decision-0002). Dual-use via
// lib/cli.mjs's runAsCli. This task ships one subcommand, `doctor`: "what can run here?"
// (US5) — every registered port, its configured/detected adapter, and whether that adapter
// is actually runnable on this host.
//
// Output is always JSON on stdout. Usage errors (bad/missing subcommand) exit 2; a
// configuration error (malformed .pdlc.json, an unknown port/adapter) exits 1 with
// `{ "error": … }` on stdout rather than throwing a stack trace. `libDir` is injectable so
// tests can point discovery at test/fixtures/ports-demo/lib instead of the real repo's lib/.
//
// `.pdlc.json` (CONFIG_FILE, operator-authored) and `.pdlc` (the plant receipt written by
// pdlc/scripts/plant.mjs) are two different look-alike files — doctor's JSON names both
// explicitly so a reader never conflates them (spec's C1 mitigation).
import { existsSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";

import { runAsCli } from "../../lib/cli.mjs";
import { createRegistry, discover } from "../../lib/port-registry.mjs";
import { CONFIG_FILE, configure } from "../../lib/pdlc-config.mjs";

const PLANT_RECEIPT_FILE = ".pdlc";

/** `doctor` subcommand body. `root`: project root to inspect. `libDir`: where to discover
 *  ports/adapters from (defaults to `<root>/lib`; tests pass a fixture lib dir). Returns the
 *  JSON report shape from spec R5. Propagates `ConfigError`/`PortError` from `configure` —
 *  the CLI wrapper below is what turns those into the `{ error }` exit-1 shape. */
export async function doctor({ root, libDir } = {}) {
  root = resolvePath(root ?? process.cwd());
  libDir ??= join(root, "lib");

  const registry = await discover(createRegistry(), libDir);
  const configured = configure(registry, root);

  const ports = registry.ports().map((port) => {
    const { adapter: adapterName, source } = configured[port.name];
    if (!adapterName) {
      return { port: port.name, adapter: null, source, canRun: false, reason: "no adapter configured or detected" };
    }
    const adapter = registry.adapters(port.name).find((a) => a.name === adapterName);
    const probed = adapter.probe(root, process.env);
    return { port: port.name, adapter: adapterName, source, canRun: !!probed.ok, reason: probed.ok ? null : (probed.reason ?? null) };
  });

  return {
    schema: 1,
    root,
    config: { file: CONFIG_FILE, present: existsSync(join(root, CONFIG_FILE)) },
    plantReceipt: { file: PLANT_RECEIPT_FILE, present: existsSync(join(root, PLANT_RECEIPT_FILE)) },
    ports,
  };
}

if (runAsCli(import.meta.url)) {
  const args = process.argv.slice(2);
  const [cmd, ...rest] = args;
  const opt = (name) => { const i = rest.indexOf(name); return i === -1 ? undefined : rest[i + 1]; };

  if (cmd !== "doctor") {
    console.error("usage: pdlc.mjs doctor [--root <dir>] [--lib-dir <dir>]");
    process.exit(2);
  }

  const root = opt("--root") ?? process.cwd();
  const libDirArg = opt("--lib-dir");

  try {
    const report = await doctor({ root, libDir: libDirArg ? resolvePath(libDirArg) : undefined });
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.log(JSON.stringify({ error: err.message }, null, 2));
    process.exit(1);
  }
}
