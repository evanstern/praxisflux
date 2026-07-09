# codebase-to-course

Turn any codebase into a **beautiful, interactive single-page HTML course** that teaches how
the code works to non-technical people ("vibe coders"). Point it at a repo; get back a
self-contained course with scroll-based modules, code ↔ plain-English translations, animated
visualizations, group-chat explainers, and quizzes that test application, not memorization.

- **`codebase-to-course`** — the one skill: analysis → curriculum → module briefs → parallel
  module builds → assembly. Prebuilt assets under the skill's `references/` (`styles.css`,
  `main.js`, `_base.html`, `_footer.html`, `build.sh`) are **copied verbatim per course, never
  regenerated** — that invariant is the skill's core.

Ported from the standalone repo `github.com/evanstern/codebase-to-course` (see
`docs/handoffs/codebase-to-course-plugin.md` for the migration plan). Upcoming slices make the
analysis corpus-aware (reads a `docs/wiki/` grounded corpus per
[`docs/corpus-spec.md`](../docs/corpus-spec.md) when present) and add a chassis output gate.

Reference output: the reference-repo repo's `docs/course/`.
