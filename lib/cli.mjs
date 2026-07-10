// cli.mjs — the run-as-CLI guard for dual-use modules (importable library + executable
// script).
//
// The naive `import.meta.url === `file://${process.argv[1]}`` comparison breaks through
// symlinks: Node resolves import.meta.url to the module's physical path, while argv[1] stays
// as typed, so a script invoked via a symlinked checkout (~/projects -> Claude/Code) compares
// unequal and silently runs none of its CLI body — for a gate runner that means exit 0 having
// checked nothing, the exact silent skip the gates doctrine forbids. Realpath both sides so
// the comparison is invocation-path-independent.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** True when the module at `moduleUrl` (pass import.meta.url) is the script Node was asked
 *  to run, regardless of symlinks on either side. False when imported as a module, or when
 *  there is no entry script (`node -e`, REPL) or argv[1] is a runner's virtual entry. */
export function runAsCli(moduleUrl) {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}
