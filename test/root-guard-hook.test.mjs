// root-guard-hook.test.mjs — the both-directions hazard suite (spec 051 R4 /
// board card AC #5), plus R5(a)/R5(b) at the hook level, the heredoc allow/block
// pair, the enumerated deny cases, and the fail-open invariant (spec R2
// reconciliation) driven end-to-end through the real stdin contract.
//
// AC #5 is load-bearing: a suite that only proves the false positives are gone
// proves nothing except that the gate got looser. Every hazard row asserts BOTH
// directions — the board-sync commit carrying the hazard is ALLOWED, and the
// genuinely out-of-scope commit carrying the SAME hazard is STILL BLOCKED.
//
// The scanner/policy internals have their own unit tests (root-guard-scan.test.mjs
// and the exported classifiers). This file exercises the shipped hook the way the
// harness does: spawn `node root-guard-hook.mjs pre-bash`, feed hook-input JSON on
// stdin, read the exit code (2 = block, 0 = allow).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { scanCommand, findGitInvocations } from "../pdlc/hooks/shell-scan.mjs";

const HOOK = fileURLToPath(new URL("../pdlc/hooks/root-guard-hook.mjs", import.meta.url));
const GID = ["-c", "user.email=t@t", "-c", "user.name=t"];
const git = (cwd, ...a) => execFileSync("git", [...GID, ...a], { cwd, encoding: "utf8" });

// A single hazard char is always safest to embed via a wrapper quote that cannot
// itself be the hazard: single-quote everything, EXCEPT the apostrophe hazard
// which is wrapped in double quotes. Both wrappers make the hazard literal, so
// the -m message is exactly one token regardless of what the hazard is.
const BT = String.fromCharCode(96); // backtick, kept out of JS template literals
function wrapMsg(ch) {
  const body = "before" + ch + "after";
  return ch === "'" ? '"' + body + '"' : "'" + body + "'";
}

// ---------------------------------------------------------------------------
// Scratch environment: a root repo with backlog/, a worktree under .worktrees/,
// and a separate "other" repo (for R5(a) cross-repo jurisdiction).
function mkEnv() {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "rg-hook-")));
  const root = join(base, "root");
  mkdirSync(root);
  git(root, "init", "-q", "-b", "main");
  mkdirSync(join(root, "backlog"));
  writeFileSync(join(root, "backlog", "card.md"), "card\n");
  writeFileSync(join(root, "README.md"), "readme\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "init");
  const worktree = join(root, ".worktrees", "task-9");
  git(root, "worktree", "add", "-q", "-b", "task-9", worktree, "HEAD");
  const other = join(base, "other");
  mkdirSync(other);
  git(other, "init", "-q", "-b", "main");
  writeFileSync(join(other, "f.txt"), "x\n");
  git(other, "add", ".");
  git(other, "commit", "-qm", "init");
  return { base, root, worktree, other, done: () => rmSync(base, { recursive: true, force: true }) };
}

// Stage ONLY the given repo-relative paths (index cleared first). Each path is
// re-touched so there is a staged change to commit.
function stageOnly(repo, ...paths) {
  git(repo, "reset", "-q");
  for (const p of paths) {
    writeFileSync(join(repo, p), "touched " + Date.now() + "\n");
    git(repo, "add", p);
  }
}

