// pdlc-config.mjs — the operator-authored adapter choice per port (spec 073 R2,
// decision-0002, C1 2026-10-15).
//
// `.pdlc.json` at the project root: `{ "ports": { "<port>": "<adapter>" } }`. An absent file,
// or an absent key for a port, means detection for that port — never a crash. This is
// deliberately NOT `.pdlc` (the machine-written plant receipt, `pdlc/scripts/plant.mjs`) or
// `.board.json` (the tracker adapter's own settings); this module reads neither of those
// files as configuration.
//
// `configure` resolves every config choice through `registry.resolve`, so a port's floors are
// enforced at configure time, not deferred to first use.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CONFIG_FILE = ".pdlc.json";

/** Thrown on a malformed, mis-shaped, or contradictory `.pdlc.json` — never a silent
 *  fallback to detection. `details.port`/`details.adapter` ride the instance when known. */
export class ConfigError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ConfigError";
    Object.assign(this, details);
  }
}

/** Read `<root>/.pdlc.json`. `{ ports: {} }` when the file is absent. Throws `ConfigError` on
 *  malformed JSON or a `ports` value that isn't a plain object. */
export function loadPdlcConfig(root) {
  const path = join(root, CONFIG_FILE);
  if (!existsSync(path)) return { ports: {} };
  const raw = readFileSync(path, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new ConfigError(`${path}: malformed JSON (${e.message})`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    throw new ConfigError(`${path}: must be a JSON object`);
  const ports = parsed.ports ?? {};
  if (ports === null || typeof ports !== "object" || Array.isArray(ports))
    throw new ConfigError(`${path}: "ports" must be an object`);
  return { ports };
}

/** For every port in `registry`, choose an adapter: the configured name when `.pdlc.json`
 *  names one, else the first registered adapter whose `detect(root)` matches (registration
 *  order), else none. Returns `{ [port]: { adapter: string|null, source: "config" |
 *  "detected" | "none" } }`. Throws `ConfigError` for an unknown port or an adapter name not
 *  registered for its port; a configured adapter that fails its port's method/floor contract
 *  throws `PortError` from `registry.resolve` (R2: config choices are resolved, not assumed). */
export function configure(registry, root) {
  const path = join(root, CONFIG_FILE);
  const { ports: configuredPorts } = loadPdlcConfig(root);
  const knownPortNames = new Set(registry.ports().map((p) => p.name));
  for (const name of Object.keys(configuredPorts)) {
    if (!knownPortNames.has(name))
      throw new ConfigError(`${path}: unknown port "${name}"`, { port: name });
  }

  const result = {};
  for (const port of registry.ports()) {
    if (Object.prototype.hasOwnProperty.call(configuredPorts, port.name)) {
      const adapterName = configuredPorts[port.name];
      if (typeof adapterName !== "string" || !adapterName)
        throw new ConfigError(`${path}: "ports.${port.name}" must be a non-empty string`, { port: port.name });
      if (!registry.adapters(port.name).some((a) => a.name === adapterName))
        throw new ConfigError(
          `${path}: port "${port.name}" names unregistered adapter "${adapterName}"`,
          { port: port.name, adapter: adapterName },
        );
      registry.resolve(port.name, adapterName); // enforces methods/floors; PortError propagates as-is
      result[port.name] = { adapter: adapterName, source: "config" };
      continue;
    }
    const detected = registry.adapters(port.name).find((a) => a.detect(root));
    result[port.name] = detected
      ? { adapter: detected.name, source: "detected" }
      : { adapter: null, source: "none" };
  }
  return result;
}
