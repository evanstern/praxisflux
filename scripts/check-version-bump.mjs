#!/usr/bin/env node
// check-version-bump.mjs — enforce "released surface changed ⇒ version bumped".
//
//   node scripts/check-version-bump.mjs [--base <ref>]   # default base: origin/main
//
// Evaluates the COMMITTED range merge-base(<base>, HEAD)..HEAD (uncommitted edits don't count —
// a bump must ship with the commits it covers):
//   - If the diff touches released surface — any registered plugin dir, lib/, scripts/, or
//     .claude-plugin/ — the marketplace version must be a semver INCREASE over the base's, and
//     the tag v<version> must not already exist. Everything else (docs/, backlog/, test/,
//     .github/, root markdown, …) is exempt: no bump required.
//   - Any change under <plugin>/skills/<skill>/ additionally requires that skill's SKILL.md
//     frontmatter `version:` to increase (a skill gaining its first version counts as a bump).
//
// Bump-size guidance and the release pipeline this feeds live in docs/releasing.md.
import { execFileSync } from "node:child_process";
import { parseFrontmatter } from "../lib/markdown.mjs";
import { runAsCli } from "../lib/cli.mjs";

// ---------- pure core (unit-tested in test/version-bump.test.mjs) ----------

export function semverParse(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v ?? "").trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function semverGt(a, b) {
  const pa = semverParse(a), pb = semverParse(b);
  if (!pa || !pb) return false;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i];
  return false;
}

const norm = (src) => String(src).replace(/^\.\//, "").replace(/\/$/, "");

/** Is this repo-relative path part of what a release ships? */
export function releasedSurface(path, pluginSrcs) {
  if (/^(lib|scripts|\.claude-plugin)\//.test(path)) return true;
  return pluginSrcs.some((src) => path.startsWith(norm(src) + "/"));
}

/** The skill dir ("educate/skills/lesson") a path belongs to, or null. */
export function skillDirOf(path, pluginSrcs) {
  for (const src of pluginSrcs) {
    const m = new RegExp(`^(${norm(src)}/skills/[^/]+)/`).exec(path);
    if (m) return m[1];
  }
  return null;
}

/**
 * Decide pass/fail from plain data. Returns a list of human-actionable errors ([] = pass).
 *   changedFiles  repo-relative paths in the range
 *   pluginSrcs    plugins[].source values (base ∪ head)
 *   baseVersion / headVersion   marketplace versions at each end
 *   tagExists     does v<headVersion> already exist?
 *   skills        [{dir, baseVersion|null, headVersion|null, headExists}] for touched skill dirs
 */
export function evaluate({ changedFiles, pluginSrcs, baseVersion, headVersion, tagExists, skills }) {
  const errors = [];
  if (changedFiles.some((f) => releasedSurface(f, pluginSrcs))) {
    if (!semverParse(headVersion)) {
      errors.push(`marketplace version ${JSON.stringify(headVersion)} is not x.y.z semver`);
    } else if (baseVersion != null && !semverGt(headVersion, baseVersion)) {
      errors.push(
        `released surface changed but the marketplace version did not increase ` +
        `(base ${baseVersion}, head ${headVersion}) — run: node scripts/sync-version.mjs <new>`,
      );
    } else if (tagExists) {
      errors.push(`v${headVersion} is already released (tag exists) — pick a higher version`);
    }
  }
  for (const s of skills ?? []) {
    if (!s.headExists) continue; // skill deleted
    if (!semverParse(s.headVersion)) {
      errors.push(`${s.dir}/SKILL.md changed but has no semver \`version:\` frontmatter — add/bump it`);
    } else if (s.baseVersion != null && semverParse(s.baseVersion) && !semverGt(s.headVersion, s.baseVersion)) {
      errors.push(
        `${s.dir}/ changed but its SKILL.md version did not increase ` +
        `(base ${s.baseVersion}, head ${s.headVersion}) — bump it`,
      );
    }
  }
  return errors;
}

export function frontmatterVersion(text) {
  return parseFrontmatter(text)?.version ?? null;
}

// ---------- git wrapper ----------

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...opts }).trimEnd();
}

function gitShow(ref, path) {
  try { return git(["show", `${ref}:${path}`]); } catch { return null; }
}

function marketplaceAt(ref) {
  const raw = gitShow(ref, ".claude-plugin/marketplace.json");
  return raw ? JSON.parse(raw) : null;
}

export function main(argv = process.argv.slice(2)) {
  const i = argv.indexOf("--base");
  const baseRef = i !== -1 ? argv[i + 1] : "origin/main";

  let mergeBase;
  try { mergeBase = git(["merge-base", baseRef, "HEAD"]); }
  catch { console.error(`cannot resolve merge-base of ${baseRef} and HEAD — fetch the base ref first`); return 2; }

  const changedFiles = git(["diff", "--name-only", mergeBase, "HEAD"]).split("\n").filter(Boolean);
  if (changedFiles.length === 0) { console.log("no committed changes vs base — nothing to check"); return 0; }

  const baseMp = marketplaceAt(mergeBase), headMp = marketplaceAt("HEAD");
  const pluginSrcs = [...new Set(
    [...(baseMp?.plugins ?? []), ...(headMp?.plugins ?? [])].map((p) => p.source).filter(Boolean),
  )];

  const skillDirs = [...new Set(changedFiles.map((f) => skillDirOf(f, pluginSrcs)).filter(Boolean))];
  const skills = skillDirs.map((dir) => {
    const head = gitShow("HEAD", `${dir}/SKILL.md`);
    return {
      dir,
      headExists: head != null,
      headVersion: frontmatterVersion(head),
      baseVersion: frontmatterVersion(gitShow(mergeBase, `${dir}/SKILL.md`)),
    };
  });

  const headVersion = headMp?.version;
  const errors = evaluate({
    changedFiles,
    pluginSrcs,
    baseVersion: baseMp?.version ?? null,
    headVersion,
    tagExists: headVersion ? git(["tag", "-l", `v${headVersion}`]) !== "" : false,
    skills,
  });

  if (errors.length) {
    console.error("version-bump check failed:");
    for (const e of errors) console.error(`  - ${e}`);
    return 1;
  }
  const bumped = baseMp && headVersion !== baseMp.version;
  console.log(bumped
    ? `version bump ok: ${baseMp.version} → ${headVersion}`
    : "no released surface changed — no bump required");
  return 0;
}

if (runAsCli(import.meta.url)) process.exit(main());
