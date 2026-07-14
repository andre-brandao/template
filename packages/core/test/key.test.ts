import { describe, expect } from "bun:test";
import { Key } from "../src/key";
import { Auth } from "../src/user/auth";
import { testEmail, withTestUser } from "./util";

describe("key", () => {
  withTestUser("create mints a usable key that shows up in list", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });

    expect(key.key).toStartWith("sk-");
    expect(key.display).toBe(`${key.key.slice(0, 7)}...${key.key.slice(-4)}`);
    expect(await Key.verify(key.key)).toBe(userID);

    const keys = await Key.list(undefined);
    expect(keys.map((k) => k.id)).toContain(key.id);
  });

  withTestUser("remove revokes the key", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });

    await Key.remove(key.id);

    expect(await Key.verify(key.key)).toBeNull();
    expect(await Key.list(undefined)).toBeEmpty();
    await expect(Key.remove(key.id)).rejects.toThrow();
  });

  withTestUser("api keys never expire, session keys do", async ({ userID }) => {
    const api = await Key.create({ userID, name: "laptop" });
    const expired = await Key.create({
      userID,
      type: "session",
      name: "session",
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await Key.verify(api.key)).toBe(userID);
    expect(await Key.verify(expired.key)).toBeNull();
  });

  withTestUser("list includes sessions but withholds their secret", async ({ userID }) => {
    const session = await Key.create({ userID, type: "session", name: "session" });
    const api = await Key.create({ userID, name: "laptop" });

    const keys = await Key.list(undefined);
    expect(keys.map((key) => key.id).sort()).toEqual([api.id, session.id].sort());

    // The api key's secret is handed back; the session's never is.
    expect(keys.find((key) => key.id === api.id)?.key).toBe(api.key);
    expect(keys.find((key) => key.id === session.id)?.key).toBeNull();
    // ...but it's still identifiable by its mask.
    expect(keys.find((key) => key.id === session.id)?.display).toBe(session.display);
  });

  withTestUser("list flags the caller's own key as current", async ({ userID }) => {
    const mine = await Key.create({ userID, type: "session", name: "session" });
    const other = await Key.create({ userID, type: "session", name: "session" });

    const keys = await Key.list(mine.key);
    expect(keys.find((key) => key.id === mine.id)?.current).toBe(true);
    expect(keys.find((key) => key.id === other.id)?.current).toBe(false);

    // With no token supplied, nothing is current.
    expect((await Key.list(undefined)).some((key) => key.current)).toBe(false);
  });

  withTestUser("revoking another session signs that device out", async ({ userID }) => {
    const mine = await Key.create({ userID, type: "session", name: "session" });
    const other = await Key.create({ userID, type: "session", name: "session" });

    await Key.remove(other.id);

    expect(await Key.verify(other.key)).toBeNull();
    expect(await Key.verify(mine.key)).toBe(userID);
    expect(await Key.list(mine.key)).toMatchObject([{ id: mine.id, current: true }]);
  });

  withTestUser("expired sessions drop out of the list", async ({ userID }) => {
    await Key.create({
      userID,
      type: "session",
      name: "session",
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await Key.list(undefined)).toBeEmpty();
  });

  withTestUser("verify stamps time_used", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });
    expect(key.timeUsed).toBeNull();

    await Key.verify(key.key);

    expect((await Key.list(undefined))[0]?.timeUsed).not.toBeNull();
  });

  withTestUser("a key belonging to another user is not listable or removable", async () => {
    const other = await Auth.register({
      name: "Other",
      email: testEmail(),
      password: "hunter2222",
    });
    const key = await Key.create({ userID: other.userID, name: "theirs" });

    expect(await Key.list(undefined)).toBeEmpty();
    await expect(Key.remove(key.id)).rejects.toThrow();
    // still valid for its own owner
    expect(await Key.verify(key.key)).toBe(other.userID);
  });
});
