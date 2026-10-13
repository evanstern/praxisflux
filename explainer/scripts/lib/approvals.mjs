// Generator command approvals. The fingerprint
// binds an approval to *exactly* this command, this cwd, and — when the
// command names a script file that exists on disk — that file's current
// content, so editing the script (or changing the command line) silently
// invalidates the approval and the next build stops again until
// `explainer.mjs approve <id>` is run again.
//
// `--yes` (`explainer.mjs build --yes`) never approves anything: nothing in
// this module, or in lib/generators.mjs's use of it, reads a "yes" flag —
// the only way an approval is ever recorded is through `recordApproval`,
// called exclusively by the `approve` CLI verb (: "--yes never
// approves").

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const APPROVALS_FILENAME = ".approvals.json";

/**
 * Finds the first whitespace-separated token in `cmd` that resolves (against
 * `cwd`) to an existing regular file — i.e. the script the command runs,
 * when it names one: "python3 specs/arch/gen_envelopes.py" -> that .py file;
 * "node gen.mjs" -> that .mjs file. Flags (tokens starting with "-") are
 * skipped. Returns the script's absolute path, or null when no token names a
 * file on disk (e.g. a cmd with no script argument at all, or an interpreter
 * name that isn't itself a path).
 */
export function findScriptFile(cmd, cwd) {
  for (const token of cmd.split(/\s+/)) {
    if (!token || token.startsWith("-")) continue;
    const candidate = path.resolve(cwd, token);
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // Not a path on disk (e.g. "python3", "node", or a bare flag value) —
      // keep looking at the remaining tokens.
    }
  }
  return null;
}

/**
 * sha256(cmd + cwd + content of the script file, if cmd names one).
 * Concatenation order is part of the fingerprint contract — never reorder.
 */
export function computeFingerprint({ cmd, cwd }) {
  const scriptPath = findScriptFile(cmd, cwd);
  const scriptContent = scriptPath ? fs.readFileSync(scriptPath, "utf8") : "";
  return crypto.createHash("sha256").update(cmd + cwd + scriptContent, "utf8").digest("hex");
}

function approvalsPath(artifactDir) {
  return path.join(artifactDir, APPROVALS_FILENAME);
}

/** Reads <artifactDir>/.approvals.json. Returns {} when it doesn't exist yet. */
export function loadApprovals(artifactDir) {
  const file = approvalsPath(artifactDir);
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw new Error(`${file}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${file}: invalid JSON — ${err.message}`);
  }
}

/** True when `id` is approved at exactly `fingerprint` (an unchanged command and script). */
export function isApproved(approvals, id, fingerprint) {
  return Boolean(approvals[id] && approvals[id].fingerprint === fingerprint);
}

/**
 * Records approval for generator `id` at its current fingerprint, persisting
 * to <artifactDir>/.approvals.json (part of the committed artifact source,
 * ). Called only by the `approve <id>` CLI verb.
 */
export function recordApproval({ artifactDir, id, cmd, cwd, fingerprint }) {
  const approvals = loadApprovals(artifactDir);
  approvals[id] = { fingerprint, cmd, cwd, approvedAt: new Date().toISOString() };
  fs.writeFileSync(approvalsPath(artifactDir), `${JSON.stringify(approvals, null, 2)}\n`);
  return approvals[id];
}

/**
 * Resolves a generator's cwd: contents.json generators[id].cwd (default ".")
 * against repoRoot (falling back to artifactDir when no repo root is known —
 * e.g. a test fixture with no enclosing git repo).
 */
export function resolveGeneratorCwd({ cwd, repoRoot, artifactDir }) {
  const base = repoRoot || artifactDir;
  return path.resolve(base, cwd ?? ".");
}
