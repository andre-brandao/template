import { it } from "bun:test";
import { Actor } from "../src/actor";
import { Permission } from "../src/permission";
import { User } from "../src/user";

export function testEmail() {
  return `test-${crypto.randomUUID()}@example.com`;
}

/**
 * Creates a user directly (bypassing the register/login flow) and runs the callback as that
 * user. `role` overrides what the row holds — the actor is what checks read, so a test can
 * run as `admin` without touching the database.
 */
export function withTestUser(
  name: string,
  cb: (ctx: { userID: string; email: string }) => Promise<any>,
  role: Permission.Role = "member",
) {
  return it(name, async () => {
    const email = testEmail();
    const userID = await Actor.provide("system", {}, () =>
      User.create({ name: "Test User", email }),
    );
    await Actor.provide("user", { userID, role }, async () => {
      await cb({ userID, email });
    });
  });
}
