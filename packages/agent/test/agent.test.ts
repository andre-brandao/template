import { describe, expect, it } from "bun:test";
import type { SandboxProvider } from "@tanstack/ai-sandbox";
import { fromEnv } from "../src/config";
import { Sandbox } from "../src/sandbox/sandbox";

const provider: SandboxProvider = {
  name: "test",
  capabilities: () => ({
    fs: true,
    exec: true,
    env: true,
    ports: false,
    backgroundProcesses: false,
    writableStdin: false,
    killableProcesses: false,
    snapshots: false,
    networkPolicy: false,
    durableFilesystem: false,
    fork: false,
  }),
  create: async () => {
    throw new Error("not used");
  },
  resume: async () => null,
  destroy: async () => undefined,
};

describe("fromEnv", () => {
  it("keeps the current three-variable assistant config compatible", () => {
    const config = fromEnv({
      LLM_URL: "https://llm.example.com/",
      LLM_KEY: "key",
      LLM_MODEL: "assistant",
    });
    expect(config.inference).toMatchObject({
      url: "https://llm.example.com",
      key: "key",
      models: ["assistant"],
      fallback: "assistant",
    });
    expect(config.sandbox.runtime).toBe("docker");
  });

  it("supports scoped harness keys and configured models", () => {
    const config = fromEnv({
      LLM_URL: "https://llm.example.com",
      LLM_KEY: "direct",
      LLM_CLAUDE_KEY: "claude",
      LLM_CODEX_KEY: "codex",
      LLM_MODEL: "assistant",
      LLM_MODELS: "assistant, coding-claude, coding-codex",
      AGENT_SANDBOX: "cloudflare",
    });
    expect(config.inference.models).toEqual(["assistant", "coding-claude", "coding-codex"]);
    expect(config.inference.claudeKey).toBe("claude");
    expect(config.inference.codexKey).toBe("codex");
    expect(config.sandbox.runtime).toBe("cloudflare");
  });
});

describe("Sandbox", () => {
  it("maps separate chat threads to one sandbox key", () => {
    const sandbox = Sandbox.make({ id: "workspace-42", provider });
    expect(sandbox.key({ threadId: "chat-a", runId: "run-a" })).toBe(
      sandbox.key({ threadId: "chat-b", runId: "run-b" }),
    );
  });

  it("isolates concrete sandboxes and tenants", () => {
    const first = Sandbox.make({ id: "workspace", provider, tenant: { userId: "user-a" } });
    const second = Sandbox.make({ id: "workspace", provider, tenant: { userId: "user-b" } });
    expect(first.key({ threadId: "chat", runId: "run" })).not.toBe(
      second.key({ threadId: "chat", runId: "run" }),
    );
  });
});
