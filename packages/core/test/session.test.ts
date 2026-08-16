import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Database } from "../src/drizzle";
import { Key } from "../src/platform/key";
import { KeyTable } from "../src/platform/key/key.sql";
import { Session } from "../src/platform/key/session";
import { withTestUser } from "./util";

describe("Session", () => {
  withTestUser("verify answers who and what role in one read", async ({ userID, email }) => {
    const raw = await Session.create(userID);
    expect(await Session.verify(raw)).toEqual({ userID, email, role: "member" });
  });

  withTestUser("stores the digest, never the token", async ({ userID }) => {
    const raw = await Session.create(userID);
    const rows = await Database.use((tx) =>
      tx.select().from(KeyTable).where(eq(KeyTable.userID, userID)),
    );
    expect(rows[0]!.key).not.toBe(raw);
    expect(rows[0]!.type).toBe("session");
  });

  withTestUser("remove logs the session out immediately", async ({ userID }) => {
    const raw = await Session.create(userID);
    await Session.remove(raw);
    expect(await Session.verify(raw)).toBeNull();
  });

  withTestUser("an expired session stops resolving", async ({ userID }) => {
    const raw = await Session.create(userID);
    await Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(KeyTable.userID, userID)),
    );
    expect(await Session.verify(raw)).toBeNull();
  });

  // The table is shared with api keys, so the two must not resolve each other.
  withTestUser("a session token is not a bearer token", async ({ userID }) => {
    const raw = await Session.create(userID);
    expect(await Key.verify(raw)).toBeNull();
    expect(await Key.list(undefined)).toBeEmpty();
  });

  withTestUser("an api key is not a session", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });
    expect(await Session.verify(key.key)).toBeNull();
  });

  it("rejects a token that was never issued", async () => {
    expect(await Session.verify("ses-nope")).toBeNull();
  });
});
