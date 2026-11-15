import { describe, expect } from "bun:test";
import { VisibleError } from "../src/error";
import { Identity } from "../src/identity";
import { Panel } from "../src/platform/panel";
import { createUser, testEmail, withTestUser } from "./util";

const spec = { root: "r", elements: { r: { type: "Text", props: {}, children: [] } } };

describe("panel", () => {
  withTestUser(
    "save, overwrite and list a panel",
    async (ctx) => {
      const made = await Panel.create({ title: "Signups", spec });
      expect(made.createdBy).toBe(ctx.userID);
      expect(made.author).toBe("Test User");
      const after = await Panel.update({ id: made.id, title: "Weekly signups", spec });
      expect(after.title).toBe("Weekly signups");
      expect(after.timeCreated).toBe(made.timeCreated);
      const rows = await Panel.list();
      expect(rows[0]?.id).toBe(made.id);
      expect(rows[0]).not.toHaveProperty("spec");
    },
    "admin",
  );

  withTestUser(
    "only its author changes a panel, even as admin",
    async () => {
      const other = await createUser({ name: "Other", email: testEmail() });
      const theirs = await Identity.provide("user", { userID: other.id, role: "admin" }, () =>
        Panel.create({ title: "Theirs", spec }),
      );
      expect((await Panel.fromID(theirs.id)).title).toBe("Theirs");
      await expect(Panel.update({ id: theirs.id, title: "Mine", spec })).rejects.toThrow(
        VisibleError,
      );
      await expect(Panel.remove(theirs.id)).rejects.toThrow(VisibleError);
    },
    "admin",
  );

  withTestUser(
    "remove hides the panel",
    async () => {
      const made = await Panel.create({ title: "Doomed", spec });
      await Panel.remove(made.id);
      await expect(Panel.fromID(made.id)).rejects.toThrow("Panel not found");
      expect((await Panel.list()).map((row) => row.id)).not.toContain(made.id);
    },
    "admin",
  );
});
