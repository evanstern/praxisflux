# Handoff: course chrome drift — stale skill copies ship the pre-inline code visualizer

**From:** the-stacks 009-library-surface-env cycle (2026-07-10), where the freshly built
Principle VIII course rendered the old **side-by-side** Code↔English blocks instead of the
canonical **inline comments-on-top** visualizer. Operator flagged it; root cause traced and
remediated downstream; the upstream fixes belong here.

## Symptom

A course built via `/spec-cycle-course` → `/codebase-to-course` on 2026-07-10 shipped with
`main.js` (498 lines) that has **no** translation-block builder: `translation-block` markup
renders as the permanent two-column CSS grid. The praxis plugin's current chrome
(`codebase-to-course/skills/codebase-to-course/references/main.js`, 742 lines) rebuilds each
block into the single wide code panel with `.tl` notes interleaved as `//`-comments plus the
"hide notes" toggle (`interactive-elements.md`, "Comments-on-top rendering (automatic)").

## Root cause chain (three links, all verified)

1. **Two same-named skills coexist and the stale one wins unqualified resolution.**
   `~/.claude/skills/codebase-to-course` is a symlink to a local checkout of the standalone
   repo (`github.com/evanstern/codebase-to-course`, `main` @ `ff8837e`, clean vs its origin)
   — its `references/main.js` is 498 lines, **pre-inline**. The praxis plugin
   (`praxis/codebase-to-course`, cache `0.1.0`) carries the inline engine. An agent invoking
   the unqualified skill name `codebase-to-course` got the **stale standalone copy** (its
   base directory was `~/.claude/skills/codebase-to-course`), whose `interactive-elements.md`
   documents *only* the side-by-side pattern. Note: the plugin-import handoff in this folder
   says the source of truth is the same repo @ `0e3b61a` ("recent features to keep intact: …
   comments-on-top") — so the actively-developed line moved on, and the checkout behind the
   global symlink was left behind.

2. **Vendored chrome in consuming repos silently fossilizes.** the-stacks'
   `docs/courses/008-ingestion-service/` was built before the inline engine landed, so its
   committed `styles.css`/`main.js` are pre-inline. When the 009 course was assembled, the
   008 course read as "the house template" and its chrome was copied sideways — reinforcing
   the stale version even beyond the skill-resolution problem. Nothing in the chrome
   identifies its own version, so the drift was invisible until a human looked at a rendered
   block.

3. **The shared-tooling extraction is in flight but not load-bearing yet.** praxis is
   mid-extraction (`lib/toolkit` TASK-7.x: shared visual pedagogy, canonical tooltip, SVG
   rules), which is exactly the "this was supposed to be shared tooling" expectation — but
   consumers can't yet pull chrome from one canonical, versioned place.

## Downstream remediation already done (in the-stacks, for reference)

- 009 course chrome replaced with the praxis plugin references' `main.js`/`styles.css`.
- All 14 translation blocks re-authored to the inline engine's positional contract
  (**exactly one `<p class="tl">` per `.code-line`, same order**) — the per-thought notes the
  side-by-side style tolerated violate it silently (engine pairs positionally; missing notes
  misalign everything after them).
- `docs/courses/008-ingestion-service/` in the-stacks still carries pre-inline chrome and
  per-thought notes — known, deliberate leftover; retrofit is the-stacks' call, but a praxis
  "chrome upgrade" story (below) would make it mechanical.

## Recommended praxis work items

1. **Kill the split-brain:** retire or fast-forward the standalone repo's local checkout
   (and the `~/.claude/skills/codebase-to-course` symlink pointing at it) so unqualified
   `codebase-to-course` cannot resolve to a pre-inline copy. Either point the symlink at the
   praxis plugin skill dir, or delete it and rely on the plugin-namespaced skill.
2. **Version-stamp the chrome:** a header comment in `styles.css` and `main.js`
   (e.g. `/* codebase-to-course chrome vX.Y — inline translation engine */`) so any vendored
   copy self-identifies, and gotchas.md gains a "check the chrome version" line.
3. **Ship a pairing validator:** the inline engine's 1-tl-per-code-line contract is easy to
   violate and fails silently (misaligned notes). A tiny checker (script or gotchas.md recipe:
   per `translation-block`, count `.code-line` vs `.tl`, fail on mismatch) belongs in the
   plugin — build.sh is a natural host.
4. **Chrome-upgrade path for existing courses:** documented one-liner (copy references over
   the course dir + run the pairing validator + rebuild) so pre-inline courses (the-stacks 008,
   any others) can be retrofitted mechanically.
5. **Finish the lib/toolkit extraction** with consumers reading chrome from the plugin at
   build time rather than each course vendoring it invisibly — or at minimum, make
   spec-cycle-course-style wrappers name the plugin references path as the only legitimate
   chrome source (the-stacks' wrapper skill will be updated to say exactly that).

## Evidence pointers

- Stale copy: `~/.claude/skills/codebase-to-course` → a local checkout of the standalone repo
  (`references/main.js` 498 lines, 0 hits for the translation builder).
- Current: `praxis/codebase-to-course/skills/codebase-to-course/references/main.js` (742
  lines, `hide notes` toggle @ ~L373); `references/interactive-elements.md` §"Comments-on-top
  rendering (automatic)".
- Downstream fix: the-stacks `docs/courses/009-library-surface-env/` (chrome swap + tl
  re-pairing), commit trail on `main` dated 2026-07-10.
