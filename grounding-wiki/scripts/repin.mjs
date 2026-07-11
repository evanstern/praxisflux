#!/usr/bin/env node
// repin.mjs — the ONE writer in the wiki-plan loop: set a corpus note's verified_against pin.
//
//   node repin.mjs <note-path> <full-commit-hash>
//
// Emitted by `gates/cli.mjs plan` for RE-PIN-ONLY notes (gates stay read-only; this script
// is the wiki analogue of the backlog CLI in spec-bridge's plan loop). A pin is a
// verification claim, so this refuses anything but a full 40-char hash and an existing note
// with a verified_against line — no silent creation, no short hashes that could be typos.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { runAsCli } from "../lib/cli.mjs";

/** Set the note's verified_against to `hash`. Returns the old pin. Throws on anything odd. */
export function repin(notePath, hash) {
  if (!/^[0-9a-f]{40}$/.test(hash)) throw new Error(`not a full 40-char commit hash: ${hash}`);
  if (!existsSync(notePath)) throw new Error(`no such note: ${notePath}`);
  const text = readFileSync(notePath, "utf8");
  const m = text.match(/^verified_against:\s*(\S+)\s*$/m);
  if (!m) throw new Error(`${notePath} has no verified_against line to update`);
  writeFileSync(notePath, text.replace(/^verified_against:.*$/m, `verified_against: ${hash}`));
  return m[1];
}

if (runAsCli(import.meta.url)) {
  const [notePath, hash] = process.argv.slice(2);
  if (!notePath || !hash) { console.error("usage: repin.mjs <note-path> <full-commit-hash>"); process.exit(2); }
  try {
    const old = repin(notePath, hash);
    console.log(`${notePath}: ${old.slice(0, 12)} → ${hash.slice(0, 12)}`);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
