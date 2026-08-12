import { test, expect } from "../util/fixtures";

test("landing page renders for an anonymous visitor", async ({ page }) => {
  await page.goto("/");
  // The headline states what the app is; the lifecycle is the rule drawn under it.
  await expect(
    page.getByRole("heading", { name: "Track work from capture to shipped." }),
  ).toBeVisible();
  await expect(page.locator("main").getByText("Capture", { exact: true })).toBeVisible();
  // Scoped to main — the Topbar also carries a "Log in" link.
  await expect(page.locator("main").getByRole("link", { name: "Log in" })).toBeVisible();
});

test("healthz reports ok", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ status: "ok" });
});
