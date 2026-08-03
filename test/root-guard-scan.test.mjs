import { test } from "node:test";
import assert from "node:assert/strict";

import { scanCommand, findGitInvocations } from "../pdlc/hooks/shell-scan.mjs";

// Convenience: the token VALUES of a single-segment successful scan.
function tokens(command) {
  const r = scanCommand(command);
  assert.ok(r.ok, `expected ok scan for: ${JSON.stringify(command)}`);
  assert.equal(r.segments.length, 1, "expected exactly one segment");
  return r.segments[0].map((t) => t.value);
}

// The whole field-failure string, with REAL newlines (a blank line) and the
// `(1M context)` paren — the two hazards that tripped the defective parser.
const FIELD_FAILURE_MSG =
  "TASK-101: card the decision\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>";
const FIELD_FAILURE_CMD = `git commit -m "${FIELD_FAILURE_MSG}"`;

// --- the field failure: the case this whole task exists to fix ---

test("verbatim field-failure trailer tokenizes to exactly four tokens, message as ONE", () => {
  // This is THE regression pin: newline + `)` inside a double-quoted -m value
  // must stay one token, not shatter into bare words read as pathspecs.
  assert.deepEqual(tokens(FIELD_FAILURE_CMD), [
    "git",
    "commit",
    "-m",
    FIELD_FAILURE_MSG,
  ]);
});

test("field-failure command yields exactly one command-position git invocation", () => {
  const r = findGitInvocations(FIELD_FAILURE_CMD);
  assert.ok(r.ok);
  assert.equal(r.invocations.length, 1);
  assert.equal(r.invocations[0].tokens[0], "git");
  assert.equal(r.invocations[0].tokens[3], FIELD_FAILURE_MSG);
});

// --- quoted separators: a separator inside quotes is NOT a boundary ---

for (const sep of [";", "|", "&", "\n", "`", ")", "("]) {
  test(`separator ${JSON.stringify(sep)} inside a double-quoted value does not split`, () => {
    const msg = `before${sep}after`;
    assert.deepEqual(tokens(`git commit -m "${msg}"`), ["git", "commit", "-m", msg]);
  });
  test(`separator ${JSON.stringify(sep)} inside a single-quoted value does not split`, () => {
    const msg = `before${sep}after`;
    assert.deepEqual(tokens(`git commit -m '${msg}'`), ["git", "commit", "-m", msg]);
  });
}

test("an UNQUOTED separator does split the segment", () => {
  const r = scanCommand("git log ; git status");
  assert.ok(r.ok);
  assert.equal(r.segments.length, 2);
  assert.deepEqual(r.segments[0].map((t) => t.value), ["git", "log"]);
  assert.deepEqual(r.segments[1].map((t) => t.value), ["git", "status"]);
});

// --- token accumulation: quoted run joins the current token ---

test("`-m \"a b\"` is two tokens, not three (quoted whitespace accumulates)", () => {
  assert.deepEqual(tokens(`git commit -m "a b"`), ["git", "commit", "-m", "a b"]);
});

test("adjacent quoted + bare runs concatenate into one token", () => {
  // pre"quoted middle"post  =>  prequoted middlepost
  assert.deepEqual(tokens(`git x pre"quoted middle"post`), [
    "git",
    "x",
    "prequoted middlepost",
  ]);
});

test("an empty quoted string is a real (empty) token", () => {
  assert.deepEqual(tokens(`git commit -m ""`), ["git", "commit", "-m", ""]);
});

// --- nested and escaped quotes ---

test("single quotes inside double quotes are literal (nesting)", () => {
  assert.deepEqual(tokens(`git commit -m "a 'b' c"`), ["git", "commit", "-m", "a 'b' c"]);
});

test("double quotes inside single quotes are literal (nesting)", () => {
  assert.deepEqual(tokens(`git commit -m 'say "hi" now'`), [
    "git",
    "commit",
    "-m",
    'say "hi" now',
  ]);
});

