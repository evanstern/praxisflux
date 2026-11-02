// contract-harness.mjs — run one assertion suite against every adapter of a port (spec 073
// R4, decision-0002, US4). A port author writes `cases` once; every adapter factory,
// including an in-memory fake, proves the same behavior against it.
//
// `runContractSuite` registers one `node:test` `describe` per adapter and, inside it, one
// `test` per case plus a dedicated contract-validation test (`registry.resolve`) — so an
// adapter missing a method or a floor fails loudly as its own test rather than throwing
// during suite registration. Each case gets a fresh adapter instance (`factory()`) and a
// fresh temp root (`ctx.root`) that is removed afterward, success or failure.
//
// Zero dependencies, pure Node, no network (lib/README.md convention).

import { describe, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRegistry } from "./port-registry.mjs";

/**
 * `factories`: `{ [adapterName]: () => adapter }`. `cases`: `[{ name, run(adapter, ctx) }]`,
 * where `run` may be async and `ctx.root` is a fresh temp directory for that case alone.
 */
export function runContractSuite({ port, factories, cases }) {
  for (const [adapterName, factory] of Object.entries(factories)) {
    describe(`${port.name}/${adapterName}`, () => {
      test("satisfies the port contract", () => {
        const registry = createRegistry();
        registry.addPort(port);
        registry.addAdapter(port.name, factory());
        registry.resolve(port.name, adapterName);
      });

      for (const { name, run } of cases) {
        test(name, async () => {
          const root = mkdtempSync(join(tmpdir(), "contract-harness-"));
          try {
            await run(factory(), { root });
          } finally {
            rmSync(root, { recursive: true, force: true });
          }
        });
      }
    });
  }
}
