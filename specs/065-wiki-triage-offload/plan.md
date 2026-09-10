# 065 — plan

**Constitution:** absent on this host (`.specify/` is not installed, so there is no
`memory/constitution.md`). Per the sweep's plan-step rule, this plan is checked against
the grounding docs — `CLAUDE.md`, `docs/principles.md`, `docs/releasing.md`,
`docs/wiki/grounding-wiki-plugin.md` and `docs/wiki/chassis.md` (the seam's contract as
documented by spec 063). The corpus-loading doctrine and the honest-re-pins rule shape
everything below: this consumer must strengthen the pin discipline, never dilute it.

## Approach

One new script + one skill-text step + a measurement harness. The deterministic
`classifyNote` is untouched; the offload triages only its REVIEW pile.

### The script: `grounding-wiki/scripts/triage-offload.mjs`

CLI: `node triage-offload.mjs <repo-root> [corpus-dir]`. For each `planFreshness` entry
with `cls: "REVIEW"`:

- Build the prompt from the note's `description:` frontmatter + `sources:` list + the
  diff stat (`files` with +/- counts) + the changed lines — NOT the note body (routing
  input, not content input; keeps the prompt small and the model blind to prose it might
  be tempted to "fix").
- Call `offload()` (`lib/structured-offload.mjs`, reached through the plugin's `lib`
  symlink) with schema:
  ```json
  { "type": "object", "required": ["route", "deciding_path"],
    "properties": {
      "route": { "type": "string", "enum": ["computed-re-pin", "needs-review"] },
      "deciding_path": { "type": "string" } } }
  ```
- Post-validate beyond the seam: `deciding_path` must be one of the entry's `files[].path`
  values. Fail → treat as fallback for that note.
- Prompt encodes the conservative bias verbatim: misrouting to `computed-re-pin` is the
  expensive error (a false pin); when uncertain, `needs-review`.
- Output: JSON to stdout — per note `{ note, route, deciding_path, offloaded }` where
  `offloaded: false` marks a fallback (route then absent; the note stays in-session
  work). Exit 0 always; an unconfigured seam yields every note `offloaded: false`, which
  is byte-identical routing to today.

The script ROUTES only. It writes nothing — no notes, no pins (read-only, matching the
`gates/` contract's spirit). Re-pinning stays with the wiki-update pass: notes routed
`computed-re-pin` get `repin.mjs` run by the pass **after Claude spot-checks the
routing output exists and parses**; notes routed `needs-review` (or fallen back) get
today's full read-verify-amend-repin treatment.

### The skill wiring

`grounding-wiki/skills/wiki-update/SKILL.md` Work step 2 gains a preamble: when
`.claude/structured-offload.json` exists, run `triage-offload.mjs` over the plan and
treat its `computed-re-pin` routes as plan-sanctioned re-pins (execute `repin.mjs` for
them); everything else follows the existing 2.1–2.3 loop. Skill `version:` bumps
(0.2.0 → 0.3.0) — this is an edited-skill surface per `docs/releasing.md`.

The Hard rule gets one added sentence, not a rewrite: an offloaded `computed-re-pin`
route is the third sanctioned no-read path ONLY when the seam validated the response
and the deciding path checked out; a fallback note is never re-pinned without the read.

### Tests: `test/triage-offload.test.mjs`

Stub-server based (same convention as `test/structured-offload.test.mjs`), no live model:
- Routes a REVIEW entry through a stub returning valid `computed-re-pin` with a path in
  the entry's file list → `offloaded: true`, route honored.
- Stub returns a path NOT in the diff → fallback for that note.
- Stub returns prose / wrong enum → fallback (seam-level).
- No config → every note `offloaded: false` (byte-identical-to-today check).
- The script never writes: fixture corpus mtimes/contents unchanged after a run.

### The measurement (AC #5–#6)

`docs/design/triage-offload-measurement.md`, produced by running the classification pass
twice over the same staleness window on the praxis corpus (recreate a real one: the
version-bump window from PRs #141/#142 gives ~15 stale notes, REVIEW-heavy):

- **Seam-off:** Claude classifies each REVIEW note in-session (this is ground truth).
- **Seam-on:** `triage-offload.mjs` against Ollama `deepseek-r1:latest` at
  `http://localhost:11434` (runbook checkpoint 1).
- Record: tokens (offload residue + session usage), wall-clock, fallback rate, misroute
  rate split by direction (false `computed-re-pin` vs false `needs-review`).
- Verdict section: second consumer justified, or revert the seam. Explicit, one
  paragraph, evidence-cited.

**Endpoint-down ruling (checkpoint 2):** code lands, ACs #5/#6 stay unticked, task parks
short of Done, operator surfaced.

## Released surface

`grounding-wiki/` and `test/` are released surface: marketplace + plugin bumps
(0.63.2 → 0.63.3) plus wiki-update's skill `version:`. Wiki notes staled:
`grounding-wiki-plugin` (real amendment — the update loop grew an opt-in offload step),
`test-suite-catalog` (new test file), plus version-churn re-pins classified per diff.
