// read-size-gate.test.mjs — end-to-end fail-closed suite for spec 064 / TASK-0124
// (Phase 1, AC #5). Spawns the hook exactly as the harness would (JSON on
// stdin, mode by argv[2]) and asserts on stdout.
//
// AC #5 is load-bearing: the deny must be asserted at the EXACT current
// schema path (hookSpecificOutput.permissionDecision === "deny"), with a
// negative control proving an obsolete top-level {"decision":"block"} shape
// — the exact shape upstream's shunt plugin emitted, which the current
// harness ignores and so fails OPEN silently — does NOT satisfy the
// assertion helper. A schema drift must break this test, not the gate.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = fileURLToPath(new URL("../pdlc/hooks/read-size-gate.mjs", import.meta.url));

// The exact schema assertion helper (this IS the AC #5 gate).
function isSchemaDeny(obj) {
  return (
    !!obj &&
    obj.hookSpecificOutput?.hookEventName === "PreToolUse" &&
    obj.hookSpecificOutput?.permissionDecision === "deny" &&
    typeof obj.hookSpecificOutput?.permissionDecisionReason === "string"
  );
}

function parsedStdout(r) {
  const out = r.stdout.trim();
  return out === "" ? null : JSON.parse(out);
}

function drive(mode, input, projectDir, extraEnv = {}) {
  return spawnSync("node", [HOOK, mode], {
    input: JSON.stringify(input),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir, ...extraEnv },
    encoding: "utf8",
  });
}

function assertDenied(r) {
  assert.equal(r.status, 0, "hook always exits 0 (deny is communicated by JSON, not exit code)");
  const parsed = parsedStdout(r);
  assert.ok(isSchemaDeny(parsed), `expected a schema-correct deny, got: ${r.stdout}`);
}

function assertAllowed(r) {
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "", "allow must produce no stdout");
}

function writeLines(path, n) {
  writeFileSync(path, Array.from({ length: n }, (_, i) => `line ${i}`).join("\n") + "\n");
}

function mkEnv() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "read-gate-")));
  mkdirSync(join(root, "docs", "wiki"), { recursive: true });
  mkdirSync(join(root, "specs"), { recursive: true });
  mkdirSync(join(root, ".worktrees"), { recursive: true });
  mkdirSync(join(root, ".claude", "worktrees"), { recursive: true });
  mkdirSync(join(root, ".claude"), { recursive: true });
  mkdirSync(join(root, "src"), { recursive: true });
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

// ===========================================================================
// AC #5 — schema-exact deny, with the negative control.
// ===========================================================================

test("negative control: an obsolete top-level {decision:'block'} shape is NOT a schema deny", () => {
  assert.equal(isSchemaDeny({ decision: "block" }), false);
  assert.equal(isSchemaDeny({ decision: "block", reason: "x" }), false);
});

test("pre-read: over-threshold file denies at the exact current schema path", () => {
  const env = mkEnv();
  try {
    writeFileSync(join(env.root, ".claude", "model-tiers.json"), JSON.stringify({ defaultTier: "sonnet" }));
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive("pre-read", { tool_name: "Read", tool_input: { file_path: file }, cwd: env.root }, env.root);
    assertDenied(r);
    const reason = parsedStdout(r).hookSpecificOutput.permissionDecisionReason;
    assert.match(reason, /CAPSULES\.md/);
    assert.match(reason, /INDEX\.md/);
    assert.match(reason, /sonnet/); // this fixture's defaultTier, read from .claude/model-tiers.json when present
  } finally {
    env.done();
  }
});

test("pre-read: under-threshold file is allowed", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "small.txt");
    writeLines(file, 10);
    const r = drive("pre-read", { tool_name: "Read", tool_input: { file_path: file }, cwd: env.root }, env.root);
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-read: defaultTier falls back to the literal name when .claude/model-tiers.json is absent", () => {
  const env = mkEnv(); // no model-tiers.json written
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive("pre-read", { tool_name: "Read", tool_input: { file_path: file }, cwd: env.root }, env.root);
    assertDenied(r);
    assert.match(parsedStdout(r).hookSpecificOutput.permissionDecisionReason, /defaultTier/);
  } finally {
    env.done();
  }
});

// ===========================================================================
// Exemptions — pre-read.
// ===========================================================================

test("pre-read exemption: offset set allows an over-threshold file", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive(
      "pre-read",
      { tool_name: "Read", tool_input: { file_path: file, offset: 100 }, cwd: env.root },
      env.root
    );
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-read exemption: limit set allows an over-threshold file", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive(
      "pre-read",
      { tool_name: "Read", tool_input: { file_path: file, limit: 50 }, cwd: env.root },
      env.root
    );
    assertAllowed(r);
  } finally {
    env.done();
  }
});

const PATH_EXEMPTIONS = [
  ["docs/wiki/", ["docs", "wiki", "note.md"]],
  ["specs/", ["specs", "064-x", "spec.md"]],
  [".worktrees/", [".worktrees", "task-1", "file.txt"]],
  [".claude/worktrees/", [".claude", "worktrees", "task-1", "file.txt"]],
];

