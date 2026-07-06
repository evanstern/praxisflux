#!/usr/bin/env bash
# gate.sh — thin shim: educate's Stop hook now runs on the shared lib/ gate-runner.
#
# All the logic (read stdin, honor stop_hook_active, walk up to a `topics/` project, run the
# read-only Definition-of-Done gate, exit 0 allow / 2 block with a message on stderr) lives in
# scripts/stop.mjs via lib/gate-runner. This wrapper exists only because hooks.json invokes a
# command; it forwards stdin to the Node entry unchanged.
exec node "${CLAUDE_PLUGIN_ROOT}/scripts/stop.mjs"
