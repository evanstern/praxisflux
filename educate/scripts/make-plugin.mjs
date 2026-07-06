#!/usr/bin/env node
/**
 * make-plugin.mjs — emit a Claude plugin SKELETON from a spec.
 *
 * This is the "self-build" tool. Point it at a plugin spec and it writes the directory tree,
 * the .claude-plugin/plugin.json manifest, and a SKILL.md (with real frontmatter) for each
 * declared skill. Run it with NO spec arg and it defaults to educate's OWN spec — so the
 * plugin regenerates its own skeleton. That is the honest meaning of "builds itself":
 *
 *   STRUCTURE + manifest + skill frontmatter  -> mechanically generated (this tool)
 *   skill BODIES, script logic, templates      -> authored payload (NOT generated)
 *
 * Usage:
 *   node make-plugin.mjs [specPath] --out <dir>
 *     specPath  default: ../educate.plugin-spec.json (relative to this script)
 *     --out     default: ./<name>-generated
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outDir = outIdx !== -1 ? resolve(args[outIdx + 1]) : null;
const specPath = args.find((a, i) => !a.startsWith("--") && a !== (outIdx !== -1 ? args[outIdx + 1] : null))
  ?? resolve(HERE, "..", "educate.plugin-spec.json");

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const out = outDir ?? resolve(process.cwd(), `${spec.name}-generated`);

function write(rel, content) {
  const full = join(out, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`  + ${rel}`);
}

console.log(`Generating plugin "${spec.name}" from ${specPath}`);
console.log(`  -> ${out}\n`);

// 1) Manifest — only plugin.json goes inside .claude-plugin/.
// NOTE: do NOT declare standard paths (skills/, hooks/hooks.json) here — those are
// auto-discovered. Declaring them double-loads the file ("Duplicate hooks file detected").
// The manifest's path fields are only for NON-standard component locations.
const manifest = {
  name: spec.name,
  version: spec.version ?? "0.1.0",
  description: spec.description ?? "",
  author: spec.author ?? undefined,
  keywords: spec.keywords ?? undefined,
};
write(".claude-plugin/plugin.json", JSON.stringify(manifest, null, 2) + "\n");

// 2) One SKILL.md per declared skill — real frontmatter, stub body.
for (const skill of spec.skills ?? []) {
  const body = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n` +
    `# ${spec.name}:${skill.name}\n\n` +
    `> Generated skeleton. The substance of this skill is authored, not generated —\n` +
    `> replace this body with the real instructions.\n`;
  write(`skills/${skill.name}/SKILL.md`, body);
}

// 3) Hooks stub (the real gate logic is authored).
if (spec.hooks) {
  write("hooks/hooks.json", JSON.stringify({
    description: `${spec.name} hooks (generated stub — wire real events here).`,
    hooks: {},
  }, null, 2) + "\n");
}

// 4) Declared scripts/templates: leave a manifest of what the authored payload must supply.
const payload = [
  ...(spec.scripts ?? []).map((s) => `scripts/${s}`),
  ...(spec.templates ?? []).map((t) => `templates/${t}`),
];
if (payload.length) {
  write("AUTHORED-PAYLOAD.txt",
    `These files are authored, not generated. Copy them in from the source plugin:\n` +
    payload.map((p) => `  - ${p}`).join("\n") + "\n");
}

console.log(`\nDone. Skeleton for "${spec.name}" written.`);
console.log(`(Structure + manifest + skill frontmatter generated; bodies/scripts/templates are the authored payload.)`);
