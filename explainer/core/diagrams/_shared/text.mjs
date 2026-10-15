// Shared text layout for core diagram generators (
// ). No browser is available at build time, so there is
// no real text measurement API; instead this carries a fixed per-character
// width table approximating the shell's system font stack (core/shell/
// shell.css: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica,
// Arial, sans-serif`) at a given font-size, plus a safety margin. It never
// claims pixel-perfect measurement — it only has to run wide enough that
// `browser.svg-overflow` (the real backstop, once lands) never
// finds overflow this module could have caught first.
//
// Every generator lays text out with an explicit width budget per node.
// Over-budget text wraps to more lines; a single word wider than the budget
// gets one more chance before giving up — it may break at an identifier
// boundary (immediately after `_`/`-`/`.`/`/`, or at a camelCase hump —
// #2, `splitIdentifierChunks` below), the same way a long
// snake_case/camelCase/path token wraps in a code editor. If it still can't
// fit — no such boundary, a boundary chunk still too wide alone, or more
// lines than the node allows either way — `render` must throw a build error
// naming the node. Never silent overflow.

// Character-width classes, in em (fraction of font-size). Deliberately
// coarse — a handful of named exceptions plus a same-shape fallback — since
// a tighter table buys nothing without a real renderer to validate it against.
const NARROW = ".,:;'`^!|iIl";
const PUNCT = "()[]{}/\\-+=<>*\"";
const WIDE = "mMW@%";
const DIGITS = "0123456789";
const SPACE = " \t\n";

function baseEm(ch) {
  if (SPACE.includes(ch)) return 0.28;
  if (NARROW.includes(ch)) return 0.26;
  if (PUNCT.includes(ch)) return 0.4;
  if (WIDE.includes(ch)) return 0.82;
  if (DIGITS.includes(ch)) return 0.56;
  if (ch >= "A" && ch <= "Z") return 0.66;
  if (ch >= "a" && ch <= "z") return 0.52;
  return 0.56; // other punctuation/unicode: an average-width guess
}

// A "plus a margin" rule: a 10% safety margin on every character, so this
// table errs toward *over*-estimating width (more wrapping than a real
// renderer would need) rather than under-estimating it (silent overflow).
export const SAFETY_MARGIN = 1.1;

/** Estimated width (px) of one character at `fontSize` (px), margin included. */
export function charWidth(ch, fontSize) {
  return baseEm(ch) * fontSize * SAFETY_MARGIN;
}

/** Estimated width (px) of `text` at `fontSize` (px), margin included. */
export function measure(text, fontSize) {
  let width = 0;
  for (const ch of String(text)) width += charWidth(ch, fontSize);
  return width;
}

export class DiagramTextError extends Error {}

// Characters after which a plain-text identifier may be cut with no added
// hyphen or space — snake_case/kebab-case/dotted/path separators. The
// character itself stays with the chunk that precedes the break (so
// "test_jira_status_map" can cut after any "_", never before one).
const IDENT_BREAK_CHARS = new Set(["_", "-", ".", "/"]);

/**
 * Splits one "word" (already known to contain no whitespace) into pieces at
 * identifier boundaries — #2's last-resort break, tried by
 * `wrapToBudget` only once a whole word has already failed to fit its
 * budget. Two boundary kinds, both zero-width (no character added or
 * removed):
 *   - immediately after `_`, `-`, `.`, or `/`;
 *   - at a camelCase hump: a lowercase letter or digit immediately followed
 *     by an uppercase one (break falls *before* the uppercase letter).
 * Returns `[word]` unchanged (a single-element array) when there's no
 * boundary at all — callers treat that as "cannot be broken further."
 */
export function splitIdentifierChunks(word) {
  const chunks = [];
  let start = 0;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (IDENT_BREAK_CHARS.has(ch)) {
      chunks.push(word.slice(start, i + 1));
      start = i + 1;
      continue;
    }
    if (i > 0 && /[a-z0-9]/.test(word[i - 1]) && /[A-Z]/.test(ch)) {
      chunks.push(word.slice(start, i));
      start = i;
    }
  }
  chunks.push(word.slice(start));
  return chunks.filter((c) => c.length > 0);
}

/**
 * Greedily word-wraps `text` to a `maxWidth` px budget at `fontSize`,
 * returning an array of line strings (length >= 1, even for an empty
 * input). Throws `DiagramTextError`, naming `label` (identifying the node
 * being laid out, for the build error requires), when:
 *   - one word alone is wider than `maxWidth` and has no identifier-boundary
 *     break point at all (`splitIdentifierChunks` returns it unchanged), or
 *     one of its boundary chunks is *still* too wide even alone, or
 *   - the wrapped result needs more lines than `maxLines` allows.
 *
 * A word that fits after breaking at its identifier boundaries (
 * #2) renders across as many lines as the greedy pack needs, with no space
 * or added character between adjoining chunks of the same original word —
 * only between the word and whatever came before/after it.
 *
 * @param {string} text
 * @param {object} opts
 * @param {number} opts.maxWidth - width budget in px
 * @param {number} [opts.fontSize=13] - matches .ex-t by default
 * @param {number} [opts.maxLines=3]
 * @param {string} [opts.label] - node description for the thrown error
 */
export function wrapToBudget(text, { maxWidth, fontSize = 13, maxLines = 3, label } = {}) {
  if (!(maxWidth > 0)) throw new DiagramTextError(`${label ? `${label}: ` : ""}width budget must be > 0, got ${maxWidth}`);

  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let current = "";

  // Tries to append `piece` to the line in progress — with a separating
  // space unless `glue` is set (same original word's next chunk, no space)
  // or the line is currently empty (nothing to separate from). Mutates
  // `current` and returns true on success; leaves `current` untouched and
  // returns false when it doesn't fit, so the caller can start a new line.
  function tryAppend(piece, glue) {
    const candidate = current === "" ? piece : glue ? current + piece : `${current} ${piece}`;
    if (measure(candidate, fontSize) <= maxWidth) {
      current = candidate;
      return true;
    }
    return false;
  }

  for (const word of words) {
    const wordWidth = measure(word, fontSize);
    if (wordWidth <= maxWidth) {
      if (!tryAppend(word, false)) {
        lines.push(current);
        current = word;
      }
      continue;
    }

    // The word alone is wider than the budget — before giving up, try
    // breaking it at identifier boundaries.
    const chunks = splitIdentifierChunks(word);
    if (chunks.length < 2) {
      throw new DiagramTextError(
        `${label ? `${label}: ` : ""}word "${word}" alone (~${Math.ceil(wordWidth)}px) does not fit in a ${Math.round(maxWidth)}px width budget`
      );
    }

    chunks.forEach((chunk, i) => {
      const chunkWidth = measure(chunk, fontSize);
      if (chunkWidth > maxWidth) {
        throw new DiagramTextError(
          `${label ? `${label}: ` : ""}word "${word}" alone (~${Math.ceil(wordWidth)}px) does not fit in a ${Math.round(maxWidth)}px width budget, ` +
            `and it has no break point that fits either ("${chunk}" alone is ~${Math.ceil(chunkWidth)}px)`
        );
      }
      if (!tryAppend(chunk, i > 0)) {
        if (current) lines.push(current);
        current = chunk;
      }
    });
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    throw new DiagramTextError(
      `${label ? `${label}: ` : ""}label needs ${lines.length} lines to fit a ${Math.round(maxWidth)}px width budget, ` +
        `exceeding the max of ${maxLines}: "${text}"`
    );
  }
  return lines;
}
