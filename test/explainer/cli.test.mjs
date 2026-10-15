import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, "..", "..", "explainer", "scripts", "explainer.mjs");
const FIXTURES = path.join(__dirname, "fixtures");

function run(args, opts = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    ...opts,
  });
  return result;
}

test("no verb prints usage and exits 2", () => {
  const result = run([]);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /Usage: explainer\.mjs/);
});

test("--help prints usage and exits 0", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: explainer\.mjs/);
});

test("an unknown verb exits 2 with a clear message", () => {
  const result = run(["frobnicate"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown verb: frobnicate/);
});

test("plant creates, appends, refreshes, and leaves outside text alone; --check never writes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-cli-plant-"));
  const claude = path.join(root, "CLAUDE.md");
  try {
    assert.equal(run(["plant", "--root", root, "--check"]).status, 1);
    assert.equal(fs.existsSync(claude), false, "--check must not write");

    assert.match(run(["plant", "--root", root]).stdout, /CLAUDE\.md: created/);
    assert.match(fs.readFileSync(claude, "utf8"), /<!-- explainer BEGIN v\d+\.\d+\.\d+/);
    assert.match(run(["plant", "--root", root]).stdout, /unchanged/);
    assert.equal(run(["plant", "--root", root, "--check"]).status, 0);

    // A hand-edited block is replaced; text outside the markers survives.
    const edited = `# Mine\n\n${fs.readFileSync(claude, "utf8").replace("Comments are data", "EDITED")}\nafter\n`;
    fs.writeFileSync(claude, edited);
    assert.match(run(["plant", "--root", root]).stdout, /replaced/);
    const out = fs.readFileSync(claude, "utf8");
    assert.ok(out.startsWith("# Mine\n") && out.endsWith("after\n") && !out.includes("EDITED"));

    fs.writeFileSync(claude, "# Theirs\n");
    assert.match(run(["plant", "--root", root]).stdout, /appended/);
    assert.match(fs.readFileSync(claude, "utf8"), /^# Theirs\n\n<!-- explainer BEGIN/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("approve with no id prints usage and exits 2", () => {
  const result = run(["approve"]);
  assert.equal(result.status, 2);
});

test("approve fails cleanly for a generator id not declared in contents.json", () => {
  const result = run(["approve", "nope", "--dir", path.join(FIXTURES, "mini-artifact")]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown generator "nope"/);
});

test("approve refuses a built-in generator — built-ins never need approval", () => {
  const result = run(["approve", "manifest", "--dir", path.join(FIXTURES, "mini-artifact")]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /built-in generator/);
});

