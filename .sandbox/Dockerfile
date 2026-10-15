FROM node:24-trixie

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      curl gh jq nano ripgrep vim \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable

USER node
ENV PATH=/home/node/.local/bin:$PATH

# The sandbox cannot reach the npm registry, so pnpm is downloaded here.
# Keep in sync with "packageManager" in package.json.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack prepare pnpm@10.33.4 --activate

# git uses GH_TOKEN through gh. The repo mount is owned by the host user.
RUN git config --global credential.https://github.com.helper '!gh auth git-credential' \
 && git config --global --add safe.directory /workspace

# Claude Code. The native install updates itself from downloads.claude.ai.
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV DISABLE_TELEMETRY=1 \
    DISABLE_ERROR_REPORTING=1

# Prepare mount points so they are owned by node.
RUN mkdir -p \
      /home/node/.claude/skills \
      /home/node/.agents/skills

# Claude Code configuration, baked into the image. claude.source.json skips the first-run dialogs.
# Owned by node, because Claude Code writes to .claude.json at runtime.
COPY --chown=node:node claude.source.json /home/node/.claude.json
COPY --chown=node:node claude-settings.source.json /home/node/.claude/settings.json
COPY --chown=node:node AGENTS.source.md /home/node/.claude/CLAUDE.md
COPY --chown=node:node --chmod=755 statusline.sh /home/node/.claude/statusline.sh

WORKDIR /workspace

# Runs when msb exec gets no command, so `pnpm sandbox` starts Claude Code.
CMD ["claude"]
