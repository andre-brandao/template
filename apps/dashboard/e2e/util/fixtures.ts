import { test as base, expect } from "@playwright/test";
import type { Permission } from "@template/core/permission";
import { mint } from "./mint";

type Session = Awaited<ReturnType<typeof mint>>;

// `as(role)` seeds a user and authenticates the browser context by cookie, so a
// test drives protected pages without the login UI:
//   test("todos", async ({ page, as }) => { await as(); await page.goto("/todos") })
// `as("admin")` for the back office. Anonymous tests simply never call it.
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
