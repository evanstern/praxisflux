// gate-runner.mjs — the shared Stop-hook harness.
//
// Each plugin ships a Stop hook whose command is a one-line Node entry that calls runStopHook
// with that plugin's gates. When several plugins are installed, each fires its own hook — so
// "run every applicable gate" happens naturally across plugins; within one plugin the runner
// runs that plugin's gates additively over every root they resolve.
//
// A gate is: { name, resolveRoots(startDir) -> string[], check(root) -> string[] (problems) }.
// A gate that resolves no roots is a no-op (this isn't its kind of project).
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
  if (input && input.stop_hook_active === true) return { block: false, message: "" };
  const start = process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || cwd;
  const problems = [];
  for (const gate of gates) {
    let roots = [];
    try { roots = gate.resolveRoots(start) || []; } catch { roots = []; }
    for (const root of roots) {
      try { problems.push(...(gate.check(root) || [])); } catch (e) {
        problems.push(`[${gate.name || "gate"}] crashed on ${root}: ${e.message}`);
      }
    }
  }
  return { block: problems.length > 0, message: problems.join("\n") };
}

/** Full harness: read stdin, evaluate the gates, exit 0 (allow) or 2 (block, message on stderr). */
export async function runStopHook({ gates, exit = process.exit } = {}) {
  const raw = await readStdin();
  let input = {};
  try { input = JSON.parse(raw || "{}"); } catch { input = {}; }
  const { block, message } = evaluate(input, gates);
  if (block) {
    process.stderr.write(message + "\n");
    exit(2);
  } else {
    exit(0);
  }
}
