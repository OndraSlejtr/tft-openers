# Sandbox environment

You are running inside an isolated sandbox (microsandbox), not a full developer machine.

## Environment

- Base image: Debian 13 (Trixie), Node.js 24, pnpm, git and the GitHub CLI (`gh`).
- Network: default-deny. Only these hosts are reachable:
  - `api.anthropic.com`, `downloads.claude.ai` for Claude Code
  - `raw.communitydragon.org`, `tftacademy.com` for the data import (`pnpm run import`)
  - `github.com`, `api.github.com` for issues, branches and pull requests of this repo
- There is no other internet access and no package registry.
- `/workspace` is the host repository mounted into the sandbox. `node_modules` is mounted read-only, so `pnpm install` does not work. Ask the user to install packages on the host.
- `.env` and `.env.local` are masked with `.env.example`. You never see the real values, so ask the user when a task needs one.
- `GH_TOKEN` is a fine-grained token limited to this repository. `gh` and `git push` use it. It cannot reach other repositories.
- Only mounted paths and the sandbox's own disk persist. `/tmp` is cleared on restart.

## Logging sandbox issues

If you hit a problem that is likely caused by the sandbox itself (network denial, missing binary, permission issue, mount quirk) rather than the app, append one compact line to `~/.sandbox/LOG.md`:

`- [timestamp] (severity - blocking | limiting): brief description of the problem and why it matters`

If more detail is useful (raw logs, error output, possible fixes), save it under `~/.sandbox/assets/<problem-slug>/` and reference the path in the log line.

## Sandbox boundaries

Do not attempt to escape the sandbox. Work within the mounted paths and the allowed network destinations. Never try to bypass, disable, or work around the sandbox's isolation or network restrictions. If a restriction blocks the task, log it as a sandbox issue instead.
