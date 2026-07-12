#!/usr/bin/env bash
# test-isolation.sh — TASK-26's repro: per-run worktree isolation, end to end.
# Self-contained: spins its own runner on a random port, builds a throwaway target repo,
# and proves (1) a human switching branches in the target mid-run cannot affect the run,
# (2) two concurrent runs of the same target coexist, (3) finish merges and cleans up,
# (4) an unstable target fails finish loudly and keeps the worktree.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT=$((20000 + RANDOM % 10000))
FAIL() { echo "FAIL: $1"; exit 1; }
OK() { echo "ok   $1"; }

node "$HERE/runner.mjs" "$PORT" >/dev/null 2>&1 &
RUNNER=$!
trap 'kill $RUNNER 2>/dev/null || true' EXIT
sleep 1

step() { curl -s -X POST "localhost:$PORT$1" -H 'content-type: application/json' -d "$2"; }
jqr() { python3 -c "import json,sys;print(json.load(sys.stdin)$1)"; }

# throwaway target
T=$(mktemp -d)
git -C "$T" init -q -b main
echo "v1" > "$T/app.txt"
git -C "$T" -c user.email=t@t -c user.name=t add -A
git -C "$T" -c user.email=t@t -c user.name=t commit -qm base

# (1) checkout is isolated; mid-run interference is a non-event
R1=$(step /checkout "{\"target\":\"$T\"}")
RUN1=$(echo "$R1" | jqr "['runId']"); DIR1=$(echo "$R1" | jqr "['dir']")
[ "$DIR1" != "$T" ] || FAIL "run dir must not be the target"
git -C "$T" checkout -qb human-was-here && echo "chaos" >> "$T/app.txt"   # the live incident, replayed
[ "$(git -C "$DIR1" branch --show-current)" = "pilot/$RUN1" ] || FAIL "run branch changed under interference"
[ -z "$(git -C "$DIR1" status --porcelain)" ] || FAIL "run tree dirtied by interference"
OK "mid-run branch switch + dirty target: run tree unaffected"

# (2) concurrent runs coexist
R2=$(step /checkout "{\"target\":\"$T\"}")
RUN2=$(echo "$R2" | jqr "['runId']"); DIR2=$(echo "$R2" | jqr "['dir']")
[ "$DIR2" != "$DIR1" ] || FAIL "concurrent runs share a dir"
OK "two concurrent checkouts of the same target coexist"

# (3) unstable target: finish fails loudly, keeps the worktree
echo "work1" > "$DIR1/feature.txt"
ERR=$(step /finish "{\"runId\":\"$RUN1\",\"approvedBy\":\"repro\"}")
echo "$ERR" | grep -q '"ok": *false' || FAIL "finish should refuse while target is off main/dirty"
echo "$ERR" | grep -q "worktree kept" || FAIL "refusal should say the work is safe"
[ -d "$DIR1" ] || FAIL "worktree must survive a refused finish"
OK "finish refuses an unstable target and keeps the worktree"

# (4) stable target: finish merges and cleans up
git -C "$T" checkout -q -- . && git -C "$T" checkout -q main && git -C "$T" branch -qD human-was-here
DONE=$(step /finish "{\"runId\":\"$RUN1\",\"approvedBy\":\"repro\"}")
echo "$DONE" | grep -q '"ok": *true' || FAIL "finish should succeed on a clean main: $DONE"
[ -f "$T/feature.txt" ] || FAIL "merged work missing from target main"
[ ! -d "$DIR1" ] || FAIL "worktree should be removed after finish"
git -C "$T" branch --list "pilot/$RUN1" | grep -q . && FAIL "run branch should be deleted after merge"
OK "finish merged --no-ff into target main, removed worktree + branch"

# run 2 still healthy after run 1 landed
[ "$(git -C "$DIR2" branch --show-current)" = "pilot/$RUN2" ] || FAIL "run 2 damaged by run 1 landing"
OK "concurrent run 2 unaffected by run 1's landing"

echo "isolation: all checks passed"
