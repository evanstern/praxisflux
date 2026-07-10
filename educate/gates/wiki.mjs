// wiki.mjs — educate's corpus-index derivation: the READ-ONLY logic behind WIKI.md.
//
// Convention (see docs/skill-patterns.md): gates/ derives + verifies but never writes; the mutating
// CLI (scripts/wiki.mjs) imports from here and owns the disk writes. Built on the lib/ chassis.
//
// A learning topic accumulates several isolated research vaults (`.research-vault` roots): one
// series-scope vault at topics/<topic>/research/ and one per lesson at
// topics/<topic>/<NNN>-lesson/research/. Each vault has its own Home.md trunk. Nothing ties a
// topic's vaults together, so the corpus isn't navigable as one body of knowledge. This module
// DERIVES a roll-up:
//   - topics/<topic>/WIKI.md  — one row per vault in the topic (links its Home.md, lists its wikis)
//   - topics/WIKI.md          — one row per topic (links its WIKI.md)
//
// Isolation is preserved on purpose: WIKI.md uses plain relative Markdown links, NEVER
// [[wikilinks]] — wikilinks can't cross vault boundaries and would merge the corpora in Obsidian's
// graph. The roll-up is navigation only, so topics never bleed into each other.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { findRootsDownwards, hasChild } from "../lib/project-root.mjs";
import { parseFrontmatter, extractWikilinks } from "../lib/markdown.mjs";
import { today } from "../lib/dates.mjs";

// A folder is a research vault iff it holds this sentinel (see research plugin / skill-patterns.md).
export const RESEARCH_VAULT_SENTINEL = ".research-vault";
export const VAULT_TRUNK = "Home.md"; // the research vault's MOC/trunk, produced by the research plugin

const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
const isSep = (row) => row.every((c) => /^:?-{2,}:?$/.test(c));

/**
 * Parse the `## Wikis` table of a vault Home.md into [{ topic, about }] rows. Tolerant of header
 * and separator rows; the topic cell is the wikilink target (or bare text if unlinked).
 */
