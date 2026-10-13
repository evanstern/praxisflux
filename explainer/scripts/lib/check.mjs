// `explainer.mjs check`.
//
// Design decision (documented per the dispatch note — "check runs the build
// first, or requires a fresh dist: pick one, document it"): **check requires
// an already-built `dist/`; it never builds for you.** Two reasons:
//   1. The coordinator's own flow is explicitly two steps ("Build, then
//      Check" — step 5), not one combined verb.
//   2. `fact.real-fresh`'s whole job is to catch *drift* between the
//      committed dist and a truly fresh generator run done right now
//      ("scenario-e drift" case). If `check` rebuilt first, the
//      dist it inspects would always be current by construction and that
//      check could never fail — the one thing it is required to
//      catch. Treating "no dist" as a plain usage error (exit 2, same as a
//      bad contents.json) keeps that drift-detection meaningful.
//
// Every check function receives one shared `ctx` (built once in `check()`)
// and returns `{ messages, special? }`:
//   - `messages`: `[{ severity: "error"|"warning"|"info", text, file?, line?, page? }]`
//   - `special`: `"skipped"` or `"pending"` when the check didn't really
//     run (environment/dependency not ready) — overrides the status that
//     would otherwise be computed from `messages`.
// The harness (`runCheck`) turns that into a `status`: `special` verbatim,
// else `"failed"` if any message has `severity: "error"`, else `"passed"`
// (warnings/info never fail a check by themselves — "errors block
// publish; warnings go in the report"). This one rule covers every row in
// the check table, including the ones with a mixed level ("error / warning",
// e.g. ref.term, ref.github): the check's declared `level` is just the
// table's own label for the report; each *message* carries its own real
// severity, and only an error-severity message can fail the check.
//
// Exit code (documented per the dispatch note): `failed` (any check) wins
// over `pending` (fact.checker with no dist/fact-check.json yet) wins over
// clean — 1 if any check is `failed`, else 3 if any check is `pending`,
// else 0. A build that is both broken AND unreviewed reports the break.

import fs from "node:fs";
import path from "node:path";

import {
  loadDistFiles,
  htmlFiles,
  lineOf,
  escapeTextLocal,
  unescapeAttr,
  runHtmlBalance,
  runJsSyntax,
  runSelfContained,
  runTitleName,
  runTitlePlaceholder,
  runXLeftover,
  runRefAnchor,
  runRefTerm,
  runRefCite,
  runRefGithub,
  runRefInfo,
  runUiAffordance,
  runFactIllustrativeTag,
  runFactNoInternalCodes,
  runRuleParagraphLength,
  runRuleMinFontSize,
  runRuleDefineBeforeUse,
  runRuleChartWithoutDataTable,
  runBrandTokens,
  runFactChecker,
  runWikiFresh,
} from "../../gates/check.mjs";
import { BROWSER_CHECK_IDS, detectBrowser, runBrowserChecks } from "./browser.mjs";
import { loadContentsForBuild } from "./contents.mjs";
import { runGenerators } from "./generators.mjs";
import { resolveAtPath } from "./includes.mjs";
import { createLookup } from "./lookup.mjs";
import { jsonScriptSafe } from "./shell.mjs";

/**
 * Re-runs every declared generator right now (lib/generators.mjs's real
 * runner — approvals respected: an unapproved/changed command generator
 * reports as an error here, same as it would stop a build) and compares
 * each rendered `x-include` ("Real" code block) to that fresh output.
 * Provenance comes from the `data-gen`/`data-at` attributes lib/includes.mjs
 * now stamps on every such block (see its header comment) — `lang`
 * ("json"/"text", already present on every Real block) says how to
 * re-render the fresh value for a byte-for-byte comparison, so no extra
 * metadata is needed for that part.
 *
 * `x-include as="data"` () renders as
 * `<script type="application/json" class="ex-data" data-gen data-at>`
 * instead — same provenance attributes, same drift question, but the body
 * is raw `jsonScriptSafe()` output, not an HTML-entity-escaped `<code>`
 * block. That block's second regex below reads it from `file.content`, not
 * `file.scanText`: `loadDistFiles`'s `blankScriptsAndStyles` blanks every
 * `<script>` body (including this one) so the other scanners never mistake
 * embedded JSON for markup, which means scanText has nothing left to
 * compare here.
 */
