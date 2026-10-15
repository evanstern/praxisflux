// Orchestrates the build steps (: explainer.mjs build).
//
// fills this in phase by phase; later phases extend `build()` in
// place rather than adding a second entry point:
//   (done): step 1 — load contents.json, merge the project config,
//     validate, and resolve brand/profile/rules through the lookup.
//   (done): step 3 — expand x-* elements; emit the Terms and
//     Sources pages.
//   (done): step 2 — run generators (builtins + approved
//     commands), between resolve and expand; x-include now reads their
//     fresh output for real (lib/includes.mjs, lib/generators.mjs).
//   (this phase, final): steps 4-6 — pattern collection/inlining,
//     single/multi shell emission (lib/shell.mjs), and dist/build-report.md
//     (lib/report.mjs). `pending` is now always empty — every build step runs.
//
// `build()` became async in Phase 2: x-diagram's handler (lib/includes.mjs)
// loads a diagrams/<kind>/render.mjs module via a dynamic import(), which is
// unavoidably async for ESM. The CLI (explainer.mjs) awaits it.

import fs from "node:fs";
import path from "node:path";

import { loadTokenNames, validateBrand } from "./brand.mjs";
import { createCiteRegistry, renderSourcesPage } from "./cites.mjs";
import { loadContentsForBuild } from "./contents.mjs";
import { runGenerators } from "./generators.mjs";
import { expandPage } from "./includes.mjs";
import { collectInfoBodies, registryKey, renderFallback, renderInfoEntry } from "./info.mjs";
import { createLookup } from "./lookup.mjs";
import * as markup from "./markup.mjs";
import { renderBuildReport } from "./report.mjs";
import { assembleShell } from "./shell.mjs";
import { renderTermsPage } from "./terms.mjs";

const PENDING_STEPS = [];

/**
 * Lists `pages/*.html` files on disk that no entry in `contents.pages[]`
 * references by id anymore (an outline edit dropped a page but
 * its placeholder/written file was never deleted — the behavioural run's
 * demo artifact left three such files behind). This never blocks the build
 * — it's a hygiene signal, surfaced in the build report and as a one-line
 * CLI warning — because a page the coordinator forgot to delete is not by
 * itself a broken build.
 */
