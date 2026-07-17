import { beforeAll, describe, expect, it, mock } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { User } from "@template/core/user";
import { Key } from "@template/core/key";
import { app } from "../src/mcp";

let token: string;

async function connect() {
  const transport = new StreamableHTTPClientTransport(new URL("http://mcp.internal/mcp"), {
    fetch: (url, init) => Promise.resolve(app.request(String(url), init)),
    requestInit: { headers: { authorization: `Bearer ${token}` } },
  });
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

describe("mcp", () => {
  beforeAll(async () => {
    console.log = mock();
    const userID = await User.create({
      name: "Test User",
      email: `test-${crypto.randomUUID()}@example.com`,
    });
    token = (await Key.create({ userID, name: "test" })).key;
  });

  it("lists todo tools", async () => {
    const client = await connect();
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name);
    expect(names).toContain("todo_list");
    expect(names).toContain("todo_create");
    await client.close();
  });

  it("creates and lists todos through tools", async () => {
    const client = await connect();
    await client.callTool({ name: "todo_create", arguments: { title: "From MCP" } });
    const result = await client.callTool({ name: "todo_list", arguments: {} });
    const content = result.content as { type: string; text: string }[];
    expect(content[0]?.text).toContain("From MCP");
    await client.close();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/mcp", {
      method: "post",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
    });
    expect(res.status).toBe(401);
  });
});
