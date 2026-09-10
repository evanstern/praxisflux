#!/usr/bin/env node
// triage-offload.mjs — routes wiki-update's REVIEW pile through the structured-offload seam.
//
//   node triage-offload.mjs <repo-root> [corpus-dir]
//
// classifyNote (gates/freshness.mjs) already separates REPIN (provably safe, no model needed)
// from REVIEW; REPIN entries are untouched. For each REVIEW entry, this asks a local model to
// ROUTE ONLY — computed-re-pin or needs-review, plus which changed path decided it — never to
// write a note, set a pin, or even see the note's own prose. See
// specs/065-wiki-triage-offload/spec.md for the full contract (AC #3: routing only).
//
// Read-only, matching the gates/ contract: prints JSON to stdout, never writes a file. Exit 0
// always — an unconfigured seam (or any offload failure) routes every note to fallback, which
// is byte-identical to today's fully-in-session triage.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { offload, loadConfig } from "../lib/structured-offload.mjs";
import { parseFrontmatter } from "../lib/markdown.mjs";
import { planFreshness, noteSources } from "../gates/freshness.mjs";
import { runAsCli } from "../lib/cli.mjs";

const SCHEMA = {
  type: "object",
  required: ["route", "deciding_path"],
  properties: {
    route: { type: "string", enum: ["computed-re-pin", "needs-review"] },
    deciding_path: { type: "string" },
  },
};

/** The +/- content lines changed in `paths` since `pin` — routing input, not the note body. */
function changedLines(repoRoot, pin, paths) {
  if (!paths.length) return [];
  try {
    return execFileSync("git", ["diff", "-U0", `${pin}..HEAD`, "--", ...paths], { cwd: repoRoot, encoding: "utf8" })
      .split("\n")
      .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
      .map((l) => l.slice(1))
      .filter((l) => l.trim() !== "");
  } catch {
    return [];
  }
}

function buildPrompt(repoRoot, entry, description, sources) {
  const stat = entry.files.map((f) => `${f.path} (+${f.plus}/-${f.minus})`).join(", ");
  const lines = changedLines(repoRoot, entry.pin, entry.files.map((f) => f.path));
  return [
    "You are triaging whether a documentation note needs human review after its sources changed.",
    "The note's own prose is withheld from you on purpose: route on the diff alone.",
    "",
    `Note description: ${description || "(none)"}`,
    `Note sources: ${sources.join(", ") || "(none)"}`,
    `Changed files: ${stat || "(none)"}`,
    "Changed lines (unified diff, no context):",
    lines.join("\n") || "(none captured)",
    "",
    'Answer route="computed-re-pin" only if the diff is mechanical churn that provably cannot',
    'invalidate the note\'s claims. Otherwise answer route="needs-review". A false',
    "computed-re-pin is the expensive error — it forges a pin nobody read the diff to earn.",
    "needs-review only costs a read that was already happening. WHEN UNCERTAIN, ANSWER",
    "needs-review. deciding_path must be one of the changed files listed above.",
  ].join("\n");
}

/** Route one REVIEW entry. Never throws; offloaded:false marks a fallback for this note. */
async function triageOne(repoRoot, entry, config) {
  const text = readFileSync(entry.absPath, "utf8");
  const fm = parseFrontmatter(text);
  const sources = noteSources(text, fm);
  const prompt = buildPrompt(repoRoot, entry, fm?.description, sources);
  const result = await offload({ prompt, schema: SCHEMA, config });
  if (!result.ok) return { note: entry.note, offloaded: false };

  const { route, deciding_path } = result.value;
  if (!entry.files.some((f) => f.path === deciding_path)) return { note: entry.note, offloaded: false };
  return { note: entry.note, route, deciding_path, offloaded: true };
}

/** Plan the corpus, then route every REVIEW entry through the seam. Read-only; never throws. */
export async function triageOffload(repoRoot, corpusDir = "docs/wiki") {
  const { entries, problems } = planFreshness(repoRoot, corpusDir);
  if (problems.length) return { entries: [] };
  const config = loadConfig(repoRoot);
  const out = [];
  for (const entry of entries.filter((e) => e.cls === "REVIEW")) out.push(await triageOne(repoRoot, entry, config));
  return { entries: out };
}

if (runAsCli(import.meta.url)) {
  const [root, corpusDir] = process.argv.slice(2);
  if (!root) { console.error("usage: triage-offload.mjs <repo-root> [corpus-dir]"); process.exit(2); }
  const result = await triageOffload(root, corpusDir || "docs/wiki");
  console.log(JSON.stringify(result));
  process.exit(0);
}
