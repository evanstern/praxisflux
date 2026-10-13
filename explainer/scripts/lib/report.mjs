// dist/build-report.md: inputs and their
// lookup layer, generator run times and output hashes, patterns used,
// overrides, and missing packs — the one place a build's provenance is
// all in one file.

function mdList(items) {
  return items.map((i) => `- ${i}`).join("\n");
}

function inputLine(label, resolved) {
  if (!resolved.found) return `- ${label}: NOT FOUND`;
  const overridden = resolved.overridden ? ", overrides core" : "";
  return `- ${label}: \`${resolved.path}\` (${resolved.layer}${overridden})`;
}

/**
 * @param {object} opts
 * @param {object} opts.contents - validated, merged contents.json
 * @param {object} opts.brand - lookup.resolve("brand", contents.brand) result
 * @param {object} opts.profile - lookup.resolve("profiles", contents.kind) result
 * @param {object[]} opts.rules - lookup.resolve("rules", id) results
 * @param {{overrides: object[], missingPacks: string[]}} opts.lookupReport
 * @param {object[]} opts.generators - lib/generators.mjs's runGenerators() report
 * @param {object[]} opts.patternsUsed - lib/shell.mjs's resolvePatterns() used list
 * @param {{relPath: string}[]} opts.files - dist files this build wrote
 * @param {string[]} [opts.orphanPages] - lib/build.mjs's findOrphanPageFiles()
 *   result: `pages/*.html` files on disk no longer referenced by
 *   contents.pages[]
 * @param {string[]} [opts.infoUnused] - lib/info.mjs-backed bodies
 *   (`<x-info-body>`/legacy panels[]) nothing ever triggers (
 * ) — a hygiene warning, same spirit as orphanPages
 */
export function renderBuildReport({
  contents,
  brand,
  profile,
  rules,
  lookupReport,
  generators,
  patternsUsed,
  files,
  orphanPages = [],
  infoUnused = [],
}) {
  const lines = [];
  lines.push(`# Build report — ${contents.title}`);
  lines.push("");

  lines.push("## Inputs");
  lines.push(inputLine(`brand/${contents.brand}.css`, brand));
  lines.push(inputLine(`profiles/${contents.kind}`, profile));
  for (const rule of rules) lines.push(inputLine(`rules/${rule.name}.json`, rule));
  lines.push("");

  lines.push("## Generators");
  if (generators.length === 0) {
    lines.push("No generators were declared.");
  } else {
    lines.push("| id | kind | ms | hash | output |");
    lines.push("|---|---|---|---|---|");
    for (const g of generators) {
      const kind = g.kind === "builtin" ? `builtin: ${g.builtin}` : `cmd: \`${g.cmd}\``;
      lines.push(`| ${g.id} | ${kind} | ${g.ms} | \`${g.hash}\` | \`${g.outputPath}\` |`);
    }
  }
  lines.push("");

  lines.push("## Patterns used");
  if (patternsUsed.length === 0) {
    lines.push("No patterns were used.");
  } else {
    lines.push("| pattern | layer | js |");
    lines.push("|---|---|---|");
    for (const p of patternsUsed) {
      lines.push(`| ${p.name} | ${p.layer}${p.overridden ? " (overrides core)" : ""} | ${p.hasJs ? "yes" : "no"} |`);
    }
  }
  lines.push("");

  lines.push("## Overrides");
  lines.push(
    lookupReport.overrides.length === 0
      ? "No core item was shadowed."
      : mdList(lookupReport.overrides.map((o) => `${o.category}/${o.name}: \`${o.layer}\` shadows core`))
  );
  lines.push("");

  lines.push("## Missing packs");
  lines.push(
    lookupReport.missingPacks.length === 0
      ? "Every configured pack was found."
      : mdList(lookupReport.missingPacks)
  );
  lines.push("");

  lines.push("## Output");
  lines.push(mdList(files.map((f) => `\`dist/${f.relPath}\``)));
  lines.push("");

  lines.push("## Orphan page files");
  lines.push(
    orphanPages.length === 0
      ? "None — every `pages/*.html` file is referenced by contents.json pages[]."
      : mdList(orphanPages.map((f) => `\`${f}\` — not referenced by any entry in contents.json pages[] (an outline edit likely dropped this page without deleting its file)`))
  );
  lines.push("");

  lines.push("## Unused info bodies");
  lines.push(
    infoUnused.length === 0
      ? "None — every `<x-info-body>`/legacy panels[] entry has at least one trigger."
      : mdList(infoUnused)
  );
  lines.push("");

  return lines.join("\n");
}
