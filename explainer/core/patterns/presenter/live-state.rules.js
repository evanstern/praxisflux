"use strict";
/* core/patterns/presenter/live-state.rules.js — the `db` access rule for
   presenter mode's one document, `live/state`.

   Shape taken verbatim from the `artifact-capabilities` skill's `db`
   section (runtime contract 0.2.74, db.d.ts "ACCESS RULES"):

     capabilities: { db: { rules: [
       { path: "<path>", read: "<level>", write: "<level>" },
       ...
     ] } }

   `live/state` is a two-segment document path (collection "live", doc
   "state") — not a prefix with anything below it, so one rule at that
   exact path is enough; it needs no companion `{self}` rule (this is a
   single shared document, not a per-viewer subtree). `write: "owner"` is
   deliberately the strictest level the `db` capability offers — only the
   artifact's own `isOwner()` person specifically, never merely an
   Editor/admin-level viewer (`write: "admin"` would include every Editor,
   which is wider than presenter mode needs). `read: "view"` is the lowest
   level, so every viewer the server admits — Viewer/Commenter included —
   can always see who is presenting; only the write is locked down.

   The coordinator's publish step (skills/explainer/references/pipeline.md)
   passes this array straight
   into `capabilities: { db: { rules: LIVE_STATE_DB_RULES } }` on first
   publish, when `contents.live.presenter` is on — never hand-typed again
   at the call site, so the rule can't drift from what this file (and
   presenter.live.js, which depends on it being in force) actually needs. */
const LIVE_STATE_DB_RULES = [{ path: "live/state", read: "view", write: "owner" }];

// Node-requirable only (never inlined into a built page — this file is not
// named `<pattern>.js`/`<pattern>.live.js`, so lib/shell.mjs's resolvePatterns
// never ships it to a viewer): a plain CommonJS export, same dual-export
// convention as every other pattern's browser JS in this folder.
if (typeof module !== "undefined" && module.exports) module.exports = { LIVE_STATE_DB_RULES };