function runFactRealFresh({ contents, files, artifactDir, repoRoot }) {
  if (!contents.generators || Object.keys(contents.generators).length === 0) {
    return { messages: [{ severity: "info", text: "no generators declared — nothing for fact.real-fresh to compare" }] };
  }

  let genResult;
  try {
    genResult = runGenerators({ contents, artifactDir, repoRoot });
  } catch (err) {
    return { messages: [{ severity: "error", text: `failed to re-run generators: ${err.message}` }] };
  }
  if (!genResult.ok) {
    return { messages: genResult.errors.map((e) => ({ severity: "error", text: e })) };
  }
  const outputs = genResult.outputs;

  const messages = [];
  const blockRe = /<div class="ex-code" data-tag="Real" data-gen="([^"]*)" data-at="([^"]*)">[\s\S]*?<code[^>]*class="ex-code-lang-(json|text)"[^>]*>([\s\S]*?)<\/code>/g;
  for (const file of htmlFiles(files)) {
    blockRe.lastIndex = 0;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = blockRe.exec(file.scanText))) {
      const [, genAttr, atAttr, lang, renderedEscaped] = m;
      const genId = unescapeAttr(genAttr);
      const at = unescapeAttr(atAttr);
      const line = lineOf(file.scanText, m.index);

      if (!outputs.has(genId)) {
        messages.push({ severity: "error", text: `x-include g="${genId}" at="${at}": generator is no longer declared (stale dist?)`, file: file.relPath, line });
        continue;
      }
      const freshValue = resolveAtPath(outputs.get(genId), at);
      if (freshValue === undefined) {
        messages.push({ severity: "error", text: `x-include g="${genId}" at="${at}": no value at that path in a fresh run (stale dist?)`, file: file.relPath, line });
        continue;
      }
      const freshRendered = lang === "json" ? escapeTextLocal(JSON.stringify(freshValue, null, 2)) : escapeTextLocal(String(freshValue));
      if (freshRendered !== renderedEscaped) {
        messages.push({
          severity: "error",
          text: `x-include g="${genId}" at="${at}": rendered value is stale — does not match a fresh generator run`,
          file: file.relPath,
          line,
        });
      }
    }
  }

  // data-at's value is `escapeAttr(at || "")` at render time (lib/includes.mjs
  // handleInclude), but the page's final HTML goes through a markup.parse +
  // markup.serialize round-trip (lib/markup.mjs's serializeAttrs) that
  // collapses an empty-string attribute to its bare boolean form — `at`
  // omitted (the common "whole generator output" case, e.g. a file-map
  // manifest) ends up as `data-at`, not `data-at=""`, in the real dist file.
  // The second alternative below matches that bare form; its capture group
  // stays undefined, which the `?? ""` just below treats the same as "".
  const dataBlockRe = /<script type="application\/json" class="ex-data" data-gen="([^"]*)" data-at(?:="([^"]*)"|(?=[\s>]))>([\s\S]*?)<\/script>/g;
  for (const file of htmlFiles(files)) {
    dataBlockRe.lastIndex = 0;
    let dm;
    // eslint-disable-next-line no-cond-assign
    while ((dm = dataBlockRe.exec(file.content))) {
      const [, genAttr, atAttr, rawJson] = dm;
      const genId = unescapeAttr(genAttr);
      const at = unescapeAttr(atAttr ?? "");
      const line = lineOf(file.content, dm.index);

      if (!outputs.has(genId)) {
        messages.push({ severity: "error", text: `x-include g="${genId}" as="data": generator is no longer declared (stale dist?)`, file: file.relPath, line });
        continue;
      }
      const freshValue = at ? resolveAtPath(outputs.get(genId), at) : outputs.get(genId);
      if (freshValue === undefined) {
        messages.push({ severity: "error", text: `x-include g="${genId}" at="${at}" as="data": no value at that path in a fresh run (stale dist?)`, file: file.relPath, line });
        continue;
      }
      const freshRendered = jsonScriptSafe(freshValue);
      if (freshRendered !== rawJson) {
        messages.push({
          severity: "error",
          text: `x-include g="${genId}" at="${at}" as="data": rendered value is stale — does not match a fresh generator run`,
          file: file.relPath,
          line,
        });
      }
    }
  }

  return { messages };
}

