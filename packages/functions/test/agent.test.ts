import { beforeAll, describe, expect, it, mock } from "bun:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { User } from "@template/core/user";
import { Session } from "@template/core/key/session";
import { app } from "../src/mcp";

// The dashboard agent reaches the MCP with the user's session as the bearer.
let token: string;

async function connect(bearer = token) {
  const transport = new StreamableHTTPClientTransport(new URL("http://mcp.internal/mcp"), {
    fetch: (url, init) => Promise.resolve(app.request(String(url), init)),
    requestInit: { headers: { authorization: `Bearer ${bearer}` } },
  });
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

function read(result: unknown) {
  return JSON.parse((result as { content: { text: string }[] }).content[0]!.text);
}

describe("mcp as a dashboard session", () => {
  beforeAll(async () => {
    console.log = mock();
    const user = await User.create({
      name: "Session User",
      email: `session-${crypto.randomUUID()}@example.com`,
    });
    token = await Session.create(user.id);
  });

  it("accepts a session bearer as the user", async () => {
    const client = await connect();
    const made = read(
      await client.callTool({ name: "todo_create", arguments: { title: "From the agent" } }),
    );
    expect(made.title).toBe("From the agent");
    await client.close();
  });

  it("rejects a revoked session", async () => {
    const user = await User.create({
      name: "Gone",
      email: `gone-${crypto.randomUUID()}@example.com`,
    });
    const dead = await Session.create(user.id);
    await Session.remove(dead);
    const res = await app.request("/mcp", {
      method: "post",
      headers: {
        authorization: `Bearer ${dead}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
    });
    expect(res.status).toBe(401);
  });

  it("marks reads read-only and leaves writes unmarked", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const hint = (name: string) =>
      tools.find((tool) => tool.name === name)?.annotations?.readOnlyHint;
    expect(hint("todo_list")).toBe(true);
    expect(hint("todo_get")).toBe(true);
    expect(hint("project_list")).toBe(true);
    expect(hint("todo_create")).toBeUndefined();
    expect(hint("todo_annotate")).toBeUndefined();
    await client.close();
  });

  it("annotates todos and projects", async () => {
    const client = await connect();
    const todo = read(await client.callTool({ name: "todo_create", arguments: { title: "Tag" } }));
    const after = read(
      await client.callTool({
        name: "todo_annotate",
        arguments: { id: todo.id, set: { "example.com/ref": "42" } },
      }),
    );
    expect(after.metadata.annotations["example.com/ref"]).toBe("42");

    const project = read(
      await client.callTool({ name: "project_create", arguments: { name: "Tagged" } }),
    );
    const annotated = read(
      await client.callTool({
        name: "project_annotate",
        arguments: { id: project.id, set: { "example.com/owner": "ops" } },
      }),
    );
    expect(annotated.metadata.annotations["example.com/owner"]).toBe("ops");
    await client.close();
  });
});