export function parseWikisTable(text) {
  if (!text) return [];
  const out = [];
  let inSection = false;
  for (const line of text.split("\n")) {
    if (/^#{1,6}\s+/.test(line)) { inSection = /^#{1,6}\s+wikis\b/i.test(line); continue; }
    if (!inSection) continue;
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    if (isSep(cells)) continue;
    if (/^topic$/i.test(cells[0]) && /^about$/i.test(cells[1])) continue; // header
    const wl = extractWikilinks(cells[0]);
    const topic = wl.length ? wl[0] : cells[0].replace(/\[\[|\]\]/g, "").trim();
    if (topic) out.push({ topic, about: cells[1] });
  }
  return out;
}

/** Read a vault's Home.md trunk. Returns { homePath, title, updated, wikis } or null if absent. */
export function readVaultHome(vaultDir) {
  const homePath = join(vaultDir, VAULT_TRUNK);
  const raw = read(homePath);
  if (raw == null) return null;
  const fm = parseFrontmatter(raw) || {};
  return { homePath, title: fm.title || "Home", updated: fm.updated || "", wikis: parseWikisTable(raw) };
}

/**
 * Every research vault under a topic, tagged with its scope: "series" for the topic-root
 * vault, else the lesson id (the folder between the topic and the vault). Sorted series-first,
 * then by relative path.
 */
export function topicVaults(topicDir) {
  return findRootsDownwards(topicDir, hasChild(RESEARCH_VAULT_SENTINEL))
    .map((vaultDir) => {
      const rel = relative(topicDir, vaultDir);
      const parts = rel.split(sep);
      const scope = parts.length === 1 ? "series" : parts[0];
      return { vaultDir, rel, scope };
    })
    .sort((a, b) => (a.scope === "series" ? -1 : b.scope === "series" ? 1 : a.rel.localeCompare(b.rel)));
}

// A cell rendered for a table (escape pipes; join multi-line with <br>).
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();

/**
 * The Wikis cell for one vault: each wiki as `Name — about`, deep-linking Name to its MOC
 * (`<vault>/<Wiki>/<Wiki>.md`) with a plain relative Markdown link when that file exists.
 * `linkBase` is the vault path relative to the WIKI.md being written.
 */
function wikisCell(topicDir, vaultRel, linkBase, wikis) {
  if (!wikis.length) return "_(empty)_";
  return wikis.map(({ topic, about }) => {
    const mocDisk = join(topicDir, vaultRel, topic, `${topic}.md`);
    const label = cell(topic);
    const name = existsSync(mocDisk) ? `[${label}](${[linkBase, topic, `${topic}.md`].join("/")})` : label;
    return about ? `${name} — ${cell(about)}` : name;
  }).join("<br>");
}

/** Render the content for topics/<topic>/WIKI.md (deterministic except the `updated:` date). */
export function renderTopicWiki(topicDir, topic, { date = today() } = {}) {
  const vaults = topicVaults(topicDir);
  const rows = vaults.map(({ rel, scope }) => {
    const home = readVaultHome(join(topicDir, rel)) || { wikis: [] };
    const homeLink = `[${cell(rel)}/Home.md](${[rel, VAULT_TRUNK].join("/")})`;
    return `| ${cell(scope)} | ${homeLink} | ${wikisCell(topicDir, rel, rel, home.wikis)} |`;
  });
  const body = rows.length
    ? ["| Scope | Vault | Wikis |", "| ----- | ----- | ----- |", ...rows].join("\n")
    : "_No research vaults under this topic yet. Ground a lesson or the series to populate this index._";
  return `---
title: ${topic} — corpus index
type: wiki
updated: ${date}
---

# ${topic} — corpus wiki

Index of every research vault under this topic. Each row is one **vault** (a self-contained
\`${RESEARCH_VAULT_SENTINEL}\`); it links to that vault's \`Home.md\` trunk and lists the wikis inside
it. This is a **navigation index only** — vault branches never cross-link, so the corpora stay
isolated and no topic bleeds into another. Derived from disk; regenerate with
\`wiki.mjs --root <project> ${topic} --sync\` and do not hand-edit.

## Vaults

${body}
`;
}

/** Topic dir names under topicsDir that could hold a corpus (skip . / _ prefixed scaffolding). */
export function topicDirs(topicsDir) {
  let entries = [];
  try { entries = readdirSync(topicsDir); } catch { return []; }
  return entries
    .filter((d) => !d.startsWith(".") && !d.startsWith("_") && statSync(join(topicsDir, d)).isDirectory())
    .sort();
}

/** Render the content for topics/WIKI.md — one row per topic that has at least one vault. */
export function renderProjectWiki(topicsDir, { date = today() } = {}) {
  const rows = [];
  for (const topic of topicDirs(topicsDir)) {
    const n = topicVaults(join(topicsDir, topic)).length;
    if (!n) continue;
    rows.push(`| ${cell(topic)} | ${n} | [${cell(topic)}/WIKI.md](${[topic, "WIKI.md"].join("/")}) |`);
  }
  const body = rows.length
    ? ["| Topic | Vaults | Corpus |", "| ----- | ------ | ------ |", ...rows].join("\n")
    : "_No topics with research vaults yet._";
  return `---
title: Learning corpus — topics index
type: wiki
updated: ${date}
---

# Learning corpus — topics index

One row per learning topic that has research. Each topic is a **self-contained corpus**; follow
its \`WIKI.md\` for the vaults and wikis inside it. Topics never cross-link — this page is
navigation only, so no corpus bleeds into another. Derived from disk; regenerate with
\`wiki.mjs --all --sync\` and do not hand-edit.

## Topics

${body}
`;
}

// Compare ignoring the volatile `updated:` line, so a same-content regen is not "stale".
const normalize = (s) => (s || "").replace(/^updated:.*$/m, "updated:").trim();

/** Is `expected` content materially different from what's on disk at `path`? (Missing ⇒ stale.) */
export function isStale(path, expected) {
  const current = read(path);
  if (current == null) return true;
  return normalize(current) !== normalize(expected);
}

/**
 * Non-blocking staleness notices for a project root: which WIKI.md files are out of date.
 * Read-only — used by the Stop hook as a warning (never blocks; freshness is the tracker's job).
 */
export function wikiStalenessWarnings(root) {
  const topicsDir = join(root, "topics");
  if (!existsSync(topicsDir)) return [];
  const warns = [];
  let anyVaults = false;
  for (const topic of topicDirs(topicsDir)) {
    const topicDir = join(topicsDir, topic);
    if (!topicVaults(topicDir).length) continue;
    anyVaults = true;
    if (isStale(join(topicDir, "WIKI.md"), renderTopicWiki(topicDir, topic))) {
      warns.push(`[${topic}] WIKI.md is out of date — run: node <educate>/scripts/wiki.mjs --root ${root} ${topic} --sync`);
    }
  }
  if (anyVaults && isStale(join(topicsDir, "WIKI.md"), renderProjectWiki(topicsDir))) {
    warns.push(`topics/WIKI.md is out of date — run: node <educate>/scripts/wiki.mjs --root ${root} --all --sync`);
  }
  return warns;
}