for (const [label, segs] of PATH_EXEMPTIONS) {
  test(`pre-read exemption: path under ${label} allows an over-threshold file`, () => {
    const env = mkEnv();
    try {
      const file = join(env.root, ...segs);
      mkdirSync(join(env.root, ...segs.slice(0, -1)), { recursive: true });
      writeLines(file, 501);
      const r = drive("pre-read", { tool_name: "Read", tool_input: { file_path: file }, cwd: env.root }, env.root);
      assertAllowed(r);
    } finally {
      env.done();
    }
  });
}

test("pre-read exemption: kill-switch PRAXIS_READ_GATE_OFF=1 allows an over-threshold file", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive(
      "pre-read",
      { tool_name: "Read", tool_input: { file_path: file }, cwd: env.root },
      env.root,
      { PRAXIS_READ_GATE_OFF: "1" }
    );
    assertAllowed(r);
  } finally {
    env.done();
  }
});

// ===========================================================================
// pre-bash — `cat` detection, piped/redirected exemption, path exemptions.
// ===========================================================================

test("pre-bash: over-threshold `cat` of a plain file denies at the exact schema path", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive("pre-bash", { tool_input: { command: `cat ${file}` }, cwd: env.root }, env.root);
    assertDenied(r);
  } finally {
    env.done();
  }
});

test("pre-bash: under-threshold `cat` is allowed", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "small.txt");
    writeLines(file, 10);
    const r = drive("pre-bash", { tool_input: { command: `cat ${file}` }, cwd: env.root }, env.root);
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-bash exemption: piped `cat file | grep x` is allowed (feeding a filter)", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive(
      "pre-bash",
      { tool_input: { command: `cat ${file} | grep foo` }, cwd: env.root },
      env.root
    );
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-bash exemption: redirected `cat file > out.txt` is allowed", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive(
      "pre-bash",
      { tool_input: { command: `cat ${file} > ${join(env.root, "out.txt")}` }, cwd: env.root },
      env.root
    );
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-bash control: a `cat file; other-command` (NOT piped) is still gated", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive("pre-bash", { tool_input: { command: `cat ${file}; echo done` }, cwd: env.root }, env.root);
    assertDenied(r);
  } finally {
    env.done();
  }
});

test("pre-bash exemption: `cat` under specs/ is allowed even over threshold", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "specs", "064-x", "spec.md");
    mkdirSync(join(env.root, "specs", "064-x"), { recursive: true });
    writeLines(file, 501);
    const r = drive("pre-bash", { tool_input: { command: `cat ${file}` }, cwd: env.root }, env.root);
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-bash exemption: kill-switch allows an over-threshold `cat`", () => {
  const env = mkEnv();
  try {
    const file = join(env.root, "src", "big.txt");
    writeLines(file, 501);
    const r = drive("pre-bash", { tool_input: { command: `cat ${file}` }, cwd: env.root }, env.root, {
      PRAXIS_READ_GATE_OFF: "1",
    });
    assertAllowed(r);
  } finally {
    env.done();
  }
});

test("pre-bash: a non-cat command is always allowed", () => {
  const env = mkEnv();
  try {
    const r = drive("pre-bash", { tool_input: { command: "backlog task list --plain" } }, env.root);
    assertAllowed(r);
  } finally {
    env.done();
  }
});

// ===========================================================================
// Config precedence: env > config file > default (500).
// ===========================================================================

test("config precedence: default 500 — 501 lines denies, 500 lines allows, with no env or config file", () => {
  const env = mkEnv();
  try {
    const over = join(env.root, "src", "over.txt");
    const at = join(env.root, "src", "at.txt");
    writeLines(over, 501);
    writeLines(at, 500);
    assertDenied(drive("pre-read", { tool_input: { file_path: over }, cwd: env.root }, env.root));
    assertAllowed(drive("pre-read", { tool_input: { file_path: at }, cwd: env.root }, env.root));
  } finally {
    env.done();
  }
});

test("config precedence: .claude/read-size-gate.json overrides the default", () => {
  const env = mkEnv();
  try {
    writeFileSync(join(env.root, ".claude", "read-size-gate.json"), JSON.stringify({ lines: 10 }));
    const over = join(env.root, "src", "over.txt");
    const at = join(env.root, "src", "at.txt");
    writeLines(over, 11);
    writeLines(at, 10);
    assertDenied(drive("pre-read", { tool_input: { file_path: over }, cwd: env.root }, env.root));
    assertAllowed(drive("pre-read", { tool_input: { file_path: at }, cwd: env.root }, env.root));
  } finally {
    env.done();
  }
});

test("config precedence: PRAXIS_READ_GATE_LINES env overrides both the config file and the default", () => {
  const env = mkEnv();
  try {
    writeFileSync(join(env.root, ".claude", "read-size-gate.json"), JSON.stringify({ lines: 10 }));
    const file = join(env.root, "src", "mid.txt");
    writeLines(file, 501); // over the config-file threshold and the default, under the env threshold
    const r = drive("pre-read", { tool_input: { file_path: file }, cwd: env.root }, env.root, {
      PRAXIS_READ_GATE_LINES: "1000",
    });
    assertAllowed(r);
  } finally {
    env.done();
  }
});
