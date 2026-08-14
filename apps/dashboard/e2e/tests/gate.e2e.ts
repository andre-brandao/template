import { test, expect } from "../util/fixtures";

// `/todos` carries no `+layout.server` guard of its own — the only thing turning an anonymous
// visitor away is the `auth()` gate the remote helper puts in front of every query. Every other
// spec authenticates first, so without this one the gate could be dropped and the suite would
// stay green.
test("a protected remote query turns an anonymous visitor away", async ({ request }) => {
  const res = await request.get("/todos", { maxRedirects: 0 });
  expect(res.status()).toBe(303);
  expect(res.headers()["location"]).toContain("/login");
});

test("the same route renders once signed in", async ({ page, as }) => {
  await as();
  await page.goto("/todos");
  await expect(page).toHaveURL(/\/todos/);
});
