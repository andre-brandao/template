FROM node:22

RUN npm install -g \
  @anthropic-ai/claude-code \
  @openai/codex \
  --include=optional

RUN claude --version && codex --version
WORKDIR /workspace
