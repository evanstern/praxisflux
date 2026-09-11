# Triage-offload measurement (TASK-0127, spec 065 Phase 3)

Real classification pass over the praxis corpus, seam-off (Claude, ground truth) vs
seam-on (`triage-offload.mjs` against Ollama `deepseek-r1:latest`), over identical
inputs. Produced 2026-09-10. Preflight: `curl http://localhost:11434/api/tags` answered
live and listed `deepseek-r1:latest` — measurement executed for real, not parked.

## Method

1. **Scratch clone.** `git clone` the worktree into a `mktemp -d` scratch directory
   (never touches the real repo or its wiki).
2. **Staleness window.** Reset every note's `verified_against` pin (frontmatter only,
   via `sed`, scratch clone only) to `390ca615074d6bf670e999ffc12f05a38e1c29cc` — the
   commit immediately before the sweep runbook that carried PRs #141 (spec 063,
   `structured-offload.mjs`) and this task's own Phase 1/2. `node
   grounding-wiki/gates/cli.mjs plan . docs/wiki` then reports the real window: **15
   stale notes total — 6 RE-PIN-ONLY (classifyNote already resolves these safely, no
   model involved), 9 NEEDS-REVIEW.** The 9 NEEDS-REVIEW notes are the measurement's
   REVIEW pile.
3. **Seam-off (ground truth).** For each of the 9 REVIEW notes: read its `description:`
   and `git diff <pin>..HEAD -- <sources>` (full unified diff, not the offload's `-U0`
   trim), and judge `computed-re-pin` vs `needs-review` the way wiki-update step 2
   would. Cross-checked every call against the actual historical record — whether the
   note's own body was edited by a real PR within this window (a genuine prior
   human/Claude review already happened for 5 of the 9; the other 4 received only a pin
   bump across the same window, i.e., a real reviewer judged no prose change was
   needed). This is a stronger ground truth than re-deriving from scratch, and it
   surfaced a fixture caveat noted below.
4. **Seam-on.** Wrote `.claude/structured-offload.json` (`ollama`,
   `deepseek-r1:latest`, `http://localhost:11434`, `timeoutMs: 120000`) in the scratch
   clone and ran `node grounding-wiki/scripts/triage-offload.mjs . docs/wiki`,
   collecting residue (`{backend, model, outcome, ms}` per call) and, via a read-only
   diagnostic script (scratch-clone-only, calls `offload()` directly, never modifies
   the shipped script), the *raw* model response for calls the post-check discarded.
5. Scratch dir removed after (`rm -rf`).

**Fixture caveat:** because only the `verified_against:` line was rolled back (per the
dispatch protocol — hand-editing pins is a sanctioned fixture move, hand-editing note
prose is not), 5 of the 9 REVIEW notes carry prose that a *later* real PR already
amended within this same window. The offload script is unaffected (by design it never
reads note bodies, only `description:` + diff, and only one of the 5 had its
`description:` touched by that amendment). Ground truth uses current prose per the
dispatch protocol; flagged here for anyone re-running this fixture.

## Per-note results

| Note | Ground truth | Model route | `offloaded` | Agree? |
|---|---|---|---|---|
| build-and-release.md | computed-re-pin | needs-review | false (bad path) | ✗ |
| chassis.md | needs-review | needs-review | false (bad path) | ✓ |
| grounding-wiki-plugin.md | needs-review | needs-review | true | ✓ |
| overview.md | computed-re-pin | needs-review | true | ✗ |
| pdlc-plugin.md | needs-review | needs-review | false (bad path) | ✓ |
| reorient-plugin.md | computed-re-pin | needs-review | false (bad path) | ✗ |
| team-review-plugin.md | computed-re-pin | needs-review | false (bad path) | ✗ |
| test-suite-catalog-plugins-gates-pdlc.md | needs-review | needs-review | true | ✓ |
| test-suite-catalog.md | needs-review | needs-review | true | ✓ |

"false (bad path)" = the seam validated the schema (`outcome: validated` in residue —
the model returned a syntactically valid `{route, deciding_path}` object) but
`triage-offload.mjs`'s post-check rejected it: in all 5 cases the model echoed the
literal string `"needs-review"` into `deciding_path` instead of naming a changed file,
which fails "must be one of the entry's `files[].path` values" and correctly falls
back. **The model's substantive route was `needs-review` in all 9/9 calls — it never
once answered `computed-re-pin`,** whether or not the call ultimately validated.

## The four metrics

