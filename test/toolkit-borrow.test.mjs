// The borrowing seam: a deck that borrows toolkit modules (code-translation panel, reveal
// quiz) must remain a valid educate artifact — self-contained, passing the DoD gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gateProblemsForProject } from "../educate/gates/dod.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, "..", rel), "utf8");

/** All fenced code blocks from a toolkit module — the copy-paste snippets. */
const fences = (md) => [...md.matchAll(/```(?:html|css|js)\n([\s\S]*?)```/g)].map((m) => m[1]);

test("toolkit borrow: a deck with borrowed translation + quiz slides passes the educate gate", () => {
  const translation = fences(read("lib/toolkit/code-translation.md")).join("\n");
  const quiz = fences(read("lib/toolkit/quiz-patterns.md")).join("\n");
  assert.ok(translation.includes("translate") && quiz.includes("details"), "snippets found");

  // Compose: the planted template with two borrowed slides added before the progress bar.
  const deck = read("educate/templates/.template/deck.html").replace(
    '<div class="bar" id="bar"></div>',
    `<section class="slide"><p class="kicker">Borrowed: code translation</p><h2>What this line does</h2>
       <div class="fill">${translation}</div>
       <div class="footer"><span>Topic · translation</span><span></span></div></section>
     <section class="slide"><p class="kicker">Borrowed: quiz</p><h2>Apply it</h2>
       <div class="fill">${quiz}</div>
       <div class="footer"><span>Topic · quiz</span><span></span></div></section>
     <div class="bar" id="bar"></div>`
  );

  const root = mkdtempSync(join(tmpdir(), "praxis-borrow-"));
  const ldir = join(root, "topics", "t", "101");
  mkdirSync(ldir, { recursive: true });
  writeFileSync(join(ldir, "checklist.md"), "");
  writeFileSync(join(ldir, "raw-notes.md"), "# notes\n");
  writeFileSync(join(ldir, "deck.html"), deck);
  writeFileSync(join(root, "topics", "t", "progress.json"),
    JSON.stringify({ definitionOfDone: {}, lessons: [{ id: "101", status: "planned", artifacts: {} }] }));

  assert.deepEqual(gateProblemsForProject(root), []);
});
