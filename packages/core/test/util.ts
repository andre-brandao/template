import { it } from "bun:test";
import { Actor } from "../src/actor";
import { User } from "../src/user";
import { Organization } from "../src/organization";
import { Member } from "../src/organization/member";

export function testEmail() {
  return `test-${crypto.randomUUID()}@example.com`;
}

/**
 * Creates a user with a personal org (bypassing the register/login flow) and runs
 * the callback as that user with org + permissions resolved, like the request hooks do.
 */
export function withTestUser(
  name: string,
  cb: (ctx: { userID: string; email: string; orgID: string }) => Promise<any>,
) {
  return it(name, async () => {
    const email = testEmail();
    const userID = await User.create({ name: "Test User", email });
    const orgID = await Organization.init({ userID, name: "Test Org" });
    const membership = await Member.resolve({ userID, orgID });
    await Actor.provide(
      "user",
      { userID, orgID, permissions: membership?.permissions },
      async () => {
        await cb({ userID, email, orgID });
      },
    );
  });
}
