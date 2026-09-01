// board-provider-seam.test.mjs — spec 053 phase 1: root resolution stops meaning "has a
// backlog dir", and the Stop hook + CLI must never disagree about what a project is (R2, AC #4).
// Later phases append coverage for boardLinks' fail-closed findings and the planner split here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { hasAnyChild } from "../lib/project-root.mjs";
import { bridgeGate } from "../spec-bridge/gates/bridge.mjs";

const CLI = new URL("../spec-bridge/gates/cli.mjs", import.meta.url).pathname;

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "board-provider-seam-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("hasAnyChild: true when ANY named child is present, false when none are", () => {
  const p = scratch();
  try {
    mkdirSync(join(p.root, "backlog"));
    assert.equal(hasAnyChild(".board", "backlog")(p.root), true);
    assert.equal(hasAnyChild(".board", "nope")(p.root), false);
  } finally {
    p.done();
  }
});

// AC #4 — a `.board`-only, a `backlog`-only, and a both-present root must all resolve under
// BOTH resolvers: bridgeGate.resolveRoots (the Stop hook) and cli.mjs's findRootUpwards call
// (the `state` command). Observed indirectly for the CLI, which is a script (not an exported
// function): a resolved root is what makes `state` pick up .spec-bridge.json's strictDone,
// visible as `analysis.required` flipping true — a root miss silently stays false.
const layouts = [
  { name: ".board-only", make: (root) => mkdirSync(join(root, ".board"), { recursive: true }) },
  { name: "backlog-only", make: (root) => mkdirSync(join(root, "backlog"), { recursive: true }) },
  {
    name: "both-present",
    make: (root) => {
      mkdirSync(join(root, ".board"), { recursive: true });
      mkdirSync(join(root, "backlog"), { recursive: true });
    },
  },
];

for (const layout of layouts) {
  test(`root resolution agrees for a ${layout.name} project (hook and CLI)`, () => {
    const p = scratch();
    try {
      layout.make(p.root);
      writeFileSync(join(p.root, ".spec-bridge.json"), JSON.stringify({ strictDone: true }));
      const specDir = join(p.root, "specs", "001-a");
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, "spec.md"), "# spec");
      writeFileSync(join(specDir, "plan.md"), "# plan");

      // Hook side.
      assert.deepEqual(bridgeGate.resolveRoots(p.root), [p.root]);

      // CLI side.
      const out = JSON.parse(execFileSync("node", [CLI, "state", specDir], { encoding: "utf8" }));
      assert.equal(out.analysis.required, true);
    } finally {
      p.done();
    }
  });
}
