// Tests for Phase 1:
// the unified `info` component's build-side registry/expansion
// (lib/info.mjs, lib/includes.mjs, lib/build.mjs, lib/shell.mjs) and its
// runtime (core/patterns/info/info.js), run under node:vm against a
// hand-rolled DOM stub (same technique as scripts/test/live-wiring.test.mjs
// — no jsdom-equivalent dependency exists in this plugin).
//
// Sections:
//   1. lib/info.mjs — collectInfoBodies: scoping/collision/validation rules,
//domIdFor, renderInfoFooter, renderInfoEntry/renderFallback.
//   2. lib/includes.mjs — x-info/x-info-body/data-info/data-panel expansion,
//      every element form, nested triggers, aliases.
//   3. lib/build.mjs/lib/shell.mjs — full build() integration: fallback
//      placement (page-scoped vs global, single vs --multi), legacy
//      panels[], unused-body warning, the term "Full definition" seeHref fix.
//   4. core/patterns/info/info.js runtime behaviour under node:vm:
//      open/close/no-reopen, role preservation, seq prev/next, deep link,
//      nested-trigger delegation.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { build } from "../../explainer/scripts/lib/build.mjs";
import { expandPage } from "../../explainer/scripts/lib/includes.mjs";
import { collectInfoBodies, domIdFor, registryKey, renderFallback, renderInfoEntry, renderInfoFooter } from "../../explainer/scripts/lib/info.mjs";
import { createCiteRegistry } from "../../explainer/scripts/lib/cites.mjs";
import { createLookup } from "../../explainer/scripts/lib/lookup.mjs";
import { parse, serialize } from "../../explainer/scripts/lib/markup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const MINI_ARTIFACT = path.join(FIXTURES, "mini-artifact");
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");

// =============================================================== 1. lib/info.mjs

function draft(pageId, html) {
  return { page: { id: pageId, panels: [] }, file: `pages/${pageId}.html`, nodes: parse(html, { file: `pages/${pageId}.html` }) };
}

test("collectInfoBodies: a single page-scoped x-info-body registers under its own page", () => {
  const { ok, errors, byPage, global } = collectInfoBodies({
    pageDrafts: [draft("overview", '<x-info-body k="note" title="Note"><p>hi</p></x-info-body>')],
  });
  assert.equal(ok, true, JSON.stringify(errors));
  assert.equal(global.size, 0);
  const meta = byPage.get("overview").get("note");
  assert.equal(meta.scope, "page");
  assert.equal(meta.mode, "panel");
  assert.equal(meta.title, "Note");
  assert.equal(domIdFor(meta), "info--overview--note");
});

test("collectInfoBodies: scope=global registers once, build-wide, with an unprefixed id", () => {
  const { ok, global } = collectInfoBodies({
    pageDrafts: [draft("overview", '<x-info-body k="note" title="Note" scope="global"><p>hi</p></x-info-body>')],
  });
  assert.equal(ok, true);
  assert.equal(domIdFor(global.get("note")), "info--note");
});

test("collectInfoBodies: mode defaults to panel (requires a title); popover mode doesn't", () => {
  const withoutTitle = collectInfoBodies({ pageDrafts: [draft("p", '<x-info-body k="a"><p>x</p></x-info-body>')] });
  assert.equal(withoutTitle.ok, false);
  assert.match(withoutTitle.errors[0], /needs a "title" attribute/);

  const popoverNoTitle = collectInfoBodies({
    pageDrafts: [draft("p", '<x-info-body k="a" mode="popover"><p>x</p></x-info-body>')],
  });
  assert.equal(popoverNoTitle.ok, true, JSON.stringify(popoverNoTitle.errors));
});

test("collectInfoBodies: mode= must be popover or panel", () => {
  const { ok, errors } = collectInfoBodies({
    pageDrafts: [draft("p", '<x-info-body k="a" title="A" mode="modal"><p>x</p></x-info-body>')],
  });
  assert.equal(ok, false);
  assert.match(errors[0], /mode="modal" must be "popover" or "panel"/);
});

test("collectInfoBodies: duplicate key in the same page scope is an error", () => {
  const { ok, errors } = collectInfoBodies({
    pageDrafts: [
      draft("p", '<x-info-body k="a" title="A"><p>1</p></x-info-body><x-info-body k="a" title="A2"><p>2</p></x-info-body>'),
    ],
  });
  assert.equal(ok, false);
  assert.match(errors[0], /duplicate info key "a" in page "p"/);
});

test("collectInfoBodies: duplicate key in global scope (across two pages) is an error", () => {
  const { ok, errors } = collectInfoBodies({
    pageDrafts: [
      draft("p1", '<x-info-body k="a" title="A" scope="global"><p>1</p></x-info-body>'),
      draft("p2", '<x-info-body k="a" title="A2" scope="global"><p>2</p></x-info-body>'),
    ],
  });
  assert.equal(ok, false);
  assert.match(errors[0], /duplicate info key "a" in global scope/);
});

test("collectInfoBodies: a page-scoped key colliding with a global key of the same name is an error", () => {
  const { ok, errors } = collectInfoBodies({
    pageDrafts: [
      draft("p1", '<x-info-body k="a" title="A" scope="global"><p>1</p></x-info-body>'),
      draft("p2", '<x-info-body k="a" title="A2"><p>2</p></x-info-body>'),
    ],
  });
  assert.equal(ok, false);
  assert.match(errors[0], /page "p2": info key "a" collides with a global-scope key/);
});

test("collectInfoBodies: the same bare key is fine on two different pages (both page-scoped)", () => {
  const { ok, byPage } = collectInfoBodies({
    pageDrafts: [
      draft("p1", '<x-info-body k="a" title="A"><p>1</p></x-info-body>'),
      draft("p2", '<x-info-body k="a" title="A2"><p>2</p></x-info-body>'),
    ],
  });
  assert.equal(ok, true);
  assert.equal(domIdFor(byPage.get("p1").get("a")), "info--p1--a");
  assert.equal(domIdFor(byPage.get("p2").get("a")), "info--p2--a");
});

test("collectInfoBodies: legacy contents.json pages[].panels[] folds into the same page-scoped registry", () => {
  const d = draft("p", "<p>no x-info-body here</p>");
  d.page.panels = [{ key: "legacy", title: "Legacy", body: "<p>old-style</p>" }];
  const { ok, byPage } = collectInfoBodies({ pageDrafts: [d] });
  assert.equal(ok, true);
  const meta = byPage.get("p").get("legacy");
  assert.equal(meta.source, "panel");
  assert.equal(meta.mode, "panel");
  assert.equal(meta.html, "<p>old-style</p>");
});

test("collectInfoBodies: a legacy panel key colliding with an x-info-body key on the same page is a duplicate-key error", () => {
  const d = draft("p", '<x-info-body k="a" title="A"><p>1</p></x-info-body>');
  d.page.panels = [{ key: "a", title: "A2", body: "<p>2</p>" }];
  const { ok, errors } = collectInfoBodies({ pageDrafts: [d] });
  assert.equal(ok, false);
  assert.match(errors[0], /duplicate info key "a" in page "p"/);
});

test("renderInfoFooter: files= needs contents.repo; renders GitHub links", () => {
  const meta = { key: "a", files: "plugins/vcs/core.py:120,README.md", file: "pages/p.html", line: 3 };
  assert.throws(() => renderInfoFooter({ meta, repo: undefined, pageIds: new Map(), multi: false }), /has no "repo"/);
  const html = renderInfoFooter({ meta, repo: { github: "example-org/example-repo", ref: "main" }, pageIds: new Map(), multi: false });
  assert.match(html, /<div class="ex-info-files"><h4>Files<\/h4>/);
  assert.match(html, /href="https:\/\/github\.com\/example-org\/example-repo\/blob\/main\/plugins\/vcs\/core\.py#L120"/);
  assert.match(html, /href="https:\/\/github\.com\/example-org\/example-repo\/blob\/main\/README\.md"/);
});

test("renderInfoFooter: see= must name a real page id; renders page links (single vs --multi)", () => {
  const meta = { key: "a", see: "overview", file: "pages/p.html", line: 3 };
  const pageIds = new Map([["overview", "Overview"]]);
  assert.throws(() => renderInfoFooter({ meta: { ...meta, see: "nope" }, repo: undefined, pageIds, multi: false }), /unknown page "nope"/);
  const single = renderInfoFooter({ meta, repo: undefined, pageIds, multi: false });
  assert.match(single, /href="#overview">Overview/);
  const multi = renderInfoFooter({ meta, repo: undefined, pageIds, multi: true });
  assert.match(multi, /href="overview\.html">Overview/);
});

