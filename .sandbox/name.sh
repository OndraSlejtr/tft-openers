#!/usr/bin/env bash
# Prints this worktree's sandbox name, so each worktree gets its own sandbox.
set -euo pipefail

printf 'tft_openers_%s\n' "$(printf '%s' "$(pwd -P)" | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-8)"
