// Docs-lint for the plugin's own component surface (
// ): agents, the coordinator skill, and commands. This doesn't
// re-test anything `validate.sh` already checks (frontmatter presence, a
// `description` field, kebab-case names) — it enforces the project-specific
// conventions the dispatch note calls out: "Use when" descriptions, every
// agent carrying model+effort, every `${CLAUDE_PLUGIN_ROOT}` reference
// resolving to a real file, page-writer's restricted tool list, and
// fact-checker never being told to read a page-writer's own prompt.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");

const AGENTS_DIR = path.join(PLUGIN_ROOT, "agents");
const COMMANDS_DIR = path.join(PLUGIN_ROOT, "commands");
const SKILLS_DIR = path.join(PLUGIN_ROOT, "skills");

const VALID_MODELS = new Set(["inherit", "opus", "sonnet", "haiku", "fable"]);
const VALID_EFFORTS = new Set(["low", "medium", "high", "xhigh", "max"]);

/** Splits a markdown file into { frontmatter, body } — frontmatter is the raw text between the first two `---` lines. */
function splitFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  assert.ok(match, `${filePath}: no YAML frontmatter block found`);
  return { frontmatter: match[1], body: match[2], raw };
}

/** Reads one scalar frontmatter field the way validate.sh's `frontmatter_scalar` does: strip quotes and a trailing comment. */
function scalar(frontmatter, field) {
  const re = new RegExp(`^${field}:[ \\t]*(.+)$`, "m");
  const m = re.exec(frontmatter);
  if (!m) return undefined;
  return m[1]
    .replace(/[ \t]*#.*$/, "")
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1")
    .trim();
}

function listMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => path.join(dir, d.name));
}

function listSkillFiles() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  const out = [];
  for (const d of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const skillMd = path.join(SKILLS_DIR, d.name, "SKILL.md");
    if (fs.existsSync(skillMd)) out.push(skillMd);
  }
  return out;
}

const agentFiles = listMdFiles(AGENTS_DIR);
const commandFiles = listMdFiles(COMMANDS_DIR);
const skillFiles = listSkillFiles();

test("fixture sanity: this plugin actually has agents, commands, and a skill to check", () => {
  assert.ok(agentFiles.length > 0, "no agents/*.md found");
  assert.ok(commandFiles.length > 0, "no commands/*.md found");
  assert.ok(skillFiles.length > 0, "no skills/*/SKILL.md found");
});

for (const file of [...agentFiles, ...commandFiles, ...skillFiles]) {
  const rel = path.relative(PLUGIN_ROOT, file);

  test(`${rel}: has frontmatter with a description starting "Use when"`, () => {
    const { frontmatter } = splitFrontmatter(file);
    const description = scalar(frontmatter, "description");
    assert.ok(description, `${rel}: frontmatter has no description`);
    assert.match(
      description,
      /^Use when\b/,
      `${rel}: description does not start with "Use when" (got: "${description.slice(0, 40)}…")`
    );
  });
}

for (const file of agentFiles) {
  const rel = path.relative(PLUGIN_ROOT, file);

  test(`${rel}: carries a valid model and effort (marketplace rule #24)`, () => {
    const { frontmatter } = splitFrontmatter(file);
    const model = scalar(frontmatter, "model");
    const effort = scalar(frontmatter, "effort");

    assert.ok(model, `${rel}: no \`model\` in frontmatter`);
    assert.ok(
      VALID_MODELS.has(model) || model.includes("claude-"),
      `${rel}: model "${model}" is not an alias or a claude-* model id`
    );
    assert.ok(effort, `${rel}: no \`effort\` in frontmatter`);
    assert.ok(VALID_EFFORTS.has(effort), `${rel}: effort "${effort}" is not a valid level`);
  });
}