function drive(command, { cwd, projectDir }) {
  const r = spawnSync("node", [HOOK, "pre-bash"], {
    input: JSON.stringify({ tool_input: { command }, cwd }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    encoding: "utf8",
  });
  return r.status === 2 ? "BLOCK" : "ALLOW";
}

function bashParse(command) {
  // `bash -n` = parse only, never executes. Exit 0 ⇒ bash would run it.
  return spawnSync("bash", ["-n"], { input: command, encoding: "utf8" }).status === 0
    ? "VALID"
    : "INVALID";
}

// The verbatim field-failure trailer — the exact string that tripped the gate.
const FIELD_MSG =
  "TASK-101: card the decision\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>";

// ===========================================================================
// R4 / AC #5 — the both-directions hazard table.
// ===========================================================================

const HAZARDS = [
  ["newline", "\n"],
  ["close-paren", ")"],
  ["single-quote", "'"],
  ["double-quote", '"'],
  ["semicolon", ";"],
  ["pipe", "|"],
  ["backtick", BT],
];

for (const [name, ch] of HAZARDS) {
  test(`hazard ${name}: board-sync commit carrying it is ALLOWED`, () => {
    const env = mkEnv();
    try {
      const cmd = `git commit -m ${wrapMsg(ch)} backlog/card.md`;
      assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
    } finally {
      env.done();
    }
  });

  test(`hazard ${name}: out-of-scope commit carrying it is STILL BLOCKED`, () => {
    const env = mkEnv();
    try {
      const cmd = `git commit -m ${wrapMsg(ch)} README.md`;
      assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "BLOCK");
    } finally {
      env.done();
    }
  });
}

// The verbatim Co-Authored-By trailer as its OWN named case — the field failure.
// It carries BOTH a newline and a `)` at once, and must commit at root with NO
// workaround (no -F <file>, no -C <repo>).
test("field-failure: verbatim Co-Authored-By trailer, backlog pathspec, ALLOWED with no workaround", () => {
  const env = mkEnv();
  try {
    const cmd = `git commit -m "${FIELD_MSG}" backlog/card.md`;
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
  } finally {
    env.done();
  }
});

test("field-failure: verbatim trailer with NO pathspec, backlog-only staged set, ALLOWED (the real incident shape)", () => {
  const env = mkEnv();
  try {
    stageOnly(env.root, "backlog/card.md");
    const cmd = `git commit -m "${FIELD_MSG}"`;
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
  } finally {
    env.done();
  }
});

test("field-failure counterpart: verbatim trailer but out-of-scope staged set is BLOCKED", () => {
  const env = mkEnv();
  try {
    stageOnly(env.root, "backlog/card.md", "README.md");
    const cmd = `git commit -m "${FIELD_MSG}"`;
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "BLOCK");
  } finally {
    env.done();
  }
});

// ===========================================================================
// R5(b) — a non-VCS command whose ARGUMENT TEXT mentions git/commit must not be
// classified as a git invocation.
// ===========================================================================

test("R5(b): `backlog task edit` whose note text says 'git commit ... README.md' is not a git invocation (scanner)", () => {
  const cmd =
    'backlog task edit TASK-1 --notes "the git commit was blocked; retry README.md"';
  const r = findGitInvocations(cmd);
  assert.ok(r.ok);
  assert.equal(r.invocations.length, 0, "quoted git text must yield zero command-position invocations");
});

test("R5(b): same command is ALLOWED end-to-end at root (not read as an out-of-scope commit)", () => {
  const env = mkEnv();
  try {
    const cmd =
      'backlog task edit TASK-1 --notes "the git commit was blocked; retry README.md"';
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
  } finally {
    env.done();
  }
});

// ===========================================================================
// R5(a) — an invocation targeting a DIFFERENT repository is out of jurisdiction
// and passes, even though its pathspec is out-of-scope for THIS project.
// ===========================================================================

test("R5(a): `cd /other && git commit ... README.md` passes (out of jurisdiction)", () => {
  const env = mkEnv();
  try {
    // README.md exists in `other`; committing it there is none of this guard's business.
    writeFileSync(join(env.other, "README.md"), "x\n");
    git(env.other, "add", "README.md");
    const cmd = `cd ${env.other} && git commit -m "fix" README.md`;
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
  } finally {
    env.done();
  }
});

test("R5(a): `git -C /other commit ... README.md` passes (out of jurisdiction)", () => {
  const env = mkEnv();
  try {
    writeFileSync(join(env.other, "README.md"), "x\n");
    git(env.other, "add", "README.md");
    const cmd = `git -C ${env.other} commit -m "fix" README.md`;
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
  } finally {
    env.done();
  }
});