test("renderInfoEntry/renderFallback: wraps title/body/footer; seq/order attributes present only with seq", () => {
  const meta = { key: "a", scope: "page", pageId: "p", title: "A", mode: "panel", seq: "walk", order: 2 };
  const html = renderInfoEntry({ meta, innerHtml: "<p>body</p>", footerHtml: "<div class=\"ex-info-see\">x</div>" });
  assert.match(html, /^<div class="ex-info-entry" id="info--p--a" data-info-key="a" data-info-mode="panel" data-info-scope="page" data-info-seq="walk" data-info-order="2">/);
  assert.match(html, /<div class="ex-info-entry-title">A<\/div>/);
  assert.match(html, /<div class="ex-info-entry-body"><p>body<\/p><\/div>/);
  assert.match(html, /<div class="ex-info-see">x<\/div><\/div>$/);
  assert.equal(renderFallback(""), "");
  assert.match(renderFallback(html), /^<details class="ex-info-fallback"><summary>More detail<\/summary>/);
});

test("registryKey: stable identity per scope", () => {
  assert.equal(registryKey({ scope: "global", key: "a" }), "global:a");
  assert.equal(registryKey({ scope: "page", pageId: "p", key: "a" }), "page:p:a");
});

// ============================================================ 2. lib/includes.mjs
//
// expandPage is exercised directly (same technique as includes.test.mjs),
// with ctx.infoLocal/infoGlobal built by the real collectInfoBodies (not
// hand-rolled maps) so the pre-scan and the expansion walk are proven to
// agree on the same registry.

