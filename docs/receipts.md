# Receipts — the `.<port-dir>/<noun>.json` convention

A **receipt** is a tracked, byte-deterministic JSON file a port's chassis verb writes so a
gate can confirm a fact offline — no provider call, no network, no MCP (decision-0002, spec
073 R3, operator ruling C2, 2026-10-15).

## The rule

- **Location:** `.<port-dir>/<noun>.json` at the project root — e.g. `.forge/changes.json`,
  `.board/links.json`. The dot-dir is the port's `receiptDir` (`definePort`'s `receiptDir`
  field in `lib/port-registry.mjs`); a port with no receipt leaves it `null`.
- **Tracked, not gitignored.** A receipt is evidence, not transport — contrast the gitignored
  `.handoff/` transport (`docs/handoff-protocol.md`).
- **Written only through the chassis helper**, `lib/receipts.mjs`'s `writeReceipt` — never
  hand-edited. `writeReceipt`/`serializeReceipt` sort object keys recursively (arrays keep
  the caller's order) and always emit `JSON.stringify(value, null, 2) + "\n"`, so two writes
  of the same logical value are byte-identical. `checkReceipt` re-serializes the parsed,
  on-disk value and byte-compares: a hand-edited or reformatted file fails even though its
  JSON still parses.
- **Gates read receipts, never providers.** A gate (or anything checking "is this true right
  now") calls `checkReceipt`/`readReceipt`, not a port adapter — the receipt is the seam.

## Existing and reserved receipts

- **`.board/links.json`** — the tracker's receipt, predates this convention (spec 052) and
  keeps its own explicit-key-order serializer (`lib/board-mirror.mjs`'s `writeMirror`), which
  this task's chassis does not migrate (TASK-0141 decides whether to). It is the precedent
  `lib/receipts.mjs` generalizes from.
- **`.forge/changes.json`** — reserved for the forge port (TASK-0140); not written by this
  task.
- The spec and harness ports have no receipt: the spec dir and the `Dispatch:` lines
  (`docs/wiki`, `CLAUDE.md` model-tiers section) are their evidence instead.
