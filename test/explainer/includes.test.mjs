import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { createCiteRegistry } from "../../explainer/scripts/lib/cites.mjs";
import { expandPage } from "../../explainer/scripts/lib/includes.mjs";
import { createLookup } from "../../explainer/scripts/lib/lookup.mjs";
import { parse, serialize } from "../../explainer/scripts/lib/markup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const MINI_ARTIFACT = path.join(FIXTURES, "mini-artifact");
const DIAGRAM_PLUGIN_ROOT = path.join(FIXTURES, "build", "plugin-root");

function baseCtx(overrides = {}) {
  return {
    file: "pages/overview.html",
    page: { id: "overview", panels: [] },
    multi: false,
    termKeys: new Set(["port", "adapter"]),
    sourcesById: new Map([
      ["s-core", { id: "s-core", kind: "file", path: "plugins/vcs/core.py", line: 120 }],
      ["s-uber", { id: "s-uber", kind: "url", url: "https://example.com/uber", vendor: true }],
      ["s-diff", { id: "s-diff", kind: "diff", range: "origin/master...HEAD", files: ["plugins/vcs/core.py"] }],
    ]),
    pageIds: new Map([
      ["overview", "Overview"],
      ["merge-control", "Merge control"],
    ]),
    repo: { github: "example-org/example-repo", ref: "poc/vcs-port" },
    citeRegistry: createCiteRegistry(),
    lookup: createLookup({ artifactDir: MINI_ARTIFACT, pluginRoot: DIAGRAM_PLUGIN_ROOT }),
    artifactDir: MINI_ARTIFACT,
    diagramModuleCache: new Map(),
    generatorOutputs: new Map([
      [
        "envelopes",
        { e: { envelope: { id: "abc", count: 3 }, ok: true, missing_value: null }, rows: [{ id: "r1" }, { id: "r2" }] },
      ],
      ["note", { text: "hello world" }],
      ["manifest", { files: [{ path: "a/b.py", status: "A", bucket: "core" }], counts: { core: 1 } }],
      ["withAngle", { html: "<div>&amp;</div>", tag: "</script>" }],
    ]),
    infoLocal: new Map(),
    infoGlobal: new Map(),
    infoUsed: new Set(),
    infoEntriesOut: new Map(),
    ...overrides,
  };
}

async function expandHtml(html, ctxOverrides = {}) {
  const ctx = baseCtx(ctxOverrides);
  const nodes = parse(html, { file: ctx.file });
  const expanded = await expandPage(nodes, ctx);
  return serialize(expanded);
}

test("x-term expands to an ex-term anchor and validates the key", async () => {
  const html = await expandHtml('<x-term k="port">ports</x-term>');
  assert.equal(html, '<a class="ex-term" data-term="port" data-info-mode="popover" href="#terms--port">ports</a>');

  await assert.rejects(() => expandHtml('<x-term k="nope">x</x-term>'), /unknown term "nope"/);
  await assert.rejects(() => expandHtml("<x-term>x</x-term>"), /requires a "k" attribute/);
});

test("x-cite numbers sources in first-use order and reuses the number on repeat", async () => {
  const ctx = baseCtx();
  const nodesA = parse('<p><x-cite s="s-core"/> and <x-cite s="s-uber"/></p>', { file: ctx.file });
  const outA = serialize(await expandPage(nodesA, ctx));
  assert.match(outA, /href="https:\/\/github\.com\/example-org\/example-repo\/blob\/poc\/vcs-port\/plugins\/vcs\/core\.py#L120">\[1\]/);
  assert.match(outA, /href="https:\/\/example\.com\/uber">\[2\]/);

  // Same ctx (same citeRegistry) on a "later page": s-core keeps number 1.
  const nodesB = parse('<x-cite s="s-core"/>', { file: "pages/merge-control.html" });
  const outB = serialize(await expandPage(nodesB, { ...ctx, file: "pages/merge-control.html" }));
  assert.match(outB, /\[1\]/);

  await assert.rejects(() => expandHtml('<x-cite s="nope"/>'), /unknown source "nope"/);
});