test("escaped double-quote inside double quotes does not close the quote", () => {
  assert.deepEqual(tokens(`git commit -m "say \\"hi\\""`), ["git", "commit", "-m", 'say "hi"']);
});

test("the '\\'' idiom yields one token with an embedded apostrophe", () => {
  // 'it'\''s'  =>  it's   (single-quoted `it`, escaped `'`, single-quoted `s`)
  assert.deepEqual(tokens(`git commit -m 'it'\\''s'`), ["git", "commit", "-m", "it's"]);
});

test("a backslash-escaped separator outside quotes is literal, not a boundary", () => {
  const r = scanCommand(`git commit -m foo\\;bar`);
  assert.ok(r.ok);
  assert.equal(r.segments.length, 1, "escaped `;` must not split the segment");
  assert.deepEqual(r.segments[0].map((t) => t.value), ["git", "commit", "-m", "foo;bar"]);
});

// --- multi-line messages ---

test("a real newline inside a quoted value is literal; unquoted newline splits", () => {
  const multiline = "line one\nline two\nline three";
  assert.deepEqual(tokens(`git commit -m "${multiline}"`), [
    "git",
    "commit",
    "-m",
    multiline,
  ]);

  const chained = "git add backlog/\ngit commit -m x";
  const r = scanCommand(chained);
  assert.ok(r.ok);
  assert.equal(r.segments.length, 2, "an UNQUOTED newline splits into two invocations");
});

// --- unbalanced input => fail closed ---

test("unbalanced double quote fails closed with NO tokens", () => {
  const r = scanCommand(`git commit -m "unterminated`);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unbalanced-double-quote");
  assert.ok(!("segments" in r), "a failed scan returns no token list to be mistaken for pathspecs");
});

test("unbalanced single quote fails closed", () => {
  const r = scanCommand(`git commit -m 'unterminated`);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unbalanced-single-quote");
});

test("a trailing backslash at EOF is resolved (bash drops it), NOT fail-closed", () => {
  // Phase 5 / spec R2a: `foo\` is a VALID, executable bash command (bash drops
  // the trailing backslash ⇒ `foo`). Reporting dangling-escape here made an
  // executable out-of-scope commit fail OPEN, an AC #5 regression.
  const r = scanCommand(`git commit -m foo\\`);
  assert.ok(r.ok, "trailing backslash must scan ok:true, not fail closed");
  assert.deepEqual(r.segments[0].map((t) => t.value), ["git", "commit", "-m", "foo"]);
});

// --- ANSI-C `$'…'` quoting (Phase 5 / spec R2a) ---

test("ANSI-C `$'it\\'s a fix'` (escaped apostrophe) is ONE token `it's a fix`, not fail-closed", () => {
  // THE fail-open case: the escaped `'` is a literal apostrophe that does not
  // close the run; bash parses this as the single word `it's a fix`.
  assert.deepEqual(tokens(`git commit -m $'it\\'s a fix' README.md`), [
    "git",
    "commit",
    "-m",
    "it's a fix",
    "README.md",
  ]);
});

test("ANSI-C `$'…'` interprets \\n \\t \\\\ escapes in the resolved value", () => {
  assert.deepEqual(tokens(`git commit -m $'a\\nb\\tc\\\\d'`), [
    "git",
    "commit",
    "-m",
    "a\nb\tc\\d",
  ]);
});

test("an UNTERMINATED `$'…'` run fails closed (unbalanced)", () => {
  const r = scanCommand(`git commit -m $'unterminated README.md`);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unbalanced-single-quote");
});

// --- locale `$"…"` quoting (Phase 5 / spec R2a) ---

test("locale `$\"…\"` tokenizes as a double-quoted run (the `$` is consumed)", () => {
  assert.deepEqual(tokens(`git commit -m $"hi there" README.md`), [
    "git",
    "commit",
    "-m",
    "hi there",
    "README.md",
  ]);
});