// browser.* — detection + the real run happen once, up front in check()
// (computeBrowserResults), not per id: three ids share one detection pass
// and one browser driver. Each run function here just reads its own
// precomputed slot off ctx.browserResults.
function makeBrowserCheckRun(id) {
  return async function runBrowserCheck({ browserResults }) {
    return browserResults[id];
  };
}

/**
 * Detects a browser once and runs the three `browser.*` checks (or reports
 * all three `skipped` with the same reason, never `passed`, when none
 * responds). `browserOpts.env`/`browserOpts.importPlaywright` are the
 * test injection seams `lib/browser.mjs`'s `detectBrowser` exposes; real
 * callers (the CLI) leave both undefined and get `process.env` / a real
 * dynamic `import("playwright")`.
 */
async function computeBrowserResults({ files, shape, contents, artifactDir }, browserOpts = {}) {
  const driver = await detectBrowser({ env: browserOpts.env, importPlaywright: browserOpts.importPlaywright });
  if (!driver.available) {
    const skipped = { special: "skipped", messages: [{ severity: "info", text: driver.reason }] };
    return { driver, results: Object.fromEntries(BROWSER_CHECK_IDS.map((id) => [id, skipped])) };
  }
  try {
    const results = await runBrowserChecks({ driver, files, shape, contents, artifactDir, timeoutMs: driver.timeoutMs });
    return { driver, results };
  } catch (err) {
    const failed = { messages: [{ severity: "error", text: `browser checks failed to run: ${err.stack || err.message}` }] };
    return { driver, results: Object.fromEntries(BROWSER_CHECK_IDS.map((id) => [id, failed])) };
  }
}

// --------------------------------------------------------------- registry
// One entry per row, in the table's own order, plus
// `brand.tokens` (not in the check table itself).

export const CHECK_DEFS = [
  { id: "html.balance", level: "error", run: runHtmlBalance },
  { id: "js.syntax", level: "error", run: runJsSyntax },
  { id: "self.contained", level: "error", run: runSelfContained },
  { id: "title.name", level: "error", run: runTitleName },
  { id: "title.placeholder", level: "error", run: runTitlePlaceholder },
  { id: "x.leftover", level: "error", run: runXLeftover },
  { id: "ref.anchor", level: "error", run: runRefAnchor },
  { id: "ref.term", level: "error/warning", run: runRefTerm },
  { id: "ref.cite", level: "error", run: runRefCite },
  { id: "ref.github", level: "warning/error", run: runRefGithub },
  { id: "ref.info", level: "error/warning", run: runRefInfo },
  { id: "ui.affordance", level: "error", run: runUiAffordance },
  { id: "fact.real-fresh", level: "error", run: runFactRealFresh },
  { id: "fact.illustrative-tag", level: "error", run: runFactIllustrativeTag },
  { id: "fact.no-internal-codes", level: "error", run: runFactNoInternalCodes },
  { id: "rule.paragraph-length", level: "warning", run: runRuleParagraphLength },
  { id: "rule.min-font-size", level: "warning", run: runRuleMinFontSize },
  { id: "rule.define-before-use", level: "warning", run: runRuleDefineBeforeUse },
  { id: "rule.chart-without-data-table", level: "warning", run: runRuleChartWithoutDataTable },
  { id: "brand.tokens", level: "error", run: runBrandTokens },
  { id: "wiki.fresh", level: "warning", run: runWikiFresh },
  ...BROWSER_CHECK_IDS.map((id) => ({ id, level: "error", run: makeBrowserCheckRun(id) })),
  { id: "fact.checker", level: "error", run: runFactChecker },
];

export const CHECK_IDS = CHECK_DEFS.map((d) => d.id);

async function runCheck(def, ctx) {
  let result;
  try {
    result = await def.run(ctx);
  } catch (err) {
    result = { messages: [{ severity: "error", text: `check threw: ${err.stack || err.message}` }] };
  }
  const { messages = [], special, ...extra } = result;
  const status = special || (messages.some((m) => m.severity === "error") ? "failed" : "passed");
  return { id: def.id, level: def.level, status, messages, ...extra };
}

// --------------------------------------------------------------- report

