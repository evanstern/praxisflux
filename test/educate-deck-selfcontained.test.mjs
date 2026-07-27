// A deck.html on disk must honor its own header contract ("single self-contained file, no
// CDN") — the DoD gate runs the shared verifier over it, so a CDN reference can't ship.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gateProblemsForProject, decksRequired, isDelegated, requiredArtifacts } from "../educate/gates/dod.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function project(deckHtml) {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-deck-"));
  const ldir = join(root, "topics", "t", "101");
  mkdirSync(ldir, { recursive: true });
  writeFileSync(join(ldir, "checklist.md"), "");
  writeFileSync(join(ldir, "raw-notes.md"), "# notes\n");
  writeFileSync(join(ldir, "deck.html"), deckHtml);
  writeFileSync(join(root, "topics", "t", "progress.json"),
    JSON.stringify({ definitionOfDone: {}, lessons: [{ id: "101", status: "planned", artifacts: {} }] }));
  return root;
}

test("deck gate: a deck with an external script/font fails as not self-contained", () => {
  const problems = gateProblemsForProject(project(
    `<!doctype html><html><head><title>t</title>
     <script src="https://cdn.example.com/x.js"></script>
     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
     </head><body></body></html>`));
  const deckProblems = problems.filter((p) => p.includes("deck.html is not self-contained"));
  assert.ok(deckProblems.length >= 2, problems.join("; ")); // script AND font each flagged
});

test("deck gate: the planted template deck passes clean", () => {
  const tpl = readFileSync(join(here, "..", "educate", "templates", ".template", "deck.html"), "utf8");
  assert.deepEqual(gateProblemsForProject(project(tpl)), []);
});

test("deck requirement: decksStandardForEveryLesson is array-or-flag tolerant, like isDelegated", () => {
  // an empty array must NOT read as "decks required" — same tolerance isDelegated already has
  const empty = { definitionOfDone: { decksStandardForEveryLesson: [] } };
  assert.equal(decksRequired(empty), false);
  assert.equal(isDelegated({ definitionOfDone: { delegatedBuild: [] } }), false); // the consistency anchor
  assert.deepEqual([...requiredArtifacts(empty)].sort(), ["checklist", "rawNotes"]);
  // a plain flag and a non-empty array still require deck+guide
  for (const v of [true, ["every lesson ships a deck"]]) {
    const p = { definitionOfDone: { decksStandardForEveryLesson: v } };
    assert.equal(decksRequired(p), true, JSON.stringify(v));
    assert.ok(requiredArtifacts(p).has("deck") && requiredArtifacts(p).has("guide"));
  }
});

test("deck requirement: done lesson without deck+guide passes under an empty-array decks config", () => {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-deck-"));
  const ldir = join(root, "topics", "t", "101");
  mkdirSync(ldir, { recursive: true });
  writeFileSync(join(ldir, "checklist.md"), "");
  writeFileSync(join(ldir, "raw-notes.md"), "# notes\n");
  writeFileSync(join(root, "topics", "t", "progress.json"), JSON.stringify({
    definitionOfDone: { decksStandardForEveryLesson: [] },
    lessons: [{ id: "101", status: "done", artifacts: {} }],
  }));
  assert.deepEqual(gateProblemsForProject(root), []); // [] used to demand deck.html + guide.md here
});
