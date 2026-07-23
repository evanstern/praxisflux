#!/usr/bin/env node
// new-plugin.mjs — scaffold a new marketplace plugin: stamp exactly the surface the drift
// gates demand (docs/skill-patterns.md "New-plugin checklist"), so a fresh plugin passes
// check-docs.mjs, gen-marketplace.mjs --check, and sync-version.mjs --check unmodified
// instead of costing the author five hand-edits.
//
//   node scripts/new-plugin.mjs <name> [--with-gate]
//
// Stamps: <name>/.claude-plugin/plugin.json (version in lockstep with the marketplace),
// skills/<name>/SKILL.md skeleton (frontmatter the bump gate keys on + the gate→work→gate
// shape), the lib -> ../lib symlink, the marketplace entry (via gen-marketplace), and the
// README table row + install line check-docs.mjs requires. --with-gate adds the Stop-hook
// trio (gates/<name>.mjs + scripts/{stop.mjs,gate.sh} + hooks/hooks.json) per
// skill-patterns §5; the stub gate resolves no roots, so it is a safe no-op until wired.
// Refuses to run if <name>/ already exists — rerunning never clobbers.
import { readFileSync, writeFileSync, existsSync, mkdirSync, symlinkSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { genMarketplace } from "./gen-marketplace.mjs";
import { runAsCli } from "../lib/cli.mjs";

const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());

const pluginJson = (name, version) => JSON.stringify({
  name,
  version,
  description: `TODO: one-line description of ${name} (flows to the marketplace entry — keep it real).`,
  author: { name: "praxisflux maintainers" },
  keywords: [],
}, null, 2) + "\n";

const skillMd = (name) => `---
name: ${name}
version: 0.1.0
description: TODO — what this skill does AND when to trigger it (the description is the trigger surface; include the phrases a user would actually say).
---

# ${name}

TODO: one paragraph — what phase this skill owns and what it knows nothing about
(phase-separated skills compose through files + gates, never by calling each other;
docs/skill-patterns.md §1–2).

Helper scripts live in this plugin's base directory (\`\${CLAUDE_PLUGIN_ROOT}\`). Every
script referenced here must state an inline fallback — the skill must still work hand-copied.

## Precondition gate

TODO: verify the input state exists before doing anything. If it fails, stop and name the
phase that must run first — don't do that phase's job here.

## The work

TODO: do the one phase.

## Output gate

TODO: verify what was produced before declaring done. Fix failures first.

## Handing off

TODO: tell the user what's now possible next (the next phase), without doing it.
`;

// The generic Stop-hook shim every praxisflux plugin ships (same text as team-review's).
const gateSh = `#!/usr/bin/env bash
# gate.sh — thin shim: this plugin's Stop hook runs scripts/stop.mjs (same pattern as the
# praxisflux plugins). Stop hooks run in a minimal, non-login shell whose PATH may not include
# node; resolve it the way the user's shell would, and no-op if it's genuinely unavailable —
# this gate must never block Stop over a missing runtime.
here="$(cd "$(dirname "$0")" && pwd)"
root="\${CLAUDE_PLUGIN_ROOT:-$(dirname "$here")}"
node_bin="$(command -v node 2>/dev/null)"
if [ -z "$node_bin" ]; then
  node_bin="$(\${SHELL:-/bin/sh} -lc 'command -v node' 2>/dev/null)"
fi
if [ -z "$node_bin" ]; then
  exit 0
fi
exec "$node_bin" "\${root}/scripts/stop.mjs"
`;

const gateMjs = (name) => `// gates/${name}.mjs — ${name}'s output gate. gates/ only verifies and NEVER writes
// (docs/skill-patterns.md §5). Speaks the lib/gate-runner.mjs contract:
// { name, resolveRoots(startDir) -> string[], check(root) -> string[] (problems) }.
// A gate that resolves no roots is a no-op — this stub is safe to ship unwired.

export const ${camel(name)}Gate = {
  name: "${name}",
  // TODO: resolve the project roots this gate applies to (lib/project-root.mjs has the
  // walk-up/walk-down helpers). Returning [] keeps the Stop hook a no-op until then.
  resolveRoots: () => [],
  // TODO: return human-actionable problem strings; [] = pass.
  check: () => [],
};
`;