- **Fallback rate:** 5/9 = 55.6% by the `offloaded` flag. The metric that matters more
  for cost: **0/9 notes actually skipped the session-side read.** Per
  `wiki-update`'s SKILL.md, only an offloaded `computed-re-pin` route re-pins without a
  read; `needs-review` — offloaded or fallen back — drops into the same full
  read-verify-repin loop. Since the model never emitted `computed-re-pin`, every one of
  the 9 notes still requires the identical Claude-side diff read the seam was meant to
  narrow. Realized session-context savings this run: **zero.**
- **Misroute rate vs. ground truth:** 4/9 = 44.4% disagreed (build-and-release,
  overview, reorient-plugin, team-review-plugin — all four genuine computed-re-pin
  notes in the ground-truth set).
- **Misroute direction (AC #4):** **100% of misroutes were false `needs-review`** (the
  cheap error — costs a read that was already happening). **Zero false
  `computed-re-pin`** (the expensive error — a forged pin). The conservative-bias prompt
  held in the safe direction on every call; the model simply never attempted the
  cheaper route, at all, even when it was correct to.
- **Wall-clock:** seam-off (Claude reading description + full diff for 9 notes,
  forming a verdict) ≈ 357s. Seam-on (9 sequential Ollama calls, `deepseek-r1:latest`
  is a thinking model) ≈ 310s total, per-call range 11.1s–108.1s (residue `ms`:
  18203, 108097, 53922, 11054, 28340, 19502, 12537, 26032, 30230). No call hit the
  120s timeout, but one came within 12s of it.
- **Token/byte cost:** seam-off required reading ~65,300 bytes (~16K tokens at a
  4-bytes/token estimate) of diff + description content into session context across
  the 9 notes. Seam-on's prompts (built from `-U0` diffs, no context lines) totaled
  ~64,700 chars sent to the local model instead — nearly the same volume, because the
  largest notes' diffs are whole new files (`structured-offload.mjs`,
  `read-size-gate.mjs`, two new test files), where `-U0` doesn't shrink anything (every
  line of a new file is a `+` line regardless of context width). The seam does not
  reduce total bytes processed for this shape of diff; its entire value proposition is
  moving those bytes out of the orchestrator's session context — a proposition this run
  did not cash in, since 0/9 notes avoided the session-side read regardless.

## Verdict

**Not justified — do not build a second consumer on this evidence, and this first
consumer's cost/benefit should be revisited before it stays wired by default.** The
conservative-bias requirement (AC #4) is unambiguously met — zero false
`computed-re-pin` across 9 calls, the expensive error never occurred — but the seam
delivered zero realized benefit alongside it: `deepseek-r1:latest` answered
`needs-review` on every single call, including the 4/9 notes ground truth confirms were
safe computed-re-pins, so no note skipped the Claude-side read that the offload exists
to avoid, while adding 310s of added local wall-clock (up to 108s on one call) and a
55.6% literal fallback rate driven by a specific, identifiable defect: the model
consistently echoes its own route value into `deciding_path` instead of naming a file
when it decides `needs-review`, which is a validation-scope gap the prompt doesn't
close (it doesn't say what to put in `deciding_path` when no single file is a
"deciding" one). That's a fixable prompt issue, not a fixable-in-this-phase item — this
phase measures, it does not patch — but even a fixed `deciding_path` wouldn't change the
result, because the route itself was never `computed-re-pin`. On a 9-call sample from
one model, the safe direction of AC #4 is proven; the seam's actual cost-saving thesis
is not — recommend re-tuning (a stronger local model, or a prompt more willing to commit
to `computed-re-pin` on unambiguous stamp-only-shaped diffs) and re-running this same
measurement before either building a second consumer or keeping this one wired.

## Findings (not fixed in this phase, per dispatch scope)

- **`deciding_path` degenerate-echo bug:** on every `needs-review` verdict,
  `deepseek-r1:latest` sets `deciding_path` to the literal string `"needs-review"`
  rather than a file path. Schema-valid (it's a string), semantically wrong, and
  correctly caught by the post-check — but worth tightening the prompt (e.g., "when
  route is needs-review, deciding_path is the single most suspicious changed file")
  before any second measurement round.
- **Zero `computed-re-pin` recall:** across 9 calls with 4 genuine positives available,
  the model never attempted the cheaper route once. Whether this is a model-capability
  ceiling (`deepseek-r1:latest` is an 8B model) or a prompt-conservatism overshoot is
  unresolved by this single run and worth isolating before re-measuring.
