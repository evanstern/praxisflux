import assert from "node:assert/strict";
import { test } from "node:test";

import { createCiteRegistry, githubBlobUrl, renderSourcesPage } from "../../explainer/scripts/lib/cites.mjs";
import { renderTermsPage } from "../../explainer/scripts/lib/terms.mjs";

const REPO = { github: "example-org/example-repo", ref: "poc/vcs-port" };

test("githubBlobUrl appends #L<line> only when a line is given", () => {
  assert.equal(
    githubBlobUrl(REPO, "a/b.py", 42),
    "https://github.com/example-org/example-repo/blob/poc/vcs-port/a/b.py#L42"
  );
  assert.equal(githubBlobUrl(REPO, "a/b.py"), "https://github.com/example-org/example-repo/blob/poc/vcs-port/a/b.py");
  assert.equal(githubBlobUrl(REPO, "a/b.py", ""), "https://github.com/example-org/example-repo/blob/poc/vcs-port/a/b.py");
});

test("createCiteRegistry assigns numbers in first-use order and reuses them", () => {
  const registry = createCiteRegistry();
  const sCore = { id: "s-core", kind: "file", path: "a.py", line: 1 };
  const sUber = { id: "s-uber", kind: "url", url: "https://example.com" };

  const first = registry.cite("s-core", sCore, REPO);
  const second = registry.cite("s-uber", sUber, REPO);
  const repeat = registry.cite("s-core", sCore, REPO);

  assert.equal(first.number, 1);
  assert.equal(second.number, 2);
  assert.equal(repeat.number, 1);
  assert.deepEqual(registry.usedSources(), [sCore, sUber]);
});

test("renderSourcesPage lists only cited sources, numbered, with a vendor tag", () => {
  const sCore = { id: "s-core", kind: "file", path: "a.py", line: 5 };
  const sUber = { id: "s-uber", kind: "url", url: "https://example.com/uber", vendor: true };
  const html = renderSourcesPage([sCore, sUber], REPO);

  assert.match(html, /<ol class="ex-sources">/);
  assert.match(
    html,
    /<li id="sources--1" value="1"><a class="ex-path" target="_blank" rel="noopener" href="https:\/\/github\.com\/example-org\/example-repo\/blob\/poc\/vcs-port\/a\.py#L5">a\.py<span class="ex-vh"> \(opens in new tab\)<\/span><\/a><\/li>/
  );
  assert.match(html, /<li id="sources--2" value="2">.*<span class="ex-vendor">\(vendor\)<\/span><\/li>/);
});

test("renderSourcesPage reports an empty state when nothing was cited", () => {
  assert.match(renderSourcesPage([], REPO), /No sources were cited/);
});

test("createCiteRegistry gives a diff source a same-page Sources anchor in single shape, never a blob URL", () => {
  const registry = createCiteRegistry();
  const sDiff = { id: "s-diff", kind: "diff", range: "origin/master...HEAD", files: ["a.py"] };
  const { number, href } = registry.cite("s-diff", sDiff, REPO);
  assert.equal(number, 1);
  assert.equal(href, "#sources--1");
});

test("createCiteRegistry qualifies a diff source's href with the Sources page's own file in multi shape", () => {
  const registry = createCiteRegistry();
  const sDiff = { id: "s-diff", kind: "diff", range: "origin/master...HEAD" };
  const { href } = registry.cite("s-diff", sDiff, REPO, { multi: true, sourcesPageId: "sources" });
  assert.equal(href, "sources.html#sources--1");
});

test("createCiteRegistry falls back to a bare fragment in multi shape when no sourcesPageId is given", () => {
  const registry = createCiteRegistry();
  const sDiff = { id: "s-diff", kind: "diff", range: "origin/master...HEAD" };
  const { href } = registry.cite("s-diff", sDiff, REPO, { multi: true, sourcesPageId: null });
  assert.equal(href, "#sources--1");
});

test("renderSourcesPage renders a diff source as text with no href for the range, and links its files", () => {
  const sDiff = { id: "s-diff", kind: "diff", range: "origin/master...HEAD", files: ["a/b.py"] };
  const html = renderSourcesPage([sDiff], REPO);

  assert.match(html, /<li id="sources--1" value="1">Diff <code>origin\/master\.\.\.HEAD<\/code>/);
  // The range itself never becomes an ex-path link (so ref.github's
  // collectGithubTargets, which only looks at class="ex-path" hrefs, never
  // sees it) — only the listed file does.
  assert.doesNotMatch(html, /<a class="ex-path"[^>]*>origin\/master/);
  assert.match(
    html,
    /<a class="ex-path" target="_blank" rel="noopener" href="https:\/\/github\.com\/example-org\/example-repo\/blob\/poc\/vcs-port\/a\/b\.py">a\/b\.py/
  );
});

test("renderSourcesPage escapes a diff source's range text", () => {
  const sDiff = { id: "s-diff", kind: "diff", range: "a<b>...HEAD" };
  const html = renderSourcesPage([sDiff], REPO);
  assert.match(html, /<code>a&lt;b&gt;\.\.\.HEAD<\/code>/);
  assert.doesNotMatch(html, /<code>a<b>/);
});

test("renderSourcesPage renders a diff source with no files as just the range, no file list", () => {
  const sDiff = { id: "s-diff", kind: "diff", range: "origin/master...HEAD" };
  const html = renderSourcesPage([sDiff], REPO);
  assert.equal(html, '<ol class="ex-sources"><li id="sources--1" value="1">Diff <code>origin/master...HEAD</code></li></ol>');
});

test("renderTermsPage renders one dt/dd per term, anchored for x-term's href", () => {
  const contents = {
    terms: [
      { key: "port", term: "Port", def: "<b>Port</b>: a shape." },
      { key: "adapter", term: "Adapter", def: "<b>Adapter</b>: an impl.", see: "port" },
    ],
  };
  const html = renderTermsPage(contents);
  assert.match(html, /<dt id="terms--port">Port<\/dt><dd><b>Port<\/b>: a shape\.<\/dd>/);
  assert.match(html, /<dt id="terms--adapter">Adapter<\/dt>/);
  assert.match(html, /see:.*href="#terms--port">Port<\/a>/);
});

test("renderTermsPage reports an empty state with no terms", () => {
  assert.match(renderTermsPage({ terms: [] }), /No terms are defined/);
});
