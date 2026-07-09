// Shared visual-contract regions cannot drift: consumers (educate's deck template) carry a
// stamped copy of each canonical source's marked regions, compared here pre-commit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { driftReport, extractRegion, stampRegion } from "../scripts/sync-shared.mjs";

test("shared sync: consumers' stamped regions match their canonical sources", () => {
  assert.deepEqual(driftReport(), []);
});

test("shared sync: stampRegion replaces only the marked body", () => {
  const src = "a\n// x:start\nNEW\n// x:end\nb";
  const dst = "p\n// x:start\nOLD\n// x:end\nq";
  assert.equal(stampRegion(dst, "x", extractRegion(src, "x")), "p\n// x:start\nNEW\n// x:end\nq");
});