const stopMjs = (name) => `#!/usr/bin/env node
// stop.mjs — ${name}'s Stop-hook entry, on the shared gate-runner.
import { runStopHook } from "../lib/gate-runner.mjs";
import { ${camel(name)}Gate } from "../gates/${name}.mjs";

runStopHook({ gates: [${camel(name)}Gate] });
`;

const hooksJson = (name) => JSON.stringify({
  description: `${name} gate — TODO: state the one invariant this Stop hook enforces. No-op while the gate resolves no roots.`,
  hooks: {
    Stop: [{ matcher: "*", hooks: [{ type: "command", command: "bash ${CLAUDE_PLUGIN_ROOT}/scripts/gate.sh" }] }],
  },
}, null, 2) + "\n";

/** Insert `line` after the last line of `text` matching `anchorRe`; throw if none matches. */
function insertAfterLast(text, anchorRe, line, what) {
  const lines = text.split("\n");
  const last = lines.findLastIndex((l) => anchorRe.test(l));
  if (last === -1) throw new Error(`README.md: cannot find ${what} to anchor on — insert the line by hand`);
  lines.splice(last + 1, 0, line);
  return lines.join("\n");
}

/** Scaffold plugin `name` into `repo`. Writes the plugin dir, then registers it
 *  (marketplace.json + README). Throws before writing anything if the dir exists. */
export function scaffoldPlugin(repo, name, { withGate = false } = {}) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name))
    throw new Error(`plugin name must be kebab-case (got ${JSON.stringify(name)})`);
  const dir = join(repo, name);
  if (existsSync(dir)) throw new Error(`${name}/ already exists — refusing to clobber`);

  const mp = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));

  mkdirSync(join(dir, ".claude-plugin"), { recursive: true });
  writeFileSync(join(dir, ".claude-plugin", "plugin.json"), pluginJson(name, mp.version));
  mkdirSync(join(dir, "skills", name), { recursive: true });
  writeFileSync(join(dir, "skills", name, "SKILL.md"), skillMd(name));
  symlinkSync("../lib", join(dir, "lib"));

  if (withGate) {
    mkdirSync(join(dir, "gates"));
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, "hooks"));
    writeFileSync(join(dir, "gates", `${name}.mjs`), gateMjs(name));
    writeFileSync(join(dir, "scripts", "stop.mjs"), stopMjs(name));
    writeFileSync(join(dir, "scripts", "gate.sh"), gateSh);
    chmodSync(join(dir, "scripts", "gate.sh"), 0o755);
    writeFileSync(join(dir, "hooks", "hooks.json"), hooksJson(name));
  }

  // Register: marketplace entry (gen-marketplace picks up the new manifest) …
  const mpPath = join(repo, ".claude-plugin", "marketplace.json");
  writeFileSync(mpPath, JSON.stringify(genMarketplace(repo), null, 2) + "\n");

  // … and the README surface check-docs.mjs demands: a plugins-table row + an install line.
  const pj = JSON.parse(readFileSync(join(dir, ".claude-plugin", "plugin.json"), "utf8"));
  const readmePath = join(repo, "README.md");
  let readme = readFileSync(readmePath, "utf8");
  readme = insertAfterLast(readme, /^\| \*\*[a-z0-9-]+\*\* \|/,
    `| **${name}** | ${pj.description} | TODO: placement model (docs/skill-patterns.md §6). |`,
    "the plugins table");
  readme = insertAfterLast(readme, /^\/plugin install [a-z0-9-]+@praxisflux$/,
    `/plugin install ${name}@praxisflux`, "the install block");
  writeFileSync(readmePath, readme);

  return dir;
}

if (runAsCli(import.meta.url)) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
  const args = process.argv.slice(2);
  const withGate = args.includes("--with-gate");
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) { console.error("usage: node scripts/new-plugin.mjs <name> [--with-gate]"); process.exit(2); }
  try {
    const dir = scaffoldPlugin(repo, name, { withGate });
    console.log(`scaffolded ${dir}`);
    console.log(`next: fill in the TODOs (plugin.json description, SKILL.md, README row),`);
    console.log(`then verify: node scripts/check-docs.mjs && node scripts/gen-marketplace.mjs --check && node scripts/sync-version.mjs --check && node --test`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
