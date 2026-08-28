// spec-source.mjs — resolve a spec dir's has/read closures: working tree first, then git refs,
// so a spec dir that only lives on an unmerged task branch still derives its true state (spec
// 058) from a checkout that doesn't contain it.
//
// Precedence: if the dir exists in the working tree, it wins unconditionally and git is never
// consulted (zero subprocess cost — the hot path, R2/R7). Otherwise the first ref among local
// HEAD then pushed `refs/remotes/origin/task-*` branches whose tree contains `<specDir>/spec.md`
// backs the closures via `git show <ref>:<path>`. No match anywhere, no git binary, or not a
// repo -> degrade to "nothing there", never throw (R5).
//
// Read-only plumbing only: show / rev-parse / for-each-ref. No fetch, no checkout, no index
// writes (R4). Ref enumeration and every (ref, path) read are memoized per repo root so a Stop
// hook re-deriving the same branch-held spec on every turn pays for git exactly once (R7).

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, isAbsolute, dirname, sep } from "node:path";
import { execFileSync } from "node:child_process";

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" });
  } catch {
    return null; // git missing, not a repo, or the ref/path doesn't exist -> caller degrades
  }
}

// Walk up from an (possibly nonexistent) absolute path to the nearest dir that actually exists,
// so `git rev-parse` has somewhere real to run from even when specDir itself is unmerged.
function nearestExistingDir(absPath) {
  let dir = absPath;
  while (!existsSync(dir)) {
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
  return dir;
}

const rootCache = new Map(); // startDir -> repo root, or null when not inside a repo
function repoRoot(startDir) {
  if (!rootCache.has(startDir)) {
    const out = git(["rev-parse", "--show-toplevel"], startDir);
    rootCache.set(startDir, out ? out.trim() : null);
  }
  return rootCache.get(startDir);
}

const refsCache = new Map(); // repo root -> ["HEAD", ...pushed task branches], computed once
function listRefs(root) {
  if (!refsCache.has(root)) {
    const refs = ["HEAD"];
    const out = git(["for-each-ref", "--format=%(refname)", "refs/remotes/origin/task-*"], root);
    if (out) for (const line of out.split("\n")) { const ref = line.trim(); if (ref) refs.push(ref); }
    refsCache.set(root, refs);
  }
  return refsCache.get(root);
}

const showCache = new Map(); // `${root}\0${ref}\0${path}` -> file content, or null when absent
function showAt(root, ref, gitPath) {
  const key = `${root}\0${ref}\0${gitPath}`;
  if (!showCache.has(key)) showCache.set(key, git(["show", `${ref}:${gitPath}`], root));
  return showCache.get(key);
}

function toGitPath(root, absSpecDir) {
  return relative(root, absSpecDir).split(sep).join("/");
}

const NONE = { has: () => false, read: () => "", source: { kind: "none" } };

/**
 * Resolve `{ has, read, source }` for one spec dir. `has(name)`/`read(name)` behave like the
 * fs-backed closures they replace; `source` names where the answer came from:
 * `{ kind: "worktree", path }`, `{ kind: "ref", ref }`, or `{ kind: "none" }`.
 */
export function resolveSpecSource(specDir) {
  if (existsSync(specDir)) {
    return {
      has: (name) => existsSync(join(specDir, name)),
      read: (name) => {
        try { return existsSync(join(specDir, name)) ? readFileSync(join(specDir, name), "utf8") : ""; } catch { return ""; }
      },
      source: { kind: "worktree", path: specDir },
    };
  }

  // Resolve through symlinks (e.g. macOS's /var -> /private/var) so this path and git's own
  // `--show-toplevel` output share one real filesystem root -- otherwise `relative()` below
  // computes nonsense and no ref ever matches.
  const absSpecDir = isAbsolute(specDir) ? specDir : join(process.cwd(), specDir);
  const existingAncestor = nearestExistingDir(absSpecDir);
  const suffix = relative(existingAncestor, absSpecDir);
  const resolvedSpecDir = join(realpathSync(existingAncestor), suffix);

  const root = repoRoot(realpathSync(existingAncestor));
  if (!root) return NONE;

  const gitPath = toGitPath(root, resolvedSpecDir);
  const ref = listRefs(root).find((r) => showAt(root, r, `${gitPath}/spec.md`) !== null);
  if (!ref) return NONE;

  return {
    has: (name) => showAt(root, ref, `${gitPath}/${name}`) !== null,
    read: (name) => showAt(root, ref, `${gitPath}/${name}`) ?? "",
    source: { kind: "ref", ref },
  };
}