test("x-cite on a file-kind source needs contents.json repo", async () => {
  await assert.rejects(
    () => expandHtml('<x-cite s="s-core"/>', { repo: undefined }),
    /source is kind="file" but contents\.json has no "repo"/
  );
});

test("x-cite on a diff-kind source anchors to its own Sources-page entry, never a blob link", async () => {
  const html = await expandHtml('<x-cite s="s-diff"/>');
  assert.match(html, /^<a class="ex-cite" target="_blank" rel="noopener" href="#sources--1">\[1\]/);
  assert.doesNotMatch(html, /github\.com/);
});

test("x-cite on a diff source with files needs contents.json repo", async () => {
  await assert.rejects(
    () => expandHtml('<x-cite s="s-diff"/>', { repo: undefined }),
    /source is kind="diff" with "files" but contents\.json has no "repo"/
  );
});

test("x-cite on a diff source in a --multi build links to the Sources page's own file, not a bare same-page fragment", async () => {
  const html = await expandHtml('<x-cite s="s-diff"/>', { multi: true, sourcesPageId: "sources" });
  assert.match(html, /href="sources\.html#sources--1"/);
});

test("x-cite on a diff source in a --multi build falls back to a bare fragment when no generated-sources page exists", async () => {
  const html = await expandHtml('<x-cite s="s-diff"/>', { multi: true, sourcesPageId: null });
  assert.match(html, /href="#sources--1"/);
});

test("x-cite on a diff source with no files does not need contents.json repo", async () => {
  const ctx = baseCtx({
    repo: undefined,
    sourcesById: new Map([["s-diff-bare", { id: "s-diff-bare", kind: "diff", range: "origin/master...HEAD" }]]),
  });
  const nodes = parse('<x-cite s="s-diff-bare"/>', { file: ctx.file });
  const html = serialize(await expandPage(nodes, ctx));
  assert.match(html, /href="#sources--1"/);
});

test("x-file builds a GitHub blob link with/without a line number", async () => {
  const withLine = await expandHtml('<x-file p="a/b.py" l="42"/>');
  assert.equal(
    withLine,
    '<a class="ex-path" target="_blank" rel="noopener" href="https://github.com/example-org/example-repo/blob/poc/vcs-port/a/b.py#L42">a/b.py<span class="ex-vh"> (opens in new tab)</span></a>'
  );
  const noLine = await expandHtml('<x-file p="a/b.py"/>');
  assert.match(noLine, /href="https:\/\/github\.com\/example-org\/example-repo\/blob\/poc\/vcs-port\/a\/b\.py">/);

  await assert.rejects(() => expandHtml('<x-file p="a/b.py"/>', { repo: undefined }), /no "repo"/);
});

test("x-page routes to a bare #id (single) or <id>.html (--multi), and validates the page id", async () => {
  const single = await expandHtml('<x-page p="merge-control">Merge control</x-page>');
  assert.equal(single, '<a class="ex-page" href="#merge-control">Merge control</a>');

  const multi = await expandHtml('<x-page p="merge-control">Merge control</x-page>', { multi: true });
  assert.equal(multi, '<a class="ex-page" href="merge-control.html">Merge control</a>');

  await assert.rejects(() => expandHtml('<x-page p="nope">x</x-page>'), /unknown page "nope"/);
});

test("x-page with no text (self-closing, or empty/whitespace) falls back to the target page's title", async () => {
  const selfClosed = await expandHtml('<x-page p="merge-control"/>');
  assert.equal(selfClosed, '<a class="ex-page" href="#merge-control">Merge control</a>');

  const empty = await expandHtml('<x-page p="merge-control"></x-page>');
  assert.equal(empty, '<a class="ex-page" href="#merge-control">Merge control</a>');

  const whitespaceOnly = await expandHtml('<x-page p="merge-control">   </x-page>');
  assert.equal(whitespaceOnly, '<a class="ex-page" href="#merge-control">Merge control</a>');

  // Explicit text is kept as-is, never overridden by the title.
  const explicit = await expandHtml('<x-page p="merge-control">the merge gate</x-page>');
  assert.equal(explicit, '<a class="ex-page" href="#merge-control">the merge gate</a>');

  // An unknown page id still errors, self-closing or not.
  await assert.rejects(() => expandHtml('<x-page p="nope"/>'), /unknown page "nope"/);
});

