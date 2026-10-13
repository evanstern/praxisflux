import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { computeFingerprint, recordApproval, resolveGeneratorCwd } from "../../explainer/scripts/lib/approvals.mjs";
import { build } from "../../explainer/scripts/lib/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const MINI_ARTIFACT = path.join(FIXTURES, "mini-artifact");
const BUILD_PLUGIN_ROOT = path.join(FIXTURES, "build", "plugin-root");
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");

// mini-artifact/contents.json declares a git-manifest generator (range
// "HEAD~1...HEAD", bucket match "plugins/*/vcs/core/**"). build() now runs
// every declared generator, so the full-build tests below need a
// *real* git repo as repoRoot — never the committed fixture directory itself
// ("Use a temp git repo inside tests for git-manifest").
function createGitManifestFixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-git-"));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", env });
  git("init", "-q");
  fs.writeFileSync(path.join(dir, "README.md"), "init\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  fs.mkdirSync(path.join(dir, "plugins", "demo", "vcs", "core"), { recursive: true });
  fs.writeFileSync(path.join(dir, "plugins", "demo", "vcs", "core", "foo.py"), "x = 1\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add core file");
  return dir;
}

test("build() resolves brand + profile, runs generators, expands every page, and reports success", async () => {
  const gitRepo = createGitManifestFixtureRepo();
  // Build in a private temp copy of the fixture, not the shared committed
  // directory — other test files (cli.test.mjs) assert on mini-artifact
  // having no dist/, and node --test runs files in parallel.
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-mini-"));
  const tmp = path.join(tmpParent, "mini-artifact");
  fs.cpSync(MINI_ARTIFACT, tmp, { recursive: true });
  try {
    const result = await build({
      dir: tmp,
      repoRoot: gitRepo,
      pluginRoot: BUILD_PLUGIN_ROOT,
    });

    assert.equal(result.step, "shell");
    assert.equal(result.ok, true);
    assert.equal(result.groupsCount, 3);
    assert.equal(result.pagesCount, 5);
    assert.equal(result.brand.found, true);
    assert.equal(result.brand.layer, "core");
    assert.equal(result.profile.found, true);
    assert.deepEqual(result.missing, []);
    assert.deepEqual(result.pending, [], "every build step runs — nothing left pending");

    // The declared git-manifest generator ran (no approval needed, build steps 2)
    // and its output is cached at dist/gen/<id>.json for x-include / the
    // report.
    assert.equal(result.generators.length, 1);
    assert.equal(result.generators[0].id, "manifest");
    assert.equal(result.generators[0].kind, "builtin");
    assert.match(result.generators[0].hash, /^[0-9a-f]{64}$/);
    const genOutputPath = path.join(tmp, "dist", "gen", "manifest.json");
    assert.ok(fs.existsSync(genOutputPath));
    const genOutput = JSON.parse(fs.readFileSync(genOutputPath, "utf8"));
    assert.deepEqual(genOutput.counts, { core: 1 });
    assert.equal(genOutput.files[0].path, "plugins/demo/vcs/core/foo.py");

    assert.equal(result.pages.length, 5);
    const byId = Object.fromEntries(result.pages.map((p) => [p.id, p]));

    // x-term, x-file, x-cite, x-page all expanded on the overview page.
    assert.match(byId.overview.html, /<a class="ex-term" data-term="port" data-info-mode="popover" href="#terms--port">port<\/a>/);
    assert.match(
      byId.overview.html,
      /<a class="ex-path" target="_blank" rel="noopener" href="https:\/\/github\.com\/example-org\/example-repo\/blob\/poc\/vcs-port\/plugins\/vcs\/core\.py#L120">plugins\/vcs\/core\.py<span class="ex-vh"> \(opens in new tab\)<\/span><\/a>/
    );
    assert.match(byId.overview.html, /class="ex-cite"[^>]*>\[1\]</);
    assert.match(byId.overview.html, /class="ex-cite"[^>]*>\[2\]</);
    assert.match(byId.overview.html, /<a class="ex-page" href="#merge-control">Merge control<\/a>/);

    // Same source cited again on a later page reuses its number (first-use
    // order across the whole artifact, not per-page).
    assert.match(byId["merge-control"].html, /class="ex-cite"[^>]*>\[1\]</);
    assert.doesNotMatch(byId["merge-control"].html, /\[3\]/);

    // x-diagram ran the fixture render.mjs through the lookup.
    assert.match(byId["merge-control"].html, /<div class="ex-diagram" data-kind="box-row"><svg viewBox="0 0 280 80" role="img" style="min-width:280px">/);
    assert.match(byId["merge-control"].html, /data-panel="guard-check"/);

    // x-example renders an Illustrative-tagged code block, untouched by cite
    // numbering or term expansion even though its text contains no markup.
    assert.match(byId["scenario-a"].html, /<span class="ex-code-tag">Illustrative<\/span>/);
    assert.match(byId["scenario-a"].html, /ex-code-lang-ts/);
    assert.match(byId["scenario-a"].html, /<a class="ex-page" href="#overview">Overview<\/a>/);

    // Generated pages: Terms lists every contents.terms[] entry; Sources
    // lists only what was actually cited, numbered in first-use order.
    assert.match(byId.terms.html, /<dt id="terms--port">Port<\/dt>/);
    assert.match(byId.terms.html, /<dt id="terms--adapter">Adapter<\/dt>/);
    assert.match(byId.terms.html, /see:.*#terms--port/);

    assert.equal(result.citesUsed.length, 2);
    assert.equal(result.citesUsed[0].id, "s-core");
    assert.equal(result.citesUsed[1].id, "s-uber");
    assert.match(byId.sources.html, /<li id="sources--1" value="1">/);
    assert.match(byId.sources.html, /<li id="sources--2" value="2">/);
    assert.match(byId.sources.html, /\(vendor\)/);

    // Phase 4: single-shape shell, written to dist/<name>.html, plus the
    // build report. mini-artifact's pages only use ex-term/ex-cite/ex-path/
    // ex-page/ex-code*/ex-diagram classes, all shell/diagram-owned —
    // no pattern folders exist in BUILD_PLUGIN_ROOT's core yet, so nothing
    // is inlined as a pattern.
    assert.deepEqual(result.patternsUsed, []);
    assert.equal(result.dist.shape, "single");
    assert.ok(result.dist.files.includes("mini-artifact.html"));
    assert.ok(result.dist.files.includes("build-report.md"));

    const distHtmlPath = path.join(tmp, "dist", "mini-artifact.html");
    assert.ok(fs.existsSync(distHtmlPath));
    const distHtml = fs.readFileSync(distHtmlPath, "utf8");
    assert.match(distHtml, /<title>Mini Fixture<\/title>/);
    // Every page is present, only the first unhidden (hash routing, ).
    assert.match(distHtml, /<section class="ex-page" id="overview">/);
    assert.match(distHtml, /<section class="ex-page" id="merge-control" hidden>/);
    assert.match(distHtml, /<div class="ex-eyebrow">1 · Overview<\/div>/);
    assert.match(distHtml, /<div class="ex-eyebrow">2 · Merge control<\/div>/);
    assert.match(distHtml, /--ex-ink:/); // the fixture brand css was inlined
    assert.doesNotMatch(distHtml, /<script src="http/);
    assert.doesNotMatch(distHtml, /<link[^>]+href="http/);

    const reportPath = path.join(tmp, "dist", "build-report.md");
    assert.ok(fs.existsSync(reportPath));
    const report = fs.readFileSync(reportPath, "utf8");
    assert.match(report, /# Build report — Mini Fixture/);
    assert.match(report, /manifest/);
  } finally {
    fs.rmSync(gitRepo, { recursive: true, force: true });
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});

test("build() with --multi routes x-page to <id>.html instead of a bare #id", async () => {
  const gitRepo = createGitManifestFixtureRepo();
  // Same reasoning as the test above: build in a private temp copy, not the
  // shared committed fixture directory.
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-mini-multi-"));
  const tmp = path.join(tmpParent, "mini-artifact");
  fs.cpSync(MINI_ARTIFACT, tmp, { recursive: true });
  try {
    const result = await build({
      dir: tmp,
      multi: true,
      repoRoot: gitRepo,
      pluginRoot: BUILD_PLUGIN_ROOT,
    });

    assert.equal(result.ok, true);
    const overview = result.pages.find((p) => p.id === "overview");
    assert.match(overview.html, /<a class="ex-page" href="merge-control\.html">Merge control<\/a>/);

    // Phase 4: --multi writes one file per page plus a shared site.css/site.js,
    // from the same source as the single-shape build above.
    assert.equal(result.dist.shape, "multi");
    for (const id of ["overview", "merge-control", "scenario-a", "terms", "sources"]) {
      assert.ok(result.dist.files.includes(path.join("mini-artifact", `${id}.html`)));
    }
    assert.ok(result.dist.files.includes(path.join("mini-artifact", "site.css")));
    assert.ok(result.dist.files.includes(path.join("mini-artifact", "site.js")));

    const overviewFile = path.join(tmp, "dist", "mini-artifact", "overview.html");
    const overviewHtml = fs.readFileSync(overviewFile, "utf8");
    assert.match(overviewHtml, /<link rel="stylesheet" href="site.css" \/>/);
    assert.match(overviewHtml, /<script src="site.js" defer><\/script>/);
    // Exactly one page section per file (no hash routing needed) — a
    // content x-page link also carries class="ex-page", so count sections
    // specifically, not every element with that class.
    assert.equal((overviewHtml.match(/<section class="ex-page"/g) || []).length, 1);
    assert.doesNotMatch(overviewHtml, /<style>/);
  } finally {
    fs.rmSync(gitRepo, { recursive: true, force: true });
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});

// Fix-up to 7618f3f: in a single-shape build a diff
// source's bare `#sources--N` fragment resolves (the Sources page is
// inlined in the same file), but --multi puts every page in its own file,
// so that same bare fragment would point at the *citing* page, where the
// id doesn't exist — a dead link in a real browser, even though
// ref.anchor (check.mjs) doesn't catch it (it collects ids across every
// built file, not per file). The href must instead name the generated
// Sources page's own file, same as lib/shell.mjs's buildTermsData already
// does for a term's `see` link.
test("build() with --multi: a diff source's x-cite links to the Sources page's own file, and that id actually exists there", async () => {
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-diff-multi-"));
  const dir = path.join(tmpParent, "diff-artifact");
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  const contents = {
    schema: 1,
    title: "Diff Fixture",
    kind: "pr-explainer",
    brand: "fixture",
    voice: "none",
    repo: { github: "example-org/example-repo", ref: "poc/vcs-port" },
    groups: [{ id: "start", title: "Start here" }],
    pages: [
      { id: "overview", title: "Overview", group: "start", type: "short-answer" },
      { id: "sources", title: "Sources", group: "start", type: "generated-sources" },
    ],
    terms: [],
    sources: [{ id: "s-diff", kind: "diff", range: "origin/master...HEAD" }],
  };
  fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
  fs.writeFileSync(path.join(dir, "pages", "overview.html"), '<p>See <x-cite s="s-diff"/> for the whole range.</p>');
  try {
    const result = await build({ dir, multi: true, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));

    const overview = result.pages.find((p) => p.id === "overview");
    assert.match(overview.html, /href="sources\.html#sources--1"/);
    assert.doesNotMatch(overview.html, /github\.com/);

    const sourcesHtml = fs.readFileSync(path.join(dir, "dist", "diff-artifact", "sources.html"), "utf8");
    assert.match(sourcesHtml, /id="sources--1"/);
  } finally {
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});

test("build() reports what's missing against the real plugin core (core ships profiles/pr-explainer; brand/fixture.css still doesn't exist)", async () => {
  const result = await build({
    dir: MINI_ARTIFACT,
    repoRoot: MINI_ARTIFACT,
    pluginRoot: REAL_PLUGIN_ROOT,
  });

  assert.equal(result.ok, false);
  assert.equal(result.step, "resolve");
  assert.ok(result.missing.includes("brand/fixture.css"));
  assert.equal(result.profile.found, true);
  assert.ok(!result.missing.includes("profiles/pr-explainer"));
});

test("build() throws a clear error when the artifact dir has no contents.json", async () => {
  await assert.rejects(
    () =>
      build({
        dir: path.join(FIXTURES, "does-not-exist"),
        repoRoot: MINI_ARTIFACT,
        pluginRoot: REAL_PLUGIN_ROOT,
      }),
    /not found/
  );
});

test("build() returns schema errors (step: load) instead of throwing on an invalid contents.json", async () => {
  const result = await build({
    dir: path.join(FIXTURES, "invalid-contents"),
    repoRoot: path.join(FIXTURES, "invalid-contents"),
    pluginRoot: REAL_PLUGIN_ROOT,
  });
  assert.equal(result.step, "load");
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test("build() reports a clear error when a page's markup file is missing", async () => {
  const result = await build({
    dir: path.join(FIXTURES, "missing-page-file"),
    repoRoot: path.join(FIXTURES, "missing-page-file"),
    pluginRoot: BUILD_PLUGIN_ROOT,
  });
  assert.equal(result.ok, false);
  assert.equal(result.step, "expand");
  assert.ok(result.errors.some((e) => e.includes("pages/overview.html") && e.includes("not found")));
});

test("build() surfaces a leftover/unknown x-* element with file:line", async () => {
  const result = await build({
    dir: path.join(FIXTURES, "leftover-x-tag"),
    repoRoot: path.join(FIXTURES, "leftover-x-tag"),
    pluginRoot: BUILD_PLUGIN_ROOT,
  });
  assert.equal(result.ok, false);
  assert.equal(result.step, "expand");
  assert.ok(result.errors.some((e) => /pages[/\\]overview\.html:\d+: unknown x-\* element <x-nope>/.test(e)));
});

// --- orphan pages/*.html files ----------------------------------

test("build() lists pages/*.html files not referenced by contents.json pages[] as orphanPages, and in dist/build-report.md", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-orphan-"));
  try {
    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Orphan Demo",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), "<p>Real content.</p>");
    // A page the outline once had, whose file was never deleted when the
    // page was dropped — the behavioural-run failure mode this fixes.
    fs.writeFileSync(path.join(dir, "pages", "dropped-page.html"), "<p>TODO — placeholder, not reviewed content.</p>");

    const result = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.deepEqual(result.orphanPages, [path.join("pages", "dropped-page.html")]);

    const report = fs.readFileSync(path.join(dir, "dist", "build-report.md"), "utf8");
    assert.match(report, /## Orphan page files/);
    assert.match(report, /dropped-page\.html/);
    assert.match(report, /not referenced by any entry in contents\.json pages\[\]/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build() reports no orphan pages when every pages/*.html file is referenced", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-noorphan-"));
  try {
    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "No Orphan Demo",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pages", "overview.html"), "<p>Real content.</p>");

    const result = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.deepEqual(result.orphanPages, []);

    const report = fs.readFileSync(path.join(dir, "dist", "build-report.md"), "utf8");
    assert.match(report, /None — every `pages\/\*\.html` file is referenced/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("build() stops an unapproved command generator, never approves via --yes, then succeeds once approved and expands x-include", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-build-xinclude-"));
  try {
    const scriptPath = path.join(dir, "gen.mjs");
    fs.writeFileSync(
      scriptPath,
      'console.log(JSON.stringify({ e: { envelope: { id: "abc", count: 3 } }, rows: [{ id: "r1" }] }));\n'
    );
    const cmd = `node ${scriptPath}`;

    fs.writeFileSync(
      path.join(dir, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Include Demo",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        generators: { envelopes: { cmd, cwd: "." } },
      })
    );
    fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "pages", "overview.html"),
      '<x-include g="envelopes" at="e.envelope" as="json"/>'
    );

    // Unapproved: the build stops with "needs approval: <id> <cmd>".
    let result = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.step, "generate");
    assert.deepEqual(result.needsApproval, { id: "envelopes", cmd });
    assert.match(result.errors[0], /^needs approval: envelopes /);

    // --yes never approves.
    result = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT, yes: true });
    assert.equal(result.ok, false);
    assert.equal(result.step, "generate");
    assert.ok(result.needsApproval);

    const cwd = resolveGeneratorCwd({ cwd: ".", repoRoot: dir, artifactDir: dir });
    const fingerprint = computeFingerprint({ cmd, cwd });
    recordApproval({ artifactDir: dir, id: "envelopes", cmd, cwd, fingerprint });

    result = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, true);
    assert.equal(result.generators.length, 1);
    assert.equal(result.generators[0].id, "envelopes");
    assert.equal(result.generators[0].kind, "cmd");

    const overview = result.pages.find((p) => p.id === "overview");
    assert.match(overview.html, /class="ex-code" data-tag="Real"/);
    assert.match(overview.html, /<span class="ex-code-tag">Real<\/span>/);
    assert.match(overview.html, /"id": "abc"/);
    assert.match(overview.html, /"count": 3/);

    // Editing the script (same cmd string) invalidates the approval again.
    fs.writeFileSync(
      scriptPath,
      'console.log(JSON.stringify({ e: { envelope: { id: "changed" } } }));\n'
    );
    result = await build({ dir, repoRoot: dir, pluginRoot: BUILD_PLUGIN_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.step, "generate");
    assert.deepEqual(result.needsApproval, { id: "envelopes", cmd });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
