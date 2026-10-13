---
title: Code Examples
aliases: [illustrative code, port sketches]
tags: [hexagonal, code, javascript]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Implementation-Mechanics]]", "[[Real-World-Precedents]]", "[[PDLC-Seam-Inventory]]"]
---

# Code Examples

> **Illustrative only.** These sketches assemble the cited patterns into Node ESM in the
> praxisflux chassis idiom (zero dependencies, JSDoc in place of TypeScript). They show *shapes*
> found in the sources. They are not a design proposal and were not run against real forges.

## 1. A driven port as a JSDoc contract

Port named by purpose (G2), neutral nouns (vibey's `ChangeRequest`, G5), problem-returning
results (vibey's `(value, problem)`, G5).

```js
// ports/for-hosting-changes.mjs
/**
 * @typedef {{ id: string, head: string, base: string, url: string,
 *             state: "open"|"merged"|"closed" }} ChangeRequest
 * @typedef {{ ok: true, value: any } | { ok: false, problem: string,
 *             unsupported?: boolean }} Result
 *
 * @typedef {object} ForHostingChanges
 * @property {string}   kind                               // "github" | "gitlab" | "gitea" | "patch"
 * @property {Set<string>} capabilities                    // e.g. "merge-commit", "draft", "checks"
 * @property {(o:{head:string, base:string, title:string, body:string}) => Promise<Result>} open
 * @property {(id:string) => Promise<Result>} view          // → ChangeRequest
 * @property {(id:string, o:{strategy:"merge-commit"|"squash"|"rebase", sha:string}) => Promise<Result>} merge
 * @property {(id:string) => Promise<Result>} isMerged      // → boolean
 */
export const REQUIRED = ["open", "view", "merge", "isMerged"];
export function assertPort(a) {
  for (const m of REQUIRED) if (typeof a[m] !== "function") throw new Error(`${a.kind}: missing ${m}`);
  return a;
}
```

`merge` takes a `sha` so a verdict binds to a commit, not a moving head (vibey invariant, G5).

## 2. CLI-transport adapters

GitHub via `gh`, Gitea via `tea` (G5). The `tea` adapter reads the body because `tea api` can exit
0 on an HTTP error (G5).

```js
// adapters/github-gh.mjs
import { execFileSync } from "node:child_process";
const gh = (args) => JSON.parse(execFileSync("gh", args, { encoding: "utf8" }) || "null");

export default {
  kind: "github",
  capabilities: new Set(["merge-commit", "squash", "rebase", "draft", "checks"]),
  async open({ head, base, title, body }) {
    try {
      const url = execFileSync("gh", ["pr", "create", "--head", head, "--base", base,
        "--title", title, "--body", body], { encoding: "utf8" }).trim();
      return { ok: true, value: { id: url.split("/").pop(), url } };
    } catch (e) { return { ok: false, problem: String(e.stderr || e) }; }
  },
  async isMerged(id) {
    try { return { ok: true, value: gh(["pr", "view", id, "--json", "state"]).state === "MERGED" }; }
    catch (e) { return { ok: false, problem: String(e.stderr || e) }; }
  },
  async merge(id, { strategy, sha }) {
    const flag = { "merge-commit": "--merge", squash: "--squash", rebase: "--rebase" }[strategy];
    try { execFileSync("gh", ["pr", "merge", id, flag, "--match-head-commit", sha]); return { ok: true }; }
    catch (e) { return { ok: false, problem: String(e.stderr || e) }; }
  },
  async view(id) { /* gh pr view --json … → ChangeRequest */ },
};
```

```js
// adapters/patch-email.mjs — forge-less: change request = patch series (G5)
export default {
  kind: "patch",
  capabilities: new Set([]),                 // no server-side merge, no checks
  async open({ base, head }) { /* git format-patch base..head → send-email */ },
  async merge() { return { ok: false, unsupported: true, problem: "maintainer applies with git am" }; },
  async isMerged(id) { /* git merge-base --is-ancestor <head> origin/main */ },
  async view(id) { /* read local series metadata */ },
};
```

## 3. The configurator

Declared-with-detected-default selection (see [[Implementation-Mechanics]]).

```js
// configure.mjs
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { assertPort } from "./ports/for-hosting-changes.mjs";

const ADAPTERS = {
  github: () => import("./adapters/github-gh.mjs"),
  gitlab: () => import("./adapters/gitlab-glab.mjs"),
  gitea:  () => import("./adapters/gitea-tea.mjs"),
  patch:  () => import("./adapters/patch-email.mjs"),
};

function detect(root) {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { cwd: root, encoding: "utf8" });
  if (/github\.com/.test(url)) return "github";
  if (/gitlab/.test(url)) return "gitlab";
  return "patch";
}

export async function forge(root) {
  const cfg = join(root, ".pdlc.json");
  const kind = (existsSync(cfg) && JSON.parse(readFileSync(cfg, "utf8")).forge) || detect(root);
  const load = ADAPTERS[kind];
  if (!load) throw new Error(`unknown forge "${kind}"; known: ${Object.keys(ADAPTERS).join(", ")}`);
  return assertPort((await load()).default);
}
```

## 4. A shared contract test

One suite, every adapter, fake included (G4). `node --test` matches the praxisflux test idiom.

```js
// test/for-hosting-changes.contract.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

export function contract(name, makeAdapter) {
  test(`${name}: open → view round-trips head/base`, async () => {
    const a = await makeAdapter();
    const r = await a.open({ head: "t-1", base: "main", title: "x", body: "" });
    if (!r.ok) return assert.ok(r.unsupported, r.problem);
    const v = await a.view(r.value.id);
    assert.equal(v.value.head, "t-1");
    assert.equal(v.value.base, "main");
  });
  test(`${name}: merge refuses a stale sha`, async () => {
    const a = await makeAdapter();
    const r = await a.open({ head: "t-2", base: "main", title: "y", body: "" });
    if (!r.ok) return;
    const m = await a.merge(r.value.id, { strategy: "merge-commit", sha: "deadbeef" });
    assert.equal(m.ok, false);
  });
}

// in-memory fake: a real implementation backed by a Map
export const fake = () => {
  const crs = new Map(); let n = 0;
  return {
    kind: "fake", capabilities: new Set(["merge-commit"]),
    async open({ head, base }) { const id = String(++n); crs.set(id, { id, head, base, sha: "abc", state: "open" }); return { ok: true, value: { id } }; },
    async view(id) { return { ok: true, value: crs.get(id) }; },
    async merge(id, { sha }) { const c = crs.get(id); if (c.sha !== sha) return { ok: false, problem: "stale sha" }; c.state = "merged"; return { ok: true }; },
    async isMerged(id) { return { ok: true, value: crs.get(id).state === "merged" }; },
  };
};
contract("fake", fake);
```

## 5. A tracker port with partial providers and fallthrough

codev's hybrid tracker (G6) plus praxisflux's verb table and dual status maps (G10).

```js
// ports/for-tracking-work.mjs
export const VERBS = ["list", "view", "create", "status", "claim", "note", "label", "acSet", "acCheck", "final"];

// compose: a primary provider; any verb it lacks falls through to the secondary
export function compose(primary, fallback) {
  return new Proxy(primary, {
    get: (t, k) => (k in t ? t[k] : fallback?.[k]),
  });
}

// translator (ACL) at the edge: bridge status ↔ site status
export function makeStatusMaps({ statusMap = {}, statusReadMap = {} }) {
  const seen = new Map();
  for (const [b, s] of Object.entries(statusMap)) {
    if (seen.has(s)) throw new Error(`statusMap not injective: ${seen.get(s)} and ${b} → ${s}`);
    seen.set(s, b);
  }
  return {
    toSite: (b) => statusMap[b] ?? b,      // write: one canonical target
    toBridge: (s) => statusReadMap[s] ?? s, // read: many-to-one by design
  };
}
```

## 6. Adapter-as-prose (skill text)

The form claude-plugin-sdd adopted and `docs/board-verbs.md` already uses: the port is a verb
table, each adapter is a column of literal commands (G5, G10).

```markdown
| Verb            | github                              | gitlab                          | gitea                                   |
|-----------------|-------------------------------------|---------------------------------|-----------------------------------------|
| vcs:open-cr     | `gh pr create --base B --head H`    | `glab mr create -b B -s H`      | `tea pulls create --base B --head H`    |
| vcs:merged?     | `gh api repos/O/R/pulls/N --jq .merged` | `glab mr view N -F json`     | `tea pulls N -o json` (read body: exit 0 on HTTP error) |
| vcs:merge       | `gh pr merge N --merge`             | `glab mr merge N`               | `tea pulls merge N --style merge`       |
```

The `glab`/`tea` flag spellings in this table follow the CLIs' published conventions as summarised
in G5; they are not verified against a live install.

## Grounding

- [[_grounding]] — G2, G4, G5, G6, G10
- [vibey #138](https://github.com/the-vibey-project/vibey/issues/138)
- [codev #1740](https://github.com/cluesmith/codev/issues/1740)
- [Contract tests](https://dev.to/gabrielanhaia/contract-tests-in-php-proving-every-adapter-honors-its-port-3hmp)
