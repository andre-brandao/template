import { test, expect } from "../util/fixtures";

test("an authenticated user sees the app nav", async ({ page, as }) => {
  await as("user");
  await page.goto("/");
  // Scoped to main — Topbar/Sidebar carry their own copies of these links.
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: "Todos" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Insights" })).toBeVisible();
  // The whole page: authed state shows "Log out", never "Log in".
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);
});

test("an authenticated user can open the todos page", async ({ page, as }) => {
  const session = await as("user");
  await page.goto(`/${session.orgID}/todos`);
  await expect(page).toHaveURL(/\/todos$/);
  await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
});
