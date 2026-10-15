#!/usr/bin/env bash
# Runs a command with the sandbox secrets and host git identity in its environment.
# Secrets come from the shell first, then from the secrets file. A missing secret is an error.
set -euo pipefail

secrets_file="${XDG_CONFIG_HOME:-$HOME/.config}/tft-openers/sandbox.env"
required_secrets=(CLAUDE_CODE_OAUTH_TOKEN GH_TOKEN)

if [ -f "$secrets_file" ]; then
  for secret_name in "${required_secrets[@]}"; do
    # Values already set in the shell win over the file.
    if [ -z "${!secret_name:-}" ]; then
      file_value=$(sed -n "s/^${secret_name}=//p" "$secrets_file" | tail -n 1)
      [ -n "$file_value" ] && export "$secret_name=$file_value"
    fi
  done
fi

missing_secrets=()
for secret_name in "${required_secrets[@]}"; do
  [ -n "${!secret_name:-}" ] || missing_secrets+=("$secret_name")
done
if [ ${#missing_secrets[@]} -gt 0 ]; then
  echo "Missing sandbox secrets: ${missing_secrets[*]}" >&2
  echo "Set them in $secrets_file (see README, Sandboxed agents)." >&2
  exit 1
fi

SANDBOX_GIT_NAME=$(git config user.name) || { echo "git user.name is not set" >&2; exit 1; }
SANDBOX_GIT_EMAIL=$(git config user.email) || { echo "git user.email is not set" >&2; exit 1; }
export SANDBOX_GIT_NAME SANDBOX_GIT_EMAIL

exec "$@"
