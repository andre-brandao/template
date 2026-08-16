import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Database } from "../src/drizzle";
import { Key } from "../src/platform/key";
import { KeyTable } from "../src/platform/key/key.sql";
import { Session } from "../src/platform/key/session";
import { withTestUser } from "./util";

const row = (userID: string) =>
  Database.use((tx) =>
    tx
      .select()
      .from(KeyTable)
      .where(eq(KeyTable.userID, userID))
      .then((rows) => rows[0]!),
  );

describe("Session", () => {
  withTestUser("verify answers who and what role in one read", async ({ userID, email }) => {
    const raw = await Session.create(userID);
    expect(await Session.verify(raw)).toEqual({ userID, email, role: "member" });
  });

  withTestUser("the cookie is the row id and a secret", async ({ userID }) => {
    const [id, secret] = (await Session.create(userID)).split(".");
    expect((await row(userID)).id).toBe(id!);
    expect(secret).toStartWith("ses-");
  });

  withTestUser("stores the digest, never the secret", async ({ userID }) => {
    const raw = await Session.create(userID);
    const stored = await row(userID);
    expect(raw).not.toContain(stored.key);
    expect(stored.type).toBe("session");
  });

  // The id travels in the clear, so it must be worthless on its own.
  withTestUser("the id alone does not authenticate", async ({ userID }) => {
    const [id] = (await Session.create(userID)).split(".");
    expect(await Session.verify(`${id}.ses-wrong`)).toBeNull();
  });

  withTestUser("remove logs the session out immediately", async ({ userID }) => {
    const raw = await Session.create(userID);
    await Session.remove(raw);
    expect(await Session.verify(raw)).toBeNull();
  });

  withTestUser("remove needs the secret, not just the id", async ({ userID }) => {
    const raw = await Session.create(userID);
    const [id] = raw.split(".");
    await Session.remove(`${id}.ses-wrong`);
    expect(await Session.verify(raw)).not.toBeNull();
  });

  withTestUser("an idle session expires", async ({ userID }) => {
    const raw = await Session.create(userID);
    await Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(KeyTable.userID, userID)),
    );
    expect(await Session.verify(raw)).toBeNull();
  });

  withTestUser("using it slides the window, but not on every read", async ({ userID }) => {
    const raw = await Session.create(userID);
    const before = await row(userID);

    // Inside the hour, a read leaves the row alone.
    await Session.verify(raw);
    expect((await row(userID)).expiresAt).toEqual(before.expiresAt!);

    // Past it, the next read pushes the window out.
    await Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ timeUsed: new Date(Date.now() - 2 * 60 * 60 * 1000) })
        .where(eq(KeyTable.userID, userID)),
    );
    await Session.verify(raw);
    expect((await row(userID)).expiresAt!.getTime()).toBeGreaterThan(before.expiresAt!.getTime());
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
    expect(await Session.verify("key_nope.ses-nope")).toBeNull();
    expect(await Session.verify("nodot")).toBeNull();
  });
});
