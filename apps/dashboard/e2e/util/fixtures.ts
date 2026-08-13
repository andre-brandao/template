import { test as base, expect } from "@playwright/test";
import type { Permission } from "@template/core/permission";
import { mint } from "./mint";

type Session = Awaited<ReturnType<typeof mint>>;

// `as(role)` seeds a user and authenticates the browser context by cookie — no login UI.
// `as("admin")` for the back office; anonymous tests simply never call it.
type Fixtures = {
  as: (role?: Permission.Role, opts?: { email?: string; name?: string }) => Promise<Session>;
};

export const test = base.extend<Fixtures>({
  as: async ({ context, baseURL }, use) => {
    await use(async (role = "member", opts = {}) => {
      const session = await mint(role, opts);
      await context.addCookies([{ name: "auth", value: session.cookie, url: baseURL! }]);
      return session;
    });
  },
});

export { expect };
