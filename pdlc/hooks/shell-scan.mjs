// shell-scan.mjs — single-pass, quote-aware shell-word scanner for the
// root-guard hook (TASK-101 / spec 051, R2 + R5(b)).
//
// This REPLACES the defective two-regex parse in promptworld's
// root-guard-hook.mjs (`parseGitInvocation`): a boundary regex
// `/[;|&\n`)]/` and a tokenizer `/("[^"]*"|'[^']*'|\S+)/g`, both applied to
// the raw command string with NO regard for quote state. A `-m` message that
// contains a newline or a `)` truncated the segment mid-quote; the now
// unterminated `"` never matched `"[^"]*"`, so `\S+` shattered the message
// into bare words that were then read as pathspecs. The default-correct
// `Co-Authored-By: Claude Opus 5 (1M context) <noreply@…>` trailer carries
// BOTH hazards (a blank line and a `)`), so it reliably tripped the gate.
//
// The fix is a real single-pass scanner that tracks single-quote,
// double-quote, and backslash-escape state, so a separator INSIDE a quoted
// run is literal, never a boundary. plan.md rejects a lookbehind / "skip
// quoted runs" patch on the regexes: it passes the obvious tests and fails on
// nesting and escapes. The scanner is the design.
//
// Node >= 18, ESM, zero npm dependencies. Pure functions — no stdin, no fs,
// no process: unit-testable in isolation, which is the whole point of lifting
// the parse out of the hook's stdin contract.
//
// ---------------------------------------------------------------------------
// Separators. A separator is a command boundary ONLY outside quotes:
//
//   ;  |  &  <newline>  `(backtick)  )  (
//
// The first six match the boundary class the defective parser used
// (`[;|&\n`)]`). `(` is added so `$(git …)` / `(git …)` subshell invocations
// are seen at COMMAND POSITION — promptworld's own git-detection regex
// `/(?:^|[;&|`(\n])\s*git(?=\s|$)/` already includes `(`, so this preserves
// its behavior rather than widening policy. An unquoted `(` in a legitimate
// git command outside a subshell is effectively never seen (globs/paths are
// quoted), so treating it as a boundary is safe and strictly more correct for
// substitutions.
const SEPARATORS = new Set([';', '|', '&', '\n', '`', ')', '(']);

// In double quotes, a backslash escapes only these (POSIX); before anything
// else the backslash is a literal character.
const DQ_ESCAPABLE = new Set(['"', '\\', '$', '`', '\n']);

/**
 * Single-pass quote-state scanner. Splits `command` into segments — maximal
 * runs of tokens uninterrupted by an unquoted separator — with full
 * single-quote, double-quote and backslash-escape tracking.
 *
 * Token rules:
 *   - Unquoted whitespace ends the current token (but not the segment).
 *   - A quoted run accumulates into the CURRENT token: `-m "a b"` is two
 *     tokens (`-m`, `a b`), never three. `'it'\''s'` is one token (`it's`).
 *   - Separators inside any quote are literal; outside quotes they end the
 *     token AND the segment (the next token is then at command position).
 *
 * FAIL-CLOSED contract: an UNBALANCED quote or a DANGLING backslash makes the
 * command unparseable. The scanner then returns `{ ok: false, reason }` and
 * NO tokens — never a partial/shattered token list. An unparseable command is
 * not an allowed command: a caller cannot mistake shredded words for
 * pathspecs (the exact original defect), because there are no words to
 * mistake. It never throws.
 *
 * @param {string} command
 * @returns {{ok: true, segments: Array<Array<{value: string, index: number}>>}
 *          | {ok: false, reason: 'unbalanced-single-quote'
 *                              | 'unbalanced-double-quote'
 *                              | 'dangling-escape'}}
 *   On success, `segments[i]` is that segment's tokens in order; each token
 *   carries its `value` (quotes/escapes resolved) and the `index` (char
 *   offset in `command`) where the token began — Phase 3 needs the index to
 *   resolve each invocation's effective dir (`cd`/`-C` before it).
 */