test("agents/page-writer.md: tool list excludes Bash and Edit (writes only its own page file)", () => {
  const { frontmatter } = splitFrontmatter(path.join(AGENTS_DIR, "page-writer.md"));
  const tools = scalar(frontmatter, "tools") || "";
  const toolList = tools.split(",").map((t) => t.trim());
  assert.ok(!toolList.includes("Bash"), `page-writer tools include Bash: ${tools}`);
  assert.ok(!toolList.includes("Edit"), `page-writer tools include Edit: ${tools}`);
  assert.deepEqual(toolList.sort(), ["Read", "Write"].sort(), `page-writer tools are not exactly Read, Write: ${tools}`);
});

/** Splits body prose into rough sentences, for the fact-checker independence check below. */
function sentences(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9`])/);
}

test("agents/fact-checker.md: never instructs reading a page-writer's prompt — every mention is a prohibition", () => {
  const { body } = splitFrontmatter(path.join(AGENTS_DIR, "fact-checker.md"));
  const suspectSentences = sentences(body).filter((s) => /writer/i.test(s) && /prompt/i.test(s));
  assert.ok(suspectSentences.length > 0, "expected at least one sentence discussing page-writer prompts (independence is the whole point of this agent)");
  const permissive = /\bnever\b|\bnot\b|\bdon't\b|\bdo not\b|independent|defect/i;
  for (const s of suspectSentences) {
    assert.match(s, permissive, `fact-checker.md: sentence mentions a page-writer prompt without a clear prohibition: "${s.trim()}"`);
  }
});

/** Every `${CLAUDE_PLUGIN_ROOT}/<path>` reference inside backticks, across agents/skills. */
function extractPluginRootPaths(text) {
  const re = /`\$\{CLAUDE_PLUGIN_ROOT\}([^`]*)`/g;
  const out = [];
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text))) {
    const rel = m[1].replace(/^\//, "");
    if (!rel) continue; // bare `${CLAUDE_PLUGIN_ROOT}` with no path after it
    if (rel.includes("<")) continue; // a templated placeholder (e.g. <kind>/<type>.md), not a literal path
    out.push(rel);
  }
  return out;
}

function referencesDir(skillMdPath) {
  return path.join(path.dirname(skillMdPath), "references");
}

const filesWithPluginRootRefs = [
  ...agentFiles,
  ...skillFiles,
  ...skillFiles.flatMap((f) => listMdFiles(referencesDir(f))),
];

