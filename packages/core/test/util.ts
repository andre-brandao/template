import { it } from "bun:test";
import { Identity } from "../src/identity";
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
    const user = await createUser({ name: "Test User", email });
    await Identity.provide("user", { userID: user.id, role }, async () => {
      await cb({ userID: user.id, email });
    });
  });
}

/** `User.create` wants `user:create`; test setup holds it as `internal`. */
export function createUser(input: Parameters<typeof User.create>[0]) {
  return Identity.internal("test", Permission.all, () => User.create(input));
}