test("x-example renders an Illustrative code block and requires kind=illustrative + lang", async () => {
  const html = await expandHtml('<x-example kind="illustrative" lang="ts" file="runner.ts">const x = 1;</x-example>');
  assert.match(html, /class="ex-code" data-tag="Illustrative"/);
  assert.match(html, /<span class="ex-code-tag">Illustrative<\/span>/);
  assert.match(html, /<span class="ex-code-file">runner\.ts<\/span>/);
  assert.match(html, /<code class="ex-code-lang-ts">const x = 1;<\/code>/);

  await assert.rejects(
    () => expandHtml('<x-example kind="real" lang="ts">x</x-example>'),
    /must be kind="illustrative"/
  );
  await assert.rejects(() => expandHtml('<x-example kind="illustrative">x</x-example>'), /requires a "lang"/);
});

test("x-example never expands x-* look-alikes inside its own code text", async () => {
  const html = await expandHtml(
    '<x-example kind="illustrative" lang="html">&lt;x-term k="port"&gt;port&lt;/x-term&gt;</x-example>'
  );
  assert.match(html, /&lt;x-term k="port"&gt;port&lt;\/x-term&gt;/);
});

// the reference site's own
// most-used annotation shape — a clickable `data-info`/`data-panel` marker
// on a field/value *inside* a code block — must survive x-example's own
// expansion (it used to be inert: x-example's literal-text handling never
// ran checkDataInfo on anything inside it, so an authored marker kept its
// bare `data-info` attribute but never gained the `data-info-target` every
// other trigger shape needs). An inline `<x-info>` works too, expanding to
// its real anchor exactly like it would outside a code block; any other
// x-* tag is still left alone, literal, same as the look-alike test above.

test("x-example: a data-info/data-panel marker inside the code is validated and stamped with data-info-target, like any other trigger", async () => {
  const meta = { key: "field-status", scope: "page", pageId: "overview", title: "status", mode: "panel", source: "body" };
  const ctx = { infoLocal: new Map([["field-status", meta]]) };

  const html = await expandHtml(
    '<x-example kind="illustrative" lang="json">{"status": <span data-info="field-status" tabindex="0">"ok"</span>}</x-example>',
    ctx
  );
  assert.match(
    html,
    /<code class="ex-code-lang-json">\{"status": <span data-info="field-status" tabindex="0" data-info-target="info--overview--field-status" data-info-mode="panel">"ok"<\/span>\}<\/code>/
  );

  await assert.rejects(
    () => expandHtml('<x-example kind="illustrative" lang="json"><span data-info="nope">x</span></x-example>'),
    /unknown info key "nope" on page "overview"/
  );
});

test("x-example: an inline <x-info> trigger inside the code expands to its real anchor", async () => {
  const meta = { key: "field-status", scope: "page", pageId: "overview", title: "status", mode: "panel", source: "body" };
  const ctx = { infoLocal: new Map([["field-status", meta]]) };
  const html = await expandHtml(
    '<x-example kind="illustrative" lang="json">{"status": <x-info k="field-status">"ok"</x-info>}</x-example>',
    ctx
  );
  assert.match(
    html,
    /<code class="ex-code-lang-json">\{"status": <a class="ex-info-trigger" data-info="field-status" data-info-target="info--overview--field-status" data-info-mode="panel" href="#info--overview--field-status">"ok"<\/a>\}<\/code>/
  );
});

