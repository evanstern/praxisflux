// Backs the `new` CLI verb: copies a profile's skeleton contents.json
// into a fresh docs/explainers/<name>/ folder. Pure w.r.t. process/git
// concerns (repoRoot is passed in) so it is unit-testable directly; the CLI
// (explainer.mjs) only handles argv parsing and git detection.

import fs from "node:fs";
import path from "node:path";

import { loadProjectConfig } from "./contents.mjs";
import { createLookup } from "./lookup.mjs";

// Page types whose body the build writes itself (lib/build.mjs's
// expandAllPages) — `new` never writes a pages/<id>.html placeholder for
// one of these, since the build would never read it.
const GENERATED_PAGE_TYPES = new Set(["generated-terms", "generated-sources"]);

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Shared with lib/check.mjs's x.leftover check: a page that
// still contains this exact text is a placeholder `new` scaffolded and
// nobody replaced — it must never publish. Keep this the single source of
// truth for the literal marker text so the two never drift apart.
export const PLACEHOLDER_MARKER_TEXT = "TODO — placeholder, not reviewed content.";

/**
 * Reads a profile's own profile.json, if it has one (a test fixture profile
 * may ship only a skeleton.contents.json), to look up a page type's
 * `purpose` text for the placeholder below. Never throws — a profile with
 * no profile.json, or one missing the page type, just gets a generic
 * placeholder.
 */
function loadPageTypePurposes(profileDir) {
  try {
    const raw = fs.readFileSync(path.join(profileDir, "profile.json"), "utf8");
    const doc = JSON.parse(raw);
    const map = new Map();
    for (const pt of doc.page_types || []) {
      if (pt && typeof pt.id === "string") map.set(pt.id, pt.purpose);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * One placeholder page middle (a fragment, never a full HTML
 * document) for a freshly scaffolded page. Carries an obvious TODO so it is
 * never mistaken for real, fact-checked content, and names what the page is
 * meant to answer (from the profile's own page_types[].purpose) when known.
 */
function placeholderPageHtml(page, purposes) {
  const purpose = purposes.get(page.type);
  const prompt = purpose
    ? `This page should answer: ${escapeHtml(purpose)}`
    : `Replace this placeholder with real, fact-checked content for the "${escapeHtml(page.title)}" page.`;
  return `<p><strong>${PLACEHOLDER_MARKER_TEXT}</strong> ${prompt}</p>\n`;
}

/**
 * @returns {{ ok: boolean, reason?: string, detail?: string, targetDir?: string }}
 */
export function newArtifact({ name, kind, repoRoot, pluginRoot }) {
  const { config: projectConfig } = loadProjectConfig({ repoRoot, startDir: repoRoot });
  const packs = Array.isArray(projectConfig.packs) ? projectConfig.packs : [];

  const targetDir = path.join(repoRoot, "docs", "explainers", name);
  const targetContents = path.join(targetDir, "contents.json");
  if (fs.existsSync(targetContents)) {
    return { ok: false, reason: "already-exists", targetDir, detail: targetContents };
  }

  // No artifact folder exists yet for a brand-new explainer, so the lookup
  // runs with only the repo, pack, and core layers (no `artifactDir`).
  const lookup = createLookup({ repoRoot, packs, pluginRoot });
  const profile = lookup.resolve("profiles", kind);
  if (!profile.found) {
    return { ok: false, reason: "profile-not-found", kind };
  }

  const skeletonPath = path.join(profile.path, "skeleton.contents.json");
  if (!fs.existsSync(skeletonPath)) {
    return { ok: false, reason: "no-skeleton", profile, skeletonPath };
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(skeletonPath, targetContents);

  // Write a placeholder pages/<id>.html for every authored page (: "new
  // produces a buildable skeleton") — every page in the skeleton except the
  // two build-generated types, and only when a file isn't already there
  // (never clobber something the operator already wrote).
  let skeleton;
  try {
    skeleton = JSON.parse(fs.readFileSync(skeletonPath, "utf8"));
  } catch {
    skeleton = null;
  }
  const pages = Array.isArray(skeleton?.pages) ? skeleton.pages : [];
  if (pages.length > 0) {
    const purposes = loadPageTypePurposes(profile.path);
    const pagesDir = path.join(targetDir, "pages");
    for (const page of pages) {
      if (!page || typeof page.id !== "string") continue;
      if (GENERATED_PAGE_TYPES.has(page.type)) continue;
      const pageFile = path.join(pagesDir, `${page.id}.html`);
      if (fs.existsSync(pageFile)) continue;
      fs.mkdirSync(pagesDir, { recursive: true });
      fs.writeFileSync(pageFile, placeholderPageHtml(page, purposes));
    }
  }

  return { ok: true, targetDir, targetContents, profile };
}
