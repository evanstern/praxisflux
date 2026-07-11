#!/usr/bin/env node
// runner.mjs — the host-side execution service for the n8n pilot (TASK-22).
//
// n8n (in Docker) owns SEQUENCING and HUMAN TOUCHPOINTS only; every step that needs the host
// toolchain (claude CLI, backlog, git, node) runs here, behind explicit whitelisted endpoints.
// This is the "checkout service" seam from decision-1: the orchestrator never shells into a
// repo itself, it asks this service to perform a named step and gets JSON back.
//
//   node runner.mjs [port]           # default 8787
//
// Endpoints (all POST, JSON body, JSON reply):
//   /checkout {fixture:"lagging"|"exceeds"} -> {runId, dir}       fresh scratch target
//   /checkout {target:"/path/to/repo"}      -> {runId, dir, branch}  REAL repo: work happens
//                                              on a fresh pilot/<runId> branch off main
//   /agent    {runId, prompt?, correction?} -> {exit, round, receipt}  headless claude -p
//                                              (docs/headless-runner.md recipe; `correction`
//                                              carries a gate's failure text verbatim)
//   /gate     {runId}                       -> {pass, failureText}  verdict by artifacts:
//                                              spec-bridge plan prints nothing AND check
//                                              exits 0 with no lag warnings
//   /notify   {runId, resumeUrl}            -> logged + stored: how the human learns where
//                                              to send the approval
//   /finish   {runId, approvedBy}           -> {merged}  the human tier's landing point:
//                                              commit the branch and merge it into main
//
// Tier map (decision-1 vocabulary): /checkout /gate — tier 1 deterministic · /agent — tier 2
// model · /notify + /finish — tier 3, only reachable through n8n's human approval.
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const PRAXISFLUX = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SPEC_CLI = join(PRAXISFLUX, "spec-bridge", "gates", "cli.mjs");
const PORT = Number(process.argv[2]) || 8787;
const LOG = join(dirname(fileURLToPath(import.meta.url)), "runner.log");
const runs = new Map(); // runId -> { dir, branch?, agentRounds }

const log = (line) => { const s = `[${new Date().toISOString()}] ${line}`; console.log(s); appendFileSync(LOG, s + "\n"); };
const git = (cwd, ...args) => execFileSync("git", ["-c", "user.email=pilot@n8n", "-c", "user.name=n8n pilot", ...args], { cwd, encoding: "utf8" }).trim();
const newRunId = () => `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function scratchFixture(fixture) {
  const dir = mkdtempSync(join(tmpdir(), "n8n-pilot-"));
  git(dir, "init", "-q");
  execFileSync("backlog", ["init", "pilot", "--agent-instructions", "none", "--check-branches", "false"], { cwd: dir });
  execFileSync("backlog", ["task", "create", "Payments feature", "-d", "Spec: specs/001-pay/", "--plain"], { cwd: dir });
  mkdirSync(join(dir, "specs", "001-pay"), { recursive: true });
  writeFileSync(join(dir, "specs", "001-pay", "spec.md"), "s");
  writeFileSync(join(dir, "specs", "001-pay", "plan.md"), "p");
  const allDone = fixture === "done-eligible";
  writeFileSync(join(dir, "specs", "001-pay", "tasks.md"),
    `## Phase 1: Setup\n- [x] T001 a\n\n## Phase 2: Core\n- [${allDone ? "x" : " "}] T002 b\n`);
  if (fixture === "exceeds") {
    // The forced-failure scenario is REAL: the board claims Done while the spec proves
    // In Progress — the gate's own failure text becomes the agent's corrective prompt.
    execFileSync("backlog", ["task", "edit", "TASK-1", "-s", "Done"], { cwd: dir });
  }
  if (allDone) {
    // The promotion scenario: spec fully proven, board lagging at In Progress — sync's
    // Done-eligible -> Done move happens in the pipeline, the human approves the landing.
    execFileSync("backlog", ["task", "edit", "TASK-1", "-s", "In Progress"], { cwd: dir });
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", `fixture: ${fixture}`);
  return { dir };
}

function checkout({ fixture, target }) {
  const runId = newRunId();
  if (target) {
    const branch = `pilot/${runId}`;
    git(target, "checkout", "-q", "main");
    git(target, "checkout", "-qb", branch);
    runs.set(runId, { dir: target, branch, agentRounds: 0 });
    log(`checkout ${runId}: REAL target ${target} on ${branch}`);
    return { runId, dir: target, branch };
  }
  const { dir } = scratchFixture(fixture || "lagging");
  runs.set(runId, { dir, agentRounds: 0 });
  log(`checkout ${runId}: scratch fixture '${fixture || "lagging"}' at ${dir}`);
  return { runId, dir, fixture: fixture || "lagging" };
}

