// Docs-sync structural gate: README/CLAUDE.md must name every shipped plugin and chassis
// module — and the real repo must pass its own check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { checkDocs } from "../scripts/check-docs.mjs";
import { underRepo } from "../scripts/stop-docs.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

function fixture({ readme, claude }) {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-docs-"));
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  mkdirSync(join(root, "lib"));
  writeFileSync(join(root, ".claude-plugin", "marketplace.json"),
    JSON.stringify({ plugins: [{ name: "alpha", source: "./alpha" }] }));
  writeFileSync(join(root, "lib", "widget.mjs"), "export {}\n");
  writeFileSync(join(root, "README.md"), readme);
  writeFileSync(join(root, "CLAUDE.md"), claude);
  return root;
}

const GOOD_README = "| **alpha** | stuff |\n`widget`\n/plugin install alpha@praxisflux\n";
const GOOD_CLAUDE = "see docs/releasing.md\n";

test("check-docs: a complete fixture passes", () => {
  const root = fixture({ readme: GOOD_README, claude: GOOD_CLAUDE });
  try { assert.deepEqual(checkDocs(root), []); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("check-docs: each omission is a named problem", () => {
  const cases = [
    { readme: "`widget`\n/plugin install alpha@praxisflux\n", claude: GOOD_CLAUDE, expect: /no row in the plugins table/ },
    { readme: "| **alpha** | stuff |\n`widget`\n", claude: GOOD_CLAUDE, expect: /no '\/plugin install alpha@praxisflux' line/ },
    { readme: "| **alpha** | stuff |\n/plugin install alpha@praxisflux\n", claude: GOOD_CLAUDE, expect: /chassis module 'widget'/ },
    { readme: GOOD_README, claude: "nothing here\n", expect: /does not link docs\/releasing\.md/ },
  ];
  for (const c of cases) {
    const root = fixture({ readme: c.readme, claude: c.claude });
    try {
      const problems = checkDocs(root);
      assert.equal(problems.length, 1, JSON.stringify(problems));
      assert.match(problems[0], c.expect);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

/* ── plugin census: README count/enumeration vs marketplace.json ─────────── */

// Same shape as fixture(), but with two registered plugins so count claims are exercised.
function censusFixture({ readme }) {
  const root = mkdtempSync(join(tmpdir(), "praxisflux-docs-census-"));
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  mkdirSync(join(root, "lib"));
  writeFileSync(join(root, ".claude-plugin", "marketplace.json"),
    JSON.stringify({ plugins: [{ name: "alpha", source: "./alpha" }, { name: "beta", source: "./beta" }] }));
  writeFileSync(join(root, "README.md"), readme);
  writeFileSync(join(root, "CLAUDE.md"), "see docs/releasing.md\n");
  return root;
}

const CENSUS_BASE = [
  "| **alpha** | stuff |",
  "| **beta** | stuff |",
  "/plugin install alpha@praxisflux",
  "/plugin install beta@praxisflux",
].join("\n") + "\n";

test("census: a README whose count claims match the marketplace passes (words and digits)", () => {
  const root = censusFixture({ readme: `Two plugins are registered.\nAll 2 plugins install.\n${CENSUS_BASE}` });
  try { assert.deepEqual(checkDocs(root), []); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("census: a stale count claim is a named problem (the seven-vs-nine drift shape)", () => {
  const cases = ["Seven plugins are registered in the marketplace.", "the 7 plugins below"];
  for (const claim of cases) {
    const root = censusFixture({ readme: `${claim}\n${CENSUS_BASE}` });
    try {
      const problems = checkDocs(root);
      assert.equal(problems.length, 1, JSON.stringify(problems));
      assert.match(problems[0], /but marketplace\.json registers 2/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test("census: non-numeric words before 'plugins' are not count claims", () => {
  const root = censusFixture({ readme: `A set of composable plugins. The plugins compose.\n${CENSUS_BASE}` });
  try { assert.deepEqual(checkDocs(root), []); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("census: enumeration is two-way — a row or install line for an unregistered plugin fails", () => {
  const cases = [
    { extra: "| **gamma** | ghost row |\n", expect: /plugins-table row for 'gamma'/ },
    { extra: "/plugin install gamma@praxisflux\n", expect: /install line for 'gamma'/ },
  ];
  for (const c of cases) {
    const root = censusFixture({ readme: CENSUS_BASE + c.extra });
    try {
      const problems = checkDocs(root);
      assert.equal(problems.length, 1, JSON.stringify(problems));
      assert.match(problems[0], c.expect);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test("check-docs: the praxisflux repo itself is in sync", () => {
  assert.deepEqual(checkDocs(repo), []);
});

/* ── stop-docs root matching: realpath both sides + separator boundary ────── */

// Regression: the docs-sync Stop gate compared the ESM-realpathed repo dir against the
// as-launched startDir with a bare startsWith. A symlinked launch path (macOS /tmp vs
// /private/tmp, ~/projects links) compared unequal and silently disabled the gate, while a
// sibling dir like .../praxis-anything satisfied startsWith and could block Stop in an
// unrelated project. underRepo realpaths both sides and requires a path-separator boundary.
test("stop-docs: a symlinked launch path still matches the repo (gate fires)", () => {
  const base = mkdtempSync(join(tmpdir(), "stop-docs-root-"));
  try {
    const repoDir = join(base, "praxis");
    mkdirSync(join(repoDir, "sub"), { recursive: true });
    const link = join(base, "praxis-link");
    symlinkSync(repoDir, link);
    assert.equal(underRepo(link, repoDir), true);              // launched via the symlink
    assert.equal(underRepo(join(link, "sub"), repoDir), true); // subdir through the symlink
    assert.equal(underRepo(repoDir, link), true);              // symlink on the repo side too
    assert.equal(underRepo(repoDir, repoDir), true);           // plain identity still holds
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("stop-docs: a sibling dir sharing the repo's name as a prefix never matches", () => {
  const base = mkdtempSync(join(tmpdir(), "stop-docs-sibling-"));
  try {
    const repoDir = join(base, "praxis");
    const sibling = join(base, "praxis-anything");
    mkdirSync(repoDir);
    mkdirSync(sibling);
    assert.equal(underRepo(sibling, repoDir), false);
    assert.equal(underRepo(join(sibling, "deep"), repoDir), false);
    assert.equal(underRepo(join(base, "unrelated"), repoDir), false);
    assert.equal(underRepo("", repoDir), false); // degenerate input degrades, never crashes
  } finally { rmSync(base, { recursive: true, force: true }); }
});
