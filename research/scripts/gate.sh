#!/usr/bin/env bash
# gate.sh — thin shim: research's Stop hook runs on the shared lib/ gate-runner.
# All logic (stdin, stop_hook_active, vault detection via the .research-vault sentinel,
# self-containment check of rendered pages, exit 0 allow / 2 block) lives in scripts/stop.mjs.
exec node "${CLAUDE_PLUGIN_ROOT}/scripts/stop.mjs"
