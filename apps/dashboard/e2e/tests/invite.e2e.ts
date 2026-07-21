import { test, expect } from "../util/fixtures";
import { invite } from "../util/invite";

test("an invited user can accept and land in the org", async ({ page, as }) => {
  const owner = await as("owner");
  const email = `e2e-invite-${crypto.randomUUID()}@example.com`;
  const token = await invite(owner.userID, email);

  // Re-minting swaps the context's cookie to the invited user.
  await as("owner", { email });
  await page.goto(`/invite/${token}`);
  await expect(page.getByRole("heading", { name: "Join E2E Org" })).toBeVisible();
  await page.getByRole("button", { name: "Accept invitation" }).click();

  await expect(page).toHaveURL(new RegExp(`/${owner.orgID}/todos$`));
});

test("a logged-out visitor is sent through login to accept", async ({ page, as }) => {
  const owner = await as("owner");
  const email = `e2e-invite-${crypto.randomUUID()}@example.com`;
  const token = await invite(owner.userID, email);

  await page.context().clearCookies();
  await page.goto(`/invite/${token}`);
  await expect(page.getByRole("link", { name: "Log in to accept" })).toBeVisible();
});
