import { describe, expect } from "bun:test";
import { Key } from "../src/key";
import { User } from "../src/user";
import { Actor } from "../src/actor";
import { Database } from "../src/drizzle";
import { Identifier } from "../src/identifier";
import { Organization } from "../src/organization";
import { Member } from "../src/organization/member";
import { MemberTable } from "../src/organization/member.sql";
import { Role } from "../src/organization/role";
import { testEmail, withTestUser } from "./util";

/** Seeds a user joined to `orgID` with `roleID` — the raw-insert test seam for memberships. */
async function join(orgID: string, roleID: string) {
  const userID = await User.create({ name: "Guest", email: testEmail() });
  await Database.use((tx) =>
    tx.insert(MemberTable).values({ id: Identifier.create("member"), orgID, userID, roleID }),
  );
  return userID;
}

describe("key", () => {
  withTestUser("create mints a usable key that shows up in list", async ({ userID, orgID }) => {
    const key = await Key.create({ userID, name: "laptop" });

    expect(key.key).toStartWith("sk-");
    expect(key.display).toBe(`${key.key.slice(0, 7)}...${key.key.slice(-4)}`);
    expect(await Key.verify(key.key)).toMatchObject({ userID, orgID });

    const keys = await Key.list(undefined);
    expect(keys.map((k) => k.id)).toContain(key.id);
  });

  withTestUser("a key defaults to the minter's role", async ({ userID, orgID }) => {
    const key = await Key.create({ userID, name: "laptop" });
    expect(key.role.name).toBe("Owner");
    expect(await Key.verify(key.key)).toEqual({ userID, orgID, permissions: ["*"] });
  });

  withTestUser("a key scoped to a lesser role acts with its permissions", async ({ userID }) => {
    const viewer = await Role.create({ name: "Viewer", permissions: ["todo:read"] });
    const key = await Key.create({ userID, name: "ci", roleID: viewer });
    expect(key.role.name).toBe("Viewer");
    expect((await Key.verify(key.key))?.permissions).toEqual(["todo:read"]);
  });

  withTestUser("a key cannot out-rank its minter", async ({ orgID }) => {
    const roles = await Role.list();
    const viewer = await Role.create({ name: "Viewer", permissions: ["todo:read"] });
    const guest = await join(orgID, viewer);
    const owner = roles.find((r) => r.owner)!.id;
    await expect(Key.create({ userID: guest, name: "evil", roleID: owner })).rejects.toMatchObject({
      code: "insufficient_permissions",
    });
  });

  withTestUser("demotion caps existing keys", async ({ orgID }) => {
    const roles = await Role.list();
    const member = roles.find((r) => r.name === "Member")!.id;
    const viewer = await Role.create({ name: "Viewer", permissions: ["todo:read"] });
    const guest = await join(orgID, member);
    const key = await Key.create({ userID: guest, name: "ci" });
    expect((await Key.verify(key.key))?.permissions).toContain("todo:write");

    const row = (await Member.list()).find((m) => m.userID === guest)!;
    await Member.assign({ id: row.id, roleID: viewer });
    expect((await Key.verify(key.key))?.permissions).toEqual(["todo:read"]);
  });

  withTestUser("leaving the org kills the key", async ({ orgID }) => {
    const viewer = await Role.create({ name: "Viewer", permissions: ["todo:read"] });
    const guest = await join(orgID, viewer);
    const key = await Key.create({ userID: guest, name: "ci" });
    expect(await Key.verify(key.key)).not.toBeNull();

    const membership = await Member.resolve({ userID: guest, orgID });
    await Actor.provide(
      "user",
      { userID: guest, orgID, permissions: membership?.permissions },
      () => Member.leave(),
    );
    expect(await Key.verify(key.key)).toBeNull();
  });

  withTestUser("a role with live keys cannot be removed", async ({ userID }) => {
    const viewer = await Role.create({ name: "Viewer", permissions: ["todo:read"] });
    const key = await Key.create({ userID, name: "ci", roleID: viewer });
    await expect(Role.remove(viewer)).rejects.toMatchObject({ code: "resource_in_use" });
    await Key.remove(key.id);
    await Role.remove(viewer);
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
    expect((await Key.verify(mine.key))?.userID).toBe(userID);
    expect(await Key.list(mine.key)).toMatchObject([{ id: mine.id, current: true }]);
  });

  withTestUser("an expired key does not verify and drops out of the list", async ({ userID }) => {
    const live = await Key.create({ userID, name: "live" });
    const dead = await Key.create({
      userID,
      name: "dead",
      expiresAt: new Date(Date.now() - 1000),
    });

    expect((await Key.verify(live.key))?.userID).toBe(userID);
    expect(await Key.verify(dead.key)).toBeNull();

    const ids = (await Key.list(undefined)).map((k) => k.id);
    expect(ids).toContain(live.id);
    expect(ids).not.toContain(dead.id);
  });

  withTestUser("a future expiry is serialized and the key still works", async ({ userID }) => {
    const at = new Date(Date.now() + 86_400_000);
    const key = await Key.create({ userID, name: "temp", expiresAt: at });

    expect(key.expiresAt).toBe(at.toISOString());
    expect((await Key.verify(key.key))?.userID).toBe(userID);
  });

  withTestUser("verify stamps time_used", async ({ userID }) => {
    const key = await Key.create({ userID, name: "laptop" });
    expect(key.timeUsed).toBeNull();

    await Key.verify(key.key);

    expect((await Key.list(undefined))[0]?.timeUsed).not.toBeNull();
  });

  withTestUser("a key belonging to another user is not listable or removable", async () => {
    const otherID = await User.create({ name: "Other", email: testEmail() });
    const otherOrg = await Organization.init({ userID: otherID, name: "Other Org" });
    const key = await Actor.provide("user", { userID: otherID, orgID: otherOrg }, () =>
      Key.create({ userID: otherID, name: "theirs" }),
    );

    expect(await Key.list(undefined)).toBeEmpty();
    await expect(Key.remove(key.id)).rejects.toThrow();
    // still valid for its own owner
    expect((await Key.verify(key.key))?.userID).toBe(otherID);
  });
});
