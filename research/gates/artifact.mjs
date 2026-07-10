// artifact.mjs — GATE: is a rendered HTML page self-contained and CSP-safe?
// Thin wrapper reading a file into the shared lib/selfcontained verifier.
import { readFileSync } from "node:fs";
import { checkHtml } from "../lib/selfcontained.mjs";

export function validateArtifact(path) {
  let html;
  try { html = readFileSync(path, "utf8"); }
  catch (e) { return { ok: false, fails: [`cannot read ${path}: ${e.message}`], warns: [] }; }
  return checkHtml(html);
}