async function expandWithRegistry({ pages, repo, pageIds }) {
  const pageDrafts = Object.entries(pages).map(([id, html]) => draft(id, html));
  const registry = collectInfoBodies({ pageDrafts });
  if (!registry.ok) return { ok: false, errors: registry.errors };

  const out = {};
  const infoEntriesOut = new Map();
  const infoUsed = new Set();
  const errors = [];
  for (const { page, file, nodes } of pageDrafts) {
    try {
      const expanded = await expandPage(nodes, {
        file,
        page,
        multi: false,
        termKeys: new Set(),
        sourcesById: new Map(),
        pageIds: pageIds || new Map(pageDrafts.map((d) => [d.page.id, d.page.id])),
        repo,
        citeRegistry: createCiteRegistry(),
        lookup: createLookup({ artifactDir: MINI_ARTIFACT, pluginRoot: REAL_PLUGIN_ROOT }),
        artifactDir: MINI_ARTIFACT,
        diagramModuleCache: new Map(),
        generatorOutputs: new Map(),
        infoLocal: registry.byPage.get(page.id) || new Map(),
        infoGlobal: registry.global,
        infoUsed,
        infoEntriesOut,
      });
      out[page.id] = serialize(expanded);
    } catch (err) {
      errors.push(err.message);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, html: out, infoEntriesOut, infoUsed };
}

test("x-info: resolves against a same-page x-info-body, emits a real link + data-info-target", async () => {
  const { ok, html, infoEntriesOut } = await expandWithRegistry({
    pages: { p: '<x-info k="a">label</x-info><x-info-body k="a" title="A"><p>detail</p></x-info-body>' },
  });
  assert.equal(ok, true);
  assert.equal(
    html.p,
    '<a class="ex-info-trigger" data-info="a" data-info-target="info--p--a" data-info-mode="panel" href="#info--p--a">label</a>'
  );
  // Removed from flow — the body never appears where it was authored;
  // handleInfoBody instead renders it once into ctx.infoEntriesOut, which
  // lib/build.mjs reads to build the page's "More detail" fallback.
  assert.match(infoEntriesOut.get("p")[0], /<div class="ex-info-entry" id="info--p--a"/);
});

test("x-info: unknown key is a build error with file:line", async () => {
  const { ok, errors } = await expandWithRegistry({ pages: { p: '<x-info k="nope">x</x-info>' } });
  assert.equal(ok, false);
  assert.match(errors[0], /pages\/p\.html:1: x-info k="nope": unknown info key "nope"/);
});

test("x-info: a trigger with no accessible text is a build error", async () => {
  const { ok, errors } = await expandWithRegistry({
    pages: { p: '<x-info k="a"><span></span></x-info><x-info-body k="a" title="A"><p>d</p></x-info-body>' },
  });
  assert.equal(ok, false);
  assert.match(errors[0], /x-info k="a": trigger has no accessible text/);
});

test("data-info on an arbitrary element (div/li/td/tr/svg g) resolves the same way as x-info", async () => {
  const page =
    '<div data-info="a">d</div><li data-info="a">l</li><td data-info="a">t</td><tr data-info="a"><td>r</td></tr>' +
    '<svg><g data-info="a"></g></svg>' +
    '<x-info-body k="a" title="A"><p>detail</p></x-info-body>';
  const { ok, html } = await expandWithRegistry({ pages: { p: page } });
  assert.equal(ok, true, JSON.stringify(html));
  assert.equal((html.p.match(/data-info-target="info--p--a"/g) || []).length, 5);
});

test("data-panel is a thin alias for data-info — same resolution, same data-info-target", async () => {
  const { ok, html } = await expandWithRegistry({
    pages: { p: '<span data-panel="a" tabindex="0">x</span><x-info-body k="a" title="A"><p>d</p></x-info-body>' },
  });
  assert.equal(ok, true);
  assert.match(html.p, /data-panel="a"/);
  assert.match(html.p, /data-info-target="info--p--a"/);
});

test("data-info/data-panel: unknown key is a build error naming the page", async () => {
  const { ok, errors } = await expandWithRegistry({ pages: { p: '<div data-info="nope">x</div>' } });
  assert.equal(ok, false);
  assert.match(errors[0], /unknown info key "nope" on page "p"/);
});

test("x-info-body: nested x-term/x-cite/x-file/x-info expand inside the body before it's wrapped into an entry", async () => {
  const pageDrafts = [draft("p", '<x-info-body k="a" title="A"><p>see <x-info k="b">b</x-info></p></x-info-body><x-info-body k="b" title="B"><p>d</p></x-info-body>')];
  const registry = collectInfoBodies({ pageDrafts });
  assert.equal(registry.ok, true, JSON.stringify(registry.errors));
  const expanded = await expandPage(pageDrafts[0].nodes, {
    file: "pages/p.html",
    page: { id: "p", panels: [] },
    multi: false,
    termKeys: new Set(),
    sourcesById: new Map(),
    pageIds: new Map([["p", "P"]]),
    repo: undefined,
    citeRegistry: createCiteRegistry(),
    lookup: createLookup({ artifactDir: MINI_ARTIFACT, pluginRoot: REAL_PLUGIN_ROOT }),
    artifactDir: MINI_ARTIFACT,
    diagramModuleCache: new Map(),
    generatorOutputs: new Map(),
    infoLocal: registry.byPage.get("p"),
    infoGlobal: registry.global,
    infoUsed: new Set(),
    infoEntriesOut: new Map(),
  });
  const html = serialize(expanded);
  // Both x-info-body elements removed from flow; the nested trigger inside
  // "a"'s body already resolved to a real anchor pointing at "b" — this is
  // only observable once lib/build.mjs renders the entries (the flow
  // itself is empty here), so assert via the shared infoEntriesOut isn't
  // available at this level; instead prove the page's own flow is empty
  // and no x-info-body/x-info survive unexpanded.
  assert.equal(html.trim(), "");
});

test("x-info-body: nested trigger content surfaces in the rendered entry via a full build", async () => {
  const dir = makeArtifact({
    p: '<x-info-body k="a" title="A"><p>see <x-info k="b">b</x-info></p></x-info-body><x-info-body k="b" title="B"><p>d</p></x-info-body>',
  });
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(
      html,
      /<div class="ex-info-entry" id="info--p--a"[\s\S]*?<a class="ex-info-trigger" data-info="b" data-info-target="info--p--b" data-info-mode="panel" href="#info--p--b">b<\/a>/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ========================================================= 3. full build() integration
//
// Same artifact-fixture shape as scripts/test/patterns.test.mjs's
// makeArtifact — a throwaway temp dir with its own local profile and brand
// "neutral" (the real committed core/brand/neutral.css).

function makeArtifact(pagesById, { terms = [], repo, live } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-info-"));
  fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
  fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  const pages = [];
  for (const [id, html] of Object.entries(pagesById)) {
    fs.writeFileSync(path.join(dir, "pages", `${id}.html`), html);
    pages.push({ id, title: id[0].toUpperCase() + id.slice(1), group: "start", type: "short-answer" });
  }
  pages.push({ id: "generated-terms", title: "Terms", group: "start", type: "generated-terms" });
  const contents = {
    schema: 1,
    title: "Info Test Demo",
    kind: "test-profile",
    brand: "neutral",
    voice: "none",
    groups: [{ id: "start", title: "Start here" }],
    pages,
    terms,
    sources: [],
    rules: { off: [], on: [] },
    live: live || { comments: false, presenter: false },
    publish: { url: null, shape: "single" },
  };
  if (repo) contents.repo = repo;
  fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
  return dir;
}

test("build(): page-scoped fallback renders once per page, each with its own page-prefixed id", async () => {
  const dir = makeArtifact({
    overview: '<x-info-body k="n" title="N"><p>overview detail</p></x-info-body>',
    other: '<x-info-body k="n" title="N2"><p>other detail</p></x-info-body>',
  });
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /id="info--overview--n"[\s\S]*overview detail/);
    assert.match(html, /id="info--other--n"[\s\S]*other detail/);
    assert.equal((html.match(/class="ex-info-fallback"/g) || []).length, 2); // one per authoring page
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build(): a global-scope body is embedded once in single-shape, once per file in --multi", async () => {
  const dir = makeArtifact({
    overview: '<x-info k="g">see</x-info><x-info-body k="g" title="G" scope="global"><p>global detail</p></x-info-body>',
    other: '<x-info k="g">see too</x-info>',
  });
  try {
    const single = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(single.ok, true, JSON.stringify(single.errors || single.missing));
    const singleHtml = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.equal((singleHtml.match(/id="info--g"/g) || []).length, 1);
    assert.match(singleHtml, /data-info-target="info--g"/);
    fs.rmSync(path.join(dir, "dist"), { recursive: true, force: true });

    const multi = await build({ dir, multi: true, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(multi.ok, true, JSON.stringify(multi.errors || multi.missing));
    const name = path.basename(dir);
    const overviewHtml = fs.readFileSync(path.join(dir, "dist", name, "overview.html"), "utf8");
    const otherHtml = fs.readFileSync(path.join(dir, "dist", name, "other.html"), "utf8");
    assert.match(overviewHtml, /id="info--g"/);
    assert.match(otherHtml, /id="info--g"/); // embedded on every file — a cross-file trigger always finds its target locally
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build(): legacy contents.json pages[].panels[] still renders through the same fallback/entry markup", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-info-legacy-"));
  try {
    fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
    fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), '<span data-panel="legacy" tabindex="0">x</span>');
    const contents = {
      schema: 1,
      title: "Info Legacy Demo",
      kind: "test-profile",
      brand: "neutral",
      voice: "none",
      groups: [{ id: "start", title: "Start here" }],
      pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer", panels: [{ key: "legacy", title: "Legacy", body: "<p>old</p>" }] }],
      terms: [],
      sources: [],
      rules: { off: [], on: [] },
      live: { comments: false, presenter: false },
      publish: { url: null, shape: "single" },
    };
    fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /data-panel="legacy"[^>]*data-info-target="info--overview--legacy"/);
    assert.match(html, /<div class="ex-info-entry" id="info--overview--legacy"[\s\S]*<p>old<\/p>/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build(): a body nothing ever triggers is reported as an unused-info warning, non-fatal", async () => {
  const dir = makeArtifact({ overview: '<x-info-body k="orphan" title="Orphan"><p>never clicked</p></x-info-body>' });
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    assert.ok(result.infoUnused.some((w) => w.includes('"orphan"') && w.includes('page "overview"')), JSON.stringify(result.infoUnused));
    const report = fs.readFileSync(path.join(dir, "dist", "build-report.md"), "utf8");
    assert.match(report, /## Unused info bodies/);
    assert.match(report, /orphan/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build(): a term's 'Full definition on Terms' link is correct in both single (bare anchor) and --multi (page.html#anchor) shapes", async () => {
  const dir = makeArtifact(
    { overview: '<p><x-term k="a">a</x-term></p>' },
    { terms: [{ key: "a", term: "A", def: "def a", see: "b" }, { key: "b", term: "B", def: "def b" }] }
  );
  try {
    const single = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(single.ok, true, JSON.stringify(single.errors || single.missing));
    const singleHtml = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(singleHtml, /"seeHref":"#terms--b"/);
    fs.rmSync(path.join(dir, "dist"), { recursive: true, force: true });

    const multi = await build({ dir, multi: true, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(multi.ok, true, JSON.stringify(multi.errors || multi.missing));
    const name = path.basename(dir);
    const overviewHtml = fs.readFileSync(path.join(dir, "dist", name, "overview.html"), "utf8");
    assert.match(overviewHtml, /"seeHref":"generated-terms\.html#terms--b"/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build(): files=/see= attributes render the files/see footer with real GitHub/page links", async () => {
  const dir = makeArtifact(
    {
      overview:
        '<x-info-body k="a" title="A" files="pages/overview.html:1" see="overview"><p>d</p></x-info-body>',
    },
    { repo: { github: "example-org/example-repo", ref: "main" } }
  );
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
    const html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.match(html, /<div class="ex-info-files"><h4>Files<\/h4>.*href="https:\/\/github\.com\/example-org\/example-repo\/blob\/main\/pages\/overview\.html#L1"/);
    assert.match(html, /<div class="ex-info-see"><h4>See<\/h4>.*href="#overview">Overview/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build(): duplicate/colliding info keys fail the build at the expand step", async () => {
  const dir = makeArtifact({
    overview: '<x-info-body k="a" title="A"><p>1</p></x-info-body><x-info-body k="a" title="A2"><p>2</p></x-info-body>',
  });
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.step, "expand");
    assert.ok(result.errors.some((e) => e.includes('duplicate info key "a"')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ======================================================== 4. info.js runtime (node:vm)
//
// A hand-rolled, minimal DOM — the same shape/technique as
// scripts/test/live-wiring.test.mjs's FakeElement/makeFakeDocument, extended
// with `closest`/`contains`/a real `innerHTML` setter (backed by
// lib/markup.mjs's own parser — building real child FakeElements, not just
// storing a string) since info.js relies on all three.

class FakeElement {
  constructor(tag, attrs = {}) {
    this.tagName = String(tag).toUpperCase();
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this._listeners = {};
    this._text = "";
    this.style = {};
    this.offsetWidth = 100;
    this.offsetHeight = 40;
  }
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }
  get id() {
    return this.attrs.id || "";
  }
  set id(v) {
    this.attrs.id = v;
  }
  get className() {
    return this.attrs.class || "";
  }
  set className(v) {
    this.attrs.class = v;
  }
  // Backed by the live `class` attribute (same source as `className`
  // above) — added for cross-file shell.js+info.js test,
  // the first here to actually load core/shell/shell.js's click handler
  // (`a.classList.contains("ex-term")`) under node:vm.
  get classList() {
    const attrs = this.attrs;
    function list() {
      return (attrs.class || "").split(/\s+/).filter(Boolean);
    }
    return {
      contains: (name) => list().includes(name),
      add: (name) => {
        const l = list();
        if (!l.includes(name)) l.push(name);
        attrs.class = l.join(" ");
      },
      remove: (name) => {
        attrs.class = list()
          .filter((c) => c !== name)
          .join(" ");
      },
      toggle: (name) => {
        const l = list();
        const idx = l.indexOf(name);
        if (idx === -1) {
          l.push(name);
          attrs.class = l.join(" ");
          return true;
        }
        l.splice(idx, 1);
        attrs.class = l.join(" ");
        return false;
      },
    };
  }
  get hidden() {
    return Object.prototype.hasOwnProperty.call(this.attrs, "hidden");
  }
  set hidden(v) {
    if (v) this.attrs.hidden = "";
    else delete this.attrs.hidden;
  }
  get textContent() {
    if (this.children.length === 0) return this._text;
    return this.children.map((c) => c.textContent || "").join("");
  }
  set textContent(v) {
    this._text = String(v);
    this.children = [];
  }
  get innerHTML() {
    // Real innerHTML: serialize actual children back to markup, not a
    // cached source string — a nested element (e.g. `.ex-info-entry-body`
    // read off a static page fixture) was never itself the *target* of an
    // `innerHTML =` assignment, only a side effect of parsing its ancestor's.
    if (this.children.length > 0) return this.children.map((c) => c.outerHTML).join("");
    return this._text || "";
  }
  set innerHTML(html) {
    this.children = fakeChildrenFromHtml(html);
    this.children.forEach((c) => {
      c.parent = this;
    });
    this._text = "";
  }
  get outerHTML() {
    const attrStr = Object.entries(this.attrs)
      .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v}"`))
      .join("");
    return `<${this.tagName.toLowerCase()}${attrStr}>${this.innerHTML}</${this.tagName.toLowerCase()}>`;
  }
  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }
  removeAttribute(name) {
    delete this.attrs[name];
  }
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }
  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }
  // Added for nested popover (info.js's
  // bindNestedReposition/unbindNestedReposition bind/unbind a 'scroll'
  // listener directly on the panel's own box element, a real DOM API this
  // harness had no need to exercise on an *element* before — only on the
  // sandbox-level `window` stand-in, which already had its own copy below).
  removeEventListener(type, fn) {
    const list = this._listeners[type] || [];
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  }
  dispatch(type, extra = {}) {
    (this._listeners[type] || []).forEach((fn) => fn({ target: this, preventDefault() {}, key: extra.key }));
  }
  contains(other) {
    let cur = other;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parent;
    }
    return false;
  }
  closest(selector) {
    const branches = selector.split(",").map(parseCompound);
    let cur = this;
    while (cur && cur instanceof FakeElement) {
      if (branches.some((b) => elementMatches(cur, b))) return cur;
      cur = cur.parent;
    }
    return null;
  }
  querySelector(sel) {
    const r = queryAll(this, sel);
    return r.length ? r[0] : null;
  }
  querySelectorAll(sel) {
    return queryAll(this, sel);
  }
  getBoundingClientRect() {
    return { left: 10, right: 110, top: 10, bottom: 30, width: 100, height: 20 };
  }
  focus() {
    this.dispatch("focus");
  }
  scrollIntoView() {
    this._scrolledIntoView = (this._scrolledIntoView || 0) + 1;
  }
}

function parseCompound(sel) {
  let s = sel.trim();
  const out = { tag: null, classes: [], attrsReq: [], attrsForbid: [] };
  let notMatch = s.match(/:not\(\[([a-zA-Z0-9-]+)\]\)/);
  while (notMatch) {
    out.attrsForbid.push(notMatch[1]);
    s = s.slice(0, notMatch.index) + s.slice(notMatch.index + notMatch[0].length);
    notMatch = s.match(/:not\(\[([a-zA-Z0-9-]+)\]\)/);
  }
  s = s.replace(/\[([a-zA-Z0-9-]+)(?:="([^"]*)")?\]/g, (_m, name, val) => {
    out.attrsReq.push({ name, val });
    return "";
  });
  s = s.replace(/\.([a-zA-Z0-9-]+)/g, (_m, cls) => {
    out.classes.push(cls);
    return "";
  });
  s = s.trim();
  if (s) out.tag = s.toUpperCase();
  return out;
}

function elementMatches(el, compound) {
  if (!(el instanceof FakeElement)) return false;
  if (compound.tag && el.tagName !== compound.tag) return false;
  const classes = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
  for (const c of compound.classes) if (!classes.includes(c)) return false;
  for (const a of compound.attrsReq) {
    if (!el.hasAttribute(a.name)) return false;
    if (a.val !== undefined && el.getAttribute(a.name) !== a.val) return false;
  }
  for (const a of compound.attrsForbid) if (el.hasAttribute(a)) return false;
  return true;
}

function queryAll(root, selector) {
  const branches = selector.split(",").map(parseCompound);
  const out = [];
  (function walk(el) {
    for (const child of el.children) {
      if (!(child instanceof FakeElement)) continue; // FakeText never matches, never has its own children
      if (branches.some((b) => elementMatches(child, b))) out.push(child);
      walk(child);
    }
  })(root);
  return out;
}

/** A bare text node — just enough to survive mixed content ("plain text <a>link</a> more text") round-tripping through innerHTML/textContent; never matched by a CSS selector. */
class FakeText {
  constructor(text) {
    this.text = text;
  }
  get textContent() {
    return this.text;
  }
  get outerHTML() {
    return this.text;
  }
}

function fakeChildrenFromHtml(html) {
  const nodes = parse(html, { file: "fake.html" });
  function convert(ns) {
    const out = [];
    for (const n of ns) {
      if (n.type === "text") {
        out.push(new FakeText(n.value));
        continue;
      }
      if (n.type !== "element") continue; // comments: skip
      const el = new FakeElement(n.tag, n.attrs);
      el.children = convert(n.children);
      el.children.forEach((c) => {
        if (c instanceof FakeElement) c.parent = el;
      });
      out.push(el);
    }
    return out;
  }
  return convert(nodes);
}

function makeFakeDocument(topChildren, extra = {}) {
  const root = new FakeElement("#root");
  topChildren.forEach((c) => root.appendChild(c));
  return {
    readyState: extra.readyState || "complete",
    _listeners: {},
    addEventListener(type, fn) {
      (this._listeners[type] = this._listeners[type] || []).push(fn);
    },
    dispatch(type, target, extra = {}) {
      // `extra` added for Esc-key tests — the only
      // callers needing anything beyond `target` (every "click" dispatch
      // above and below this still passes none, so `evt.key` stays
      // `undefined` there, same as always).
      const evt = Object.assign({ target, defaultPrevented: false }, extra);
      evt.preventDefault = () => {
        evt.defaultPrevented = true;
      };
      (this._listeners[type] || []).forEach((fn) => fn(evt));
      return evt;
    },
    getElementById(id) {
      let found = null;
      (function walk(el) {
        if (found) return;
        if (el.attrs && el.attrs.id === id) {
          found = el;
          return;
        }
        el.children.forEach((c) => {
          if (c instanceof FakeElement) walk(c);
        });
      })(root);
      return found;
    },
    querySelector(sel) {
      return root.querySelector(sel);
    },
    querySelectorAll(sel) {
      return root.querySelectorAll(sel);
    },
    createElement(tag) {
      return new FakeElement(tag);
    },
    body: root,
    documentElement: new FakeElement("html"),
  };
}

/**
 * A minimal `window.ExShell` stand-in (deep-link-navigation
 * fix) — real enough to exercise `openByKey`'s navigation decision without
 * reimplementing shell.js: `navigateTo` actually flips which page is
 * `hidden`, same observable effect shell.js's own `showPage` has, so a test
 * can assert on `page.hidden` after the call exactly like it would against
 * a real build. `pages` is the same FakeElement array passed to
 * `makeFakeDocument`.
 */
function makeShellStub(pages) {
  function currentPageId() {
    const visible = pages.find((p) => !p.hidden);
    return visible ? visible.attrs.id : null;
  }
  function navigateTo(pageId) {
    if (!pages.some((p) => p.attrs.id === pageId)) return;
    pages.forEach((p) => {
      p.hidden = p.attrs.id !== pageId;
    });
  }
  return { currentPageId, navigateTo };
}

function runInfoJs({ topChildren, hash = "", readyState = "complete", shell = null, innerWidth = 1024 } = {}) {
  const infoSrc = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "patterns", "info", "info.js"), "utf8");
  const document_ = makeFakeDocument(topChildren, { readyState });
  const sandbox = {};
  sandbox.document = document_;
  sandbox.location = { hash };
  // `innerWidth` added for phone-sheet regression test
  // (the nested popover, which is always `data-mode="popover"`, must never
  // get an inline left/width at phone widths — info.js's own open-time/
  // reposition-time width<=640 guard is what this test exercises; the
  // actual phone-width CSS fix lives in info.css and needs a real browser,
  // a judgment call).
  sandbox.innerWidth = innerWidth;
  sandbox._listeners = {};
  sandbox.addEventListener = function (type, fn) {
    (sandbox._listeners[type] = sandbox._listeners[type] || []).push(fn);
  };
  sandbox.removeEventListener = function (type, fn) {
    const list = sandbox._listeners[type] || [];
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  };
  sandbox.window = sandbox;
  if (shell) sandbox.ExShell = shell;
  sandbox.requestAnimationFrame = (fn) => fn();
  sandbox.setTimeout = (fn) => fn(); // synchronous for these tests: suppressReopen's own test below exercises it directly instead
  sandbox.console = console;
  vm.createContext(sandbox);
  vm.runInContext(infoSrc, sandbox, { timeout: 2000 });
  return { sandbox, document: document_ };
}

function findInfoBox(document_) {
  return document_.body.children.find((c) => c.attrs && c.attrs.class === "ex-info");
}

/**
 * Loads the real core/shell/shell.js *and* info.js into one sandbox, same
 * concatenation order the real build uses (lib/shell.mjs's
 * `[shellJs, patternsJs].join(...)`) — needed only for the in-page
 * `#info=<key>` click test below, which exercises both files' document-
 * level "click" listeners together (shell's registered first, same as a
 * real page's inline `<script>`). A minimal `history`/`scrollTo` stub is
 * enough for shell.js to load and run: `pushState`/`replaceState` update
 * `sandbox.location.hash` from the url argument, the one effect either
 * file's code depends on.
 */
function runShellAndInfoJs({ topChildren, hash = "", readyState = "complete" } = {}) {
  const shellSrc = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "shell", "shell.js"), "utf8");
  const infoSrc = fs.readFileSync(path.join(REAL_PLUGIN_ROOT, "core", "patterns", "info", "info.js"), "utf8");
  const document_ = makeFakeDocument(topChildren, { readyState });
  const sandbox = {};
  sandbox.document = document_;
  sandbox.location = { hash };
  sandbox.innerWidth = 1024;
  sandbox._listeners = {};
  sandbox.addEventListener = function (type, fn) {
    (sandbox._listeners[type] = sandbox._listeners[type] || []).push(fn);
  };
  sandbox.removeEventListener = function (type, fn) {
    const list = sandbox._listeners[type] || [];
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  };
  sandbox.window = sandbox;
  sandbox.scrollTo = () => {};
  function applyUrlToLocation(url) {
    if (url === undefined || url === null) return;
    const s = String(url);
    const hashIdx = s.indexOf("#");
    sandbox.location.hash = hashIdx !== -1 ? s.slice(hashIdx) : "";
  }
  sandbox.history = {
    scrollRestoration: "auto",
    pushState: (_state, _title, url) => applyUrlToLocation(url),
    replaceState: (_state, _title, url) => applyUrlToLocation(url),
  };
  sandbox.requestAnimationFrame = (fn) => fn();
  sandbox.setTimeout = (fn) => fn();
  sandbox.console = console;
  vm.createContext(sandbox);
  vm.runInContext(shellSrc, sandbox, { timeout: 2000 });
  vm.runInContext(infoSrc, sandbox, { timeout: 2000 });
  return { sandbox, document: document_ };
}

/**
 * Simulates a real browser's click on an in-page `<a href="#...">`: runs
 * every document-level "click" listener in registration order (shell.js's
 * then info.js's — same event, same order the real concatenated `<script>`
 * gives them) and, only when nothing called `preventDefault()`, performs
 * the one thing a fake DOM can't do on its own — the browser's own default
 * action for an unprevented same-document anchor click: changes
 * `location.hash` and fires `hashchange`, but only when the hash value
 * actually changes (a real browser never fires `hashchange` for a
 * same-value "change" — the mechanism "click the same deep
 * link twice" fix depends on).
 */
function simulateAnchorClick(document_, sandbox, anchorEl) {
  const evt = document_.dispatch("click", anchorEl);
  if (evt.defaultPrevented) return;
  const href = anchorEl.getAttribute("href") || "";
  if (!href.startsWith("#") || href === sandbox.location.hash) return;
  sandbox.location.hash = href;
  (sandbox._listeners.hashchange || []).forEach((fn) => fn({ target: sandbox }));
}

test("info.js: a bare [data-info]/[data-panel] trigger opens its entry; role is added only when absent (never overwritten)", () => {
  const withRole = new FakeElement("div", { "data-info-target": "info--p--a", role: "listitem" });
  const withoutRole = new FakeElement("span", { "data-info-target": "info--p--b" });
  const entryA = new FakeElement("div", { class: "ex-info-entry", id: "info--p--a", "data-info-key": "a", "data-info-mode": "panel" });
  entryA.innerHTML = '<div class="ex-info-entry-title">A</div><div class="ex-info-entry-body"><p>detail a</p></div>';
  const entryB = new FakeElement("div", { class: "ex-info-entry", id: "info--p--b", "data-info-key": "b", "data-info-mode": "panel" });
  entryB.innerHTML = '<div class="ex-info-entry-title">B</div><div class="ex-info-entry-body"><p>detail b</p></div>';
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(withRole);
  page.appendChild(withoutRole);
  page.appendChild(entryA);
  page.appendChild(entryB);

  const { document: document_ } = runInfoJs({ topChildren: [page] });

  // decorateTriggers ran at module init: role preserved on withRole, added on withoutRole.
  assert.equal(withRole.getAttribute("role"), "listitem");
  assert.equal(withoutRole.getAttribute("role"), "button");
  assert.equal(withoutRole.getAttribute("tabindex"), "0");

  document_.dispatch("click", withoutRole);
  const box = findInfoBox(document_);
  assert.ok(box, "expected the info dialog root to be created");
  assert.equal(box.hidden, false);
  const bodyEl = box.querySelector(".ex-info-body");
  assert.match(bodyEl.innerHTML, /detail b/);
});

test("info.js: close() restoring focus to the trigger never reopens it (defect #2)", () => {
  const trigger = new FakeElement("span", { "data-info-target": "info--p--a" });
  trigger.focus = function () {
    this.dispatch("focus");
  };
  const entry = new FakeElement("div", { class: "ex-info-entry", id: "info--p--a", "data-info-key": "a", "data-info-mode": "panel" });
  entry.innerHTML = '<div class="ex-info-entry-title">A</div><div class="ex-info-entry-body"><p>d</p></div>';
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(trigger);
  page.appendChild(entry);
  const { sandbox, document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", trigger);
  const box = findInfoBox(document_);
  assert.equal(box.hidden, false);

  sandbox.ExplainerInfo.close();
  assert.equal(box.hidden, true);
  // Simulate the reopen attempt happening synchronously inside close()'s own
  // focus()-return window (this test's sandbox.setTimeout runs its callback
  // synchronously too, so by the time we get here the guard has already
  // cleared itself via that queued callback — dispatching a *fresh* click
  // confirms a real, later interaction still works, which is the other half
  // of the fix: the guard must not get stuck permanently).
  document_.dispatch("click", trigger);
  assert.equal(box.hidden, false);
});

test("info.js: seq prev/next navigates an ordered chain of entries", () => {
  function makeEntry(key, order) {
    const e = new FakeElement("div", {
      class: "ex-info-entry",
      id: "info--p--" + key,
      "data-info-key": key,
      "data-info-mode": "panel",
      "data-info-seq": "walk",
      "data-info-order": String(order),
    });
    e.innerHTML = `<div class="ex-info-entry-title">${key.toUpperCase()}</div><div class="ex-info-entry-body"><p>detail ${key}</p></div>`;
    return e;
  }
  const trigger = new FakeElement("span", { "data-info-target": "info--p--a" });
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(trigger);
  page.appendChild(makeEntry("a", 1));
  page.appendChild(makeEntry("b", 2));
  page.appendChild(makeEntry("c", 3));
  const { document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", trigger);
  const box = findInfoBox(document_);
  const nav = box.querySelector(".ex-info-nav");
  assert.equal(nav.hidden, false);
  const prevBtn = nav.querySelector(".ex-info-prev");
  assert.equal(prevBtn.hasAttribute("disabled"), true, "first in the chain: prev is disabled");

  nav.querySelector(".ex-info-next").dispatch("click");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail b/);
  const nav2 = box.querySelector(".ex-info-nav");
  assert.equal(nav2.querySelector(".ex-info-prev").hasAttribute("disabled"), false);
  assert.equal(nav2.querySelector(".ex-info-next").hasAttribute("disabled"), false);

  nav2.querySelector(".ex-info-next").dispatch("click");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail c/);
  assert.equal(box.querySelector(".ex-info-nav").querySelector(".ex-info-next").hasAttribute("disabled"), true, "last in the chain: next is disabled");
});

test("info.js: a nested trigger inside an open body opens its own entry (event delegation)", () => {
  const trigger = new FakeElement("span", { "data-info-target": "info--p--a" });
  const entryA = new FakeElement("div", { class: "ex-info-entry", id: "info--p--a", "data-info-key": "a", "data-info-mode": "panel" });
  entryA.innerHTML =
    '<div class="ex-info-entry-title">A</div><div class="ex-info-entry-body"><p>see ' +
    '<a class="ex-info-trigger" data-info="b" data-info-target="info--p--b" href="#info--p--b">b</a></p></div>';
  const entryB = new FakeElement("div", { class: "ex-info-entry", id: "info--p--b", "data-info-key": "b", "data-info-mode": "panel" });
  entryB.innerHTML = '<div class="ex-info-entry-title">B</div><div class="ex-info-entry-body"><p>detail b</p></div>';
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(trigger);
  page.appendChild(entryA);
  page.appendChild(entryB);
  const { document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", trigger);
  const box = findInfoBox(document_);
  const nested = box.querySelector(".ex-info-body").querySelector("[data-info-target]");
  assert.ok(nested, "expected the nested trigger to be a real, queryable element inside the open body");
  assert.equal(nested.getAttribute("data-info-target"), "info--p--b");

  document_.dispatch("click", nested);
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail b/);
});

test("info.js: #info=<key> deep link opens on load", () => {
  const entry = new FakeElement("div", { class: "ex-info-entry", id: "info--g", "data-info-key": "g", "data-info-mode": "panel", "data-info-scope": "global" });
  entry.innerHTML = '<div class="ex-info-entry-title">G</div><div class="ex-info-entry-body"><p>deep linked</p></div>';
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(entry);
  const { document: document_ } = runInfoJs({ topChildren: [page], hash: "#info=g" });

  const box = findInfoBox(document_);
  assert.ok(box, "expected the dialog to open on load from the deep link");
  assert.equal(box.hidden, false);
  assert.match(box.querySelector(".ex-info-body").innerHTML, /deep linked/);
});

test("info.js: a term deep-linked from another page navigates there first (ExShell.navigateTo), then anchors the popover to the real, now-visible trigger and scrolls it into view (defect #6)", () => {
  const termTrigger = new FakeElement("a", { class: "ex-term", "data-term": "idemp" });
  const pageA = new FakeElement("section", { class: "ex-page", id: "architecture" });
  pageA.hidden = true; // not the page currently showing
  pageA.appendChild(termTrigger);

  const pageB = new FakeElement("section", { class: "ex-page", id: "start-here" });
  pageB.hidden = false; // the page currently showing — no trigger for this key lives here

  const termsScript = new FakeElement("script", { type: "application/json", id: "ex-terms-data" });
  termsScript.textContent = JSON.stringify([{ key: "idemp", term: "Idempotency key", def: "def text" }]);
  pageB.appendChild(termsScript);

  const shell = makeShellStub([pageA, pageB]);
  const { document: document_ } = runInfoJs({ topChildren: [pageA, pageB], hash: "#info=idemp", shell });

  assert.equal(pageA.hidden, false, "navigateTo should have shown the trigger's own page");
  assert.equal(pageB.hidden, true, "the previously-current page should now be hidden");

  const box = findInfoBox(document_);
  assert.ok(box, "expected the dialog to open");
  assert.equal(box.getAttribute("data-mode"), "popover", "a live, now-visible trigger exists — must anchor as a popover, not fall back to a panel");
  assert.ok(termTrigger._scrolledIntoView >= 1, "the real trigger should be scrolled into view");
});

test("info.js: a popover-mode entry deep-linked with no live trigger anywhere opens as a panel instead (never an unanchored popover, defect #6)", () => {
  const entry = new FakeElement("div", {
    class: "ex-info-entry",
    id: "info--order-service-def",
    "data-info-key": "order-service-def",
    "data-info-mode": "popover",
  });
  entry.innerHTML =
    '<div class="ex-info-entry-title">What is the order service?</div><div class="ex-info-entry-body"><p>def text</p></div>';
  const page = new FakeElement("section", { class: "ex-page", id: "architecture" });
  page.appendChild(entry);
  // Deliberately no element anywhere carries data-info-target="info--order-service-def".

  const shell = makeShellStub([page]);
  const { document: document_ } = runInfoJs({ topChildren: [page], hash: "#info=order-service-def", shell });

  const box = findInfoBox(document_);
  assert.ok(box, "expected the dialog to open");
  assert.equal(box.getAttribute("data-mode"), "panel", "no live trigger to anchor to — must fall back to a panel, never an unanchored popover");
});

test('info.js + shell.js: an in-page <a href="#info=key"> click opens its panel; clicking the same link again after close reopens it', () => {
  const entry = new FakeElement("div", {
    class: "ex-info-entry",
    id: "info--order-service-def",
    "data-info-key": "order-service-def",
    "data-info-mode": "panel",
  });
  entry.innerHTML =
    '<div class="ex-info-entry-title">What is the order service?</div><div class="ex-info-entry-body"><p>def text</p></div>';
  // A hand-authored prose deep link — never stamped data-info-target (only
  // <x-info>/data-info/data-panel triggers are); info.js's own click
  // delegation must not be what opens it, same as a real build.
  const link = new FakeElement("a", { href: "#info=order-service-def" });
  link.innerHTML = "open it";

  const page1 = new FakeElement("section", { class: "ex-page", id: "p1" });
  page1.appendChild(link);
  page1.appendChild(entry);
  const page2 = new FakeElement("section", { class: "ex-page", id: "p2" }); // only to make isSingle true (pages.length > 1)
  page2.hidden = true;

  const { sandbox, document: document_ } = runShellAndInfoJs({ topChildren: [page1, page2] });

  simulateAnchorClick(document_, sandbox, link);
  let box = findInfoBox(document_);
  assert.ok(box, "expected the click to open the dialog (shell.js must not have swallowed it)");
  assert.equal(box.hidden, false);
  assert.match(box.querySelector(".ex-info-body").innerHTML, /def text/);

  sandbox.ExplainerInfo.close();
  assert.equal(box.hidden, true);
  assert.notEqual(sandbox.location.hash, "#info=order-service-def", "close() must clear the deep-link hash so a repeat click is a real hash change");

  simulateAnchorClick(document_, sandbox, link);
  box = findInfoBox(document_);
  assert.equal(box.hidden, false, "clicking the exact same deep link again must reopen it");
});

test("info.js: a term popover opens via data-term, using the build-precomputed seeHref (defect #1)", () => {
  const trigger = new FakeElement("a", { class: "ex-term", "data-term": "port" });
  const termsScript = new FakeElement("script", { type: "application/json", id: "ex-terms-data" });
  termsScript.textContent = JSON.stringify([{ key: "port", term: "port", def: "a fixed plug shape", see: "adapter", seeHref: "#terms--adapter" }]);
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(trigger);
  page.appendChild(termsScript);
  const { document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", trigger);
  const box = findInfoBox(document_);
  assert.equal(box.hidden, false);
  assert.match(box.querySelector(".ex-info-body").innerHTML, /a fixed plug shape/);
  assert.match(box.querySelector(".ex-info-body").innerHTML, /href="#terms--adapter"/);
});

// ============================================ 4b. nested triggers
//
// The operator's own repro (Amendment 2026-10-08 (2)): a
// panel-mode "orderId" trigger opens a panel whose body contains a
// popover-mode term trigger ("order ID") — clicking it used to replace the
// panel body (destroying the term trigger) and pin the popover at (0,0).
// `findNestedInfoBox` mirrors `findInfoBox` above but for the SECOND,
// independent dialog node (class "ex-info ex-info-nested") info.js appends
// once a nested popover first opens.

function findNestedInfoBox(document_) {
  return document_.body.children.find((c) => c.attrs && c.attrs.class === "ex-info ex-info-nested");
}

/** The operator's own shape: a panel-mode entry ("orderId") whose body carries a popover-mode term trigger ("order ID") — real `a.ex-term` markup, not a second `data-info` entry, same as the real demo. */
function buildPanelWithNestedTermFixture(options = {}) {
  const outerTrigger = new FakeElement("span", { "data-info-target": "info--p--order" });
  const orderEntry = new FakeElement("div", {
    class: "ex-info-entry",
    id: "info--p--order",
    "data-info-key": "order",
    "data-info-mode": "panel",
  });
  orderEntry.innerHTML =
    '<div class="ex-info-entry-title">orderId</div>' +
    '<div class="ex-info-entry-body"><p>The <a class="ex-term" data-term="order-id">order ID</a> assigned at creation.</p></div>';
  const termsScript = new FakeElement("script", { type: "application/json", id: "ex-terms-data" });
  termsScript.textContent = JSON.stringify([{ key: "order-id", term: "Order ID", def: "The identifier assigned when the order was first created." }]);
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(outerTrigger);
  page.appendChild(orderEntry);
  page.appendChild(termsScript);

  const { sandbox, document: document_ } = runInfoJs({ topChildren: [page], innerWidth: options.innerWidth });
  document_.dispatch("click", outerTrigger);
  const panelBox = findInfoBox(document_);
  const termTrigger = panelBox.querySelector(".ex-info-body").querySelector("a.ex-term");
  return { sandbox, document: document_, outerTrigger, panelBox, termTrigger };
}

test("info.js: a popover-mode trigger clicked inside an open panel opens as a second, stacked dialog anchored to the clicked text; the panel stays open, untouched, underneath (the orderId -> order ID repro)", () => {
  const { document: document_, panelBox, termTrigger } = buildPanelWithNestedTermFixture();
  assert.equal(panelBox.hidden, false, "the panel must still be open before the nested click");

  document_.dispatch("click", termTrigger);

  // The panel is untouched: still open, still "panel" mode, still showing
  // the orderId body (never replaced — that was the bug).
  assert.equal(panelBox.hidden, false, "the panel must stay open underneath the nested popover");
  assert.equal(findInfoBox(document_).getAttribute("data-mode"), "panel");
  assert.match(panelBox.querySelector(".ex-info-body").innerHTML, /order ID/);

  // A second, independent dialog now exists, anchored to the clicked term.
  const nested = findNestedInfoBox(document_);
  assert.ok(nested, "expected a second, nested dialog node");
  assert.equal(nested.hidden, false);
  assert.match(nested.querySelector(".ex-info-body").innerHTML, /identifier assigned/);
  assert.equal(termTrigger.getAttribute("aria-expanded"), "true");
  assert.equal(termTrigger.getAttribute("aria-controls"), "ex-info-nested-box");
});

test("info.js: nested popover Esc closes only the popover (panel stays open); a second Esc then closes the panel", () => {
  const { document: document_, panelBox, termTrigger } = buildPanelWithNestedTermFixture();
  document_.dispatch("click", termTrigger);
  const nested = findNestedInfoBox(document_);
  assert.equal(nested.hidden, false);

  document_.dispatch("keydown", null, { key: "Escape" });
  assert.equal(nested.hidden, true, "first Esc: nested popover only");
  assert.equal(panelBox.hidden, false, "the panel must still be open after the first Esc");

  document_.dispatch("keydown", null, { key: "Escape" });
  assert.equal(panelBox.hidden, true, "second Esc: now the panel itself closes");
});

test("info.js: closing the nested popover (its own close button) returns focus to the trigger inside the panel and clears aria-expanded", () => {
  const { document: document_, panelBox, termTrigger } = buildPanelWithNestedTermFixture();
  termTrigger.focus = function () {
    this._focusCount = (this._focusCount || 0) + 1;
    this.dispatch("focus");
  };
  document_.dispatch("click", termTrigger);
  const nested = findNestedInfoBox(document_);
  const nestedCloseBtn = nested.querySelector(".ex-info-close");

  nestedCloseBtn.dispatch("click"); // directly bound listener, not document delegation

  assert.equal(nested.hidden, true);
  assert.equal(panelBox.hidden, false, "closing the nested popover must never close the panel");
  assert.equal(termTrigger.getAttribute("aria-expanded"), "false");
  assert.ok(termTrigger._focusCount >= 1, "expected focus to return to the trigger inside the panel");
});

test("info.js: an outside click — inside the panel but outside the nested popover — closes only the popover", () => {
  const { document: document_, panelBox, termTrigger } = buildPanelWithNestedTermFixture();
  document_.dispatch("click", termTrigger);
  const nested = findNestedInfoBox(document_);
  assert.equal(nested.hidden, false);

  // A click on the panel's own title — inside the open panel, but outside
  // the nested popover and not the term trigger itself.
  const panelTitle = panelBox.querySelector(".ex-info-title");
  document_.dispatch("click", panelTitle);

  assert.equal(nested.hidden, true, "outside-the-popover-but-inside-the-panel must close the popover");
  assert.equal(panelBox.hidden, false, "the panel itself must stay open");
});

test("info.js: a popover trigger that's detached/zero-size never opens unanchored — top-level falls back to a panel, nested never opens at all", () => {
  // Top-level: a real (non-null) trigger whose rect is zero-size.
  const zeroRectTrigger = new FakeElement("a", { class: "ex-term", "data-term": "order-id" });
  zeroRectTrigger.getBoundingClientRect = () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 });
  const termsScript = new FakeElement("script", { type: "application/json", id: "ex-terms-data" });
  termsScript.textContent = JSON.stringify([{ key: "order-id", term: "Order ID", def: "def text" }]);
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  page.appendChild(zeroRectTrigger);
  page.appendChild(termsScript);
  const { document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", zeroRectTrigger);
  const box = findInfoBox(document_);
  assert.ok(box, "expected the dialog to open");
  assert.equal(box.getAttribute("data-mode"), "panel", "a detached/zero-size anchor must fall back to a panel, never an unanchored popover");

  // Nested: same zero-size trigger, but now clicked from inside an already-open panel.
  const { document: document2, panelBox, termTrigger } = buildPanelWithNestedTermFixture();
  termTrigger.getBoundingClientRect = () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 });

  document2.dispatch("click", termTrigger);
  assert.equal(findNestedInfoBox(document2), undefined, "a detached/zero-size nested anchor must never open a nested popover at all");
  assert.equal(panelBox.hidden, false, "the panel itself must be unaffected");
});

