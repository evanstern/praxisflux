import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { newArtifact } from "../../explainer/scripts/lib/scaffold.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const NEW_VERB_FIXTURE = path.join(FIXTURES, "new-verb");
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");

function withTempCopy(sourceDir, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-new-test-"));
  fs.cpSync(sourceDir, tmp, { recursive: true });
  try {
    return fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test("new fails cleanly when the profile is absent", () => {
  withTempCopy(NEW_VERB_FIXTURE, (repoRoot) => {
    const result = newArtifact({
      name: "my-explainer",
      kind: "no-such-profile",
      repoRoot,
      pluginRoot: REAL_PLUGIN_ROOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "profile-not-found");
    assert.equal(fs.existsSync(path.join(repoRoot, "docs", "explainers", "my-explainer")), false);
  });
});

test("new copies the profile's skeleton contents.json when the profile exists", () => {
  withTempCopy(NEW_VERB_FIXTURE, (repoRoot) => {
    const result = newArtifact({
      name: "my-explainer",
      kind: "demo-kind",
      repoRoot,
      pluginRoot: REAL_PLUGIN_ROOT,
    });
    assert.equal(result.ok, true);
    const written = JSON.parse(fs.readFileSync(result.targetContents, "utf8"));
    assert.equal(written.kind, "demo-kind");
    assert.equal(written.title, "New Explainer");
  });
});

test("new refuses to overwrite an existing contents.json", () => {
  withTempCopy(NEW_VERB_FIXTURE, (repoRoot) => {
    const first = newArtifact({
      name: "my-explainer",
      kind: "demo-kind",
      repoRoot,
      pluginRoot: REAL_PLUGIN_ROOT,
    });
    assert.equal(first.ok, true);

    const second = newArtifact({
      name: "my-explainer",
      kind: "demo-kind",
      repoRoot,
      pluginRoot: REAL_PLUGIN_ROOT,
    });
    assert.equal(second.ok, false);
    assert.equal(second.reason, "already-exists");
  });
});