test("x-diagram loads diagrams/<kind>/render.mjs through the lookup and wraps the svg", async () => {
  const html = await expandHtml('<x-diagram kind="box-row" data="diagrams/flow.json"/>');
  assert.match(html, /^<div class="ex-diagram" data-kind="box-row"><svg viewBox="0 0 280 80" role="img" style="min-width:280px">/);
  assert.match(html, /<rect x="10" y="10" width="120" height="60" rx="8" class="ex-box">/);
  assert.match(html, /<rect x="150" y="10" width="120" height="60" rx="8" class="ex-box-new">/);

  await assert.rejects(
    () => expandHtml('<x-diagram kind="does-not-exist" data="diagrams/flow.json"/>'),
    /no diagrams\/does-not-exist\/render\.mjs found/
  );
  await assert.rejects(
    () => expandHtml('<x-diagram kind="box-row" data="diagrams/does-not-exist.json"/>'),
    /diagrams\/does-not-exist\.json/
  );
});

test("x-diagram: minWidth lands on the inner <svg>, never on the .ex-diagram wrapper (overflow-x:auto on the wrapper only scrolls if the wrapper itself has no min-width)", async () => {
  const html = await expandHtml('<x-diagram kind="box-row" data="diagrams/flow.json"/>');
  const wrapperOpenTag = /^<div class="ex-diagram"[^>]*>/.exec(html)[0];
  assert.doesNotMatch(wrapperOpenTag, /min-width/);
  assert.match(html, /<svg[^>]*\sstyle="min-width:280px"/);
});

test("data-panel must resolve against the page's info registry (lib/info.mjs) — the alias for a legacy contents.json panels[] key", async () => {
  const guardCheckMeta = { key: "guard-check", scope: "page", pageId: "merge-control", title: "t", mode: "panel", source: "panel" };
  const ctx = baseCtx({
    page: { id: "merge-control", panels: [{ key: "guard-check", title: "t", body: "b" }] },
    infoLocal: new Map([["guard-check", guardCheckMeta]]),
  });
  const ok = serialize(await expandPage(parse('<div data-panel="guard-check">x</div>', { file: ctx.file }), ctx));
  assert.match(ok, /data-panel="guard-check"/);
  assert.match(ok, /data-info-target="info--merge-control--guard-check"/);

  await assert.rejects(
    () => expandHtml('<div data-panel="nope">x</div>', { page: { id: "overview", panels: [] } }),
    /unknown info key "nope" on page "overview"/
  );
});

test("x-include at=json renders fresh generator output with the code pattern markup, tagged Real", async () => {
  const html = await expandHtml('<x-include g="envelopes" at="e.envelope" as="json"/>');
  assert.match(html, /class="ex-code" data-tag="Real"/);
  assert.match(html, /<span class="ex-code-tag">Real<\/span>/);
  assert.match(html, /class="ex-code-lang-json"/);
  assert.match(html, /"id": "abc"/);
  assert.match(html, /"count": 3/);
});

test("x-include at= resolves a dotted/indexed JSON path (rows[0].id)", async () => {
  const html = await expandHtml('<x-include g="envelopes" at="rows[0].id" as="json"/>');
  assert.match(html, /<code class="ex-code-lang-json">"r1"<\/code>/);
});

test("x-include as=text renders a string value as plain text, tagged Real", async () => {
  const html = await expandHtml('<x-include g="note" at="text" as="text"/>');
  assert.match(html, /class="ex-code" data-tag="Real"/);
  assert.match(html, /<code class="ex-code-lang-text">hello world<\/code>/);
});

// as="text" renders any JSON scalar — string, number, boolean,
// or null — in its JSON text form; only an object/array still errors (with
// a hint to use as="json" instead, since those have no single-line form).
test("x-include as=text renders every JSON scalar type (number, boolean, null), not just strings", async () => {
  const number = await expandHtml('<x-include g="envelopes" at="e.envelope.count" as="text"/>');
  assert.match(number, /<code class="ex-code-lang-text">3<\/code>/);

  const bool = await expandHtml('<x-include g="envelopes" at="e.ok" as="text"/>');
  assert.match(bool, /<code class="ex-code-lang-text">true<\/code>/);

  const nil = await expandHtml('<x-include g="envelopes" at="e.missing_value" as="text"/>');
  assert.match(nil, /<code class="ex-code-lang-text">null<\/code>/);
});

