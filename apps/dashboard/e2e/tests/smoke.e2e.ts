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

test("probes answer live, ready and started", async ({ request }) => {
  const live = await request.get("/healthz");
  expect(live.ok()).toBe(true);
  expect(await live.json()).toMatchObject({ status: "ok" });

  const ready = await request.get("/readyz");
  expect(ready.ok()).toBe(true);
  expect(await ready.json()).toMatchObject({ status: "ok", checks: { db: { status: "ok" } } });

  const started = await request.get("/startupz");
  expect(started.ok()).toBe(true);
  expect(await started.json()).toMatchObject({ status: "ok" });
});