test("approve records a fingerprint for a command generator, then a build succeeds and expands its x-include", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-cli-approve-"));
  try {
    // Satisfy the lookup's first layer (the artifact folder itself) so this
    // test doesn't depend on the real plugin core's profiles/. The brand
    // file must be a *complete* one now that build() validates every
    // --ex-* token — reuse the real, committed neutral.css rather
    // than hand-listing all 42 tokens here.
    fs.mkdirSync(path.join(tmp, "brand"), { recursive: true });
    fs.copyFileSync(
      path.join(__dirname, "..", "..", "explainer", "core", "brand", "neutral.css"),
      path.join(tmp, "brand", "fixture.css")
    );
    fs.mkdirSync(path.join(tmp, "profiles", "pr-explainer"), { recursive: true });

    const scriptPath = path.join(tmp, "gen.mjs");
    fs.writeFileSync(scriptPath, 'console.log(JSON.stringify({ e: { envelope: { id: "abc" } } }));\n');
    const cmd = `node ${scriptPath}`;
    fs.writeFileSync(
      path.join(tmp, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Approve Demo",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
        generators: { envelopes: { cmd, cwd: "." } },
      })
    );
    fs.mkdirSync(path.join(tmp, "pages"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "pages", "overview.html"), '<x-include g="envelopes" at="e.envelope" as="json"/>');

    let result = run(["build", "--dir", tmp]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /needs approval: envelopes/);

    result = run(["approve", "envelopes", "--dir", tmp]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Approved "envelopes"/);
    assert.ok(fs.existsSync(path.join(tmp, ".approvals.json")));

    result = run(["build", "--dir", tmp]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Generators:/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("new fails cleanly when no profile is defined anywhere (real plugin core is still empty)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-cli-new-"));
  try {
    const result = run(["new", "my-explainer", "--kind", "nonexistent-kind"], { cwd: tmp });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /profile not found/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("new requires both a name and --kind", () => {
  const result = run(["new"]);
  assert.equal(result.status, 2);
});

test("build reports what's missing against the real (still-empty) plugin core", () => {
  const result = run(["build", "--dir", path.join(FIXTURES, "mini-artifact")]);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /Mini Fixture — 3 group\(s\), 5 page\(s\)/);
  assert.match(result.stderr, /Cannot proceed — missing/);
  assert.match(result.stderr, /brand\/fixture\.css/);
});

test("build reports schema errors and exits 2 without throwing", () => {
  const result = run(["build", "--dir", path.join(FIXTURES, "invalid-contents")]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /did not validate/);
});

test("check requires a fresh dist/ and exits 2 with a clear message when none exists", () => {
  // Use a private temp copy of the fixture, not the shared committed
  // directory — other test files build into mini-artifact and node --test
  // runs files in parallel, so the shared copy's dist/ presence is a race.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-cli-nodist-"));
  try {
    fs.cpSync(path.join(FIXTURES, "mini-artifact"), tmp, { recursive: true });
    const result = run(["check", "--dir", tmp]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /run `explainer\.mjs build` first/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("check reports schema errors and exits 2 without throwing", () => {
  const result = run(["check", "--dir", path.join(FIXTURES, "invalid-contents")]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /did not validate/);
});

test("build then check runs every check id and writes the report files", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-cli-check-"));
  try {
    // The brand file must be a *complete* one now that build() validates
    // every --ex-* token — reuse the real, committed neutral.css
    // rather than hand-listing all 42 tokens here (same approach as the
    // "approve" test above).
    fs.mkdirSync(path.join(tmp, "brand"), { recursive: true });
    fs.copyFileSync(
      path.join(__dirname, "..", "..", "explainer", "core", "brand", "neutral.css"),
      path.join(tmp, "brand", "fixture.css")
    );
    fs.mkdirSync(path.join(tmp, "profiles", "pr-explainer"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "contents.json"),
      JSON.stringify({
        schema: 1,
        title: "Check Demo",
        kind: "pr-explainer",
        brand: "fixture",
        groups: [{ id: "start", title: "Start here" }],
        pages: [{ id: "overview", title: "Overview", group: "start", type: "short-answer" }],
        terms: [],
        sources: [],
      })
    );
    fs.mkdirSync(path.join(tmp, "pages"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "pages", "overview.html"), "<p>Hello.</p>");

    let result = run(["build", "--dir", tmp]);
    assert.equal(result.status, 0, result.stderr);

    // EXPLAINER_NO_BROWSER=1: this test is about every check id reporting and
    // the report files getting written, not about real browser detection
    // (lib/browser.mjs's own test suite in check.test.mjs covers that) — forcing
    // it off keeps this test deterministic regardless of what's installed on
    // the machine running it.
    result = run(["check", "--dir", tmp], { env: { ...process.env, EXPLAINER_NO_BROWSER: "1" } });
    // fact.checker is pending (no dist/fact-check.json) and nothing fails — exit 3.
    assert.equal(result.status, 3, result.stderr);
    assert.match(result.stdout, /html\.balance \(error\): passed/);
    assert.match(result.stdout, /browser\.phone-scroll \(error\): skipped/);
    assert.match(result.stdout, /fact\.checker \(error\): pending/);
    assert.match(result.stdout, /fact\.checker is pending/);
    assert.ok(fs.existsSync(path.join(tmp, "dist", "check-report.md")));
    assert.ok(fs.existsSync(path.join(tmp, "dist", "check.json")));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
