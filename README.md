# TFT openers

Personal web app for creating, saving and quickly looking up Teamfight Tactics Set 18 openers and the comps they lead into. See [the spec](./docs/spec.md) and the [issues](https://github.com/OndraSlejtr/tft-openers/issues).

## Requirements

- Node.js 24 (pinned in `.nvmrc`, enforced through `engines` and `engine-strict`)
- pnpm 10 (pinned in `packageManager`)

```bash
nvm use                # or `fnm use`, both read .nvmrc
pnpm install
```

## Development

```bash
pnpm dev                  # Vite dev server on http://localhost:5173
pnpm run test             # Vitest
pnpm run import           # refreshes game and comp data from Community Dragon and tftacademy
```

CI runs `pnpm run test` as the required `test` check on every PR.

## Working with agents

Each issue on GitHub is one vertical slice. Agents work in the sandbox and follow the rules in `CLAUDE.md`.

- **Start a run:** `pnpm sandbox`, then for example "work through #2, #3, #4, #5 in order".
- **Flow per issue:** branch `<issue>-<slug>`, PR with `Closes #<issue>`, auto-merge turned on, merged by GitHub once the required `test` check passes. No approval is needed.
- **When you're needed:** only for issues labeled `blocked` and for the report at the end of a run. A blocked issue has a comment saying what's needed. The agent skips it and continues with issues that don't depend on it.
- **Unblocking:** answer in the issue comment or install the requested package on the host, remove the `blocked` label, then start a new run.
- **Reviewing:** read the merged PRs, or open the dev server at `http://localhost:5173` while the agent runs it.

`main` is protected by the `main-protect` ruleset: no direct pushes, no force pushes, squash merge only, and the `test` check must pass. This applies to you as well, so all changes go through PRs.

Manual settings agents can't change:

- GitHub Pages source (Settings, Pages, Source: GitHub Actions), already set. The `Deploy` workflow publishes on every push to `main` and can be rerun by hand from the Actions tab
- ruleset and repository settings
- the sandbox token's permissions

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

Port 5173 is published, so a dev server the agent starts with `--host` opens on the host at `http://localhost:5173`. Only one sandbox at a time can publish it.

Each worktree gets its own sandbox. The repo is mounted live at `/workspace`, so host edits and sandbox edits share the working tree. Commits made in the sandbox use your host git name and email, read when the sandbox is created. `.env` and `.env.local` are masked with `.env.example`, so the agent never sees real values. Other `.env.*` files (for example `.env.production.local`) are not masked, so keep secrets in those two.

> [!NOTE]
> Secrets are read when the sandbox starts. After changing a secret, run `pnpm sandbox:stop` and then `pnpm sandbox`. After adding a new secret to `msb-config.yaml` and `.sandbox/with-secrets.sh`, recreate the sandbox with `pnpm sandbox:remove` and `pnpm sandbox:create`.

> [!WARNING]
> The sandbox cannot reach package registries. `node_modules` is mounted read-only, so install npm packages on the host.

### Troubleshooting

- **Updating to a newer image or fixing a broken sandbox:** run `pnpm sandbox:remove` and then `pnpm sandbox:create`. This deletes the Claude conversations stored in the sandbox. The Claude Code config in `.sandbox/*.source.*` is part of the image, so changes to it also arrive this way, once the image is rebuilt from `main`.
- **Raw msb commands:** `msb ls` shows all sandboxes. `.sandbox/name.sh` prints the name of this worktree's sandbox, for example `msb logs $(.sandbox/name.sh)`.