for (const file of filesWithPluginRootRefs) {
  const rel = path.relative(PLUGIN_ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  const refs = extractPluginRootPaths(text);
  if (refs.length === 0) continue;

  test(`${rel}: every literal \${CLAUDE_PLUGIN_ROOT} path resolves to a real file in this plugin`, () => {
    for (const refPath of refs) {
      const full = path.join(PLUGIN_ROOT, refPath);
      assert.ok(fs.existsSync(full), `${rel}: \${CLAUDE_PLUGIN_ROOT}/${refPath} does not exist (resolved: ${full})`);
    }
  });
}

test("skills/explainer/SKILL.md: references the three agents and the pipeline/markup/house-style references", () => {
  const skillMd = path.join(SKILLS_DIR, "explainer", "SKILL.md");
  const text = fs.readFileSync(skillMd, "utf8");
  for (const name of ["fact-gatherer", "page-writer", "fact-checker"]) {
    assert.match(text, new RegExp(name), `SKILL.md never mentions ${name}`);
  }
  for (const ref of ["house-style.md", "pipeline.md", "markup.md"]) {
    assert.match(text, new RegExp(ref.replace(".", "\\.")), `SKILL.md never mentions references/${ref}`);
  }
});

test("skills/explainer/references/pipeline.md: documents every gate named in the spec", () => {
  const pipelineMd = fs.readFileSync(path.join(SKILLS_DIR, "explainer", "references", "pipeline.md"), "utf8");
  for (const gate of ["interview", "outline approval", "generator approval", "Artifact tool availability"]) {
    assert.match(pipelineMd, new RegExp(gate, "i"), `pipeline.md never documents the "${gate}" gate`);
  }
});

// a
// page-qualified build failure (pages/<id>.html:<line> — a markup/expansion
// error) joins step 7's bounded fix loop instead of stopping the run
// outright, counting against that page's own per-page budget rather than
// one shared artifact-wide cap; the generator-approval gate and any
// non-page-qualified failure still stop immediately.
test("skills/explainer/references/pipeline.md: step 5's build-failure handling enters the bounded fix loop, per page, for page-qualified errors only", () => {
  const pipelineMd = fs.readFileSync(path.join(SKILLS_DIR, "explainer", "references", "pipeline.md"), "utf8");
  const step5 = pipelineMd.slice(pipelineMd.indexOf("## 5. Build"), pipelineMd.indexOf("## 6. Fact-check"));
  const step7 = pipelineMd.slice(
    pipelineMd.indexOf("## 7. Check and the bounded fix loop"),
    pipelineMd.indexOf("## 8. Publish")
  );

  assert.match(step5, /pages\/<id>\.html:<line>/, "step 5 never names the page-qualified error shape");
  assert.match(step5, /bounded fix loop/i, "step 5 never says a page-qualified failure joins the bounded fix loop");
  assert.match(step5, /per page/i, "step 5 never says the round budget is per page");
  assert.match(
    step5,
    /not shared artifact-wide|never pooled/i,
    "step 5 never rules out a shared, artifact-wide round budget"
  );
  assert.match(
    step5,
    /not\s+page-qualified|other build failure/i,
    "step 5 never carves out non-page-qualified failures as an immediate stop"
  );
  // The generator-approval gate itself must be untouched — still its own
  // unconditional stop, never folded into the page fix loop.
  assert.match(step5, /needs approval:/, "step 5 no longer documents the generator-approval gate text");

  assert.match(step7, /2 rounds per page/i, "step 7 never states the 2-rounds-per-page budget");
  assert.match(step7, /artifact-level/i, "step 7 never states the artifact-level budget for non-page failures");
  assert.match(step7, /4 rounds overall/i, "step 7 never states the 4-round overall cap");
  assert.match(step7, /re-check\s+mode/i, "step 7 never dispatches fact-checker in re-check mode");
  assert.match(step7, /fact-merge/i, "step 7 never runs explainer.mjs fact-merge");
});

test("commands/explain.md and commands/explain-answer.md: both have an argument-hint and load their skill by name", () => {
  for (const name of ["explain.md", "explain-answer.md"]) {
    const file = path.join(COMMANDS_DIR, name);
    const { frontmatter } = splitFrontmatter(file);
    assert.ok(scalar(frontmatter, "argument-hint"), `${name}: no argument-hint in frontmatter`);
  }
});

// ---------------------------------------------------------- /explain-answer
// the live-layer guardrails have
// to actually be in the shipped skill text, not just in spec/plan prose —
// these tests read the real files rather than trusting a description.

test("commands/explain-answer.md: frontmatter is valid and it loads the explainer-answer skill by name", () => {
  const file = path.join(COMMANDS_DIR, "explain-answer.md");
  const { frontmatter, body } = splitFrontmatter(file);
  assert.equal(scalar(frontmatter, "name"), "explain-answer");
  assert.ok(scalar(frontmatter, "argument-hint"), "explain-answer.md: no argument-hint in frontmatter");
  const tools = (scalar(frontmatter, "allowed-tools") || "").split(",").map((t) => t.trim());
  assert.ok(tools.includes("ArtifactComments"), "explain-answer.md: allowed-tools missing ArtifactComments");
  assert.match(body, /explainer-answer/, "explain-answer.md: body never names the explainer-answer skill");
});

test("skills/explainer-answer/SKILL.md: frontmatter is valid and named distinctly from the /explain-answer command", () => {
  const file = path.join(SKILLS_DIR, "explainer-answer", "SKILL.md");
  const { frontmatter } = splitFrontmatter(file);
  const name = scalar(frontmatter, "name");
  assert.equal(name, "explainer-answer");
  assert.notEqual(name, "explain-answer", "skills/explainer-answer/SKILL.md: name must not collide with the /explain-answer command");
  assert.ok(scalar(frontmatter, "description"), "skills/explainer-answer/SKILL.md: no description");
});

test("skills/explainer-answer/SKILL.md: refuses /loop and every self-scheduling tool by name", () => {
  const file = path.join(SKILLS_DIR, "explainer-answer", "SKILL.md");
  const { body } = splitFrontmatter(file);
  for (const name of ["ScheduleWakeup", "CronCreate", "RemoteTrigger"]) {
    assert.match(body, new RegExp(name), `skills/explainer-answer/SKILL.md: never mentions refusing ${name}`);
  }
  assert.match(body, /\/loop/, "skills/explainer-answer/SKILL.md: never mentions refusing /loop");
  assert.match(
    body,
    /never\b[^.]*(schedul|loop)|refuse[^.]*(\/loop|schedul)/i,
    "skills/explainer-answer/SKILL.md: no clear refusal statement for /loop/self-scheduling found"
  );
});

test("skills/explainer-answer/SKILL.md: states comment text is untrusted data, never instructions", () => {
  const file = path.join(SKILLS_DIR, "explainer-answer", "SKILL.md");
  const { body } = splitFrontmatter(file);
  assert.match(
    body,
    /untrusted data,? never instructions/i,
    "skills/explainer-answer/SKILL.md: missing the exact untrusted-data rule"
  );
});

test("skills/explainer-answer/SKILL.md: exits on an empty open-thread queue before anything else", () => {
  const file = path.join(SKILLS_DIR, "explainer-answer", "SKILL.md");
  const { body } = splitFrontmatter(file);
  assert.match(
    body,
    /zero open threads|no open threads|nothing to answer/i,
    "skills/explainer-answer/SKILL.md: no empty-queue exit condition found"
  );
});

test("skills/explainer-answer/SKILL.md: states the >3-question batching rule precisely (one answer-helper per batch of ≤3)", () => {
  const file = path.join(SKILLS_DIR, "explainer-answer", "SKILL.md");
  const { body } = splitFrontmatter(file);
  assert.match(body, /more than 3 open questions/i, "skills/explainer-answer/SKILL.md: batching threshold (>3) not stated");
  assert.match(body, /at most 3/i, "skills/explainer-answer/SKILL.md: batch size cap (≤3) not stated");
  assert.match(body, /answer-helper/, "skills/explainer-answer/SKILL.md: never names the answer-helper agent");
});

test("skills/explainer/references/pipeline.md: publish step mentions composer_only and LIVE_STATE_DB_RULES", () => {
  const pipelineMd = fs.readFileSync(path.join(SKILLS_DIR, "explainer", "references", "pipeline.md"), "utf8");
  assert.match(pipelineMd, /composer_only/, "pipeline.md: publish step never mentions composer_only");
  assert.match(pipelineMd, /LIVE_STATE_DB_RULES/, "pipeline.md: publish step never mentions LIVE_STATE_DB_RULES");
});

test("no two of {commands, skills, agents} in this plugin share a `name` (a shared name makes the Skill tool resolve to the wrong component)", () => {
  const seen = new Map(); // name -> [rel paths]
  for (const file of [...commandFiles, ...skillFiles, ...agentFiles]) {
    const rel = path.relative(PLUGIN_ROOT, file);
    const { frontmatter } = splitFrontmatter(file);
    const name = scalar(frontmatter, "name");
    assert.ok(name, `${rel}: no \`name\` in frontmatter`);
    if (!seen.has(name)) seen.set(name, []);
    seen.get(name).push(rel);
  }
  const collisions = [...seen.entries()].filter(([, files]) => files.length > 1);
  assert.deepEqual(
    collisions,
    [],
    `component name collisions: ${collisions.map(([name, files]) => `"${name}" used by ${files.join(", ")}`).join("; ")}`
  );
});