test("R5(a) control: the SAME out-of-scope commit AT ROOT is BLOCKED (jurisdiction is the discriminator)", () => {
  const env = mkEnv();
  try {
    const cmd = `git commit -m "fix" README.md`;
    assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "BLOCK");
  } finally {
    env.done();
  }
});

// ===========================================================================
// Heredoc coverage — the sanctioned `git commit -F - <<'EOF' … EOF` pattern with
// an apostrophe + paren in the body. Phase 3 found heredocs break the guard in
// BOTH parse states without stripping; both directions must be pinned.
// ===========================================================================

const HEREDOC_BODY = "TASK-1: it's a fix (1M context)\nCo-Authored-By: x <y@z>";
const heredocCmd = "git commit -F - <<'EOF'\n" + HEREDOC_BODY + "\nEOF";

test("heredoc: `-F - <<'EOF'` with apostrophe+paren body is ALLOWED when the staged set is backlog-only", () => {
  const env = mkEnv();
  try {
    stageOnly(env.root, "backlog/card.md");
    assert.equal(drive(heredocCmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
  } finally {
    env.done();
  }
});

test("heredoc: the SAME heredoc commit is BLOCKED when the staged set reaches outside backlog/", () => {
  const env = mkEnv();
  try {
    stageOnly(env.root, "backlog/card.md", "README.md");
    assert.equal(drive(heredocCmd, { cwd: env.root, projectDir: env.root }), "BLOCK");
  } finally {
    env.done();
  }
});

// ===========================================================================
// Enumerated deny cases (Phase 3 §3) — so "no previously-blocked scoping
// violation became allowed" is auditable, not asserted. Each is a root
// invocation expected to BLOCK, with the allow counterparts that must survive.
// ===========================================================================

const DENY_AT_ROOT = [
  ["--amend outright (even with backlog pathspec)", `git commit --amend -m "x" backlog/card.md`],
  ["-a / --all (deny-flag)", `git commit -a -m "x" backlog/card.md`],
  ["--interactive (deny-flag)", `git commit --interactive -m "x"`],
  ["--patch long (deny-flag)", `git commit --patch -m "x" backlog/card.md`],
  ["-p post-subcommand = --patch (deny-flag)", `git commit -p -m "x" backlog/card.md`],
  ["--include (deny-flag)", `git commit --include -m "x" backlog/card.md`],
  ["--pathspec-from-file (unverifiable)", `git commit --pathspec-from-file=list.txt -m "x"`],
  ["cherry-pick", `git cherry-pick abc123`],
  ["revert", `git revert HEAD`],
  ["am", `git am patch.mbox`],
  ["merge --squash", `git merge --squash feature`],
  ["checkout -b (branch create)", `git checkout -b newbranch`],
  ["checkout -B (branch create)", `git checkout -B newbranch`],
  ["switch -c (branch create)", `git switch -c newbranch`],
  ["switch --create (branch create)", `git switch --create newbranch`],
  ["rebase (repo-wide)", `git rebase main`],
  ["push -f (repo-wide)", `git push -f origin main`],
  ["push --force (repo-wide)", `git push --force origin main`],
  ["push --force-with-lease (repo-wide)", `git push --force-with-lease origin main`],
  ["subshell $(git commit … README.md)", `echo $(git commit -m "x" README.md)`],
  ["explicit out-of-scope pathspec", `git commit -m "x" README.md`],
];

for (const [name, cmd] of DENY_AT_ROOT) {
  test(`deny at root: ${name}`, () => {
    const env = mkEnv();
    try {
      assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "BLOCK");
    } finally {
      env.done();
    }
  });
}

test("deny: no-pathspec commit with NOTHING staged is BLOCKED (cannot be verified as board-sync)", () => {
  const env = mkEnv();
  try {
    git(env.root, "reset", "-q"); // clean index == HEAD ⇒ nothing staged
    assert.equal(drive(`git commit -m "x"`, { cwd: env.root, projectDir: env.root }), "BLOCK");
  } finally {
    env.done();
  }
});

// Allow counterparts that MUST survive (proving the deny list did not overreach).
const ALLOW_AT_ROOT = [
  ["plain merge (how branches land)", `git merge feature`],
  ["git-global -p (paginate) ≠ post-subcommand -p (--patch)", `git -p commit -m "x" backlog/card.md`],
  ["fetch", `git fetch origin`],
  ["status", `git status`],
  ["worktree add", `git worktree add .worktrees/task-42 -b task-42 origin/main`],
];

for (const [name, cmd] of ALLOW_AT_ROOT) {
  test(`allow at root: ${name}`, () => {
    const env = mkEnv();
    try {
      assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
    } finally {
      env.done();
    }
  });
}

// Worktree asymmetry: a non-backlog commit in a worktree is allowed (own
// toplevel ⇒ not root), but a rebase there is still blocked (repo-wide).
test("worktree: non-backlog `git commit` is ALLOWED (worktree has its own toplevel)", () => {
  const env = mkEnv();
  try {
    stageOnly(env.worktree, "README.md");
    assert.equal(
      drive(`git commit -m "wip" README.md`, { cwd: env.worktree, projectDir: env.root }),
      "ALLOW"
    );
  } finally {
    env.done();
  }
});

test("worktree: `git rebase` is STILL BLOCKED (rebases forbidden repo-wide)", () => {
  const env = mkEnv();
  try {
    assert.equal(drive(`git rebase main`, { cwd: env.worktree, projectDir: env.root }), "BLOCK");
  } finally {
    env.done();
  }
});

// MERGE_HEAD allow path (checked before board-sync) and its ordering vs --amend.
test("allow path: with MERGE_HEAD present a non-backlog merge-conclusion commit is ALLOWED", () => {
  const env = mkEnv();
  try {
    // Stage FIRST — `git reset` (inside stageOnly) would clear MERGE_HEAD.
    stageOnly(env.root, "README.md"); // a real conflict-resolution touches non-backlog files
    const head = git(env.root, "rev-parse", "HEAD").trim();
    writeFileSync(join(env.root, ".git", "MERGE_HEAD"), head + "\n");
    assert.equal(
      drive(`git commit -m "Merge branch feature"`, { cwd: env.root, projectDir: env.root }),
      "ALLOW"
    );
  } finally {
    env.done();
  }
});

test("ordering: --amend is denied OUTRIGHT even with MERGE_HEAD present", () => {
  const env = mkEnv();
  try {
    const head = git(env.root, "rev-parse", "HEAD").trim();
    writeFileSync(join(env.root, ".git", "MERGE_HEAD"), head + "\n");
    assert.equal(
      drive(`git commit --amend -m "x"`, { cwd: env.root, projectDir: env.root }),
      "BLOCK"
    );
  } finally {
    env.done();
  }
});

// ===========================================================================
// Fail-open invariant (spec R2 reconciliation): the claim under test is
// "unparseable ⊆ unexecutable" — every command the scanner reports ok:false for
// is ALSO rejected by bash -n, so fail-open cannot pass a commit bash would run.
//
// Direction 1 (holds): genuinely unbalanced quotes scan ok:false AND bash -n
// rejects them.
// ===========================================================================

const UNBALANCED = [
  ["unbalanced single quote", `git commit -m 'unterminated README.md`, "unbalanced-single-quote"],
  ["unbalanced double quote", `git commit -m "unterminated README.md`, "unbalanced-double-quote"],
];

for (const [name, cmd, reason] of UNBALANCED) {
  test(`fail-open invariant HOLDS: ${name} is scanner-ok:false AND bash-rejected`, () => {
    const scan = scanCommand(cmd);
    assert.equal(scan.ok, false);
    assert.equal(scan.reason, reason);
    assert.equal(bashParse(cmd), "INVALID", "an unbalanced-quote command must not be bash-executable");
  });
}

// Direction 2 (holds for these five): executable exotic-quoting forms scan
// ok:true and are therefore GATED NORMALLY — an out-of-scope variant BLOCKS.
const EXECUTABLE_OK_TRUE = [
  ['locale $"…"', `git commit -m $"hi there" README.md`],
  ["backslash-newline continuation", `git commit -m x \\\n README.md`],
  ['escaped quotes in double quotes', `git commit -m "say \\"hi\\"" README.md`],
  ["apostrophe in double quotes", `git commit -m "it's fine" README.md`],
  ['nested double quotes in single quotes', `git commit -m 'say "hi"' README.md`],
];

for (const [name, cmd] of EXECUTABLE_OK_TRUE) {
  test(`fail-open invariant HOLDS: ${name} scans ok:true, is bash-valid, and is GATED (out-of-scope ⇒ BLOCK)`, () => {
    const env = mkEnv();
    try {
      assert.equal(scanCommand(cmd).ok, true, "expected ok:true (scanner models this form)");
      assert.equal(bashParse(cmd), "VALID");
      assert.equal(
        drive(cmd, { cwd: env.root, projectDir: env.root }),
        "BLOCK",
        "an ok:true out-of-scope commit must be gated normally, not fail-open"
      );
    } finally {
      env.done();
    }
  });
}

// ---------------------------------------------------------------------------
// !!! PHASE 4 FINDING — the fail-open invariant is VIOLATED for two forms. !!!
//
// These are CHARACTERIZATION tests: they assert the CURRENT (defective) reality
// so the suite is honest and green, and so a future fix FLIPS them — turning
// this section red and forcing the fixer to re-read the finding below.
//
// The spec R2 reconciliation and the Phase 3 notes assert "unparseable ⊆
// unexecutable" and list ANSI-C `$'…'` among the forms that scan ok:true. Both
// claims are FALSE:
//   • ANSI-C `$'it\'s a fix'` (an escaped apostrophe inside `$'…'`) scans
//     ok:false — the scanner does not model `$'…'`, so the closing `'` opens an
//     unterminated single-quote run — YET bash parses and executes it.
//   • A trailing unquoted backslash (`… README.md\`) scans ok:false
//     (dangling-escape) YET bash treats it as a literal no-op and executes.
//
// Because the hook FAILS OPEN on residual ok:false, BOTH out-of-scope root
// commits are ALLOWED — commits the OLD promptworld regex parser BLOCKED. That
// is a regression against spec 051 R4 / AC #5 ("no commit blocked for genuine
// scoping reasons becomes allowed by this fix"). Severity is low in practice (an
// honest sweep emits neither ANSI-C quoting nor stray trailing backslashes), but
// the invariant that JUSTIFIED fail-open is not true as written. Flagged for the
// hook owner / Phase 5 — see specs/051 tasks.md Notes "Phase 4 finding".
// ---------------------------------------------------------------------------

const BS = String.fromCharCode(92); // backslash, kept out of JS template literals
const INVARIANT_VIOLATIONS = [
  ["ANSI-C $'…' with escaped apostrophe", `git commit -m $'it${BS}'s a fix' README.md`],
  ["trailing unquoted backslash", `git commit -m x README.md${BS}`],
];

for (const [name, cmd] of INVARIANT_VIOLATIONS) {
  test(`KNOWN GAP (Phase 4 finding): ${name} — scanner ok:false but bash-VALID (invariant violated)`, () => {
    assert.equal(scanCommand(cmd).ok, false, "scanner cannot parse this form");
    assert.equal(
      bashParse(cmd),
      "VALID",
      "bash WOULD execute it — so 'unparseable ⊆ unexecutable' is false here"
    );
  });

  test(`KNOWN GAP (Phase 4 finding): ${name} — out-of-scope root commit is ALLOWED via fail-open (regression vs old hook)`, () => {
    const env = mkEnv();
    try {
      // Pins the regression. A fix (model $'…'/$"…" in the scanner, or fail
      // closed on residual for root commits) must flip this to "BLOCK".
      assert.equal(drive(cmd, { cwd: env.root, projectDir: env.root }), "ALLOW");
    } finally {
      env.done();
    }
  });
}
