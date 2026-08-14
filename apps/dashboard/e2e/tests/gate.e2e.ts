import { test, expect } from "../util/fixtures";

// `/todos` carries no `+layout.server` guard of its own — the only thing turning an anonymous
// visitor away is the `auth()` gate the remote helper puts in front of every query. Every other
// spec authenticates first, so without this one the gate could be dropped and the suite would
// stay green. 401 rather than a redirect: the gate `error()`s, and `+error.svelte` is what
// offers the way back to /login.
test("a protected remote query turns an anonymous visitor away", async ({ page }) => {
  const res = await page.goto("/todos");
  expect(res?.status()).toBe(401);
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});

test("the same route renders once signed in", async ({ page, as }) => {
  await as();
  await page.goto("/todos");
  await expect(page).toHaveURL(/\/todos/);
});
