#!/usr/bin/env bash
# test-reconcile.sh — TASK-27's proof: pure-sync pipeline rounds at $0.
# Self-contained like test-isolation.sh: spins its own runner on a random port and proves
# both scratch fixtures whose gate failure is pure bookkeeping — `exceeds` (board claims
# Done over an unproven spec) and `done-eligible` (spec fully proven, board lagging) —
# complete gate-FAIL → /reconcile → gate-PASS with ZERO model spend: no /agent call, no
# claude session, ever (asserted against this runner instance's own log).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT=$((20000 + RANDOM % 10000))
FAIL() { echo "FAIL: $1"; exit 1; }
OK() { echo "ok   $1"; }

RLOG=$(mktemp)
node "$HERE/runner.mjs" "$PORT" >"$RLOG" 2>&1 &
RUNNER=$!
trap 'kill $RUNNER 2>/dev/null || true' EXIT
sleep 1

step() { curl -s -X POST "localhost:$PORT$1" -H 'content-type: application/json' -d "$2"; }
jqr() { python3 -c "import json,sys;print(json.load(sys.stdin)$1)"; }

for FIXTURE in exceeds done-eligible; do
  R=$(step /checkout "{\"fixture\":\"$FIXTURE\"}")
  RUN=$(echo "$R" | jqr "['runId']")

  # the board lies (or lags) — the gate must fail before reconciliation
  G0=$(echo "$(step /gate "{\"runId\":\"$RUN\"}")" | jqr "['pass']")
  [ "$G0" = "False" ] || FAIL "$FIXTURE: gate should FAIL before reconcile"
  OK "$FIXTURE: gate FAILs on the un-reconciled board"

  # tier 1 reconciles: plan's own commands, executed verbatim, no model
  REC=$(step /reconcile "{\"runId\":\"$RUN\"}")
  [ "$(echo "$REC" | jqr "['ok']")" = "True" ] || FAIL "$FIXTURE: /reconcile errored: $REC"
  [ "$(echo "$REC" | jqr "['planEmpty']")" = "True" ] || FAIL "$FIXTURE: re-plan not empty — not pure bookkeeping: $REC"
  N=$(echo "$REC" | jqr "['ran'].__len__()")
  [ "$N" -gt 0 ] || FAIL "$FIXTURE: reconcile ran nothing"
  OK "$FIXTURE: reconcile executed $N plan command(s), re-plan empty"

  G1=$(echo "$(step /gate "{\"runId\":\"$RUN\"}")" | jqr "['pass']")
  [ "$G1" = "True" ] || FAIL "$FIXTURE: gate should PASS after reconcile"
  OK "$FIXTURE: gate PASSes after reconcile"
done

# zero model spend: this runner instance never logged an agent round
grep -E '\] agent ' "$RLOG" && FAIL "a model agent ran — reconcile rounds must cost \$0"
OK "zero /agent calls across both fixtures — \$0 of model spend"

echo "reconcile: all checks passed"