test("x-include as=text still errors on an object or array, with a hint to use as=json", async () => {
  await assert.rejects(
    () => expandHtml('<x-include g="envelopes" at="e.envelope" as="text"/>'),
    /value at that path is an object, not a scalar — use as="json" for an object/
  );
  await assert.rejects(
    () => expandHtml('<x-include g="envelopes" at="rows" as="text"/>'),
    /value at that path is an array, not a scalar — use as="json" for an array/
  );
});

test("x-include validates its attributes and references", async () => {
  await assert.rejects(() => expandHtml('<x-include at="e.envelope" as="json"/>'), /requires a "g" attribute/);
  await assert.rejects(() => expandHtml('<x-include g="envelopes" as="json"/>'), /requires an "at" attribute/);
  await assert.rejects(
    () => expandHtml('<x-include g="envelopes" at="e.envelope"/>'),
    /requires as="json", as="text", or as="data"/
  );
  await assert.rejects(
    () => expandHtml('<x-include g="nope" at="e.envelope" as="json"/>'),
    /unknown generator "nope"/
  );
  await assert.rejects(
    () => expandHtml('<x-include g="envelopes" at="e.missing" as="json"/>'),
    /no value at that path/
  );
});

// ------------------------------------------------------------- x-include as="data"
//
// follow-up (): kills the "paste generator
// output into markup by hand" drift exists to stop — a pattern that
// renders data itself (file-map) gets the generator's fresh value as a
// `<script type="application/json" class="ex-data">` block, never a
// `code`-pattern display block (that's what as="json"/as="text" are for).

test('x-include as="data" with at= emits an ex-data script with data-gen/data-at provenance', async () => {
  const html = await expandHtml('<x-include g="envelopes" at="rows" as="data"/>');
  assert.match(html, /<script type="application\/json" class="ex-data" data-gen="envelopes" data-at="rows">/);
  assert.match(html, /\[\{"id":"r1"\},\{"id":"r2"\}\]/);
  assert.match(html, /<\/script>$/);
});

test('x-include as="data" with no at= emits the whole generator output, data-at empty', async () => {
  const html = await expandHtml('<x-include g="manifest" as="data"/>');
  // `data-at=""` round-trips through markup.mjs's parse/serialize as the
  // bare attribute `data-at` (same convention as every other empty-string
  // attribute value) — `el.getAttribute("data-at")` still reads back ""
  // in a real browser, so file-map.js sees the same empty value either way.
  assert.match(html, /<script type="application\/json" class="ex-data" data-gen="manifest" data-at>/);
  assert.match(html, /"files":\[\{"path":"a\/b\.py","status":"A","bucket":"core"\}\]/);
  assert.match(html, /"counts":\{"core":1\}/);
});

test('x-include as="data" safely escapes "<" so an embedded "</script" can never close the tag early', async () => {
  const html = await expandHtml('<x-include g="withAngle" as="data"/>');
  // Every literal "<" inside the JSON value becomes the 6-character escape
  // \u003c (only "<" is escaped — JSON.stringify never needs to touch "/"
  // or ">" itself) — including the one in "</script>" — so the only
  // literal "<" characters left anywhere in the output are the real
  // <script>/</script> tags handleInclude wrote.
  assert.match(html, /"html":"\\u003cdiv>&amp;\\u003c\/div>"/);
  assert.match(html, /"tag":"\\u003c\/script>"/);
  assert.doesNotMatch(html, /<div>/);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.equal((html.match(/<script /g) || []).length, 1);
});

test('x-include as="data" still errors on an unknown generator', async () => {
  await assert.rejects(
    () => expandHtml('<x-include g="nope" as="data"/>'),
    /unknown generator "nope"/
  );
});

test('x-include as="data" with at= pointing nowhere errors "no value at that path"', async () => {
  await assert.rejects(
    () => expandHtml('<x-include g="envelopes" at="e.missing" as="data"/>'),
    /no value at that path/
  );
});

test("an unknown x-* tag fails the build with file:line (no silent leftover)", async () => {
  await assert.rejects(
    () => expandHtml('<x-nope k="x">y</x-nope>'),
    /pages\/overview\.html:1: unknown x-\* element <x-nope>/
  );
});
