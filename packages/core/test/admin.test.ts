import { describe, expect } from "bun:test";
import { Actor } from "../src/actor";
import { Admin } from "../src/admin";
import { Event } from "../src/event";
import { Auth } from "../src/user/auth";
import { User } from "../src/user";
import { testEmail, withTestUser } from "./util";

/** A second account to act on, created outside the acting actor. */
function mate() {
  const email = testEmail();
  return Actor.provide("system", {}, async () => ({
    email,
    id: await User.create({ name: "Mate", email }),
  }));
}

describe("admin stats", () => {
  withTestUser(
    "tables report sizes and a database total",
    async () => {
      const stats = await Admin.tables();
      expect(stats.bytes).toBeGreaterThan(0);
      expect(stats.tables.map((t) => t.name)).toContain("user");
      expect(stats.tables.every((t) => Number.isFinite(t.bytes))).toBe(true);
    },
    "admin",
  );

  withTestUser(
    "queue, counts and server all answer",
    async () => {
      expect(await Admin.queue()).toMatchObject({ pending: expect.any(Number) });
      expect((await Admin.counts()).users).toBeGreaterThan(0);
      expect((await Admin.server()).version).not.toBe("unknown");
    },
    "admin",
  );

  withTestUser("a member cannot read any of it", async () => {
    expect(() => Admin.tables()).toThrow(/admin:read/);
    expect(() => Admin.counts()).toThrow(/admin:read/);
  });
});

describe("admin users", () => {
  withTestUser(
    "page paginates, searches and carries the role",
    async () => {
      const one = await mate();
      const found = await User.page({ search: one.email });
      expect(found.total).toBe(1);
      expect(found.data[0]?.role).toBe("member");
      expect(found.data[0]?.timeDeleted).toBeNull();
    },
    "admin",
  );

  withTestUser(
    "assign promotes and audits",
    async () => {
      const one = await mate();
      await User.assign({ id: one.id, role: "admin" });
      expect((await User.fromID(one.id))?.role).toBe("admin");
    },
    "admin",
  );

  withTestUser(
    "remove hides the user everywhere auth looks, restore brings them back",
    async () => {
      const one = await mate();
      await User.remove(one.id);

      expect(await User.fromID(one.id)).toBeNull();
      expect((await User.page({ search: one.email })).total).toBe(0);
      expect((await User.page({ search: one.email, deleted: true })).total).toBe(1);
      await expect(
        Auth.provision({ provider: "email", accountId: one.email, email: one.email }),
      ).rejects.toThrow(/disabled/);

      await User.restore(one.id);
      expect(await User.fromID(one.id)).not.toBeNull();
    },
    "admin",
  );

  withTestUser(
    "an admin cannot lock themselves out",
    async ({ userID }) => {
      await expect(User.assign({ id: userID, role: "member" })).rejects.toThrow(/your own/);
      await expect(User.remove(userID)).rejects.toThrow(/your own/);
    },
    "admin",
  );

  withTestUser("a member holds none of it", async () => {
    const one = await mate();
    expect(() => User.page({})).toThrow(/admin:read/);
    await expect(User.assign({ id: one.id, role: "admin" })).rejects.toThrow(/user:assign/);
    await expect(User.remove(one.id)).rejects.toThrow(/user:delete/);
  });
});

describe("admin logs", () => {
  withTestUser(
    "an unpinned read spans every actor and resolves who acted",
    async ({ userID }) => {
      const one = await mate();
      await User.assign({ id: one.id, role: "admin" });

      const all = await Event.list({ type: "user.assigned", search: one.id });
      expect(all.total).toBe(1);
      // The join resolves the acting user rather than leaving a bare id.
      expect(all.data[0]?.user?.id).toBe(userID);
      expect(all.data[0]?.sourceID).toBe(one.id);
    },
    "admin",
  );

  withTestUser(
    "filters compose and narrow the total",
    async () => {
      const one = await mate();
      await User.remove(one.id);

      const bySource = await Event.list({ source: "user", search: one.id });
      expect(bySource.data.map((e) => e.type)).toContain("user.removed");

      const wrong = await Event.list({ type: "todo.created", search: one.id });
      expect(wrong.total).toBe(0);

      const facets = await Event.facets();
      expect(facets.types).toContain("user.removed");
      expect(facets.sources).toContain("user");
    },
    "admin",
  );

  withTestUser("a member cannot read the log", async () => {
    expect(() => Event.list({})).toThrow(/admin:read/);
    expect(() => Event.facets()).toThrow(/admin:read/);
  });
});
