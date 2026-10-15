// credentials.mjs — resolve a forge credential without assuming `gh` (spec 073 R6,
// decision-0002, US6).
//
// Tries `git credential fill` first (whatever credential helper the host has configured —
// keychain, manager-core, a fixture script in tests), then named env vars in the caller's
// order. Never prompts: `GIT_TERMINAL_PROMPT=0` plus Node's own input-then-close-stdin
// behavior for `spawnSync({ input })`, and a timeout, so a misconfigured or interactive helper
// can't hang the caller. Never logs, returns, or embeds the token anywhere but the `token`
// field of its result — `describeToken` exists precisely so callers display only the
// *source*.
//
// Zero dependencies, pure Node, no network from this module — `git credential fill` may
// itself be backed by a network-calling credential manager, but this module only spawns the
// local `git` process (lib/README.md convention).

import { spawnSync as nodeSpawnSync } from "node:child_process";

const TIMEOUT_MS = 10_000;

/** Ask `git credential fill` for a token for `protocol://host`, falling back to the first
 *  present env var in `envVars` order. `spawn`/`env` are injectable for tests (a stub spawn;
 *  a real-`git` test points `env` at a fixture `GIT_CONFIG_GLOBAL` + isolated `HOME`, never
 *  the operator's own config). Returns `{ token, source }` or `null` when nothing resolves.
 *  `source` is `"git-credential"` or `"env:<NAME>"` — never the token itself. */
export function resolveToken({ host, protocol = "https", envVars = [], spawn = nodeSpawnSync, env = process.env }) {
  const result = spawn("git", ["credential", "fill"], {
    input: `protocol=${protocol}\nhost=${host}\n\n`,
    env: { ...env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
    timeout: TIMEOUT_MS,
    encoding: "utf8",
  });
  if (result && !result.error && result.status === 0 && typeof result.stdout === "string") {
    const match = result.stdout.match(/^password=(.*)$/m);
    if (match && match[1]) return { token: match[1], source: "git-credential" };
  }
  for (const name of envVars) {
    const value = env[name];
    if (value) return { token: value, source: `env:${name}` };
  }
  return null;
}

/** The *source* a `resolveToken` result came from — safe to log or display, never the token
 *  itself. `null` (nothing resolved) reports as `"none"`. */
export function describeToken(result) {
  return result ? result.source : "none";
}
