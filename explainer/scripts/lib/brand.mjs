// Brand file validation.
//
//   validateBrand  — used by lib/build.mjs and lib/check.mjs: a brand file
//                     missing any --ex-* token from core/brand/tokens.json is
//                     an error that lists every missing token.
//
// Brand files are hand-authored CSS with literal values only (see
// core/brand/neutral.css). A project adds its own brand by dropping
// brand/<id>.css into a higher lookup layer.
//
// Node built-ins only.

import fs from "node:fs";
import path from "node:path";

/** Reads core/brand/tokens.json and returns the ordered list of --ex-* token names. */
export function loadTokenNames(pluginRoot) {
  const tokensPath = path.join(pluginRoot, "core", "brand", "tokens.json");
  const doc = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
  return doc.tokens.map((t) => t.name);
}

/**
 * True when every name in `tokenNames` is declared in `cssText` (a
 * `<name>:` custom-property declaration appears somewhere in the text — a
 * textual contract check, not a full CSS parse, matching this codebase's
 * other lint-style checks). Returns `{ ok, missing }`; `missing` lists every
 * token the brand file does not define, in tokens.json order (: "error
 * lists missing tokens").
 */
export function validateBrand(cssText, tokenNames) {
  const missing = tokenNames.filter((name) => !new RegExp(`${name}\\s*:`).test(cssText));
  return { ok: missing.length === 0, missing };
}
