#!/usr/bin/env bash
# gate.sh — thin shim: educate's Stop hook now runs on the shared lib/ gate-runner.
#
# All the logic (read stdin, honor stop_hook_active, walk up to a `topics/` project, run the
# read-only Definition-of-Done gate, exit 0 allow / 2 block with a message on stderr) lives in
# scripts/stop.mjs via lib/gate-runner. This wrapper exists only because hooks.json invokes a
# command; it forwards stdin to the Node entry unchanged.
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
  # Advisory by design: never block Stop over a missing runtime — but say so once per
  # temp-dir lifetime instead of vanishing silently. CI enforcement is unaffected.
  sentinel="${TMPDIR:-/tmp}/praxisflux-gate-node-missing.notified"
  if [ ! -e "$sentinel" ]; then
    echo "praxisflux: node not found on PATH — local Stop-hook gates are skipped (they are advisory by design; CI enforcement is unaffected). Install node to enable them. One-time notice; marker: $sentinel" >&2
    : > "$sentinel" 2>/dev/null || true
  fi
  exit 0
fi
exec "$node_bin" "${CLAUDE_PLUGIN_ROOT}/scripts/stop.mjs"
