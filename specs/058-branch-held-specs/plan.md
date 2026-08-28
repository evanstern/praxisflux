# 058 — Implementation plan

**Constitution check:** this host has no `.specify/` and no ratified constitution (the
template is absent, not unfilled). Per `pdlc:sweep`'s plan step, this plan is checked against
the project's grounding instead: `CLAUDE.md` (artifact-grounded action, one-TASK-one-PR,
gates), `docs/principles.md`, and `docs/wiki/spec-bridge-plugin.md`.

## The seam

`deriveSpecState` already funnels **every** filesystem touch through two closures:

```js
const has  = (name) => existsSync(join(specDir, name));
const read = (name) => { try { return has(name) ? readFileSync(join(specDir, name), "utf8") : ""; } catch { return ""; } };
```

Nothing else in the function calls `fs`. So the entire change is: **choose what backs those
two closures.** Every derivation rule below them — stage ladder, phase parsing, box counting,
analysis criticals — is untouched, which is what keeps R6 (byte-identical behavior) cheap and
credible rather than aspirational.

## Approach

A small resolver returns a `{ has, read, source }` triple:

1. If `existsSync(specDir)` in the working tree → back the closures with `fs`, `source` is
   `{ kind: "worktree", path: specDir }`. This is the overwhelmingly common path and pays
   **zero** subprocess cost (R2, R7).
2. Otherwise, ask git — local `HEAD` first, then `refs/remotes/origin/task-*` — for the first
   ref whose tree contains `<specDir>/spec.md`. Back the closures with `git show <ref>:<path>`
   and set `source` to `{ kind: "ref", ref }` (R1, R3, R8).
3. If git is absent, errors, or matches nothing → back the closures with the "nothing there"
   answer, exactly as today (R5).

Reads go through `execFileSync("git", [...])` — never a shell string, so paths with spaces or
shell metacharacters cannot be misparsed or injected. Only `show`, `ls-tree`, `rev-parse`, and
`for-each-ref` are used: all read-only plumbing, no fetch/checkout/index write (R4).

**Why a resolver and not git-awareness sprinkled through the function:** the two closures are
already the only I/O boundary. Widening them keeps the derivation logic a pure function of
"can I see these files", which is the property the existing tests pin.

## Phases

### Phase 1 — the resolver, tested standalone
New `lib/spec-source.mjs`: ref enumeration (HEAD + `origin/task-*`), per-(ref,path) memo,
`execFileSync` reads with `stdio: ["ignore","pipe","ignore"]` so git's stderr never pollutes a
Stop hook's output. Exports `resolveSpecSource(specDir)`. Unit-tested against a scratch repo
built in a temp dir with real commits on a real branch — no mocks, because the thing under
test *is* the git interaction.

### Phase 2 — wire it into the derivation
`deriveSpecState` swaps its two closures for the resolver's and passes `source` through to its
return value. No other line changes. Existing tests must pass untouched — that is the phase's
own gate (R6, AC5).

### Phase 3 — prove the real scenario end to end
The TASK-104 case verbatim: a spec dir committed **only** on a branch, derived from a checkout
that does not contain it, asserting the true stage rather than a false "To Do". Plus the
guards: worktree wins over ref, no-git degrades, no-match degrades, repo unchanged after a run
(AC1–AC4, AC8).

### Phase 4 — grounding
Re-pin `docs/wiki/` notes whose sources this PR touched, via
`node grounding-wiki/gates/cli.mjs plan . docs/wiki`, classifying RE-PIN-ONLY vs NEEDS-REVIEW
and amending prose **before** moving any pin. Marketplace + skill `version:` bumps per
`docs/releasing.md`, since `lib/` and `spec-bridge/` are released surface.

## Risks

- **Ref enumeration cost in a Stop hook.** Mitigated by ordering: the worktree hit short-
  circuits before any subprocess, so the common case is unchanged. Only a *missing* spec dir
  pays for git, and that is the case currently producing a false failure anyway.
- **A stale `origin/task-*` ref carrying an old spec.** Accepted: it is strictly better than
  today's "nothing at all", and the `source` provenance (R8) makes the origin auditable.
- **`bridge.mjs` contains a literal `\0` byte** (line 217, a cache-key separator), which makes
  plain `grep` treat the file as binary and return **exit 0 with no matches**. Use `grep -a`
  when searching it. Recorded here because it silently misleads anyone inspecting this code
  path; not fixed in this PR (out of scope).
