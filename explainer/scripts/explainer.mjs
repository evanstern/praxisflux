#!/usr/bin/env node
// explainer CLI. Node built-ins only — no npm dependencies.
//
// Keep this file a dispatch table, one line per verb — real logic lives in
// scripts/lib/*.mjs (state-mutating) and gates/*.mjs (read-only checks).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { computeFingerprint, recordApproval, resolveGeneratorCwd } from "./lib/approvals.mjs";
import { build } from "./lib/build.mjs";
import { check } from "./lib/check.mjs";
import { loadContentsForBuild } from "./lib/contents.mjs";
import { mergeFactCheckFiles } from "./lib/fact-merge.mjs";
import { plant } from "./lib/plant.mjs";
import { newArtifact } from "./lib/scaffold.mjs";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- small arg parser (built-ins only) --------------------------------------
// Flags are `--name value` (string) or `--name` (boolean); everything else is
// a positional. Good enough for this CLI's small, fixed set of verbs.
function parseArgs(argv, { booleanFlags = [] } = {}) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      if (booleanFlags.includes(name)) {
        flags[name] = true;
      } else {
        const value = argv[i + 1];
        if (value === undefined || value.startsWith("--")) {
          throw new Error(`--${name} expects a value`);
        }
        flags[name] = value;
        i += 1;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

function repoRootFor(dir) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function usage() {
  return [
    "Usage: explainer.mjs <verb> [args…]",
    "",
    "Verbs:",
    "  build [--dir <artifact dir>] [--multi] [--yes]",
    "  new <name> --kind <profile id>",
    "  approve <id> [--dir <artifact dir>]",
    "  check [--dir <artifact dir>]           (requires a fresh dist/ — run build first)",
    "  fact-merge --dir <artifact dir>        (folds dist/fact-check.recheck.json into dist/fact-check.json)",
    "  plant [--root <project dir>] [--check] [--force] (plants/refreshes the marked AGENTS.md block, with a CLAUDE.md pointer)",
  ].join("\n");
}

// --- verbs -------------------------------------------------------------------

async function verbBuild(argv) {
  const { flags } = parseArgs(argv, { booleanFlags: ["multi", "yes"] });
  const dir = path.resolve(flags.dir ?? ".");
  const repoRoot = repoRootFor(dir);

  const result = await build({
    dir,
    multi: Boolean(flags.multi),
    yes: Boolean(flags.yes),
    repoRoot,
    pluginRoot: PLUGIN_ROOT,
  });

  if (result.step === "load") {
    console.error(`contents.json did not validate (${result.artifactDir}):`);
    for (const err of result.errors) console.error(`  ✗ ${err}`);
    return 2;
  }

  console.log(`${result.title} — ${result.groupsCount} group(s), ${result.pagesCount} page(s)`);
  console.log(
    `brand: ${result.brand.found ? `${result.brand.path} (${result.brand.layer}${result.brand.overridden ? ", overrides core" : ""})` : "NOT FOUND"}`
  );
  console.log(
    `profile: ${result.profile.found ? `${result.profile.path} (${result.profile.layer}${result.profile.overridden ? ", overrides core" : ""})` : "NOT FOUND"}`
  );
  for (const rule of result.rules) {
    console.log(
      `rule "${rule.name}": ${rule.found ? `${rule.path} (${rule.layer})` : "NOT FOUND"}`
    );
  }
  if (result.lookupReport.missingPacks.length > 0) {
    console.log(`missing packs: ${result.lookupReport.missingPacks.join(", ")}`);
  }

  if (result.step === "generate" && !result.ok) {
    console.error("");
    console.error("Generators:");
    for (const err of result.errors) console.error(`  ✗ ${err}`);
    return 2;
  }

  if (result.step === "expand" && !result.ok) {
    console.error("");
    console.error("Page expansion failed:");
    for (const err of result.errors) console.error(`  ✗ ${err}`);
    return 2;
  }

  if (result.step === "shell" && !result.ok) {
    console.error("");
    console.error("Shell assembly failed:");
    for (const err of result.errors) console.error(`  ✗ ${err}`);
    return 2;
  }

  if (result.generators && result.generators.length > 0) {
    console.log("");
    console.log("Generators:");
    for (const g of result.generators) {
      console.log(`  ${g.id} (${g.kind}): ${g.ms}ms, sha256:${g.hash.slice(0, 12)}`);
    }
  }

  if (!result.ok) {
    console.error("");
    console.error("Cannot proceed — missing:");
    for (const m of result.missing) console.error(`  ✗ ${m}`);
    return 2;
  }

  if (result.patternsUsed && result.patternsUsed.length > 0) {
    console.log("");
    console.log("Patterns used:");
    for (const p of result.patternsUsed) {
      console.log(`  ${p.name} (${p.layer}${p.overridden ? ", overrides core" : ""}${p.hasJs ? ", +js" : ""})`);
    }
  }

  if (result.dist) {
    console.log("");
    console.log(`Built (${result.dist.shape}):`);
    for (const f of result.dist.files) console.log(`  dist/${f}`);
  }

  if (result.orphanPages && result.orphanPages.length > 0) {
    console.warn(`warning: ${result.orphanPages.length} orphan page file(s) in pages/ are not referenced by contents.json pages[] — see dist/build-report.md`);
  }

  if (result.infoUnused && result.infoUnused.length > 0) {
    console.warn(`warning: ${result.infoUnused.length} info body/bodies (x-info-body / legacy panels[]) are never referenced by a trigger — see dist/build-report.md`);
  }

  return 0;
}

// Cheap listing for the `new` verb's error path: just the plugin core's own
// profiles/ folder names, not a full lookup across repo/pack layers.
function listCoreProfiles() {
  try {
    return fs
      .readdirSync(path.join(PLUGIN_ROOT, "core", "profiles"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

function verbNew(argv) {
  const { positionals, flags } = parseArgs(argv, {});
  const [name] = positionals;
  const kind = flags.kind;

  if (!name || !kind) {
    console.error("Usage: explainer.mjs new <name> --kind <profile id>");
    return 2;
  }

  const repoRoot = repoRootFor(process.cwd()) ?? process.cwd();
  const result = newArtifact({ name, kind, repoRoot, pluginRoot: PLUGIN_ROOT });

  if (!result.ok) {
    switch (result.reason) {
      case "already-exists":
        console.error(`${result.detail}: already exists — not overwriting`);
        return 2;
      case "profile-not-found": {
        console.error(`profile not found: "${result.kind}"`);
        console.error("Looked in the repo (.claude/explainer/), configured packs, and plugin core.");
        const available = listCoreProfiles();
        if (available.length > 0) {
          console.error(`Available profiles (plugin core): ${available.join(", ")}`);
        }
        return 1;
      }
      case "no-skeleton":
        console.error(`${result.skeletonPath}: profile "${kind}" has no skeleton.contents.json`);
        return 1;
      default:
        console.error(`new: failed (${result.reason})`);
        return 1;
    }
  }

  console.log(`Created ${result.targetContents} from profile "${kind}".`);
  return 0;
}

// Records approval for one command generator at its current fingerprint.
//`--yes` on `build` never reaches this path —
// this verb is the only way an approval is ever written.
function verbApprove(argv) {
  const { positionals, flags } = parseArgs(argv, {});
  const [id] = positionals;
  if (!id) {
    console.error("Usage: explainer.mjs approve <id> [--dir <artifact dir>]");
    return 2;
  }

  const dir = path.resolve(flags.dir ?? ".");
  const repoRoot = repoRootFor(dir);

  let contents;
  let errors;
  try {
    ({ contents, errors } = loadContentsForBuild(dir, { repoRoot }));
  } catch (err) {
    console.error(err.message);
    return 2;
  }
  if (errors.length > 0) {
    console.error(`contents.json did not validate (${dir}):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    return 2;
  }

  const config = contents.generators?.[id];
  if (!config) {
    console.error(`approve: unknown generator "${id}" (not declared in ${path.join(dir, "contents.json")}'s generators)`);
    return 2;
  }
  if (config.builtin) {
    console.error(`approve: "${id}" is a built-in generator (${config.builtin}) — built-ins never need approval`);
    return 2;
  }

  const cwd = resolveGeneratorCwd({ cwd: config.cwd, repoRoot, artifactDir: dir });
  const fingerprint = computeFingerprint({ cmd: config.cmd, cwd });
  recordApproval({ artifactDir: dir, id, cmd: config.cmd, cwd, fingerprint });

  console.log(`Approved "${id}": ${config.cmd}`);
  console.log(`fingerprint: ${fingerprint}`);
  return 0;
}

// Runs every check against an already-built dist/ (lib/check.mjs
// — see its header comment for why `check` never builds for you). Exit code:
// 1 if any check failed (error-level), else 3 if fact.checker is still
// `pending` (dist/fact-check.json hasn't been written yet), else 0.
async function verbCheck(argv) {
  const { flags } = parseArgs(argv, {});
  const dir = path.resolve(flags.dir ?? ".");
  const repoRoot = repoRootFor(dir);

  const result = await check({ dir, repoRoot, pluginRoot: PLUGIN_ROOT });

  if (!result.ok) {
    if (result.step === "load") {
      console.error(`contents.json did not validate (${result.artifactDir}):`);
      for (const err of result.errors) console.error(`  ✗ ${err}`);
    } else {
      console.error(result.errors[0]);
    }
    return 2;
  }

  for (const r of result.results) {
    const suffix = r.messages.length > 0 ? ` — ${r.messages.length} message(s)` : "";
    console.log(`${r.id} (${r.level}): ${r.status}${suffix}`);
  }
  console.log("");
  console.log("Wrote dist/check-report.md, dist/check.json");
  if (result.exitCode === 3) {
    console.log("fact.checker is pending — publish is blocked until the fact-checker agent runs (exit 3).");
  }
  return result.exitCode;
}

// Folds a fact-checker re-check into the main fact-check file (plan 023
// phase 1, lib/fact-merge.mjs's mergeFactCheckFiles). Requires --dir, since
// there's no sensible default artifact for a merge step that only makes
// sense mid fix-loop against a specific artifact's dist/.
function verbFactMerge(argv) {
  const { flags } = parseArgs(argv, {});
  if (!flags.dir) {
    console.error("Usage: explainer.mjs fact-merge --dir <artifact dir>");
    return 2;
  }

  const dir = path.resolve(flags.dir);
  const result = mergeFactCheckFiles({ dir });

  if (!result.ok) {
    console.error(`fact-merge: ${result.error}`);
    return 2;
  }

  const pagesLabel = result.pagesReplaced.length > 0 ? result.pagesReplaced.join(", ") : "none";
  const statusLabel = Object.entries(result.counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");
  console.log(
    `fact-merge: replaced ${result.pagesReplaced.length} page(s) (${pagesLabel}) — ${statusLabel}`
  );
  return 0;
}

// Plants (or refreshes) the marked explainer block in the host project's AGENTS.md, with a
// @AGENTS.md pointer kept in CLAUDE.md. --check reports what would change and writes nothing
// (exit 1 when out of date). --force migrates a legacy CLAUDE.md-resident block (pre-074) after
// the diff has been reviewed — never silently.
function verbPlant(argv) {
  const { flags } = parseArgs(argv, { booleanFlags: ["check", "force"] });
  const root = path.resolve(flags.root ?? repoRootFor(process.cwd()) ?? process.cwd());
  const { agentsMd, claudeMd } = plant({ root, pluginRoot: PLUGIN_ROOT, check: flags.check, force: flags.force });
  console.log(`AGENTS.md: ${agentsMd}`);
  console.log(`CLAUDE.md: ${claudeMd}`);
  if (flags.check && (agentsMd === "drifted" || claudeMd === "drifted")) {
    console.error("plant: a legacy explainer block is present in CLAUDE.md — diff it, get consent, then re-run with --force to migrate it into AGENTS.md.");
  }
  return flags.check && (agentsMd !== "unchanged" || claudeMd !== "unchanged") ? 1 : 0;
}

const VERBS = {
  build: verbBuild,
  new: verbNew,
  approve: verbApprove,
  check: verbCheck,
  "fact-merge": verbFactMerge,
  plant: verbPlant,
};

async function main(argv) {
  const [verb, ...rest] = argv;

  if (!verb || verb === "--help" || verb === "-h") {
    console.log(usage());
    return verb ? 0 : 2;
  }

  const handler = VERBS[verb];
  if (!handler) {
    console.error(`Unknown verb: ${verb}\n`);
    console.error(usage());
    return 2;
  }

  return handler(rest);
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(err.stack || err.message);
    process.exit(1);
  }
);
