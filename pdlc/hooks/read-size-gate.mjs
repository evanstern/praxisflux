#!/usr/bin/env node
// read-size-gate.mjs — praxis-native port of a bulk-read-interception idea
// (spec 064 / TASK-0124). Two PreToolUse hooks (Read, Bash) that deny a read
// above a configurable line threshold, redirecting the session to OUR cheap
// path — capsule-first corpus loading (CAPSULES.md / INDEX.md) and Agent
// dispatch at the `.claude/model-tiers.json` `defaultTier` — never an
// external service. Shipped from pdlc; PLANTED into an adopting host's
// .claude/settings.json (deliberately no hooks.json beside this file, so the
// marketplace never auto-registers it — same posture as root-guard-hook.mjs,
// spec 051).
//
// The two hazards this port must not inherit (see specs/064-read-size-gate):
//   1. Fail-open schema drift — upstream emitted an obsolete top-level
//      `{"decision":"block"}` shape the current harness ignores, so its gate
//      silently failed open. This hook emits the CURRENT schema:
//        { hookSpecificOutput: { hookEventName: "PreToolUse",
//          permissionDecision: "deny", permissionDecisionReason } }
//      on stdout, exit 0. Allow is exit 0 with NO stdout.
//   2. Corpus rot via blocked grounding reads — wiki-build/wiki-update and
//      design-rounds Phase 2 must read real source to earn their pins, so
//      this is a nudge, not a wall: path exemptions
//      (docs/wiki/, specs/, .worktrees/, .claude/worktrees/), targeted-read
//      exemptions (offset/limit; piped/redirected bash), and a kill-switch
//      (PRAXIS_READ_GATE_OFF=1).
//
// Node >= 18, ESM, zero npm dependencies (stdlib fs/path/readline only).
//
// Usage (selected by argv[2]):
//
//   node read-size-gate.mjs pre-read
//     PreToolUse hook on Read. stdin JSON:
//       { tool_name, tool_input: { file_path, offset?, limit? }, cwd }
//     Exempt (allow, no deny output): offset or limit set (targeted read);
//     resolved project-relative path under an exempt prefix; kill-switch set.
//     Otherwise streams the file counting lines, stopping as soon as the
//     count passes the threshold (never reads the whole file) — over
//     threshold denies.
//
//   node read-size-gate.mjs pre-bash
//     PreToolUse hook on Bash. stdin JSON: { tool_input: { command }, cwd }
//     Finds every command-position `cat` invocation (shell-scan.mjs — the
//     same quote-safe scanner spec 051 built, so this does not re-import its
//     regex defect). A `cat` segment piped to a filter (terminated by `|`) or
//     whose args redirect output/input (`>`, `>>`, `<`) is feeding a filter,
//     not session context, so it is exempt. Otherwise each non-flag argument
//     is resolved against cwd and gated exactly like pre-read.
//
// Threshold: env PRAXIS_READ_GATE_LINES wins; else `.claude/read-size-gate.json`
// (`{ "lines": N }`) under the project root; else 500.
// Kill-switch: env PRAXIS_READ_GATE_OFF=1 disables the gate entirely.
//
// Exit codes: always 0 (this hook never uses the exit-code block protocol —
// it is deny-by-JSON only). Any malformed/unresolvable input, or an internal
// error, fails OPEN (exit 0, no deny output).

import { readFileSync, writeSync, createReadStream, realpathSync } from 'node:fs';
import { resolve as resolvePath, relative as relativePath, sep as pathSep } from 'node:path';
import { createInterface } from 'node:readline';

import { scanCommand } from './shell-scan.mjs';

const KILL_SWITCH_ENV = 'PRAXIS_READ_GATE_OFF';
const THRESHOLD_ENV = 'PRAXIS_READ_GATE_LINES';
const CONFIG_REL = '.claude/read-size-gate.json';
const TIERS_REL = '.claude/model-tiers.json';
const DEFAULT_THRESHOLD = 500;
const EXEMPT_PREFIXES = ['docs/wiki/', 'specs/', '.worktrees/', '.claude/worktrees/'];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function realOrNull(p) {
  try {
    return realpathSync(p);
  } catch {
    return null;
  }
}

function killSwitchOn() {
  return process.env[KILL_SWITCH_ENV] === '1';
}

function projectDirFrom(input) {
  return (
    process.env.CLAUDE_PROJECT_DIR ||
    (typeof input?.cwd === 'string' && input.cwd) ||
    process.cwd()
  );
}

