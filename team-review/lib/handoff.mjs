// handoff.mjs — the shared inter-plugin handoff TRANSPORT (envelope + lifecycle, not semantics).
//
// One plugin hands work to another through files, but those messages are transient plumbing —
// they must NOT clutter git. So payloads live in a gitignored `.handoff/` at the project root;
// the durable EVIDENCE that a handoff happened is the consumer's job to record in its own tracked
// state (e.g. progress.json). The chassis moves opaque payloads and never touches a plugin's ledger.
//
// The payload SCHEMA is per plugin pair (educate→build sends a SPEC; build→educate returns
// findings). This module only knows the envelope: id, kind (request|response), from, to, ref.

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { ensureGitignore } from "./installer.mjs";
import { parseFrontmatter } from "./markdown.mjs";

export const HANDOFF_DIR = ".handoff";

export function handoffDir(root) { return join(root, HANDOFF_DIR); }

/** Ensure `.handoff/` exists and is gitignored (so it never shows in `git status`). */
export function ensureHandoffDir(root) {
  const dir = handoffDir(root);
  mkdirSync(dir, { recursive: true });
  ensureGitignore(root, HANDOFF_DIR + "/");
  return dir;
}

/**
 * Write a handoff. Envelope fields are frontmatter; `body` is the opaque, plugin-defined payload.
 *   kind: "request" (e.g. a SPEC) | "response" (e.g. findings)
 *   ref:  correlation id tying a response back to its request
 * Returns the file path.
 */
export function writeHandoff(root, { id, kind, from, to, ref = "", title = "", body = "" }) {
  if (!id || !kind || !from || !to) throw new Error("handoff requires id, kind, from, to");
  const dir = ensureHandoffDir(root);
  const fm = [`id: ${id}`, `kind: ${kind}`, `from: ${from}`, `to: ${to}`, `ref: ${ref}`, `title: ${title}`].join("\n");
  const path = join(dir, `${id}.md`);
  writeFileSync(path, `---\n${fm}\n---\n${body}\n`);
  return path;
}

/** Read a handoff → { envelope, body, path } or null if absent. */
export function readHandoff(root, id) {
  const path = join(handoffDir(root), `${id}.md`);
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf8");
  const envelope = parseFrontmatter(text) || {};
  const body = text.replace(/^---[\s\S]*?\n---\s*\n?/, "");
  return { envelope, body, path };
}

/** List pending (unconsumed) handoffs, optionally filtered by envelope fields, e.g. {to, kind, ref}. */
export function listHandoffs(root, filter = {}) {
  const dir = handoffDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readHandoff(root, f.replace(/\.md$/, "")))
    .filter((h) => h && Object.entries(filter).every(([k, v]) => h.envelope[k] === v));
}

/**
 * Consume a handoff: move it into `.handoff/consumed/` so it stops appearing as pending. The
 * durable record ("this handoff happened, here's what it changed") is the CONSUMER's job to write
 * into its own tracked state — the chassis never edits a plugin's ledger. Returns false if absent.
 */
export function markConsumed(root, id) {
  const src = join(handoffDir(root), `${id}.md`);
  if (!existsSync(src)) return false;
  const cdir = join(handoffDir(root), "consumed");
  mkdirSync(cdir, { recursive: true });
  renameSync(src, join(cdir, `${id}.md`));
  return true;
}
