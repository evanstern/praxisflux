# PDLC demo — the 30-minute runsheet

One presenter, two terminals, ~30 minutes: walk a real project (praxis-pet, a tiny
tamagotchi CLI) through the whole praxis development lifecycle by time-traveling its git
history, break two gates on camera, and sweep one real task to a genuine merged PR in
the background while you talk.

## Prep (before the audience arrives, ~2 minutes)

```sh
# From the praxisflux checkout — $PFX below. Demo repo lands at $DEMO.
PFX=~/neumo/projects/praxis            # adjust to your checkout
DEMO=${TMPDIR:-/tmp}/praxisflux-demo
node $PFX/demo/generate.mjs --reset                                  # regenerate
node $PFX/demo/generate.mjs --check                                  # prove all green
node $PFX/demo/generate.mjs --reset --remote evanstern/praxisflux-demo-sandbox  # refresh sandbox
```

- Terminal A: `cd $DEMO` (the stage walk). Terminal B: idle (the live thread).
- `--check` MUST be green before you start; if it isn't, the rig rotted — fix before
  demoing, that's the whole point of the CI test.
- Every stage jump is `node $PFX/demo/generate.mjs --stage N` (or `git checkout stage-N`).

## The clock

### 00:00–03:00 — frame it, stage-0: a bare project

- One sentence: "praxisflux makes status impossible to fake: every claim is derived from
  artifacts, and gates block anything the artifacts don't prove. This project's HISTORY
  is the demo — one tag per lifecycle stage."
- `git log --oneline --all` — point at the five tags.
- `node $PFX/demo/generate.mjs --stage 0` → `node bin/pet.mjs new Mochi`, `node bin/pet.mjs play`,
  `node --test`. A real app, tests green, and nothing else: no grounding, no board.

### 03:00–05:00 — stage-1: grounded

- `node $PFX/demo/generate.mjs --stage 1`.
- `cat docs/wiki/INDEX.md`; open `docs/wiki/pet-state-machine.md` — point at
  `sources:` and `verified_against:` (a pin to the stage-0 commit).
- `ls research/Virtual-Pet-Mechanics/` — a cited research vault grounding the domain.
- `node $PFX/scripts/run-gates.mjs --gates wiki-freshness --path .` → green. "Prose is
  now welded to code. Watch what happens when the code moves — in a few minutes."

### 05:00–08:00 — LIVE KICKOFF: the background sweep (Terminal B)

The board (coming at stage-2) has task-3, "--version flag", pre-specced and unmerged.
Sweep it for real while the walk continues:

```sh
git clone git@github.com:evanstern/praxisflux-demo-sandbox.git /tmp/pet-live && cd /tmp/pet-live
git checkout demo-live-base                # the stage-2 planned state
git checkout -b live-version-flag
```

Implement specs/003-version-flag (one file, bin/pet.mjs — insert before `if (cmd === "new")`):

```js
if (cmd === "--version" || cmd === "version") {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  console.log(`praxis-pet ${pkg.version}`);
  process.exit(0);
}
```

(plus `import { readFileSync } from "node:fs";` up top). Then:

```sh
node bin/pet.mjs --version && node --test          # prove it
sed -i '' 's/- \[ \]/- [x]/' specs/003-version-flag/tasks.md
git commit -am "task-3: add --version flag" && git push -u origin live-version-flag
gh pr create -R evanstern/praxisflux-demo-sandbox --base demo-live-base \
  --title "task-3: add a --version flag (live)" --body "specs/003-version-flag, swept live."
```

