// triage-offload.test.mjs — routes wiki-update's REVIEW pile through the structured-offload
// seam. Stub-server based (test/structured-offload.test.mjs conventions), no live model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { triageOffload } from "../grounding-wiki/scripts/triage-offload.mjs";

const GIT_ID = ["-c", "user.email=test@test", "-c", "user.name=test"];
function git(cwd, ...args) {
  return execFileSync("git", [...GIT_ID, ...args], { cwd, encoding: "utf8" }).trim();
}

function note({ name, pin, sources }) {
  const src = sources.map((s) => `  - ${s}`).join("\n");
  return `---\nname: ${name}\ndescription: test note about ${name}\nkind: component\nsources:\n${src}\nverified_against: ${pin}\n---\n\n# ${name}\n\nBody.\n`;
}

/** A REVIEW-pile fixture: one note whose source changed with a real (non-version-stamp) diff. */
function makeReviewFixture() {
  const repo = mkdtempSync(join(tmpdir(), "triage-offload-"));
  git(repo, "init", "-q");
  mkdirSync(join(repo, "src"), { recursive: true });
  writeFileSync(join(repo, "src", "a.txt"), "one\n");
  git(repo, "add", "."); git(repo, "commit", "-qm", "c1");
  const pin = git(repo, "rev-parse", "HEAD");

  mkdirSync(join(repo, "docs", "wiki"), { recursive: true });
  writeFileSync(join(repo, "docs", "wiki", "INDEX.md"), "# index\n");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"), note({ name: "alpha", pin, sources: ["src/a.txt"] }));
  git(repo, "add", "."); git(repo, "commit", "-qm", "add note");

  writeFileSync(join(repo, "src", "a.txt"), "two\n"); // real content change, not a version stamp
  git(repo, "add", "."); git(repo, "commit", "-qm", "content change");
  return repo;
}

function configureSeam(repo, endpoint) {
  mkdirSync(join(repo, ".claude"), { recursive: true });
  writeFileSync(
    join(repo, ".claude", "structured-offload.json"),
    JSON.stringify({ endpoint, api: "ollama", model: "m" }),
  );
}

function startServer(handler) {
  const server = createServer((req, res) => {
    req.socket.on("error", () => {});
    res.on("error", () => {});
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => handler(req, res, body));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}
async function stopServer(server) {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}
function ollamaOk(value) {
  return JSON.stringify({ message: { content: JSON.stringify(value) } });
}

/** Recursive snapshot of file contents under `dir`, for the "writes nothing" check. */
function snapshot(dir) {
  const out = {};
  for (const f of readdirSync(dir, { recursive: true })) {
    if (f.split(/[/\\]/)[0] === '.git') continue;
    const p = join(dir, f);
    if (statSync(p).isFile()) out[f] = readFileSync(p, "utf8");
  }
  return out;
}

test("valid computed-re-pin with an in-diff deciding_path is honored", async (t) => {
  const repo = makeReviewFixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const server = await startServer((req, res) =>
    res.end(ollamaOk({ route: "computed-re-pin", deciding_path: "src/a.txt" })));
  t.after(() => stopServer(server));
  configureSeam(repo, baseUrl(server));

  const before = snapshot(repo);
  const result = await triageOffload(repo, "docs/wiki");
  assert.deepEqual(result.entries, [
    { note: "docs/wiki/alpha.md", route: "computed-re-pin", deciding_path: "src/a.txt", offloaded: true },
  ]);
  assert.deepEqual(snapshot(repo), before, "the script must write nothing");
});

test("deciding_path outside the diff's file list falls back", async (t) => {
  const repo = makeReviewFixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const server = await startServer((req, res) =>
    res.end(ollamaOk({ route: "computed-re-pin", deciding_path: "src/not-in-diff.txt" })));
  t.after(() => stopServer(server));
  configureSeam(repo, baseUrl(server));

  const result = await triageOffload(repo, "docs/wiki");
  assert.deepEqual(result.entries, [{ note: "docs/wiki/alpha.md", offloaded: false }]);
});

test("prose response and a wrong-enum route both fall back (seam-level rejection)", async (t) => {
  const repo = makeReviewFixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  const prose = await startServer((req, res) => res.end(JSON.stringify({ message: { content: "sure, re-pin it" } })));
  t.after(() => stopServer(prose));
  configureSeam(repo, baseUrl(prose));
  assert.deepEqual((await triageOffload(repo, "docs/wiki")).entries,
    [{ note: "docs/wiki/alpha.md", offloaded: false }]);

  const badEnum = await startServer((req, res) =>
    res.end(ollamaOk({ route: "definitely-repin-trust-me", deciding_path: "src/a.txt" })));
  t.after(() => stopServer(badEnum));
  configureSeam(repo, baseUrl(badEnum));
  assert.deepEqual((await triageOffload(repo, "docs/wiki")).entries,
    [{ note: "docs/wiki/alpha.md", offloaded: false }]);
});

test("no config: every REVIEW note falls back, byte-identical to today's routing", async (t) => {
  const repo = makeReviewFixture(); // no .claude/structured-offload.json written
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  const before = snapshot(repo);
  const result = await triageOffload(repo, "docs/wiki");
  assert.deepEqual(result.entries, [{ note: "docs/wiki/alpha.md", offloaded: false }]);
  assert.deepEqual(snapshot(repo), before, "the script must write nothing");
});

test("a fresh corpus (no REVIEW entries) routes nothing", async (t) => {
  const repo = mkdtempSync(join(tmpdir(), "triage-offload-fresh-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  git(repo, "init", "-q");
  mkdirSync(join(repo, "src"), { recursive: true });
  writeFileSync(join(repo, "src", "a.txt"), "one\n");
  git(repo, "add", "."); git(repo, "commit", "-qm", "c1");
  const pin = git(repo, "rev-parse", "HEAD");
  mkdirSync(join(repo, "docs", "wiki"), { recursive: true });
  writeFileSync(join(repo, "docs", "wiki", "INDEX.md"), "# index\n");
  writeFileSync(join(repo, "docs", "wiki", "alpha.md"), note({ name: "alpha", pin, sources: ["src/a.txt"] }));

  assert.deepEqual((await triageOffload(repo, "docs/wiki")).entries, []);
});
