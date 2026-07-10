---
name: handoff-protocol
description: How one plugin hands work to another — shared transport in lib/handoff.mjs with gitignored .handoff/ payloads, plugin-pair payload schemas, and durable evidence in tracked state
kind: pattern
sources:
  - docs/handoff-protocol.md
  - lib/handoff.mjs
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# The handoff protocol

How one praxisflux plugin hands work to another. The **transport is shared** (`lib/handoff.mjs`
on the chassis); the **payload semantics are per plugin pair**. The protocol reference is
`docs/handoff-protocol.md`.

## How it works

The rule is *transient payload, durable evidence*. A handoff message is plumbing, not a
work product, so it must not clutter `git status`:

- **Payloads** live in a gitignored `.handoff/` at the project root (`HANDOFF_DIR` in
  `lib/handoff.mjs`; `ensureHandoffDir` creates it and gitignores it via the installer's
  `ensureGitignore`). Consuming one moves it to `.handoff/consumed/` (`markConsumed`).
- **Evidence** that a handoff happened is recorded in the consumer's own **tracked state**
  (e.g. educate's `progress.json`). Gates read the evidence, never the loose payload files.
- **Durable residue** (what was learned/produced) lands in normal tracked artifacts
  (a lesson's `guide.md` / `raw-notes.md`), not in the handoff.

**The envelope** is frontmatter on each `.handoff/<id>.md`: `id` (unique message id),
`kind` (`request` or `response`), `from`/`to` (plugin names), `ref` (correlation id tying a
response to its request), `title`. The body below is the payload — defined by the plugin
pair, never by the chassis. `writeHandoff` requires `id`, `kind`, `from`, and `to`;
`readHandoff` returns `{ envelope, body, path }`; `listHandoffs` filters pending messages
by envelope fields (e.g. `{to, kind, ref}`).

**Known instances:**

- educate → build: a `request` carrying a **SPEC**. Evidence: `handoff.specd`.
- build → educate: a `response` carrying **findings**. Evidence: `handoff.returned`, then
  `handoff.foldedIn` once folded into the lesson (gated at `done`).
- educate → research: a `request` to ground a topic/lesson.

## Connections

- [[chassis]] hosts the transport; [[installer]] provides `ensureGitignore`;
  [[markdown-module]] parses the envelope frontmatter.
- [[educate-plugin]] and [[build-plugin]] are the primary pair riding it (the teach → build seam).
- [[gates-convention]] — evidence-in-tracked-state is what lets gates enforce handoff steps.

## Operational notes

- The chassis moves opaque payloads and never edits a plugin's ledger — writing the durable
  record is always the consumer's job.
- `markConsumed` returns `false` if the message is absent; `readHandoff` returns `null`.
- Tracked evidence lives outside `.handoff/`, so a clean `git status` and an enforceable
  gate coexist.
