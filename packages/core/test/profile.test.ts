import { describe, expect } from "bun:test";
import { App } from "../src/platform/app";
import { Event } from "../src/platform/event";
import { Identity } from "../src/identity";
import { Todo } from "../src/todo";
import { User } from "../src/user";
import { createUser, testEmail, withTestUser } from "./util";

describe("profile", () => {
  withTestUser(
    "a teammate's profile hides prefs; a bot's hides its placeholder email",
    async () => {
      const mate = await createUser({ name: "Mate", email: testEmail() });
      const seen = await User.profile(mate.id);
      expect(seen?.email).toBe(mate.email);
      expect(seen && "prefs" in seen).toBe(false);

      const bot = await createUser({
        name: "CI",
        email: testEmail(),
        kind: "system",
        ownerID: mate.id,
      });
      const profile = await User.profile(bot.id);
      expect(profile?.email).toBeNull();
      expect(profile?.owner).toEqual({ id: mate.id, name: "Mate" });
    },
  );

  withTestUser(
    "a member sees only public activity; an admin sees all of it",
    async ({ userID }) => {
      await Todo.create({ title: "Mine" });
      const mate = await createUser({ name: "Mate", email: testEmail() });
      // `user.assigned` is internal, so it stays off a member's view of the admin's profile.
      await Identity.provide("user", { userID, role: "admin" }, () =>
        User.assign({ id: mate.id, role: "admin" }),
      );

      const member = (await Event.by({ userID })).map((e) => e.type);
      expect(member).toContain("todo.created");
      expect(member).not.toContain("user.assigned");

      const admin = await Identity.provide("user", { userID, role: "admin" }, () =>
        Event.by({ userID }),
      );
      expect(admin.map((e) => e.type)).toContain("user.assigned");
    },
  );

  withTestUser(
    "an admin renames an app through its bot profile",
    async () => {
      const app = await App.create({ name: "Old" });
      await App.update({ id: app.id, name: "New" });
      expect((await User.profile(app.id))?.name).toBe("New");
    },
    "admin",
  );
});