test("info.js: the nested popover never gets an inline left/width at phone widths — it's always a full-width CSS bottom sheet there, never a narrow, left-pinned box", () => {
  // A real screenshot at 400px found the nested popover ~340px wide and
  // stuck to the left edge, with the panel's own close button peeking out
  // to its right — the nested dialog is always `data-mode="popover"`
  // (ensureNested), and info.css's unconditional desktop popover-width
  // rule was winning the cascade even inside the phone media query (fixed
  // there with a scoped `!important`; this test guards the JS half of that
  // contract — the inline styles info.js itself might set).
  const { document: document_, termTrigger } = buildPanelWithNestedTermFixture({ innerWidth: 400 });

  document_.dispatch("click", termTrigger);
  const nested = findNestedInfoBox(document_);
  assert.ok(nested, "expected the nested popover to open at phone width too");
  const nestedBox = nested.querySelector(".ex-info-box");
  assert.equal(nestedBox.style.left, "", "no inline left at phone width — the CSS bottom sheet owns horizontal positioning");
  // info.js never sets `.style.width` on the nested box at all (only
  // left/top/right/bottom/visibility) — `undefined` (never set) and `""`
  // (set, then cleared) are equally fine; either means CSS's own
  // `width: auto !important` is free to win.
  assert.ok(!nestedBox.style.width, "no inline width at phone width either — width:auto (CSS) must win, not a desktop anchor width");
  assert.equal(nestedBox.style.top, "", "no inline top either — it's pinned to the bottom by CSS, not anchored under the trigger");
});

