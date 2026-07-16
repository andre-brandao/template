import { test as base, expect } from "@playwright/test";
import { mint } from "./mint";

type Session = Awaited<ReturnType<typeof mint>>;

// `as(role)` seeds a user and authenticates the browser context by cookie, so a
// test drives protected pages without the login UI:
//   test("todos", async ({ page, as }) => { await as("user"); await page.goto("/todos") })
// Anonymous tests simply never call it.
type Fixtures = {
  as: (role?: string, opts?: { email?: string; name?: string }) => Promise<Session>;
};

export const test = base.extend<Fixtures>({
  as: async ({ context, baseURL }, use) => {
    await use(async (role = "user", opts = {}) => {
      const session = await mint(role, opts);
      await context.addCookies([{ name: "token", value: session.token, url: baseURL! }]);
      return session;
    });
  },
});

export { expect };
