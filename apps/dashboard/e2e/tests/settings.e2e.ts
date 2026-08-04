import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Todo } from "@template/core/todo";
import { test, expect } from "../util/fixtures";

test("settings redirects to the profile page", async ({ page, as }) => {
  await as("user");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings\/profile$/);
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
});

test("the settings nav links the user and workspace sections", async ({ page, as }) => {
  await as("user");
  await page.goto("/settings/experience");

  const nav = page.locator("aside nav");
  await expect(nav.getByRole("link", { name: "Profile" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "API keys" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Experience" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("picking a theme applies instantly and survives a reload", async ({ page, as }) => {
  await as("user");
  await page.goto("/settings/experience");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "system");

  // No reload between these two — the attribute is set before the command resolves.
  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(html).toHaveAttribute("data-theme", "dark");

  // The cookie is what makes the server paint it correctly on a cold load.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
});

test("the date format preference reaches the rest of the app", async ({ page, as }) => {
  const session = await as("user");
  await Database.provide(process.env.DATABASE_URL!, () =>
    Actor.provide("user", { userID: session.userID }, () =>
      Todo.create({ title: "Ship the settings page", dueDate: "2024-03-12T12:00:00.000Z" }),
    ),
  );

  await page.goto("/settings/experience");
  // A zone well clear of the date boundary, so the rendered day can't drift.
  await page.selectOption("select[name='zone']", "UTC");
  await page.selectOption("select[name='date']", "mdy");

  await page.goto("/todos");
  await expect(page.getByText("Due Mar 12, 2024")).toBeVisible();

  await page.goto("/settings/experience");
  await page.selectOption("select[name='date']", "ymd");

  await page.goto("/todos");
  await expect(page.getByText("Due 2024 Mar 12")).toBeVisible();
});
