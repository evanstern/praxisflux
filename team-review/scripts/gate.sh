#!/usr/bin/env bash
# gate.sh — thin shim: team-review's Stop hook runs scripts/stop.mjs (same pattern as the
# praxisflux plugins). Stop hooks run in a minimal, non-login shell whose PATH may not include
# node; resolve it the way the user's shell would, and no-op if it's genuinely unavailable —
# this gate must never block Stop over a missing runtime.
here="$(cd "$(dirname "$0")" && pwd)"
root="${CLAUDE_PLUGIN_ROOT:-$(dirname "$here")}"
node_bin="$(command -v node 2>/dev/null)"
if [ -z "$node_bin" ]; then
  node_bin="$(${SHELL:-/bin/sh} -lc 'command -v node' 2>/dev/null)"
fi
if [ -z "$node_bin" ]; then
  exit 0
fi
exec "$node_bin" "${root}/scripts/stop.mjs"