test("info.js: a live resize crossing down into phone width clears any stale inline anchor position on the nested popover", () => {
  const { sandbox, document: document_, termTrigger } = buildPanelWithNestedTermFixture({ innerWidth: 1024 });
  document_.dispatch("click", termTrigger);
  const nested = findNestedInfoBox(document_);
  const nestedBox = nested.querySelector(".ex-info-box");
  // The desktop-anchored open leaves a real inline position (positionNestedPopover
  // runs inside a mocked, synchronous requestAnimationFrame in this harness).
  assert.notEqual(nestedBox.style.left, "", "sanity: desktop open should anchor with an inline left");

  sandbox.innerWidth = 400;
  (sandbox._listeners.resize || []).forEach((fn) => fn({}));

  assert.equal(nestedBox.style.left, "", "crossing down into phone width must clear the stale inline left");
  assert.equal(nestedBox.style.top, "", "and the stale inline top");
  assert.equal(nestedBox.style.visibility, "", "and the stale inline visibility — the CSS bottom sheet must render it, unobstructed");
  assert.equal(nested.hidden, false, "the nested popover itself must still be open, just no longer inline-positioned");
});

test("info.css: the popover's desktop-only width/max-height is scoped to @media (min-width: 641px), not left unconditional with a phone-side !important override", () => {
  // Orchestrator review found the SAME cascade bug affects every popover,
  // not just the nested one: `.ex-info[data-mode="popover"] .ex-info-box`'s
  // width rule had no media guard at all, so its higher selector
  // specificity (two classes + an attribute) kept winning over the phone
  // sheet's own `width: auto` (one class) even inside `@media
  // (max-width: 640px)` — a top-level popover (a term opened from body
  // text) was just as pinned-narrow on a phone as the nested one. Fixed by
  // scoping the width/max-height declaration to desktop/tablet only
  // (min-width: 641px, the exact inverse of the phone query), so it's
  // never even in the running at phone widths — which is also why the
  // nested-only `!important` from the first follow-up became unnecessary
  // and was removed.
  const cssPath = path.join(REAL_PLUGIN_ROOT, "core", "patterns", "info", "info.css");
  const css = fs.readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""); // strip comments (prose may say "!important")

  // Not a file-wide ban: an unrelated, pre-existing `!important` legitimately
  // lives elsewhere (the code-block trigger cue) — this only checks the
  // one declaration this fix is specifically about, `.ex-info-nested-box`'s
  // own rule, which no longer needs it now that the thing it used to have
  // to out-rank is gone from phone widths entirely.
  const nestedBoxRule = css.match(/\.ex-info-nested-box\s*\{([^}]*)\}/);
  assert.ok(nestedBoxRule, "expected to find the .ex-info-nested-box rule");
  assert.ok(!/!important/.test(nestedBoxRule[1]), "the nested popover's own rule should no longer need !important to win on width at phone widths");

  assert.equal((css.match(/min\(340px/g) || []).length, 1, "expected exactly one popover-width declaration");
  const mediaBlock = css.match(/@media \(min-width: 641px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(mediaBlock, "expected a @media (min-width: 641px) block");
  assert.match(
    mediaBlock[1],
    /\.ex-info\[data-mode="popover"\] \.ex-info-box\s*\{[^}]*width:\s*min\(340px/,
    "the popover's width/max-height must live INSIDE the min-width: 641px block, not unconditionally"
  );
});

test("info.js: a panel-mode trigger inside an open panel replaces the panel's content and shows a working '← Back' control, to depth >= 2, never closing the panel", () => {
  function panelEntry(key, nestedHtml) {
    const e = new FakeElement("div", { class: "ex-info-entry", id: "info--p--" + key, "data-info-key": key, "data-info-mode": "panel" });
    e.innerHTML = `<div class="ex-info-entry-title">${key.toUpperCase()}</div><div class="ex-info-entry-body"><p>detail ${key}${nestedHtml || ""}</p></div>`;
    return e;
  }
  const triggerA = new FakeElement("span", { "data-info-target": "info--p--a" });
  const entryA = panelEntry("a", ' <a data-info="b" data-info-target="info--p--b" href="#info--p--b">go to b</a>');
  const entryB = panelEntry("b", ' <a data-info="c" data-info-target="info--p--c" href="#info--p--c">go to c</a>');
  const entryC = panelEntry("c", "");
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  [triggerA, entryA, entryB, entryC].forEach((n) => page.appendChild(n));
  const { document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", triggerA);
  const box = findInfoBox(document_);
  const backBtn = box.querySelector(".ex-info-back");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail a/);
  assert.equal(backBtn.hidden, true, "no Back control at the root frame");

  document_.dispatch("click", box.querySelector(".ex-info-body").querySelector('[data-info-target="info--p--b"]'));
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail b/);
  assert.equal(backBtn.hidden, false, "depth 1: Back control must appear");
  assert.equal(box.hidden, false, "pushing a nested panel frame must never close the panel");

  document_.dispatch("click", box.querySelector(".ex-info-body").querySelector('[data-info-target="info--p--c"]'));
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail c/, "depth >= 2 must work");
  assert.equal(backBtn.hidden, false);

  backBtn.dispatch("click");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail b/, "Back from depth 2 restores depth 1's body");
  assert.equal(backBtn.hidden, false, "still one level to go back to");

  backBtn.dispatch("click");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail a/, "Back from depth 1 restores the root body");
  assert.equal(backBtn.hidden, true, "back at the root frame: Back control hides again");
  assert.equal(box.hidden, false, "the panel itself was never closed by any of this");
});

