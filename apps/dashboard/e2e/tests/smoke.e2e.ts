import { test, expect } from "../util/fixtures";

test("landing page renders for an anonymous visitor", async ({ page }) => {
  await page.goto("/");
  // The headline spells the lifecycle stages; "Todos" is only the topbar brand.
  await expect(page.getByRole("heading", { name: "Capture Move Ship" })).toBeVisible();
  // Scoped to main — the Topbar also carries a "Log in" link.
  await expect(page.locator("main").getByRole("link", { name: "Log in" })).toBeVisible();
});

test("healthz reports ok", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ status: "ok" });
});
