// fixture-teardown.mjs — retry-and-backoff wrapper around rmSync for git-fixture teardown
// (spec 070). Many suites build a fixture with mkdtemp + `git init` and tear it down with
// rmSync(dir, { recursive: true, force: true }). CI has observed that removal race git on the
// `.git` dir: ENOTEMPTY at rmdir, on a run that passes cleanly when re-run against the
// identical commit (CI run 34397432814, test/stop-docs-window.test.mjs:80). The mechanism
// could not be reproduced or directly observed on macOS/darwin (1500+ iterations of the exact
// fixture-then-immediate-rmSync sequence, serial and 8-way parallel, produced zero failures);
// CI runs on ubuntu-latest, a different kernel/filesystem, so the fix here is defensive against
// the *class* of hazard (something — a background git process, an indexer, the OS reconciling
// a burst of writes — still walking `.git` when rmSync's own readdir/rmdir pair runs) rather
// than a confirmed single culprit. See specs/070-teardown-race/spec.md and plan.md.
//
// `force: true` does NOT cover this: per Node's fs docs it only suppresses errors for a path
// that no longer exists, and does nothing for a directory that is non-empty at the moment
// rmdir is attempted — exactly the ENOTEMPTY case. Retry is the fix, not a stronger force.
//
// Bounded and loud, never silent: after RETRIES attempts the error is re-thrown exactly as an
// unretried rmSync would throw it, so a directory that is genuinely stuck (a real leak, not a
// transient race) still fails the test instead of being swallowed.
import { rmSync } from "node:fs";

const RETRYABLE_CODES = new Set(["ENOTEMPTY", "EBUSY", "EPERM"]);
const RETRIES = 5;
const BASE_DELAY_MS = 10;

/** Block the current thread for `ms` — rmSync's call sites are synchronous test bodies, so the
 *  backoff delay must be too. Atomics.wait on a private buffer is Node's standard sync sleep. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Remove a fixture directory (recursive, force). On ENOTEMPTY/EBUSY/EPERM, retry up to
 *  RETRIES times with escalating backoff; re-throw if it still hasn't cleared. */
export function removeFixtureDir(dir) {
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (!RETRYABLE_CODES.has(err.code) || attempt >= RETRIES) throw err;
      sleepSync(BASE_DELAY_MS * 2 ** attempt);
    }
  }
}
