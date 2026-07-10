#!/usr/bin/env bash
# gate.sh — thin shim: spec-bridge's Stop hook runs on the shared lib/ gate-runner.
# All logic (stdin, stop_hook_active, linked-task discovery, status-vs-artifacts verdicts,
# exit 0 allow / 2 block) lives in scripts/stop.mjs.
#
# Stop hooks run in a minimal, non-login shell whose PATH may not include node (nvm/volta/
# Homebrew installs live in the user's shell rc, which isn't sourced here). Resolve node the
# way the user's own shell would rather than hardcoding a path; if it's genuinely unavailable,
# no-op instead of failing — this gate should never block Stop over a missing runtime.
node_bin="$(command -v node 2>/dev/null)"
if [ -z "$node_bin" ]; then
  node_bin="$(${SHELL:-/bin/sh} -lc 'command -v node' 2>/dev/null)"
fi
if [ -z "$node_bin" ]; then
  exit 0
fi
exec "$node_bin" "${CLAUDE_PLUGIN_ROOT}/scripts/stop.mjs"