Leave the PR open on screen. Back to Terminal A.
**Fallback pivot:** if anything here stalls (network, auth), skip closing it at 20:00 —
stage-3 already contains this exact task merged (PR #3), and you say so out loud.

### 08:00–12:00 — LIVE GATE-BREAK: freshness goes red (Terminal A, at stage-1)

```sh
echo "// demo tweak: rules under review" >> src/pet.mjs
git commit -am "tweak the rules"
node $PFX/scripts/run-gates.mjs --gates wiki-freshness --path .
```

Expected red: `docs/wiki/pet-state-machine.md: STALE — sources changed since 0e26ad95…`.
"The wiki note claims it was verified against code that no longer exists. The gate
doesn't ask anyone's opinion." Recover honestly — re-verify, then re-pin:

```sh
git diff stage-1 -- src/pet.mjs      # the diff is a comment; the note's prose still holds
node $PFX/grounding-wiki/scripts/repin.mjs docs/wiki/pet-state-machine.md $(git rev-parse HEAD)
node $PFX/scripts/run-gates.mjs --gates wiki-freshness --path .   # green again
git checkout -- . && git reset --hard stage-1                      # back on the rails
```

**Fallback pivot:** if the theater misfires, `git reset --hard stage-1` returns green
instantly; narrate the failure line from this sheet instead of the screen.

### 12:00–16:00 — stage-2: planned, and the SPEC-BRIDGE BLOCK

- `node $PFX/demo/generate.mjs --stage 2`.
- `backlog task list --plain` — three tasks; `backlog task view task-3 --plain` — the
  `Spec: specs/003-version-flag` marker ties the card to its spec dir.
- `cat docs/design/pet-sweep-runbook.md` — signed-off lanes; task-3 flagged live.
- Now lie to the board:

```sh
backlog task edit task-1 -s Done
node $PFX/scripts/run-gates.mjs --gates spec-bridge --path .
```

Expected block: `task-1 is "Done" but specs/001-rename-command only proves
"In Progress": 3 of 3 tasks unchecked…`. "Status can never exceed artifacts. The board
is a VIEW; the spec dir is the truth." Recover: `git checkout -- backlog` (the file is
tracked — the lie never survives).
**Fallback pivot:** the expected failure line is above — narrate it and reset.

### 16:00–20:00 — stage-3: swept

- `node $PFX/demo/generate.mjs --stage 3`.
- `git log --oneline -8` — three real merge commits, `Merge pull request #1/#2/#3` —
  those PRs exist on github.com/evanstern/praxisflux-demo-sandbox, merged for real.
- `backlog task list --plain` — all three Done ("derived by spec-bridge sync", never
  hand-set); `git diff stage-1..stage-3 -- docs/wiki/pet-cli.md` — prose amended AND
  re-pinned with the merge, in the same slice.
- `node $PFX/scripts/run-gates.mjs --gates wiki-freshness,spec-bridge --path .` → green.

### 20:00–24:00 — LIVE CLOSE (Terminal B)

```sh
gh pr merge -R evanstern/praxisflux-demo-sandbox --merge   # the live PR — a genuine merge
cd /tmp/pet-live && git checkout demo-live-base && git pull
node $PFX/spec-bridge/gates/cli.mjs plan .                 # sync derives: task-3 → Done
```

Run the printed `backlog task edit` lines verbatim — "no human ever types `-s Done`;
the artifacts did." **Fallback pivot:** PR stuck → show stage-3's canned twin instead:
`git -C $DEMO show stage-3 --stat | head` and the merged PR #3 on the sandbox.

### 24:00–28:00 — stage-4: triaged (the loop closes)

- Terminal A: `node $PFX/demo/generate.mjs --stage 4`.
- `cat docs/reviews/refactor-triage-pet-2026-07-27-01.md` — headless policy verbatim,
  every finding dispositioned, accepted ones carded.
- `backlog task view task-4 --plain` — a debt card citing file:line evidence, labeled
  `debt`, immediately sweepable: **the next sweep's input. That's the loop.**
- Optional live beat (time permitting): card a deferred finding yourself —
  `backlog task create "Usage line omits --version" -d "F3, deferred in the triage record" -l debt`
  — then delete it (`git checkout -- backlog` after showing the board).
  **Fallback pivot:** the canned record already shows a full triage; skip the live card.

### 28:00–30:00 — close

- `node $PFX/demo/generate.mjs --check` (or show the pre-run from prep) — every stage
  green by its own gates.
- "This demo is itself CI-tested (`test/demo-rig.test.mjs`): regenerate, gate every
  stage, regenerate again, byte-identical. If a skill we demoed drifts, the praxisflux
  wiki's demo-rig note goes stale and the freshness gate flags it. The demo cannot rot
  silently."
- Reset for the next audience: `node $PFX/demo/generate.mjs --reset` (and `--remote …`
  to restore the sandbox).

## The one rule if you're improvising

Never touch the praxisflux checkout's git from the demo repo — everything above runs in
`$DEMO` or `/tmp/pet-live`. If a moment goes sideways, `--reset` regenerates the whole
world in seconds; identical task IDs, tags, and narrative every time.