// Config precedence: env wins, else the config file, else the default.
function readThreshold(projectDir) {
  const envVal = process.env[THRESHOLD_ENV];
  if (envVal !== undefined && envVal.trim() !== '') {
    const n = Number(envVal);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  try {
    const cfg = JSON.parse(readFileSync(resolvePath(projectDir, CONFIG_REL), 'utf8'));
    if (Number.isFinite(cfg?.lines) && cfg.lines > 0) return Math.floor(cfg.lines);
  } catch {
    // absent/malformed config: fall through to the default
  }
  return DEFAULT_THRESHOLD;
}

function defaultTierName(projectDir) {
  try {
    const cfg = JSON.parse(readFileSync(resolvePath(projectDir, TIERS_REL), 'utf8'));
    if (typeof cfg?.defaultTier === 'string' && cfg.defaultTier.trim() !== '') {
      return cfg.defaultTier;
    }
  } catch {
    // absent/malformed tiers config: fall back to the literal name
  }
  return 'defaultTier';
}

// Project-relative path (forward-slash separated). Returns null when `absPath`
// is not under `projectDir`.
function relToProject(absPath, projectDir) {
  const rel = relativePath(projectDir, absPath).split(pathSep).join('/');
  if (rel === '' || rel === '..' || rel.startsWith('../')) return null;
  return rel;
}

function isExemptPath(absPath, projectDir) {
  const rel = relToProject(absPath, projectDir);
  if (rel === null) return false;
  return EXEMPT_PREFIXES.some((p) => rel === p.slice(0, -1) || rel.startsWith(p));
}

// Streams `absPath` counting lines, stopping as soon as the count passes
// `threshold` — never reads the whole file into memory. Resolves
// { ok: false } when the path can't be read (fail open at the call site).
function countLinesOverThreshold(absPath, threshold) {
  return new Promise((res) => {
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      res(result);
    };

    let stream;
    try {
      stream = createReadStream(absPath, { encoding: 'utf8' });
    } catch {
      settle({ ok: false });
      return;
    }
    stream.on('error', () => settle({ ok: false }));

    let count = 0;
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    rl.on('line', () => {
      count++;
      if (count > threshold) {
        // Settle BEFORE closing: rl.close() can synchronously fire 'close',
        // which would otherwise win the race and settle over:false first.
        settle({ ok: true, over: true });
        rl.close();
        stream.destroy();
      }
    });
    rl.on('close', () => settle({ ok: true, over: false }));
  });
}

function reasonFor(threshold, projectDir) {
  const tier = defaultTierName(projectDir);
  return (
    `Read denied: over the ${threshold}-line read-size gate. ` +
    'Load the code-grounded corpus capsule-first instead (CAPSULES.md / INDEX.md, ' +
    'just-in-time notes) or dispatch an Agent at the "' +
    tier +
    '" tier to read and summarize this file, rather than spending orchestrator ' +
    'context on the whole thing. Set PRAXIS_READ_GATE_OFF=1 for grounding-wiki/' +
    'design-rounds passes that must read raw source.'
  );
}

function denyOutput(reason) {
  // Synchronous write to fd 1: process.exit() right after an async
  // process.stdout.write() can truncate the write when stdout is piped
  // (the harness's own contract) — writeSync side-steps that entirely.
  writeSync(
    1,
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

async function runPreRead() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // malformed/empty stdin: fail open
  }
  if (!input || typeof input !== 'object') process.exit(0);
  if (killSwitchOn()) process.exit(0);

  const toolInput = input.tool_input;
  const filePath = toolInput?.file_path;
  if (typeof filePath !== 'string' || filePath.trim() === '') process.exit(0);

  // Targeted read (offset or limit set): the session already scoped itself.
  if (toolInput.offset !== undefined || toolInput.limit !== undefined) process.exit(0);

  const projectDir = projectDirFrom(input);
  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd();
  const abs = resolvePath(cwd, filePath);

  if (isExemptPath(abs, projectDir)) process.exit(0);

  const threshold = readThreshold(projectDir);
  const result = await countLinesOverThreshold(abs, threshold);
  if (!result.ok || !result.over) process.exit(0);

  denyOutput(reasonFor(threshold, projectDir));
}

// Redirect operators shell-scan does not treat as separators (`>`, `>>`,
// `<`, `2>`, `&>`, …) show up as ordinary token text; a simple substring
// check is enough to catch the common written forms.
function looksLikeRedirect(token) {
  return token.includes('>') || token.includes('<');
}

async function runPreBash() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // malformed/empty stdin: fail open
  }
  if (!input || typeof input !== 'object') process.exit(0);
  if (killSwitchOn()) process.exit(0);

  const command = input?.tool_input?.command;
  if (typeof command !== 'string' || command.trim() === '') process.exit(0);

  const scan = scanCommand(command);
  if (!scan.ok) process.exit(0); // unparseable: fail open

  const projectDir = projectDirFrom(input);
  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd();
  const threshold = readThreshold(projectDir);

  for (let i = 0; i < scan.segments.length; i++) {
    const segment = scan.segments[i];
    if (segment.length === 0 || segment[0].value !== 'cat') continue;

    // Piped downstream: the read is feeding a filter, not session context.
    if (scan.terminators[i] === '|') continue;

    const args = segment.slice(1).map((t) => t.value);
    // Redirected output/input: same reasoning as a pipe.
    if (args.some(looksLikeRedirect)) continue;

    const files = args.filter((a) => a !== '-' && !a.startsWith('-'));
    for (const f of files) {
      const abs = resolvePath(cwd, f);
      if (isExemptPath(abs, projectDir)) continue;
      const result = await countLinesOverThreshold(abs, threshold);
      if (result.ok && result.over) {
        denyOutput(reasonFor(threshold, projectDir));
      }
    }
  }

  process.exit(0);
}

async function main() {
  const mode = process.argv[2];
  try {
    if (mode === 'pre-read') await runPreRead();
    else if (mode === 'pre-bash') await runPreBash();
    else process.exit(0);
  } catch {
    process.exit(0); // any internal hook error fails open
  }
}

// Only run when invoked directly (not when imported by a test).
if (
  process.argv[1] &&
  realOrNull(process.argv[1]) === realOrNull(new URL(import.meta.url).pathname)
) {
  main();
}
