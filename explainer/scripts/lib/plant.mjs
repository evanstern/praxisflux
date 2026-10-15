// plant.mjs — plant (or refresh) explainer's marked CLAUDE.md block in a host project.
//
// A plugin has no always-on slot (docs/skill-patterns.md §3), so the rules an explainer
// session must follow even before /explain loads ride a marked block in the host's
// CLAUDE.md. Created when absent, appended when CLAUDE.md has no block, replaced between
// the markers when it does. Text outside the markers is never touched.
import fs from "node:fs";
import path from "node:path";

import { render } from "../../lib/template.mjs";

const BEGIN = /<!-- explainer BEGIN\b[^\n]*-->/;
const END = "<!-- explainer END -->";

/** Plant the block into `<root>/CLAUDE.md`. Returns "created" | "appended" | "replaced" | "unchanged". */
export function plant({ root, pluginRoot, check = false }) {
  const version = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8")).version;
  const block = render(fs.readFileSync(path.join(pluginRoot, "templates", "CLAUDE.md"), "utf8"), { EXPLAINER_VERSION: version }).trim();
  const target = path.join(root, "CLAUDE.md");

  let status, next;
  if (!fs.existsSync(target)) {
    status = "created";
    next = `${block}\n`;
  } else {
    const current = fs.readFileSync(target, "utf8");
    const begin = current.match(BEGIN);
    const endAt = current.indexOf(END);
    if (!begin || endAt === -1) {
      status = "appended";
      next = `${current.replace(/\n*$/, "\n\n")}${block}\n`;
    } else {
      next = current.slice(0, begin.index) + block + current.slice(endAt + END.length);
      status = next === current ? "unchanged" : "replaced";
    }
  }
  if (!check && status !== "unchanged") fs.writeFileSync(target, next);
  return status;
}