test("info.js: seq prev/next inside a pushed nested-panel frame swaps content in place — it never pushes a new frame or pops the existing one", () => {
  function seqEntry(key, order) {
    const e = new FakeElement("div", {
      class: "ex-info-entry",
      id: "info--p--" + key,
      "data-info-key": key,
      "data-info-mode": "panel",
      "data-info-seq": "walk",
      "data-info-order": String(order),
    });
    e.innerHTML = `<div class="ex-info-entry-title">${key.toUpperCase()}</div><div class="ex-info-entry-body"><p>detail ${key}</p></div>`;
    return e;
  }
  const triggerA = new FakeElement("span", { "data-info-target": "info--p--a" });
  const entryA = new FakeElement("div", { class: "ex-info-entry", id: "info--p--a", "data-info-key": "a", "data-info-mode": "panel" });
  entryA.innerHTML =
    '<div class="ex-info-entry-title">A</div><div class="ex-info-entry-body"><p>detail a ' +
    '<a data-info="x" data-info-target="info--p--x" href="#info--p--x">go to x</a></p></div>';
  const entryX = seqEntry("x", 1);
  const entryY = seqEntry("y", 2);
  const page = new FakeElement("section", { class: "ex-page", id: "p" });
  [triggerA, entryA, entryX, entryY].forEach((n) => page.appendChild(n));
  const { document: document_ } = runInfoJs({ topChildren: [page] });

  document_.dispatch("click", triggerA);
  const box = findInfoBox(document_);
  const backBtn = box.querySelector(".ex-info-back");
  document_.dispatch("click", box.querySelector(".ex-info-body").querySelector('[data-info-target="info--p--x"]'));
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail x/);
  assert.equal(backBtn.hidden, false, "pushed one level (A -> X)");

  box.querySelector(".ex-info-nav").querySelector(".ex-info-next").dispatch("click");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail y/, "seq next navigates within the same pushed frame");
  assert.equal(backBtn.hidden, false, "still depth 1 — seq nav must not have pushed a second frame");

  backBtn.dispatch("click");
  assert.match(box.querySelector(".ex-info-body").innerHTML, /detail a/, "Back restores A directly — seq nav never pushed X/Y as their own frames");
  assert.equal(backBtn.hidden, true);
});

