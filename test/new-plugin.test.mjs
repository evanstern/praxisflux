// new-plugin.mjs scaffolds the exact surface the drift gates demand: the stamped plugin passes
// checkDocs and genMarketplace-as-no-op unmodified, its version rides the marketplace's
// (sync-version lockstep), and rerunning fails safely instead of clobbering.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readlinkSync, lstatSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { scaffoldPlugin } from "../scripts/new-plugin.mjs";
import { genMarketplace } from "../scripts/gen-marketplace.mjs";
import { checkDocs } from "../scripts/check-docs.mjs";
import { parseFrontmatter } from "../lib/markdown.mjs";

const VERSION = "0.5.0";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-newplugin-"));
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  writeFileSync(join(root, ".claude-plugin", "marketplace.json"), JSON.stringify({
    name: "praxisflux", version: VERSION,
    plugins: [{ name: "alpha", source: "./alpha", description: "existing plugin", category: "productivity", tags: [] }],
  }, null, 2) + "\n");
  mkdirSync(join(root, "alpha", ".claude-plugin"), { recursive: true });
  writeFileSync(join(root, "alpha", ".claude-plugin", "plugin.json"),
    JSON.stringify({ name: "alpha", version: VERSION, description: "existing plugin" }));
  mkdirSync(join(root, "lib")); // empty chassis: checkDocs then demands no module mentions
  writeFileSync(join(root, "README.md"), [
    "# fixture", "",
    "| Plugin | Role | Placement |", "|---|---|---|",
    "| **alpha** | existing plugin | anywhere |", "",
    "```", "/plugin install alpha@praxisflux", "```", "",
  ].join("\n"));
  writeFileSync(join(root, "CLAUDE.md"), "see docs/releasing.md\n");
  return root;
}

test("scaffold: the stamped plugin passes the drift checks unmodified", () => {
  const root = fixture();
  try {
    scaffoldPlugin(root, "newbie");

    // check-docs: README row + install line were inserted.
    assert.deepEqual(checkDocs(root), []);

    // gen-marketplace: the entry is registered and regeneration is a no-op.
    const mpStr = readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8");
    assert.equal(JSON.stringify(genMarketplace(root), null, 2) + "\n", mpStr);
    const entry = JSON.parse(mpStr).plugins.find((p) => p.name === "newbie");
    assert.equal(entry.source, "./newbie");

    // sync-version lockstep: plugin version == marketplace version.
    const pj = JSON.parse(readFileSync(join(root, "newbie", ".claude-plugin", "plugin.json"), "utf8"));
    assert.equal(pj.version, VERSION);

    // SKILL.md skeleton: the frontmatter the bump gate keys on + the gate→work→gate shape.
    const skill = readFileSync(join(root, "newbie", "skills", "newbie", "SKILL.md"), "utf8");
    const fm = parseFrontmatter(skill);
    assert.equal(fm.name, "newbie");
    assert.match(fm.version, /^\d+\.\d+\.\d+$/);
    assert.ok(fm.description.length > 0);
    for (const section of ["## Precondition gate", "## The work", "## Output gate", "## Handing off"])
      assert.ok(skill.includes(section), `SKILL.md missing "${section}"`);

    // The committed lib -> ../lib symlink.
    assert.ok(lstatSync(join(root, "newbie", "lib")).isSymbolicLink());
    assert.equal(readlinkSync(join(root, "newbie", "lib")), "../lib");

    // Optional pieces are opt-in: no gate surface without --with-gate.
    assert.ok(!existsSync(join(root, "newbie", "hooks")));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("scaffold: rerunning fails safely instead of clobbering", () => {
  const root = fixture();
  try {
    scaffoldPlugin(root, "newbie");
    const before = {
      skill: readFileSync(join(root, "newbie", "skills", "newbie", "SKILL.md"), "utf8"),
      readme: readFileSync(join(root, "README.md"), "utf8"),
      mp: readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"),
    };
    assert.throws(() => scaffoldPlugin(root, "newbie"), /already exists/);
    assert.equal(readFileSync(join(root, "newbie", "skills", "newbie", "SKILL.md"), "utf8"), before.skill);
    assert.equal(readFileSync(join(root, "README.md"), "utf8"), before.readme);
    assert.equal(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"), before.mp);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("scaffold: --with-gate stamps the Stop-hook trio as a safe no-op", async () => {
  const root = fixture();
  try {
    scaffoldPlugin(root, "two-word", { withGate: true });

    const hooks = JSON.parse(readFileSync(join(root, "two-word", "hooks", "hooks.json"), "utf8"));
    assert.equal(hooks.hooks.Stop[0].hooks[0].command, "bash ${CLAUDE_PLUGIN_ROOT}/scripts/gate.sh");
    assert.ok(statSync(join(root, "two-word", "scripts", "gate.sh")).mode & 0o100, "gate.sh must be executable");
    assert.ok(readFileSync(join(root, "two-word", "scripts", "stop.mjs"), "utf8").includes("twoWordGate"));

    // The stub gate is dependency-free and resolves no roots — a no-op until wired.
    const { twoWordGate } = await import(pathToFileURL(join(root, "two-word", "gates", "two-word.mjs")));
    assert.deepEqual(twoWordGate.resolveRoots("."), []);
    assert.deepEqual(twoWordGate.check("."), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("scaffold: rejects non-kebab-case names before touching disk", () => {
  const root = fixture();
  try {
    for (const bad of ["Bad", "has_underscore", "-lead", "trail-", "a/b"])
      assert.throws(() => scaffoldPlugin(root, bad), /kebab-case/);
    assert.deepEqual(checkDocs(root), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
