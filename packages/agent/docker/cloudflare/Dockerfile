ARG CLOUDFLARE_SANDBOX_TAG=0.12.1
FROM docker.io/cloudflare/sandbox:${CLOUDFLARE_SANDBOX_TAG}

RUN npm install -g \
  @anthropic-ai/claude-code \
  @openai/codex \
  --include=optional

RUN claude --version && codex --version
WORKDIR /workspace
