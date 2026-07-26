# docs/design-inputs — tracked session notes and vendored design inputs

This directory holds **tracked, durable design inputs**: session notes and vendored
documents (e.g. a review report or migration plan) that specified a piece of work and
remain its permanent paper trail. Files here are committed history — they are cited by
specs, READMEs, and wiki notes, and are never regenerated or consumed.

**It is not the handoff transport.** The similarly-named `.handoff/` directory at a
project root is the *gitignored runtime transport* for inter-plugin handoff payloads
(`lib/handoff.mjs`): transient plumbing that must not clutter `git status`, defined by
[`docs/handoff-protocol.md`](../handoff-protocol.md). The two are unrelated — this
directory's name was chosen (TASK-38) precisely so a grep for one no longer finds the
other. Rule of thumb: **evidence and design inputs live here, tracked;
payloads ride `.handoff/`, ignored.**
