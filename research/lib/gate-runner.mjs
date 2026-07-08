// gate-runner.mjs — the shared Stop-hook harness.
//
// Each plugin ships a Stop hook whose command is a one-line Node entry that calls runStopHook
// with that plugin's gates. When several plugins are installed, each fires its own hook — so
// "run every applicable gate" happens naturally across plugins; within one plugin the runner
// runs that plugin's gates additively over every root they resolve.
//
// A gate is: { name, resolveRoots(startDir) -> string[], check(root) -> string[] (problems),
//             warn?(root) -> string[] (non-blocking notices) }.
// A gate that resolves no roots is a no-op (this isn't its kind of project). `check` problems
// block the stop (exit 2); optional `warn` notices are surfaced on stderr but never block (exit 0)
// — for freshness reminders and the like that shouldn't refuse to let the model finish.
//
// Contract (Claude Code Stop hook): stdin is JSON with { stop_hook_active, cwd, … };
// exit 0 = allow the model to stop; exit 2 = block, and stderr becomes the message it sees.

/** Read all of stdin as a string (empty string on a TTY, so it's safe to run by hand). */
export function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
  });
}

/**
 * Pure core: given the parsed hook input and the gates, return { block, message }.
 * Separated from process I/O so it is unit-testable.
 */
export function evaluate(input, gates, { cwd = process.cwd() } = {}) {
  if (input && input.stop_hook_active === true) return { block: false, message: "", warnings: "" };
  const start = process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || cwd;
  const problems = [];
  const warnings = [];
  for (const gate of gates) {
    let roots = [];
    try { roots = gate.resolveRoots(start) || []; } catch { roots = []; }
    for (const root of roots) {
      try { problems.push(...(gate.check(root) || [])); } catch (e) {
        problems.push(`[${gate.name || "gate"}] crashed on ${root}: ${e.message}`);
      }
      if (typeof gate.warn === "function") {
        try { warnings.push(...(gate.warn(root) || [])); } catch { /* warnings are best-effort */ }
      }
    }
  }
  return { block: problems.length > 0, message: problems.join("\n"), warnings: warnings.join("\n") };
}

/**
 * Full harness: read stdin, evaluate the gates, exit 0 (allow) or 2 (block, message on stderr).
 * Blocking problems win; otherwise any non-blocking warnings are written to stderr and we still
 * allow the stop (exit 0).
 */
export async function runStopHook({ gates, exit = process.exit } = {}) {
  const raw = await readStdin();
  let input = {};
  try { input = JSON.parse(raw || "{}"); } catch { input = {}; }
  const { block, message, warnings } = evaluate(input, gates);
  if (block) {
    process.stderr.write([message, warnings].filter(Boolean).join("\n") + "\n");
    exit(2);
  } else {
    if (warnings) process.stderr.write(warnings + "\n");
    exit(0);
  }
}