function agent({ runId, prompt, correction }) {
  const run = runs.get(runId);
  if (!run) throw new Error(`unknown runId ${runId}`);
  if (run.agentRounds >= 3) throw new Error(`agent round limit (3) reached for ${runId} — this needs a human`);
  run.agentRounds++;
  const base = prompt && prompt.trim() ? prompt : "/spec-bridge:sync";
  const p = correction && correction.trim()
    ? `${base}\n\nA gate rejected the current state. Fix exactly what it names, nothing else:\n${correction}`
    : base;
  log(`agent ${runId} round ${run.agentRounds}: ${p.split("\n")[0].slice(0, 100)}`);
  const r = spawnSync("claude", [
    "-p", p,
    "--allowedTools", "Bash(node:*),Bash(backlog:*),Bash(git:*),Bash(bash:*),Bash(chmod:*),Read,Write,Edit,Glob,Grep",
    "--output-format", "json",
  ], { cwd: run.dir, encoding: "utf8", timeout: 600_000 });
  let receipt = {};
  try { receipt = JSON.parse(r.stdout); } catch { /* receipt stays diagnostic-only */ }
  const out = {
    exit: r.status,
    round: run.agentRounds,
    receipt: { num_turns: receipt.num_turns, duration_ms: receipt.duration_ms, total_cost_usd: receipt.total_cost_usd, subtype: receipt.subtype },
  };
  log(`agent ${runId} round ${run.agentRounds} done: exit=${out.exit} turns=${out.receipt.num_turns} cost=$${out.receipt.total_cost_usd}`);
  return out;
}

function gate({ runId }) {
  const run = runs.get(runId);
  if (!run) throw new Error(`unknown runId ${runId}`);
  // The check half runs the PUBLISHED npm artifact — the pilot consumes the same
  // @praxisflux/gates surface any external orchestrator would, not a repo checkout.
  const check = spawnSync("npx", ["-y", "@praxisflux/gates", "--gates", "spec-bridge", "--path", "."],
    { cwd: run.dir, encoding: "utf8", timeout: 120_000 });
  // plan-empty is the reconciliation half (plan is part of the plugin, not the npm gate CLI).
  const plan = spawnSync("node", [SPEC_CLI, "plan", "."], { cwd: run.dir, encoding: "utf8" });
  const planEmpty = plan.status === 0 && plan.stdout.trim() === "";
  const checkPass = check.status === 0 && !/warn:/m.test(check.stdout);
  const pass = planEmpty && checkPass;
  log(`gate ${runId}: ${pass ? "PASS" : "FAIL"} (planEmpty=${planEmpty} npxCheckExit=${check.status})`);
  return {
    pass,
    // The corrective prompt for the agent node, verbatim — the gates already speak model.
    failureText: pass ? "" : [plan.stdout.trim(), check.stdout.trim()].filter(Boolean).join("\n"),
  };
}

function notify({ runId, resumeUrl }) {
  const run = runs.get(runId);
  if (run) run.resumeUrl = resumeUrl;
  log(`APPROVAL NEEDED ${runId}: curl -X POST '${resumeUrl}' -H 'content-type: application/json' -d '{"approvedBy":"<you>"}'`);
  return { notified: true };
}

function finish({ runId, approvedBy }) {
  const run = runs.get(runId);
  if (!run) throw new Error(`unknown runId ${runId}`);
  if (!approvedBy) throw new Error("finish requires approvedBy — this endpoint is the human tier's landing point");
  git(run.dir, "add", "-A");
  const dirty = git(run.dir, "status", "--porcelain");
  if (dirty) git(run.dir, "commit", "-qm", `pilot ${runId}: work approved by ${approvedBy}`);
  let merged = null;
  if (run.branch) {
    git(run.dir, "checkout", "-q", "main");
    git(run.dir, "merge", "--no-ff", "-q", "-m", `pilot ${runId}: merge ${run.branch} — approved by ${approvedBy}`, run.branch);
    merged = git(run.dir, "rev-parse", "--short", "HEAD");
  } else {
    merged = git(run.dir, "rev-parse", "--short", "HEAD");
  }
  log(`finish ${runId}: approved by ${approvedBy}, HEAD ${merged}`);
  return { merged, approvedBy, branch: run.branch ?? null };
}

const HANDLERS = { "/checkout": checkout, "/agent": agent, "/gate": gate, "/notify": notify, "/finish": finish };

createServer((req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  const handler = HANDLERS[req.url];
  if (req.method !== "POST" || !handler) return send(404, { error: `no such step: ${req.method} ${req.url}` });
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    try {
      const t0 = Date.now();
      const result = handler(body ? JSON.parse(body) : {});
      send(200, { ok: true, step: req.url, ms: Date.now() - t0, ...result });
    } catch (e) {
      log(`ERROR ${req.url}: ${e.message}`);
      send(500, { ok: false, step: req.url, error: String(e.message || e) });
    }
  });
}).listen(PORT, () => log(`n8n-pilot runner on http://localhost:${PORT} — steps: ${Object.keys(HANDLERS).join(" ")}`));