function findOrphanPageFiles(artifactDir, contents) {
  const pagesDir = path.join(artifactDir, "pages");
  if (!fs.existsSync(pagesDir)) return [];
  const referencedIds = new Set(contents.pages.map((p) => p.id));
  const orphans = [];
  for (const entry of fs.readdirSync(pagesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const id = entry.name.slice(0, -".html".length);
    if (!referencedIds.has(id)) orphans.push(path.join("pages", entry.name));
  }
  return orphans.sort();
}

/**
 * Expands every non-generated page's markup (in contents.pages[] order, so
 * x-cite's first-use numbering comes out right), then renders the
 * generated-terms/generated-sources pages once the citation registry is
 * complete. Returns `{ ok: true, pages, citesUsed, infoUnused,
 * globalInfoFallbackHtml }` or `{ ok: false, errors }` — never throws, so
 * lib/build.mjs can report every page's problem from one call rather than
 * stopping at the first.
 *
 * Info-component expansion runs in three passes
 * rather than inside the single per-page walk every other x-* element uses,
 * because a trigger must validate against the *complete* key registry
 * regardless of whether its `<x-info-body>` appears earlier or later in the
 * document (or on another page entirely, for scope="global"):
 *   1. parse every non-generated page's raw markup (once — the same parsed
 *      node tree is reused for the real expansion pass below, never
 *      reparsed);
 *   2. pre-scan every parsed tree for `<x-info-body>` plus contents.json's
 *      legacy `pages[].panels[]` (lib/info.mjs's collectInfoBodies) to build
 *      the complete key registry up front, folding in both sources and
 *      failing the whole build on a duplicate/colliding key before any
 *      page is expanded;
 *   3. expand every page against that registry (x-info/data-info/data-panel
 *      validate and resolve; x-info-body renders into `ctx.infoEntriesOut`
 *      and is removed from flow), then render each page's own "More detail"
 *      fallback plus the one shared global-scope fallback.
 */
async function expandAllPages({ contents, artifactDir, lookup, multi, generatorOutputs }) {
  const termKeys = new Set((contents.terms || []).map((t) => t.key));
  const sourcesById = new Map((contents.sources || []).map((s) => [s.id, s]));
  // Map (not a bare Set of ids): x-page's handler (lib/includes.mjs) also
  // needs each page's title as its fallback link text for a self-closing
  // <x-page p="id"/> — generated pages (Terms/Sources) carry their own
  // contents.pages[] title the same as any hand-authored page, so no
  // special-casing is needed here.
  const pageIds = new Map(contents.pages.map((p) => [p.id, p.title]));
  const citeRegistry = createCiteRegistry();
  const diagramModuleCache = new Map();
  // The generated-sources page's own id, or `null` if the artifact has
  // none — lib/cites.mjs needs it to build a `diff` source's multi-shape
  // cite href (`<id>.html#sources--N`); same precedent as lib/shell.mjs's
  // termsPageId, which does the same thing for a term's `see` link.
  const sourcesPageId = contents.pages.find((p) => p.type === "generated-sources")?.id || null;

  const errors = [];
  const pageDrafts = []; // non-generated pages only: { page, file, nodes }
  const generatedDrafts = []; // generated-terms/generated-sources, in order

  for (const page of contents.pages) {
    if (page.type === "generated-terms" || page.type === "generated-sources") {
      generatedDrafts.push({ page });
      continue;
    }

    const relFile = path.join("pages", `${page.id}.html`);
    const fullPath = path.join(artifactDir, relFile);
    let raw;
    try {
      raw = fs.readFileSync(fullPath, "utf8");
    } catch (err) {
      errors.push(`${relFile}: ${err.code === "ENOENT" ? "not found" : err.message}`);
      continue;
    }
    try {
      const nodes = markup.parse(raw, { file: relFile });
      pageDrafts.push({ page, file: relFile, nodes });
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const infoRegistry = collectInfoBodies({ pageDrafts });
  if (!infoRegistry.ok) return { ok: false, errors: infoRegistry.errors };

  // Legacy contents.json pages[].panels[] entries never go through
  // expandPage (they carry no markup to walk — their `body` is already-
  // final HTML, same as before) — rendered directly into the
  // same entries-out bucketing x-info-body's handler uses, so both sources
  // land in one "More detail" fallback per page.
  const infoEntriesOut = new Map();
  for (const map of infoRegistry.byPage.values()) {
    for (const meta of map.values()) {
      if (meta.source !== "panel") continue;
      const entryHtml = renderInfoEntry({ meta, innerHtml: meta.html });
      if (!infoEntriesOut.has(meta.pageId)) infoEntriesOut.set(meta.pageId, []);
      infoEntriesOut.get(meta.pageId).push(entryHtml);
    }
  }

  const infoUsed = new Set();
  const drafts = [];

  for (const { page, file, nodes } of pageDrafts) {
    try {
      const expanded = await expandPage(nodes, {
        file,
        page,
        multi,
        termKeys,
        sourcesById,
        pageIds,
        sourcesPageId,
        repo: contents.repo,
        citeRegistry,
        lookup,
        artifactDir,
        diagramModuleCache,
        generatorOutputs,
        infoLocal: infoRegistry.byPage.get(page.id) || new Map(),
        infoGlobal: infoRegistry.global,
        infoUsed,
        infoEntriesOut,
      });
      drafts.push({ page, html: markup.serialize(expanded) });
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  // : a body nothing ever triggers is a (non-fatal) hygiene warning,
  // same spirit as lib/build.mjs's own orphan-page-files report — surfaced
  // on the build result, never block-worthy by itself.
  const infoUnused = [];
  for (const [, map] of [["global", infoRegistry.global], ...infoRegistry.byPage]) {
    for (const meta of map.values()) {
      if (!infoUsed.has(registryKey(meta))) {
        infoUnused.push(
          meta.scope === "global"
            ? `info key "${meta.key}" (global) is never referenced by any trigger`
            : `info key "${meta.key}" (page "${meta.pageId}") is never referenced by any trigger`
        );
      }
    }
  }

  const globalInfoFallbackHtml = renderFallback((infoEntriesOut.get("global") || []).join(""));

  const pages = [...drafts, ...generatedDrafts].map(({ page, html }) => {
    if (page.type === "generated-terms") return { ...page, html: renderTermsPage(contents) };
    if (page.type === "generated-sources") {
      return { ...page, html: renderSourcesPage(citeRegistry.usedSources(), contents.repo) };
    }
    const pageFallbackHtml = renderFallback((infoEntriesOut.get(page.id) || []).join(""));
    return { ...page, html: pageFallbackHtml ? html + pageFallbackHtml : html };
  });
  // Generated pages were appended after drafts above only to keep the map
  // simple; contents.pages[] order is what actually matters downstream
  // (numbering, menu, pager — lib/shell.mjs), so re-sort back to it.
  const order = new Map(contents.pages.map((p, i) => [p.id, i]));
  pages.sort((a, b) => order.get(a.id) - order.get(b.id));

  return { ok: true, pages, citesUsed: citeRegistry.usedSources(), infoUnused, globalInfoFallbackHtml };
}

/**
 * Writes every `{ relPath, content }` file (lib/shell.mjs's assembleShell
 * output) under `<artifactDir>/dist/`, creating directories as needed.
 * Returns the list of relPaths actually written, for the build result and
 * the build report.
 */
function writeDistFiles(artifactDir, files) {
  const distRoot = path.join(artifactDir, "dist");
  for (const { relPath, content } of files) {
    const target = path.join(distRoot, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return files.map((f) => f.relPath);
}

/**
 * Runs the currently-implemented prefix of the build (build steps 1, 2 and 3).
 * Returns a result object rather than throwing on a bad contents.json or a
 * bad page, so the CLI can print every problem from one call.
 *
 * @param {object} opts
 * @param {string} opts.dir - the artifact folder (docs/explainers/<name>)
 * @param {boolean} [opts.multi] - changes x-page's href shape; full
 *   single/multi shell emission is Phase 4's
 * @param {boolean} [opts.yes] - never approves a generator: nothing
 *   in the generator-run step below reads this flag, by construction
 * @param {string} [opts.repoRoot] - repo root, for .claude/explainer/, the
 *   project config and generator cwd resolution; falls back to walking up
 *   from `dir` when omitted
 * @param {string} opts.pluginRoot - this plugin's own root (for core/ and the
 *   default packs root)
 */
export async function build({ dir, multi = false, yes = false, repoRoot, pluginRoot }) {
  const artifactDir = path.resolve(dir);
  const { contents, packs, errors, projectConfigPath } = loadContentsForBuild(artifactDir, {
    repoRoot,
  });

  if (errors.length > 0) {
    return { ok: false, step: "load", artifactDir, errors };
  }

  const lookup = createLookup({ artifactDir, repoRoot, packs, pluginRoot });
  const brand = lookup.resolve("brand", contents.brand);
  const profile = lookup.resolve("profiles", contents.kind);
  const rules = (contents.rules?.on ?? []).map((id) => lookup.resolve("rules", id));
  const orphanPages = findOrphanPageFiles(artifactDir, contents);

  const missing = [];
  let brandCss;
  if (!brand.found) {
    missing.push(`brand/${contents.brand}.css`);
  } else {
    // : a brand file missing any --ex-* token fails the build, listing
    // every missing token (lib/brand.mjs validateBrand — shared with
    // check script).
    brandCss = fs.readFileSync(brand.path, "utf8");
    const tokenNames = loadTokenNames(pluginRoot);
    const brandCheck = validateBrand(brandCss, tokenNames);
    if (!brandCheck.ok) {
      for (const name of brandCheck.missing) {
        missing.push(`brand/${contents.brand}.css: missing token ${name}`);
      }
    }
  }
  if (!profile.found) missing.push(`profiles/${contents.kind}`);
  for (const r of rules) if (!r.found) missing.push(`rules/${r.name}.json`);

  const shared = {
    artifactDir,
    multi,
    yes,
    projectConfigPath,
    packs,
    title: contents.title,
    groupsCount: contents.groups.length,
    pagesCount: contents.pages.length,
    brand,
    profile,
    rules,
    lookupReport: lookup.report(),
    orphanPages,
  };

  if (missing.length > 0) {
    return { ok: false, step: "resolve", missing, pending: PENDING_STEPS, ...shared };
  }

  const genResult = runGenerators({ contents, artifactDir, repoRoot });
  if (!genResult.ok) {
    return {
      ok: false,
      step: "generate",
      errors: genResult.errors,
      needsApproval: genResult.needsApproval,
      missing,
      pending: PENDING_STEPS,
      ...shared,
    };
  }

  const expansion = await expandAllPages({
    contents,
    artifactDir,
    lookup,
    multi,
    generatorOutputs: genResult.outputs,
  });
  if (!expansion.ok) {
    return { ok: false, step: "expand", errors: expansion.errors, ...shared };
  }

  // build steps 4-5: collect + inline the patterns actually used, then emit
  // the single or --multi shell (lib/shell.mjs). brandCss was already read
  // and validated (every --ex-* token present) in the "resolve" step above.
  const name = path.basename(artifactDir);
  const shellResult = assembleShell({
    contents,
    pages: expansion.pages,
    multi,
    brandCss,
    lookup,
    name,
    globalInfoFallbackHtml: expansion.globalInfoFallbackHtml,
  });
  if (!shellResult.ok) {
    return {
      ok: false,
      step: "shell",
      errors: shellResult.errors,
      missing,
      pages: expansion.pages,
      citesUsed: expansion.citesUsed,
      generators: genResult.report,
      pending: PENDING_STEPS,
      ...shared,
    };
  }

  const distFiles = writeDistFiles(artifactDir, shellResult.files);

  // build steps 6: dist/build-report.md.
  const reportMarkdown = renderBuildReport({
    contents,
    brand,
    profile,
    rules,
    lookupReport: shared.lookupReport,
    generators: genResult.report,
    patternsUsed: shellResult.patternsUsed,
    files: shellResult.files,
    orphanPages,
    infoUnused: expansion.infoUnused,
  });
  fs.writeFileSync(path.join(artifactDir, "dist", "build-report.md"), reportMarkdown);

  return {
    ok: true,
    step: "shell",
    missing,
    pages: expansion.pages,
    citesUsed: expansion.citesUsed,
    generators: genResult.report,
    patternsUsed: shellResult.patternsUsed,
    dist: { shape: multi ? "multi" : "single", files: [...distFiles, "build-report.md"] },
    pending: PENDING_STEPS,
    infoUnused: expansion.infoUnused,
    ...shared,
  };
}
