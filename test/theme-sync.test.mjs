// The theme contract cannot drift: consumers (educate's deck template) carry a stamped copy of
// base.html's marked regions, and this comparison runs pre-commit via the suite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { driftReport, extractRegion, stampRegion } from "../scripts/sync-theme.mjs";

test("theme sync: consumers' stamped regions match lib/html/base.html", () => {
  assert.deepEqual(driftReport(), []);
});

test("theme sync: stampRegion replaces only the marked body", () => {
  const src = "a\n// x:start\nNEW\n// x:end\nb";
  const dst = "p\n// x:start\nOLD\n// x:end\nq";
  assert.equal(stampRegion(dst, "x", extractRegion(src, "x")), "p\n// x:start\nNEW\n// x:end\nq");
});
