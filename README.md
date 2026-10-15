# TFT openers

Personal web app for creating, saving and quickly looking up Teamfight Tactics Set 18 openers and the comps they lead into. See [the spec](./docs/spec.md) and the [issues](https://github.com/OndraSlejtr/tft-openers/issues).

## Requirements

- Node.js 24 (pinned in `.nvmrc`, enforced through `engines` and `engine-strict`)
- pnpm 10 (pinned in `packageManager`)

```bash
nvm use                # or `fnm use`, both read .nvmrc
pnpm install
```

## Sandboxed agents

The coding agent (Claude Code) can run in a [microsandbox](https://microsandbox.dev/) VM with default-deny network egress. The config is `msb-config.yaml`, and the image is built from `.sandbox/Dockerfile` by a GitHub Action on every push to `main` that touches `.sandbox/`.

The sandbox can reach only Anthropic (Claude Code), the two data sources for `pnpm run import` (`raw.communitydragon.org`, `tftacademy.com`) and GitHub (`github.com`, `api.github.com`).

### One-time setup

1. Install microsandbox: `curl -fsSL https://install.microsandbox.dev | sh`. The config needs 0.7 or newer. Update with `msb self update`.
2. Log in to ghcr.io so msb can pull the image. Create a [GitHub personal access token](https://github.com/settings/tokens/new) with the `read:packages` scope, then run `docker login ghcr.io` with your GitHub username and the token as the password. msb reuses the Docker credentials.
3. Create the two secrets:
   - `CLAUDE_CODE_OAUTH_TOKEN`: run `claude setup-token`.
   - `GH_TOKEN`: create a [fine-grained token](https://github.com/settings/personal-access-tokens/new) with access to **only this repository** and the permissions Contents, Issues and Pull requests set to read and write.
4. Store them in `~/.config/tft-openers/sandbox.env`, readable only by you:

   ```bash
   mkdir -p ~/.config/tft-openers
   install -m 600 /dev/null ~/.config/tft-openers/sandbox.env
   nano ~/.config/tft-openers/sandbox.env
   ```

   ```bash
   CLAUDE_CODE_OAUTH_TOKEN=...
   GH_TOKEN=...
   ```

   A variable already set in your shell wins over the file. A missing secret stops the command with an error.
5. Make sure `~/.claude/skills` and `~/.agents/skills` exist. They are mounted read-only and can be empty.

### Usage

```bash
pnpm sandbox:create       # creates this worktree's sandbox, once per worktree
pnpm sandbox              # runs Claude Code in the sandbox, starting it if it is stopped
pnpm sandbox -- bash      # runs another command in the sandbox instead
pnpm sandbox:stop         # stops the sandbox, conversations are kept
pnpm sandbox:remove       # deletes the sandbox and everything on its disk
```

Each worktree gets its own sandbox. The repo is mounted live at `/workspace`, so host edits and sandbox edits share the working tree. Commits made in the sandbox use your host git name and email, read when the sandbox is created. `.env` and `.env.local` are masked with `.env.example`, so the agent never sees real values. Other `.env.*` files (for example `.env.production.local`) are not masked, so keep secrets in those two.

> [!NOTE]
> Secrets are read when the sandbox starts. After changing a secret, run `pnpm sandbox:stop` and then `pnpm sandbox`. After adding a new secret to `msb-config.yaml` and `.sandbox/with-secrets.sh`, recreate the sandbox with `pnpm sandbox:remove` and `pnpm sandbox:create`.

> [!WARNING]
> The sandbox cannot reach package registries. `node_modules` is mounted read-only, so install npm packages on the host.

### Troubleshooting

- **Updating to a newer image or fixing a broken sandbox:** run `pnpm sandbox:remove` and then `pnpm sandbox:create`. This deletes the Claude conversations stored in the sandbox. The Claude Code config in `.sandbox/*.source.*` is part of the image, so changes to it also arrive this way, once the image is rebuilt from `main`.
- **Raw msb commands:** `msb ls` shows all sandboxes. `.sandbox/name.sh` prints the name of this worktree's sandbox, for example `msb logs $(.sandbox/name.sh)`.
