// codebase-to-course.course-gate.test.mjs — the course output gate against a minimal fixture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateCourse } from "../codebase-to-course/gates/course.mjs";

const quiz = '<div class="quiz-container" id="q"></div>';
const translation = '<div class="translation-block"></div>';

function module_(n, extra = "") {
  return `<section class="module" id="module-${n}">${quiz}${translation}${extra}</section>`;
}

function courseHtml({ modules = 2, dots = modules, chat = true, flow = true, external = "" } = {}) {
  const navDots = Array.from({ length: dots }, (_, i) => `<button class="nav-dot" data-target="module-${i + 1}"></button>`).join("");
  const body = Array.from({ length: modules }, (_, i) =>
    module_(i + 1, i === 0 ? `${chat ? '<div class="chat-window" id="c"></div>' : ""}${flow ? '<div class="flow-animation" data-steps=\'[]\'></div>' : ""}` : "")
  ).join("\n");
  return `<!doctype html><html><head><title>Fixture Course</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans">
<link rel="stylesheet" href="styles.css">${external}</head>
<body><nav>${navDots}</nav>${body}<script src="main.js"></script></body></html>`;
}

function makeCourse(html) {
  const dir = mkdtempSync(join(tmpdir(), "c2c-test-"));
  if (html !== null) writeFileSync(join(dir, "index.html"), html);
  return dir;
}

test("course gate: complete fixture passes, Google Fonts allowed", (t) => {
  const dir = makeCourse(courseHtml());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.equal(r.fails.length, 0, JSON.stringify(r.fails));
  assert.equal(r.modules, 2);
  assert.ok(r.ok);
});

test("course gate: missing index.html fails with a build hint", (t) => {
  const dir = makeCourse(null);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(!r.ok);
  assert.ok(r.fails[0].includes("build.sh"), r.fails[0]);
});

test("course gate: a non-Google-Fonts external load fails", (t) => {
  const dir = makeCourse(courseHtml({ external: '<script src="https://cdn.example.com/x.js"></script>' }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("external")), JSON.stringify(r.fails));
});

test("course gate: nav dot / module count mismatch fails", (t) => {
  const dir = makeCourse(courseHtml({ modules: 3, dots: 2 }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("nav dots (2) != modules (3)")), JSON.stringify(r.fails));
});

test("course gate: a module without quiz or translation fails; any quiz type counts", (t) => {
  const bare = courseHtml({ modules: 1 }).replace(quiz + translation, '<div class="dnd-container"></div>');
  const dir = makeCourse(bare);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(!r.fails.some((f) => f.includes("no quiz")), "dnd-container should count as a quiz");
  assert.ok(r.fails.some((f) => f.includes("no code translation")), JSON.stringify(r.fails));
});

test("course gate: missing group chat and flow animation fail course-wide", (t) => {
  const dir = makeCourse(courseHtml({ chat: false, flow: false }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("group chat")), JSON.stringify(r.fails));
  assert.ok(r.fails.some((f) => f.includes("flow animation")), JSON.stringify(r.fails));
});