function locationLabel(m) {
  const parts = [];
  if (m.file) parts.push(m.line ? `${m.file}:${m.line}` : m.file);
  if (m.page) parts.push(`page: ${m.page}`);
  return parts.join(", ");
}

export function renderCheckReport(results, meta = {}) {
  const lines = [];
  lines.push("# Check report");
  lines.push("");
  if (meta.driver) {
    const d = meta.driver;
    lines.push(
      d.available
        ? `Browser driver: **${d.kind}** — \`${d.executablePath}\`${d.version ? ` (${d.version})` : ""}`
        : `Browser driver: **none** — ${d.reason}`
    );
    lines.push("");
  }
  lines.push("| id | level | status | messages |");
  lines.push("|---|---|---|---|");
  for (const r of results) {
    lines.push(`| ${r.id} | ${r.level} | ${r.status} | ${r.messages.length} |`);
  }
  lines.push("");

  for (const r of results) {
    if (r.messages.length === 0) continue;
    lines.push(`## ${r.id} (${r.status})`);
    for (const m of r.messages) {
      const loc = locationLabel(m);
      lines.push(`- **${m.severity}**${loc ? ` ${loc}:` : ""} ${m.text}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// -------------------------------------------------------------- orchestrator

/**
 * Runs every check against an already-built artifact. Writes
 * `dist/check-report.md` and `dist/check.json` on success. Returns
 * `{ ok: false, step: "load"|"dist", errors }` without writing anything when
 * contents.json doesn't validate or `dist/` doesn't exist (a usage error,
 * not a check result — the CLI maps this to exit 2, same as `build`'s own
 * load-step failure).
 *
 * @param {object} opts
 * @param {string} opts.dir - the artifact folder (docs/explainers/<name>)
 * @param {string} [opts.repoRoot] - repo root, for ref.github's git cat-file,
 *   fact.real-fresh's generator re-run cwd resolution, and the lookup's repo layer
 * @param {string} opts.pluginRoot - this plugin's own root (core/ + default packs root)
 * @param {object} [opts.browser] - test injection seam for lib/browser.mjs's
 *   detectBrowser: `{ env, importPlaywright }`, both passed through verbatim
 *   (undefined means "use the real default" — process.env / a real dynamic
 *   `import("playwright")`). The CLI never sets this.
 */
export async function check({ dir, repoRoot, pluginRoot, browser = {} }) {
  const artifactDir = path.resolve(dir);
  const { contents, packs, errors: contentsErrors } = loadContentsForBuild(artifactDir, { repoRoot });
  if (contentsErrors.length > 0) {
    return { ok: false, step: "load", artifactDir, errors: contentsErrors };
  }

  const files = loadDistFiles(artifactDir);
  if (!files) {
    return { ok: false, step: "dist", artifactDir, errors: ["dist/ not found — run `explainer.mjs build` first"] };
  }

  const name = path.basename(artifactDir);
  const shape = files.some((f) => f.relPath === `${name}.html`) ? "single" : "multi";

  const lookup = createLookup({ artifactDir, repoRoot, packs, pluginRoot });
  const brand = lookup.resolve("brand", contents.brand);
  const brandCss = brand.found ? fs.readFileSync(brand.path, "utf8") : "";

  const { driver, results: browserResults } = await computeBrowserResults({ files, shape, contents, artifactDir }, browser);

  const ctx = { contents, files, shape, name, artifactDir, repoRoot, lookup, pluginRoot, brandCss, browserResults };

  const results = [];
  for (const def of CHECK_DEFS) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await runCheck(def, ctx));
  }

  const hasFailed = results.some((r) => r.status === "failed");
  const hasPending = results.some((r) => r.status === "pending");
  const exitCode = hasFailed ? 1 : hasPending ? 3 : 0;

  const driverMeta = {
    available: driver.available,
    kind: driver.kind || null,
    executablePath: driver.executablePath || null,
    version: driver.version || null,
    reason: driver.reason || null,
  };

  fs.writeFileSync(path.join(artifactDir, "dist", "check-report.md"), renderCheckReport(results, { driver: driverMeta }));
  fs.writeFileSync(path.join(artifactDir, "dist", "check.json"), `${JSON.stringify({ driver: driverMeta, results }, null, 2)}\n`);

  return { ok: true, artifactDir, shape, results, exitCode, driver: driverMeta };
}
