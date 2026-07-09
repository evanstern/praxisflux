#!/usr/bin/env node
// cli.mjs — command-line entry to the codebase-to-course gates.
//   node cli.mjs course <course-dir>
import { validateCourse } from "./course.mjs";

const [cmd, courseDir] = process.argv.slice(2);
if (cmd !== "course" || !courseDir) {
  console.error("usage: cli.mjs course <course-dir>");
  process.exit(2);
}

const r = validateCourse(courseDir);
for (const w of r.warns) console.log(`warn: ${w}`);
if (r.fails.length) {
  console.log(`\nGATE FAILED (${r.fails.length} issue(s)):`);
  for (const f of r.fails) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`OK: course gate passed — ${r.modules} module(s), self-contained, all mandatory elements present.`);
process.exit(0);
