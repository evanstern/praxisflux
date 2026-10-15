// wiki.fresh: a grounding-wiki note cited as a file source warns once its sources move past
// its verified_against pin — never an error, never fires without a cited docs/wiki note.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runWikiFresh } from "../../explainer/gates/check.mjs";

function repoWithNote(sourcesFrontmatter) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-wiki-fresh-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", env }).trim();
  git("init", "-q");
  fs.writeFileSync(path.join(root, "app.js"), "v1\n");
  git("add", "-A"); git("commit", "-qm", "code");
  const pin = git("rev-parse", "HEAD");
  fs.mkdirSync(path.join(root, "docs", "wiki"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs", "wiki", "app.md"), `---\nname: app\n${sourcesFrontmatter}\nverified_against: ${pin}\n---\n\nApp.\n`);
  git("add", "-A"); git("commit", "-qm", "wiki");
  return { root, git };
}
const cite = { sources: [{ id: "s-app", kind: "file", path: "docs/wiki/app.md" }] };

test("wiki.fresh: no cited wiki note → nothing to check", () => {
  assert.deepEqual(runWikiFresh({ contents: { sources: [{ id: "s", kind: "file", path: "src/a.js" }] }, repoRoot: "/nowhere" }), { messages: [] });
});

test("wiki.fresh: a fresh note passes; once its source changes it warns (block-list and inline sources)", () => {
  for (const fm of ["sources:\n  - app.js", "sources: [app.js]"]) {
    const { root, git } = repoWithNote(fm);
    try {
      assert.deepEqual(runWikiFresh({ contents: cite, repoRoot: root }).messages, []);
      fs.writeFileSync(path.join(root, "app.js"), "v2\n");
      git("commit", "-qam", "change");
      const { messages } = runWikiFresh({ contents: cite, repoRoot: root });
      assert.equal(messages.length, 1);
      assert.equal(messages[0].severity, "warning");
      assert.match(messages[0].text, /docs\/wiki\/app\.md is STALE — 1 commit/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test("wiki.fresh: a cited note that is missing or unpinned warns", () => {
  const { root } = repoWithNote("kind: component");
  try {
    assert.match(runWikiFresh({ contents: cite, repoRoot: root }).messages[0].text, /freshness unverifiable/);
    const gone = { sources: [{ id: "s", kind: "file", path: "docs/wiki/gone.md" }] };
    assert.match(runWikiFresh({ contents: gone, repoRoot: root }).messages[0].text, /no longer exists/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
