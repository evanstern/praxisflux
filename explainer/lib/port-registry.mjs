// port-registry.mjs — the shared chassis every driven port (Tracker, Forge, Spec, Harness)
// registers against: declare a port contract, register adapters for it, and resolve one by
// name with the contract enforced (spec 073 R1, decision-0002).
//
// A port is a frozen contract: required method names plus "floor" capability strings every
// adapter must declare. An adapter is plain data + functions — `{ name, capabilities,
// detect(root), probe(root, env), ...methods }` — registered against exactly one port.
// `resolve` is the only place the contract is checked: registration never validates, so a
// broken adapter can sit in the registry (discovered, listed) without blocking anything until
// something actually calls `resolve` for it (US1).
//
// `discover` is the only I/O in this module: it imports `<libDir>/ports/*.mjs` (each
// default-exporting a port definition) and, per registered port, `<libDir>/adapters/<port
// name>/*.mjs` (each default-exporting a factory `() => adapter`). Missing directories are
// not errors — a fresh chassis with no ports yet is a valid, empty registry.
//
// Zero dependencies, pure Node, no network (lib/README.md convention).

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Thrown by registry operations: definition errors, an adapter registered against an
 *  undeclared port, or `resolve` against a missing/incomplete adapter. `details` (port,
 *  adapter, missing) ride the instance for programmatic handling; the message alone already
 *  names everything a human needs. */
export class PortError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PortError";
    Object.assign(this, details);
  }
}

/** Declare a port contract. `methods`: required method names an adapter must implement.
 *  `floors`: capability strings every adapter must declare in its `capabilities` array.
 *  `receiptDir`: the dot-dir this port's receipts live in (e.g. `".forge"`), or `null` when
 *  the port has no receipt. Returns a frozen definition — ports never mutate after they're
 *  declared. */
export function definePort({ name, methods = [], floors = [], receiptDir = null }) {
  if (typeof name !== "string" || !name) throw new PortError("definePort requires a non-empty name");
  return Object.freeze({
    name,
    methods: Object.freeze([...methods]),
    floors: Object.freeze([...floors]),
    receiptDir,
  });
}

/** A fresh, isolated registry. Nothing here is global — each caller (a test, the `pdlc`
 *  CLI) builds its own via `createRegistry()` + `discover(...)`, so nothing leaks between
 *  runs. */
export function createRegistry() {
  const ports = new Map(); // name -> port definition
  const adapters = new Map(); // port name -> Map(adapter name -> adapter)

  function addPort(port) {
    if (!port || typeof port.name !== "string" || !port.name)
      throw new PortError("addPort requires a definePort() result with a non-empty name");
    ports.set(port.name, port);
    if (!adapters.has(port.name)) adapters.set(port.name, new Map());
    return port;
  }

  function addAdapter(portName, adapter) {
    if (!ports.has(portName))
      throw new PortError(`port "${portName}" is not registered`, { port: portName });
    if (!adapter || typeof adapter.name !== "string" || !adapter.name)
      throw new PortError(`adapter for port "${portName}" has no name`, { port: portName });
    adapters.get(portName).set(adapter.name, adapter);
    return adapter;
  }

  function portsList() {
    return [...ports.values()];
  }

  /** Adapters registered for `portName`, in registration order. An unregistered port name
   *  (or one with none yet) returns `[]` rather than throwing — callers that only want to
   *  look, such as the configurator's detection loop, shouldn't need to guard first. */
  function adaptersList(portName) {
    return [...(adapters.get(portName) ?? new Map()).values()];
  }

  /** The only place a port's contract is checked. Throws `PortError` naming the port, the
   *  adapter, and every missing method or floor capability when the adapter falls short;
   *  otherwise returns the adapter. */
  function resolve(portName, adapterName) {
    const port = ports.get(portName);
    if (!port) throw new PortError(`port "${portName}" is not registered`, { port: portName });
    const adapter = adapters.get(portName)?.get(adapterName);
    if (!adapter)
      throw new PortError(`port "${portName}" has no adapter "${adapterName}"`, { port: portName, adapter: adapterName });
    const caps = new Set(adapter.capabilities ?? []);
    const missing = [
      ...port.methods.filter((m) => typeof adapter[m] !== "function").map((m) => `method "${m}"`),
      ...port.floors.filter((f) => !caps.has(f)).map((f) => `floor "${f}"`),
    ];
    if (missing.length) {
      throw new PortError(
        `port "${portName}" adapter "${adapterName}" is missing ${missing.join(", ")}`,
        { port: portName, adapter: adapterName, missing },
      );
    }
    return adapter;
  }

  return { addPort, addAdapter, ports: portsList, adapters: adaptersList, resolve };
}

/** `.mjs` file names in `dir`, sorted — the deterministic load order `discover` relies on.
 *  A missing directory is not an error: it yields no files. */
function moduleFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.filter((f) => f.endsWith(".mjs")).sort();
}

async function importDefault(dir, file) {
  const mod = await import(pathToFileURL(join(dir, file)).href);
  return mod.default;
}

/** Populate `registry` from `<libDir>/ports/*.mjs` and, per discovered port,
 *  `<libDir>/adapters/<port name>/*.mjs`. Registration order is sorted file-name order, so
 *  detection (which walks adapters in registration order) is deterministic. Returns
 *  `registry`. */
export async function discover(registry, libDir) {
  for (const file of moduleFiles(join(libDir, "ports"))) {
    registry.addPort(await importDefault(join(libDir, "ports"), file));
  }
  for (const port of registry.ports()) {
    const adaptersDir = join(libDir, "adapters", port.name);
    for (const file of moduleFiles(adaptersDir)) {
      const factory = await importDefault(adaptersDir, file);
      registry.addAdapter(port.name, factory());
    }
  }
  return registry;
}
