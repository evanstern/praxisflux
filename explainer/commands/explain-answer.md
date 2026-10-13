---
name: explain-answer
description: "Use when the user wants open comment threads on a published explainer artifact answered from its facts and sources — e.g. \"/explain-answer https://claude.ai/artifact/...\" or \"answer the questions on the architecture site\"."
argument-hint: "<artifact url | name>"
allowed-tools: Read, Grep, Glob, Bash, ArtifactComments, Task, ToolSearch
---

# /explain-answer

**Arguments:** $ARGUMENTS

Parse `$ARGUMENTS` as a single `<artifact url | name>`:

- If it looks like a URL (starts with `https://claude.ai/`), hand it to the
  skill as-is.
- Otherwise treat it as an artifact **name** under `docs/explainers/<name>/`
  — the skill resolves it to that artifact's own `contents.json`'s
  `publish.url`; do not resolve it here yourself.

Load the `explainer-answer` skill (`explainer:explainer-answer`) and
hand it the parsed argument. The skill owns the entire flow from here —
resolving the artifact, reading open comment threads, answering from facts
and sources, batching, posting replies, and exiting — exactly as documented
in its own body. Do not reimplement any part of that flow in this command.

**This command always runs once and exits.** It never schedules a repeat of
itself and never keeps a session open waiting for new comments — if the
surrounding invocation says this is a `/loop` run, a scheduled/recurring
run, or otherwise asks this command to keep watching, refuse per the
skill's guardrails instead of proceeding (see `explainer-answer`'s "No
self-scheduling" section).
