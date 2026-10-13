// Proves the authoring dialect covers real markup from both reference artifacts
// docs/explainers fixtures excerpted and
// rewritten from the reference site's vcs-port-architecture site and the
// runtime-strategy-briefing.html, run through the real parse + expand
// pipeline — not just synthetic mini-artifact strings.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { createCiteRegistry } from "../../explainer/scripts/lib/cites.mjs";
import { expandPage } from "../../explainer/scripts/lib/includes.mjs";
import { createLookup } from "../../explainer/scripts/lib/lookup.mjs";
import { parse, serialize } from "../../explainer/scripts/lib/markup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const EXCERPTS = path.join(FIXTURES, "reference-excerpts");
const MINI_ARTIFACT = path.join(FIXTURES, "mini-artifact");

const REPO = { github: "example-org/example-repo", ref: "poc/vcs-port" };

const TERMS = new Set(["port", "adapter", "stage-runner"]);
const SOURCES = new Map([
  ["s-vcs-v1", { id: "s-vcs-v1", kind: "file", path: "skills/pipeline-conventions/references/vcs-v1.md" }],
  ["s-vcs-core", { id: "s-vcs-core", kind: "file", path: "scripts/vcs_lib/core.py", line: 212 }],
  ["s-noise", { id: "s-noise", kind: "url", url: "https://www.anthropic.com/engineering/infrastructure-noise" }],
  [
    "s-agent-program",
    { id: "s-agent-program", kind: "url", url: "https://arxiv.org/abs/2609.17394", vendor: false },
  ],
]);
const PAGE_IDS = new Map([
  ["vcs-port", "Vcs Port"],
  ["briefing", "Briefing"],
]);

// Only the vcs-port excerpt uses data-panel (it keeps the reference site's
// `<g data-panel="…">` diagram-node convention as-is; see its header
// comment) — the panel keys it uses must be declared here, the same way
// they'd be declared in that page's contents.json pages[].panels. Folded
// into an `infoLocal` registry view by hand (lib/info.mjs's shape, not a
// real `collectInfoBodies` pre-scan — these fixtures call `expandPage`
// directly, same as lib/build.mjs's own pre-scan + real-expansion split).
const PANELS_BY_FILE = {
  "vcs-port.html": [
    { key: "core", title: "core.py", body: "<p>the dispatcher</p>" },
    { key: "adapter-gh", title: "GitHubAdapter", body: "<p>GitHub implementation</p>" },
  ],
  "briefing.html": [],
};

function infoLocalFor(file) {
  const pageId = file.replace(".html", "");
  const map = new Map();
  for (const panel of PANELS_BY_FILE[file] || []) {
    map.set(panel.key, { key: panel.key, scope: "page", pageId, title: panel.title, mode: "panel", source: "panel" });
  }
  return map;
}

function sharedCtx(file, citeRegistry) {
  return {
    file,
    page: { id: file.replace(".html", ""), panels: PANELS_BY_FILE[file] || [] },
    multi: false,
    termKeys: TERMS,
    sourcesById: SOURCES,
    pageIds: PAGE_IDS,
    repo: REPO,
    citeRegistry,
    lookup: createLookup({ artifactDir: MINI_ARTIFACT, pluginRoot: path.join(FIXTURES, "build", "plugin-root") }),
    artifactDir: MINI_ARTIFACT,
    diagramModuleCache: new Map(),
    infoLocal: infoLocalFor(file),
    infoGlobal: new Map(),
  };
}

test("the vcs-port excerpt expands cleanly through the real pipeline", async () => {
  const raw = fs.readFileSync(path.join(EXCERPTS, "vcs-port.html"), "utf8");
  const nodes = parse(raw, { file: "vcs-port.html" });
  const expanded = await expandPage(nodes, sharedCtx("vcs-port.html", createCiteRegistry()));
  const html = serialize(expanded);

  // x-term (the reference site's site.js VcsInfo/TERMS style)
  assert.match(html, /<a class="ex-term" data-term="port" data-info-mode="popover" href="#terms--port">port<\/a>/);
  assert.match(html, /<a class="ex-term" data-term="adapter" data-info-mode="popover" href="#terms--adapter">adapter<\/a>/);
  // x-file (the reference site's GitHub blob links)
  assert.match(
    html,
    /href="https:\/\/github\.com\/example-org\/example-repo\/blob\/poc\/vcs-port\/plugins\/sdlc-pipeline-plugin\/scripts\/vcs_lib\/core\.py#L120"/
  );
  // x-cite, numbered
  assert.match(html, /class="ex-cite"[^>]*>\[1\]</);
  assert.match(html, /class="ex-cite"[^>]*>\[2\]</);
  // data-panel preserved for the shell to wire in (the reference site's
  // site.js initNodePanels / window.NODE_INFO equivalent)
  assert.match(html, /data-panel="core"/);
  assert.match(html, /data-panel="adapter-gh"/);
  // hand-drawn SVG uses only pattern base classes, never var() in attributes
  assert.doesNotMatch(html, /var\(--/);
  assert.match(html, /class="ex-box"/);
  assert.match(html, /class="ex-box-new"/);
});

test("the briefing excerpt expands cleanly through the real pipeline", async () => {
  const raw = fs.readFileSync(path.join(EXCERPTS, "briefing.html"), "utf8");
  const nodes = parse(raw, { file: "briefing.html" });
  const expanded = await expandPage(nodes, sharedCtx("briefing.html", createCiteRegistry()));
  const html = serialize(expanded);

  // x-term: the briefing's <dfn>/<span class="def"> style converges on the
  // same x-term the reference excerpt uses .
  assert.match(html, /<a class="ex-term" data-term="stage-runner" data-info-mode="popover" href="#terms--stage-runner">stage runner<\/a>/);
  // x-cite: url-kind sources link straight out, numbered.
  assert.match(html, /class="ex-cite"[^>]*href="https:\/\/www\.anthropic\.com\/engineering\/infrastructure-noise"[^>]*>\[1\]/);
  assert.match(html, /class="ex-cite"[^>]*href="https:\/\/arxiv\.org\/abs\/2609\.17394"[^>]*>\[2\]/);
  // Callouts and the verdict list pass through untouched (not x-* — just
  // pattern classes the build will inline in Phase 4).
  assert.match(html, /class="ex-callout ex-callout-note"/);
  assert.match(html, /class="ex-callout ex-callout-key"/);
  assert.match(html, /<ol class="ex-verdict">/);
});

test("citation numbering runs first-use order across both excerpts as one artifact", async () => {
  const citeRegistry = createCiteRegistry();
  const vcsRaw = fs.readFileSync(path.join(EXCERPTS, "vcs-port.html"), "utf8");
  const briefingRaw = fs.readFileSync(path.join(EXCERPTS, "briefing.html"), "utf8");

  const vcsHtml = serialize(
    await expandPage(parse(vcsRaw, { file: "vcs-port.html" }), sharedCtx("vcs-port.html", citeRegistry))
  );
  const briefingHtml = serialize(
    await expandPage(parse(briefingRaw, { file: "briefing.html" }), sharedCtx("briefing.html", citeRegistry))
  );

  assert.match(vcsHtml, /\[1\]/);
  assert.match(vcsHtml, /\[2\]/);
  // The briefing page is expanded second, so its first citation continues
  // the shared registry at 3, not restarting at 1.
  assert.match(briefingHtml, /\[3\]/);
  assert.match(briefingHtml, /\[4\]/);
  assert.equal(citeRegistry.usedSources().length, 4);
});
