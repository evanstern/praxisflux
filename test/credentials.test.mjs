// credentials.test.mjs — spec 073 R6: resolveToken/describeToken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveToken, describeToken } from "../lib/credentials.mjs";
import { removeFixtureDir } from "./fixture-teardown.mjs";

test("resolveToken: git credential fill succeeds -> token from git-credential, GIT_TERMINAL_PROMPT forced off", () => {
  let seenEnv;
  const spawn = (cmd, args, opts) => {
    seenEnv = opts.env;
    assert.equal(cmd, "git");
    assert.deepEqual(args, ["credential", "fill"]);
    return { status: 0, stdout: "username=x\npassword=secret-abc\n", stderr: "", error: null };
  };
  const result = resolveToken({ host: "example.com", spawn, env: {} });
  assert.deepEqual(result, { token: "secret-abc", source: "git-credential" });
  assert.equal(seenEnv.GIT_TERMINAL_PROMPT, "0");
});

test("resolveToken: nonzero exit falls back to env vars in order", () => {
  const spawn = () => ({ status: 1, stdout: "", stderr: "", error: null });
  const result = resolveToken({
    host: "example.com",
    envVars: ["FIRST_TOKEN", "SECOND_TOKEN"],
    spawn,
    env: { SECOND_TOKEN: "env-token" },
  });
  assert.deepEqual(result, { token: "env-token", source: "env:SECOND_TOKEN" });
});

test("resolveToken: missing git (ENOENT-style spawn error) falls back to env", () => {
  const spawn = () => ({ error: new Error("spawn git ENOENT"), status: null, stdout: null, stderr: null });
  const result = resolveToken({ host: "example.com", envVars: ["FORGE_TOKEN"], spawn, env: { FORGE_TOKEN: "t1" } });
  assert.deepEqual(result, { token: "t1", source: "env:FORGE_TOKEN" });
});

test("resolveToken: empty password from git credential falls back to env", () => {
  const spawn = () => ({ status: 0, stdout: "username=x\npassword=\n", stderr: "", error: null });
  const result = resolveToken({ host: "example.com", envVars: ["FORGE_TOKEN"], spawn, env: { FORGE_TOKEN: "t2" } });
  assert.deepEqual(result, { token: "t2", source: "env:FORGE_TOKEN" });
});

test("resolveToken: env var order is respected (first absent, second present)", () => {
  const spawn = () => ({ status: 1, stdout: "", stderr: "", error: null });
  const result = resolveToken({
    host: "example.com",
    envVars: ["ABSENT_TOKEN", "PRESENT_TOKEN"],
    spawn,
    env: { PRESENT_TOKEN: "present" },
  });
  assert.deepEqual(result, { token: "present", source: "env:PRESENT_TOKEN" });
});

test("resolveToken: nothing resolves -> null", () => {
  const spawn = () => ({ status: 1, stdout: "", stderr: "", error: null });
  assert.equal(resolveToken({ host: "example.com", envVars: [], spawn, env: {} }), null);
});

test("describeToken: reports only the source, never the token", () => {
  assert.equal(describeToken({ token: "secret", source: "git-credential" }), "git-credential");
  assert.equal(describeToken({ token: "secret", source: "env:FORGE_TOKEN" }), "env:FORGE_TOKEN");
  assert.equal(describeToken(null), "none");
});

test("resolveToken/describeToken never write the token to stdout or stderr", () => {
  const writes = [];
  const origOut = process.stdout.write.bind(process.stdout);
  const origErr = process.stderr.write.bind(process.stderr);
  process.stdout.write = (chunk, ...rest) => {
    writes.push(String(chunk));
    return origOut(chunk, ...rest);
  };
  process.stderr.write = (chunk, ...rest) => {
    writes.push(String(chunk));
    return origErr(chunk, ...rest);
  };
  try {
    const spawn = () => ({ status: 0, stdout: "username=x\npassword=super-secret-token\n", stderr: "", error: null });
    const result = resolveToken({ host: "example.com", spawn, env: {} });
    describeToken(result);
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
  assert.ok(!writes.some((w) => w.includes("super-secret-token")), "token leaked to stdout/stderr");
});

test("resolveToken integration: real `git credential fill` through a fixture helper, isolated from the operator's global config", () => {
  const dir = mkdtempSync(join(tmpdir(), "credentials-fixture-"));
  try {
    const helperPath = join(dir, "fixture-credential-helper.sh");
    writeFileSync(
      helperPath,
      "#!/bin/sh\nif [ \"$1\" = get ]; then\n  echo username=fixture-user\n  echo password=fixture-token-xyz\nfi\nexit 0\n",
    );
    chmodSync(helperPath, 0o755);

    const gitConfig = join(dir, "gitconfig");
    writeFileSync(gitConfig, `[credential]\n\thelper = ${helperPath}\n`);

    const home = join(dir, "home");
    mkdirSync(home, { recursive: true });

    const isolatedEnv = {
      PATH: process.env.PATH,
      GIT_CONFIG_GLOBAL: gitConfig,
      GIT_CONFIG_NOSYSTEM: "1",
      HOME: home,
      XDG_CONFIG_HOME: join(home, ".config"),
    };

    const result = resolveToken({ host: "example.com", protocol: "https", env: isolatedEnv });
    assert.deepEqual(result, { token: "fixture-token-xyz", source: "git-credential" });
  } finally {
    removeFixtureDir(dir);
  }
});
