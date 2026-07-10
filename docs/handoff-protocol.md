# The praxisflux handoff protocol

How one plugin hands work to another. The **transport is shared** (`lib/handoff.mjs`); the
**payload semantics are per plugin pair**. (Full authoring guidance lands in `skill-patterns.md`,
TASK-1.11 — this is the protocol reference.)

## The rule: transient payload, durable evidence

A handoff message is *plumbing*, not a work product — it must not clutter `git status`. So:

- **Payloads** live in a **gitignored `.handoff/`** at the project root (the installer adds the
  ignore). They are opaque markdown files with a small envelope; consuming one moves it to
  `.handoff/consumed/`.
- **Evidence** that a handoff happened — and what it changed — is recorded in the consumer's own
  **tracked state** (e.g. educate's `progress.json`). Gates read the evidence, never the loose
  payload files. A clean `git status` and an enforceable gate at the same time.
- **Durable residue** (what was actually learned/produced) lands in the normal tracked artifacts
  (a lesson's `guide.md` / `raw-notes.md`), not in the handoff.

## The envelope (shared)

Frontmatter on each `.handoff/<id>.md`:

| field | meaning |
|---|---|
| `id` | unique message id |
| `kind` | `request` (e.g. a SPEC) or `response` (e.g. findings) |
| `from` / `to` | plugin names |
| `ref` | correlation id tying a response back to its request |
| `title` | human label |

The body below the frontmatter is the **payload — defined by the plugin pair, not the chassis.**

## Instances

- **educate → build:** a `request` carrying a **SPEC** (what to build). Evidence: `handoff.specd`.
- **build → educate:** a `response` carrying **findings** (what building taught us). Evidence:
  `handoff.returned`; once folded back into the lesson, `handoff.foldedIn` (gated at `done`).
- **educate → research (grounding):** a `request` to ground a topic/lesson (see TASK-1.9).

Each pair defines its own payload shape; all ride the same envelope + `.handoff/` transport.