// ================================================== 5. explainer.mjs check (headless)
//
// A small fixture exercising every trigger form (x-info, data-info, the
// data-panel alias, a term) through a real build + check, with a real
// browser (EXPLAINER_NO_BROWSER is left unset — see lib/browser.mjs;
// skipped gracefully if no browser is available in this environment).

test("explainer.mjs check: every error-level check (browser.* included) passes on a fixture using every info trigger form", async () => {
  const dir = makeArtifact(
    {
      overview:
        '<p>A <x-term k="port">port</x-term> is a fixed plug shape. See the ' +
        '<x-info k="adapter-note">adapter</x-info> for the concrete wiring.</p>' +
        '<div class="ex-diagram"><svg viewBox="0 0 200 80"><g class="ex-node" data-info="dispatcher" tabindex="0" aria-label="core.py dispatcher"><rect x="10" y="10" width="120" height="60" rx="8" class="ex-box"></rect><text x="20" y="45" class="ex-t">core.py</text></g></svg></div>' +
        '<table><tr><td data-panel="exit-code">0</td><td>success</td></tr></table>' +
        // research.md's most-used reference shape: a data-info marker on a
        // value inside an x-example code block (shares the "dispatcher"
        // key the diagram node above already declared a trigger for:
        // several triggers may share one key).
        '<x-example kind="illustrative" lang="json" file="response.json">{"handledBy": <span data-info="dispatcher" tabindex="0">"core.py"</span>}</x-example>' +
        '<x-info-body k="adapter-note" title="Adapter wiring" seq="walk" order="1"><p>An adapter wires into a port.</p></x-info-body>' +
        '<x-info-body k="dispatcher" title="core.py: the dispatcher" seq="walk" order="2"><p>Routes every call.</p></x-info-body>',
    },
    { terms: [{ key: "port", term: "port", def: "A fixed plug shape." }] }
  );
  try {
    const dirContents = JSON.parse(fs.readFileSync(path.join(dir, "contents.json"), "utf8"));
    dirContents.pages.find((p) => p.id === "overview").panels = [{ key: "exit-code", title: "Exit code", body: "<p>0 means success.</p>" }];
    fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(dirContents, null, 2));

    const buildResult = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(buildResult.ok, true, JSON.stringify(buildResult.errors || buildResult.missing));

    // The marker survives build-time expansion as a real, literal element
    // inside the code block — not flattened to text (that only happens at
    // runtime, in the browser, via code.js's highlightAll — see its own
    // scripts/test/patterns.test.mjs unit test).
    const distHtml = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
    assert.ok(
      distHtml.includes(
        '<code class="ex-code-lang-json">{"handledBy": <span data-info="dispatcher" tabindex="0" data-info-target="info--overview--dispatcher" data-info-mode="panel">"core.py"</span>}</code>'
      ),
      "expected the data-info marker to survive, literal, inside the built code block"
    );

    const { check } = await import("../../explainer/scripts/lib/check.mjs");
    const checkResult = await check({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    assert.equal(checkResult.ok, true, JSON.stringify(checkResult.errors));
    for (const r of checkResult.results) {
      if (r.id === "fact.checker") continue; // Phase 3's demo review step, not this fixture's concern
      assert.notEqual(r.status, "failed", `${r.id}: ${JSON.stringify(r.messages)}`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