export function scanCommand(command) {
  if (typeof command !== 'string') return { ok: false, reason: 'dangling-escape' };

  const segments = [];
  let segment = [];

  let cur = '';
  let tokenOpen = false; // a token is being built (may be empty, e.g. "")
  let tokenIndex = -1; // char offset where the current token began

  let inSingle = false;
  let inDouble = false;

  const openToken = (i) => {
    if (!tokenOpen) {
      tokenOpen = true;
      tokenIndex = i;
    }
  };
  const endToken = () => {
    if (tokenOpen) {
      segment.push({ value: cur, index: tokenIndex });
      cur = '';
      tokenOpen = false;
      tokenIndex = -1;
    }
  };
  const endSegment = () => {
    endToken();
    segments.push(segment);
    segment = [];
  };

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];

    if (inSingle) {
      // Inside single quotes NOTHING is special except the closing quote —
      // backslashes and separators are all literal.
      if (ch === "'") inSingle = false;
      else cur += ch;
      continue;
    }

    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else if (ch === '\\') {
        const next = command[i + 1];
        if (next !== undefined && DQ_ESCAPABLE.has(next)) {
          cur += next;
          i++;
        } else {
          cur += ch; // literal backslash
        }
      } else {
        cur += ch; // separators, spaces, newlines: all literal in double quotes
      }
      continue;
    }

    // --- outside all quotes ---

    if (ch === '\\') {
      // Backslash escapes the next char literally (including a quote, space,
      // or separator). A trailing backslash is a dangling escape => fail
      // closed.
      const next = command[i + 1];
      if (next === undefined) return { ok: false, reason: 'dangling-escape' };
      openToken(i);
      cur += next;
      i++;
      continue;
    }

    if (ch === "'") {
      openToken(i);
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      openToken(i);
      inDouble = true;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\r') {
      endToken(); // whitespace ends a token, not a segment
      continue;
    }

    if (SEPARATORS.has(ch)) {
      endSegment(); // unquoted separator ends token AND segment
      continue;
    }

    openToken(i);
    cur += ch;
  }

  if (inSingle) return { ok: false, reason: 'unbalanced-single-quote' };
  if (inDouble) return { ok: false, reason: 'unbalanced-double-quote' };

  endSegment();
  return { ok: true, segments };
}

/**
 * Command-position `git` invocations in `command`.
 *
 * A `git` token qualifies ONLY as the FIRST token of its segment — i.e. at
 * the start of the command or immediately after an unquoted separator /
 * pipeline operator (`;`, `&&`, `||`, `|`, newline, backtick, `$(` …). This
 * is what kills R5(b), the content false-positive: a `git` that lives inside
 * a quoted argument becomes part of one quoted token (never its own token),
 * and a `git` that is an option value is not first-of-segment — so prose like
 * `backlog task edit "… git commit …"` is NOT classified as a git invocation.
 *
 * Fail-closed propagates: if the command does not parse, this returns the
 * scanner's `{ ok: false, reason }` unchanged (no invocations invented from a
 * broken parse).
 *
 * @param {string} command
 * @returns {{ok: true, invocations: Array<{index: number, tokens: string[]}>}
 *          | {ok: false, reason: string}}
 *   Each invocation's `tokens` is the whole segment's token VALUES with
 *   `tokens[0] === 'git'`; `index` is the char offset of that `git` token
 *   (for effective-dir resolution in Phase 3).
 */
export function findGitInvocations(command) {
  const scan = scanCommand(command);
  if (!scan.ok) return scan;

  const invocations = [];
  for (const segment of scan.segments) {
    if (segment.length > 0 && segment[0].value === 'git') {
      invocations.push({
        index: segment[0].index,
        tokens: segment.map((t) => t.value),
      });
    }
  }
  return { ok: true, invocations };
}
