import { describe, expect, test } from "bun:test";
import { Auth } from "../src/auth";
import { Event } from "../src/platform/event";
import { Identity } from "../src/identity";
import { Permission } from "../src/permission";
import { testEmail } from "./util";

const user = { userID: "usr_1", role: "member" } as const;

describe("delegate", () => {
  test("for a user: their role, narrowed to the grants, still answerable as them", () =>
    Identity.provide("user", user, () =>
      Identity.delegate("copilot", { todo: ["read"] }, () => {
        expect(Identity.use()).toMatchObject({ type: "agent", properties: { name: "copilot" } });
        expect(Identity.userID()).toBe("usr_1");
        expect(Identity.can({ todo: ["read"] })).toBe(true);
        expect(Identity.can({ todo: ["delete"] })).toBe(false);
      }),
    ));

  test("without grants the agent copies the user's role whole", () =>
    Identity.provide("user", user, () =>
      Identity.delegate("copilot", undefined, () => {
        expect(Identity.can({ todo: ["delete"] })).toBe(true);
        expect(Identity.can({ user: ["delete"] })).toBe(false);
      }),
    ));

  test("an agent can only narrow, and an App's account can't delegate at all", () => {
    Identity.provide("user", user, () =>
      Identity.delegate("copilot", { todo: ["read"] }, () =>
        expect(() => Identity.delegate("sub", { todo: ["delete"] }, () => {})).toThrow(),
      ),
    );
    const owner = { userID: "usr_2", role: "admin" } as const;
    Identity.enter({ type: "system", properties: { userID: "usr_3", role: "member", owner } }, () =>
      expect(() => Identity.delegate("x", undefined, () => {})).toThrow(/App can.t delegate/),
    );
  });

  test("internal narrows to another internal holding exactly its grants", () =>
    Identity.internal("sync", { user: ["create"], todo: ["read"] }, () =>
      Identity.delegate("auth", { user: ["create"] }, () => {
        expect(Identity.use()).toEqual({
          type: "internal",
          properties: { name: "auth", scope: { user: ["create"] } },
        });
        expect(Identity.can({ user: ["create"] })).toBe(true);
        expect(Identity.can({ todo: ["read"] })).toBe(false);
        expect(Identity.known()).toBe(false);
        expect(() => Identity.userID()).toThrow();
        expect(() => Identity.delegate("x", { todo: ["delete"] }, () => {})).toThrow();
      }),
    ));

  test("public has nothing to lend", () =>
    Identity.provide("public", {}, () =>
      expect(() => Identity.delegate("auth", { user: ["create"] }, () => {})).toThrow(/Nobody/),
    ));

  test("a signup is on record as internal auth, whoever was calling", async () => {
    const email = testEmail();
    const id = await Identity.provide("user", user, () =>
      Auth.link({ provider: "email", accountId: email, email }),
    );
    const log = await Identity.internal("test", Permission.all, () =>
      Event.list({ sourceID: id, type: "user.created" }),
    );
    expect(log.data[0]?.identity).toEqual({
      type: "internal",
      properties: { name: "auth", scope: { user: ["create"] } },
    });
  });
});
