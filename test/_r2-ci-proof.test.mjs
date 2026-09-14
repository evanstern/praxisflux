// TEMPORARY — spec 072 R2/AC#2 proof. This file exists to make the suite genuinely red so CI
// can demonstrate that the `tests` project gate still BLOCKS after ci.yml's dedicated `tests`
// step was removed. It is reverted in the very next commit; if you are reading this on a
// merged branch, something went wrong and it should be deleted.
import { test } from "node:test";
import assert from "node:assert/strict";

test("spec 072 R2 proof: deliberately red so CI can prove the gate blocks", () => {
  assert.equal(1, 2, "intentional failure — spec 072 AC#2 CI proof, reverted immediately");
});
