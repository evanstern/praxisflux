// gen-marketplace is generative, not just a re-sync: a top-level dir with a plugin.json but no
// marketplace entry gets registered (the new-plugin checklist's step 1, true as written), while
// registered entries keep their hand-set category/tags and follow their plugin's name/description.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { genMarketplace } from "../scripts/gen-marketplace.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-genmp-"));
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  writeFileSync(join(root, ".claude-plugin", "marketplace.json"), JSON.stringify({
    name: "praxisflux", version: "0.0.1",
    plugins: [{ name: "alpha", source: "./alpha", description: "stale", category: "hand-set", tags: ["kept"] }],
  }));
  const plant = (dir, pj) => {
    mkdirSync(join(root, dir, ".claude-plugin"), { recursive: true });
    writeFileSync(join(root, dir, ".claude-plugin", "plugin.json"), JSON.stringify(pj));
  };
  plant("alpha", { name: "alpha", description: "fresh from the manifest" });
  plant("newcomer", { name: "newcomer", description: "unregistered plugin", keywords: ["review", "gates"] });
  mkdirSync(join(root, "not-a-plugin"));
  return root;
}

test("gen-marketplace: registers a previously-unregistered plugin dir", () => {
  const root = fixture();
  try {
    const mp = genMarketplace(root);
    const entry = mp.plugins.find((p) => p.name === "newcomer");
    assert.ok(entry, "newcomer/ has a plugin.json but got no marketplace entry");
    assert.deepEqual(entry, {
      name: "newcomer", source: "./newcomer", description: "unregistered plugin",
      category: "productivity", tags: ["review", "gates"],
    });
    assert.ok(!mp.plugins.some((p) => p.name === "not-a-plugin"), "dir without plugin.json must not register");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("gen-marketplace: registered entries follow the manifest but keep hand-set category/tags", () => {
  const root = fixture();
  try {
    const alpha = genMarketplace(root).plugins.find((p) => p.name === "alpha");
    assert.equal(alpha.description, "fresh from the manifest");
    assert.equal(alpha.category, "hand-set");
    assert.deepEqual(alpha.tags, ["kept"]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("gen-marketplace: idempotent once everything is registered", () => {
  const root = fixture();
  try {
    const once = genMarketplace(root);
    writeFileSync(join(root, ".claude-plugin", "marketplace.json"), JSON.stringify(once));
    assert.deepEqual(genMarketplace(root), once);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("gen-marketplace: the praxisflux repo's own catalog is not stale", () => {
  const cur = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
  assert.deepEqual(genMarketplace(repo), cur);
});