test("separators inside a locale `$\"…\"` run do not split", () => {
  assert.deepEqual(tokens(`git commit -m $"a;b|c"`), ["git", "commit", "-m", "a;b|c"]);
});

test("fail-closed propagates through findGitInvocations (no invocations invented)", () => {
  const r = findGitInvocations(`git commit -m "unterminated`);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unbalanced-double-quote");
  assert.ok(!("invocations" in r));
});

test("non-string input fails closed rather than throwing", () => {
  assert.equal(scanCommand(undefined).ok, false);
  assert.equal(scanCommand(null).ok, false);
});

// --- command-position detection (R5(b)) ---

test("git at command position (start of string) is detected", () => {
  const r = findGitInvocations("git commit -m x");
  assert.ok(r.ok);
  assert.equal(r.invocations.length, 1);
  assert.equal(r.invocations[0].index, 0);
});

for (const [label, cmd] of [
  ["after ;", "ls; git status"],
  ["after &&", "ls && git status"],
  ["after ||", "ls || git status"],
  ["after |", "cat x | git hash-object --stdin"],
  ["after newline", "ls\ngit status"],
  ["after $( subshell", "echo $(git rev-parse HEAD)"],
  ["after ( subshell", "(git status)"],
  ["after backtick", "echo `git rev-parse HEAD`"],
]) {
  test(`git ${label} is detected at command position`, () => {
    const r = findGitInvocations(cmd);
    assert.ok(r.ok);
    assert.equal(r.invocations.length, 1, `expected one git invocation in: ${JSON.stringify(cmd)}`);
    assert.equal(r.invocations[0].tokens[0], "git");
  });
}

test("R5(b): `git` inside a quoted argument is NOT a git invocation", () => {
  // The content false-positive: a backlog CLI call whose ARGUMENT TEXT names
  // git and commit is prose, not a VCS write.
  const cmd = `backlog task edit TASK-1 --notes "the git commit was blocked; retry"`;
  const r = findGitInvocations(cmd);
  assert.ok(r.ok);
  assert.deepEqual(r.invocations, [], "a quoted `git commit` must not be classified as a git invocation");
});

test("R5(b): a `git` that is an option VALUE is not command position", () => {
  // `--author git` — `git` is the value of --author, not first-of-segment.
  const r = findGitInvocations("backlog task edit --author git");
  assert.ok(r.ok);
  assert.deepEqual(r.invocations, []);
});

test("R5(b): the word `git` mid-argument (e.g. a URL/path) is not an invocation", () => {
  const r = findGitInvocations("cd github.com/x && backlog task list");
  assert.ok(r.ok);
  assert.deepEqual(r.invocations, []);
});

test("multiple real git invocations in one chain are each found", () => {
  const r = findGitInvocations("git add backlog/ && git commit -m x; git push");
  assert.ok(r.ok);
  assert.equal(r.invocations.length, 3);
  assert.deepEqual(r.invocations.map((inv) => inv.tokens[1]), ["add", "commit", "push"]);
});

test("git-in-quotes and git-at-command-position coexisting: only the real one is found", () => {
  const cmd = `git commit -m "reverted the git commit from yesterday"`;
  const r = findGitInvocations(cmd);
  assert.ok(r.ok);
  assert.equal(r.invocations.length, 1, "only the leading real invocation, not the quoted mention");
  assert.equal(r.invocations[0].index, 0);
});

// --- index reporting (Phase 3 effective-dir resolution) ---

test("invocation index points at the `git` token in the original string", () => {
  const cmd = "cd .worktrees/x && git status";
  const r = findGitInvocations(cmd);
  assert.ok(r.ok);
  assert.equal(r.invocations.length, 1);
  assert.equal(cmd.slice(r.invocations[0].index, r.invocations[0].index + 3), "git");
});
