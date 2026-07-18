import { describe, expect } from "bun:test";
import { Key } from "../src/key";
import { User } from "../src/user";
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

  withTestUser("list hands back the secret", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });

    const keys = await Key.list(undefined);
    expect(keys.find((k) => k.id === key.id)?.key).toBe(key.key);
  });

  withTestUser("remove revokes the key", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });

    await Key.remove(key.id);

    expect(await Key.verify(key.key)).toBeNull();
    expect(await Key.list(undefined)).toBeEmpty();
    await expect(Key.remove(key.id)).rejects.toThrow();
  });

  withTestUser("list flags the caller's own key as current", async ({ userID }) => {
    const mine = await Key.create({ userID, name: "laptop" });
    const other = await Key.create({ userID, name: "desktop" });

    const keys = await Key.list(mine.key);
    expect(keys.find((key) => key.id === mine.id)?.current).toBe(true);
    expect(keys.find((key) => key.id === other.id)?.current).toBe(false);

    // With no token supplied, nothing is current.
    expect((await Key.list(undefined)).some((key) => key.current)).toBe(false);
  });

  withTestUser("revoking another key stops it authenticating", async ({ userID }) => {
    const mine = await Key.create({ userID, name: "laptop" });
    const other = await Key.create({ userID, name: "desktop" });

    await Key.remove(other.id);

    expect(await Key.verify(other.key)).toBeNull();
    expect(await Key.verify(mine.key)).toBe(userID);
    expect(await Key.list(mine.key)).toMatchObject([{ id: mine.id, current: true }]);
  });

  withTestUser("an expired key does not verify and drops out of the list", async ({ userID }) => {
    const live = await Key.create({ userID, name: "live" });
    const dead = await Key.create({
      userID,
      name: "dead",
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await Key.verify(live.key)).toBe(userID);
    expect(await Key.verify(dead.key)).toBeNull();

    const ids = (await Key.list(undefined)).map((k) => k.id);
    expect(ids).toContain(live.id);
    expect(ids).not.toContain(dead.id);
  });

  withTestUser("a future expiry is serialized and the key still works", async ({ userID }) => {
    const at = new Date(Date.now() + 86_400_000);
    const key = await Key.create({ userID, name: "temp", expiresAt: at });

    expect(key.expiresAt).toBe(at.toISOString());
    expect(await Key.verify(key.key)).toBe(userID);
  });

  withTestUser("verify stamps time_used", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });
    expect(key.timeUsed).toBeNull();

    await Key.verify(key.key);

    expect((await Key.list(undefined))[0]?.timeUsed).not.toBeNull();
  });

  withTestUser("a key belonging to another user is not listable or removable", async () => {
    const otherID = await User.create({ name: "Other", email: testEmail() });
    const key = await Key.create({ userID: otherID, name: "theirs" });

    expect(await Key.list(undefined)).toBeEmpty();
    await expect(Key.remove(key.id)).rejects.toThrow();
    // still valid for its own owner
    expect(await Key.verify(key.key)).toBe(otherID);
  });
});
