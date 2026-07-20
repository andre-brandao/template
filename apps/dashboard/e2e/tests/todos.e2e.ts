import { test, expect } from "../util/fixtures";
import { seed } from "../util/seed";

// Each test gets a fresh user via `as()`, and the list is per-user, so seeded /
// created titles never collide across tests sharing the e2e database.

test("creating a todo through the form shows it in the list", async ({ page, as }) => {
  await as("user");
  await page.goto("/todos");

  await page.getByRole("button", { name: "New todo" }).click();
  await page.getByPlaceholder("What needs doing?").fill("Write the quarterly report");
  await page.getByRole("button", { name: "Add todo" }).click();

  await expect(page.getByRole("link", { name: "Write the quarterly report" })).toBeVisible();
});

test("existing todos are listed", async ({ page, as }) => {
  const session = await as("user");
  await seed(session.userID, ["Buy milk", "Renew passport"]);

  await page.goto("/todos");

  await expect(page.getByRole("link", { name: "Buy milk" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Renew passport" })).toBeVisible();
});
