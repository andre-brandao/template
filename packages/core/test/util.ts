import { it } from "bun:test";
import { Actor } from "../src/actor";
import { User } from "../src/user";

export function testEmail() {
  return `test-${crypto.randomUUID()}@example.com`;
}

/** Creates a user directly (bypassing the register/login flow) and runs the callback as that user. */
export function withTestUser(name: string, cb: (ctx: { userID: string; email: string }) => Promise<any>) {
  return it(name, async () => {
    const email = testEmail();
    const userID = await User.create({ name: "Test User", email });
    await Actor.provide("user", { userID }, async () => {
      await cb({ userID, email });
    });
  });
}
