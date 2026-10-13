// gates/explainer.mjs — explainer's Stop-hook gate. gates/ only verifies and NEVER writes
// (docs/skill-patterns.md §5). Speaks the lib/gate-runner.mjs contract:
// { name, resolveRoots(startDir) -> string[], check(root) -> string[] (problems) }.
//
// The one always-on invariant: every built page under an explainer artifact's dist/ is
// self-contained (the Artifact CSP blocks external loads). An artifact is any directory
// holding both contents.json and dist/ — the shape `explainer.mjs build` produces. The
// full check suite (gates/check.mjs) is a phase gate the skill runs itself; it is too slow
// and too stateful (browser, generators) to run on every Stop.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findRootsDownwards, hasChild } from "../lib/project-root.mjs";
import { externalLoads } from "../lib/selfcontained.mjs";

const isArtifact = (dir) => hasChild("contents.json")(dir) && hasChild("dist")(dir);

/** Built page files under `dist/`, skipping the build's own provenance (gen/, screenshots/). */
function distPages(distDir, rel = "") {
  const out = [];
  for (const e of readdirSync(join(distDir, rel), { withFileTypes: true })) {
    const p = join(rel, e.name);
    if (e.isDirectory()) {
      if (!(rel === "" && (e.name === "gen" || e.name === "screenshots"))) out.push(...distPages(distDir, p));
    } else if (/\.(html|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

export const explainerGate = {
  name: "explainer",
  resolveRoots: (startDir) => findRootsDownwards(startDir, isArtifact),
  check: (root) => {
    const dist = join(root, "dist");
    const problems = [];
    for (const page of distPages(dist)) {
      for (const { label, url } of externalLoads(readFileSync(join(dist, page), "utf8"))) {
        problems.push(`${join(root, "dist", page)}: ${label} loads ${url} from an external host — the Artifact CSP blocks it; rebuild without it`);
      }
    }
    return problems;
  },
};
