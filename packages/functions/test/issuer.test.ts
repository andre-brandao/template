import { describe, expect, it } from "bun:test";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { createAuth } from "../src/auth";

const app = createAuth(MemoryStorage());

function register(body: unknown) {
  return app.request("/register", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("issuer for MCP clients", () => {
  it("advertises registration and PKCE on top of OpenAuth's metadata", async () => {
    const meta: any = await (await app.request("/.well-known/oauth-authorization-server")).json();
    expect(meta.token_endpoint).toEndWith("/token");
    expect(meta.registration_endpoint).toEndWith("/register");
    expect(meta.code_challenge_methods_supported).toEqual(["S256"]);
  });

  it("registers a client as an mcp: agent name", async () => {
    const res = await register({
      client_name: "Claude Code",
      redirect_uris: ["http://localhost:33418/callback"],
    });
    expect(res.status).toBe(201);
    expect(((await res.json()) as any).client_id).toBe("mcp:claude-code");
  });

  it("refuses a redirect outside the allowlist", async () => {
    const res = await register({ client_name: "x", redirect_uris: ["https://evil.example/cb"] });
    expect(res.status).toBe(400);
    const lookalike = await register({ redirect_uris: ["https://evildeveloping.company/cb"] });
    expect(lookalike.status).toBe(400);
  });
});
