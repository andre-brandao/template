import { describe, expect } from "bun:test";
import { Connection } from "../src/platform/connection";
import { withTestUser } from "./util";

describe("connection", () => {
  withTestUser("a reconnect replaces the grant", async () => {
    await Connection.save({
      provider: "github",
      access: "tok-1",
      refresh: "ref-1",
      scopes: ["repo"],
    });
    expect((await Connection.tokens("github"))?.access).toBe("tok-1");

    await Connection.save({ provider: "github", access: "tok-2" });
    const tokens = await Connection.tokens("github");
    expect(tokens?.access).toBe("tok-2");
    expect(tokens?.refresh).toBeNull();
    expect(await Connection.list()).toHaveLength(1);
  });

  withTestUser("an unconnected provider has no tokens, and remove disconnects", async () => {
    expect(await Connection.tokens("slack")).toBeNull();
    await Connection.save({ provider: "slack", access: "x" });
    await Connection.remove("slack");
    expect(await Connection.tokens("slack")).toBeNull();
  });
});
