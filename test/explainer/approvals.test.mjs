import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  computeFingerprint,
  findScriptFile,
  isApproved,
  loadApprovals,
  recordApproval,
  resolveGeneratorCwd,
} from "../../explainer/scripts/lib/approvals.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "explainer-approvals-"));
}

test("findScriptFile finds the first token that resolves to a real file, skipping the interpreter and flags", () => {
  const dir = tmpDir();
  try {
    fs.writeFileSync(path.join(dir, "gen.py"), "print('hi')\n");
    assert.equal(findScriptFile("python3 gen.py", dir), path.join(dir, "gen.py"));
    assert.equal(findScriptFile("python3 -u gen.py", dir), path.join(dir, "gen.py"));
    assert.equal(findScriptFile("env", dir), null, "no token names a file on disk");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("computeFingerprint changes when the script's content changes, even though cmd and cwd don't", () => {
  const dir = tmpDir();
  try {
    const scriptPath = path.join(dir, "gen.mjs");
    fs.writeFileSync(scriptPath, "console.log('{}');\n");
    const cmd = `node ${scriptPath}`;
    const fp1 = computeFingerprint({ cmd, cwd: dir });

    fs.writeFileSync(scriptPath, "console.log('{\"changed\":true}');\n");
    const fp2 = computeFingerprint({ cmd, cwd: dir });

    assert.notEqual(fp1, fp2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("computeFingerprint changes when the command string changes, even with the same script content", () => {
  const dir = tmpDir();
  try {
    const scriptPath = path.join(dir, "gen.mjs");
    fs.writeFileSync(scriptPath, "console.log('{}');\n");
    const fp1 = computeFingerprint({ cmd: `node ${scriptPath}`, cwd: dir });
    const fp2 = computeFingerprint({ cmd: `node ${scriptPath} --flag`, cwd: dir });
    assert.notEqual(fp1, fp2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("loadApprovals returns {} when .approvals.json doesn't exist yet", () => {
  const dir = tmpDir();
  try {
    assert.deepEqual(loadApprovals(dir), {});
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("recordApproval persists a fingerprint that isApproved then recognizes", () => {
  const dir = tmpDir();
  try {
    const cmd = "node gen.mjs";
    const cwd = dir;
    const fingerprint = "deadbeef";
    recordApproval({ artifactDir: dir, id: "demo", cmd, cwd, fingerprint });

    const approvals = loadApprovals(dir);
    assert.equal(approvals.demo.fingerprint, fingerprint);
    assert.equal(approvals.demo.cmd, cmd);
    assert.ok(approvals.demo.approvedAt);
    assert.ok(isApproved(approvals, "demo", fingerprint));
    assert.ok(!isApproved(approvals, "demo", "some-other-fingerprint"));
    assert.ok(!isApproved(approvals, "nope", fingerprint));

    assert.ok(fs.existsSync(path.join(dir, ".approvals.json")));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveGeneratorCwd resolves against repoRoot by default, falling back to artifactDir", () => {
  assert.equal(
    resolveGeneratorCwd({ cwd: "specs/arch", repoRoot: "/repo", artifactDir: "/repo/docs/explainers/x" }),
    path.resolve("/repo", "specs/arch")
  );
  assert.equal(
    resolveGeneratorCwd({ cwd: undefined, repoRoot: "/repo", artifactDir: "/repo/docs/explainers/x" }),
    path.resolve("/repo")
  );
  assert.equal(
    resolveGeneratorCwd({ cwd: ".", repoRoot: undefined, artifactDir: "/artifact" }),
    path.resolve("/artifact")
  );
});
