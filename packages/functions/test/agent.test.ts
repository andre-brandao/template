import { beforeAll, describe, expect, it, mock } from "bun:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { Session } from "@template/core/auth/session";
import { Delegation } from "@template/core/auth/delegation";
import { Event } from "@template/core/event";
import { Identity } from "@template/core/identity";
import { Permission } from "@template/core/permission";
import { app } from "../src/mcp";
import { createUser } from "./api/util";

// The dashboard agent reaches the MCP with a delegation: it acts as `copilot` for the user.
let token: string;
let userID: string;

function ping(bearer?: string) {
  return app.request("/mcp", {
    method: "post",
    headers: {
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });
}

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

describe("mcp as a delegated agent", () => {
  beforeAll(async () => {
    console.log = mock();
    const user = await createUser({
      name: "Session User",
      email: `session-${crypto.randomUUID()}@example.com`,
    });
    userID = user.id;
    token = await Identity.provide("user", { userID, role: "member" }, () =>
      Delegation.create({ name: "copilot" }),
    );
  });

  it("acts as the agent, and the event it causes says so", async () => {
    const client = await connect();
    const made = read(
      await client.callTool({ name: "todo_create", arguments: { title: "From the agent" } }),
    );
    expect(made.title).toBe("From the agent");
    await client.close();

    const log = await Identity.internal("test", Permission.all, () =>
      Event.list({ sourceID: made.id, page: 1, pageSize: 10 }),
    );
    const created = log.data.find((e) => e.type === "todo.created");
    expect(created?.identity).toMatchObject({
      type: "agent",
      properties: { name: "copilot", userID },
    });
  });

  it("refuses a dashboard session as a bearer", async () => {
    const session = await Session.create(userID);
    expect((await ping(session)).status).toBe(401);
  });

  it("points an unauthenticated client at the OAuth metadata", async () => {
    const res = await ping();
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain(
      'resource_metadata="http://localhost/.well-known/oauth-protected-resource"',
    );
    const meta: any = await (await app.request("/.well-known/oauth-protected-resource")).json();
    expect(meta.resource).toBe("http://localhost/mcp");
    expect(meta.authorization_servers).toHaveLength(1);
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
