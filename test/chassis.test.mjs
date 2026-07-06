// Smoke tests for the shared lib/ chassis. Zero-dep: node:test + node:assert.
//   run: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { hasChild, findRootUpwards, findRootsDownwards } from "../lib/project-root.mjs";
import { parseFrontmatter, stripCode, extractWikilinks, linkTarget, namesFor, resolveLinks } from "../lib/markdown.mjs";
import { today, bumpUpdated } from "../lib/dates.mjs";
import { render } from "../lib/template.mjs";
import { checkHtml } from "../lib/selfcontained.mjs";
import { createLifecycle } from "../lib/lifecycle.mjs";
import { copyDir, ensureGitignore, verifyPresent, installMode } from "../lib/installer.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

const scratch = () => mkdtempSync(join(tmpdir(), "praxis-"));

test("markdown: frontmatter, code stripping, wikilinks", () => {
  const fm = parseFrontmatter("---\ntitle: My Note\ntype: MOC\naliases: [Alt, Other]\n---\nbody");
  assert.equal(fm.title, "My Note");
  assert.equal(fm.type, "moc"); // lowercased
  assert.deepEqual(fm.aliases, ["Alt", "Other"]);
  assert.equal(parseFrontmatter("no frontmatter here"), null);

  assert.equal(stripCode("a `[[x]]` b\n```\n[[y]]\n```").includes("[[x]]"), false);
  assert.deepEqual(extractWikilinks("see [[A|alias]] and `[[Z]]` and [[B#h]]"), ["A", "B"]);
  assert.equal(linkTarget("Note|display"), "Note");

  const known = namesFor("_grounding", { title: "Grounding", aliases: ["src"] });
  assert.ok(known.has("_grounding") && known.has("grounding") && known.has("src"));
  const { unresolved } = resolveLinks(["A", "Ghost"], new Set(["a"]));
  assert.deepEqual(unresolved, ["Ghost"]);
});

test("dates: today + bumpUpdated", () => {
  assert.match(today(new Date("2026-07-06T12:00:00Z")), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(bumpUpdated("updated: 2020-01-01", new Date("2026-07-06T00:00:00Z")), "updated: 2026-07-06");
});

test("template: render known + leave unknown", () => {
  assert.equal(render("# {{PROJECT_NAME}} ({{MISSING}})", { PROJECT_NAME: "praxis" }), "# praxis ({{MISSING}})");
});

test("selfcontained: external loads fail, clean page passes", () => {
  const bad = checkHtml('<title>x</title><script src="https://cdn/x.js"></script>');
  assert.equal(bad.ok, false);
  assert.ok(bad.fails.some((f) => f.includes("external <script src>")));

  assert.equal(checkHtml("<div>no title</div>").ok, false); // missing <title> fails
  const good = checkHtml("<title>ok</title><style>@media (prefers-color-scheme: dark){}</style><table></table>");
  assert.equal(good.ok, true);
  assert.equal(good.warns.length, 0);
});

test("lifecycle: status cannot exceed proven artifacts", () => {
  const dir = scratch();
  writeFileSync(join(dir, "checklist.md"), "x");
  const lc = createLifecycle({
    states: ["scaffolded", "taught", "decked", "done"],
    artifacts: { checklist: "checklist.md", deck: "deck.html", guide: "guide.md" },
    requires: { taught: ["checklist"], decked: ["deck", "guide"], done: ["checklist", "deck", "guide"] },
  });
  assert.deepEqual(lc.check(dir, "taught"), []);           // checklist present → ok
  const problems = lc.check(dir, "done");                   // deck+guide missing
  assert.equal(problems.length, 2);
  assert.ok(problems.every((p) => p.includes("missing on disk")));
  assert.ok(lc.check(dir, "bogus")[0].includes("unknown status"));
});

test("installer: dotfile-safe copy, gitignore, verify, mode", () => {
  const root = scratch();
  const tpl = join(root, "src");
  mkdirSync(join(tpl, ".template"), { recursive: true });
  writeFileSync(join(tpl, ".template", "checklist.md"), "x");
  copyDir(tpl, join(root, "dst"));
  assert.ok(existsSync(join(root, "dst", ".template", "checklist.md"))); // dotfile survived

  assert.equal(ensureGitignore(root, ".handoff/"), true);   // added
  assert.equal(ensureGitignore(root, ".handoff/"), false);  // idempotent
  assert.ok(readFileSync(join(root, ".gitignore"), "utf8").includes(".handoff/"));

  assert.deepEqual(verifyPresent(root, ["dst", "nope"]), ["nope"]);
  assert.equal(installMode(root, ["topics"]), "fresh");
  mkdirSync(join(root, "topics"));
  assert.equal(installMode(root, ["topics"]), "update");
});

test("project-root: walk up to marker, find nested roots down", () => {
  const root = scratch();
  const deep = join(root, "a", "b");
  mkdirSync(deep, { recursive: true });
  mkdirSync(join(root, "topics"));
  assert.equal(findRootUpwards(deep, hasChild("topics")), root);
  assert.equal(findRootUpwards(deep, hasChild("nope")), null);

  mkdirSync(join(root, "vault1", ".vault"), { recursive: true });
  mkdirSync(join(root, "sub", "vault2", ".vault"), { recursive: true });
  const found = findRootsDownwards(root, hasChild(".vault")).sort();
  assert.equal(found.length, 2);
  assert.ok(found.some((f) => f.endsWith("vault1")) && found.some((f) => f.endsWith("vault2")));
});

test("gate-runner: additive evaluate, stop_hook_active guard, no-op", () => {
  const failing = { name: "g", resolveRoots: () => ["/x"], check: () => ["boom"] };
  const inert = { name: "n", resolveRoots: () => [], check: () => ["never"] };
  assert.equal(evaluate({}, [failing]).block, true);
  assert.equal(evaluate({}, [inert]).block, false);                  // resolves no roots → no-op
  assert.equal(evaluate({ stop_hook_active: true }, [failing]).block, false); // loop guard
});
