import { describe, expect } from "bun:test";
import { Identity } from "../src/identity";
import { Storage } from "../src/lib/storage";
import { Panel } from "../src/platform/panel";
import { createUser, testEmail, withTestUser } from "./util";

const spec = { root: "r", elements: { r: { type: "Text", props: {}, children: [] } } };

describe("panel", () => {
  withTestUser(
    "save, overwrite and list a panel",
    (ctx) =>
      Storage.provide(Storage.fake(), async () => {
        const made = await Panel.create({ title: "Signups", spec });
        expect(made.createdBy).toBe(ctx.userID);
        expect(made.author).toBe("Test User");
        expect(await Storage.disk().files("panels/")).toEqual([
          `panels/${ctx.userID}/${made.id}.json`,
        ]);
        const after = await Panel.update({ id: made.id, title: "Weekly signups", spec });
        expect(after.title).toBe("Weekly signups");
        expect(after.timeCreated).toBe(made.timeCreated);
        expect((await Panel.fromID(made.id)).title).toBe("Weekly signups");
        const rows = await Panel.list();
        expect(rows[0]?.id).toBe(made.id);
        expect(rows[0]).not.toHaveProperty("spec");
      }),
    "admin",
  );

  withTestUser(
    "another user's panel is out of reach, even as admin",
    () =>
      Storage.provide(Storage.fake(), async () => {
        const other = await createUser({ name: "Other", email: testEmail() });
        const theirs = await Identity.provide("user", { userID: other.id, role: "admin" }, () =>
          Panel.create({ title: "Theirs", spec }),
        );
        await expect(Panel.fromID(theirs.id)).rejects.toThrow("Panel not found");
        await expect(Panel.update({ id: theirs.id, title: "Mine", spec })).rejects.toThrow(
          "Panel not found",
        );
        await expect(Panel.remove(theirs.id)).rejects.toThrow("Panel not found");
        expect(await Panel.list()).toEqual([]);
      }),
    "admin",
  );

  withTestUser(
    "a file that no longer parses reads as missing",
    (ctx) =>
      Storage.provide(Storage.fake(), async () => {
        const id = crypto.randomUUID();
        await Storage.disk().put(
          `panels/${ctx.userID}/${id}.json`,
          new TextEncoder().encode(JSON.stringify({ id, title: "Broken" })),
          "application/json",
        );
        await expect(Panel.fromID(id)).rejects.toThrow("Panel not found");
        expect(await Panel.list()).toEqual([]);
      }),
    "admin",
  );

  withTestUser(
    "remove deletes the file",
    () =>
      Storage.provide(Storage.fake(), async () => {
        const made = await Panel.create({ title: "Doomed", spec });
        await Panel.remove(made.id);
        await expect(Panel.fromID(made.id)).rejects.toThrow("Panel not found");
        expect(await Storage.disk().files("panels/")).toEqual([]);
      }),
    "admin",
  );
});
