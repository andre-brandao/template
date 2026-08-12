import type { Page } from "@playwright/test";
import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Todo } from "@template/core/todo";
import { test, expect } from "../util/fixtures";

// The prefs `save` command POSTs to the remote-function endpoint; navigating or
// reloading before it resolves aborts the request and nothing is persisted. Arm
// this BEFORE the interaction, await it before leaving the page.
const saved = (page: Page) =>
  page.waitForResponse(
    (res) => res.url().includes("/_app/remote/") && res.request().method() === "POST",
  );

test("settings redirects to the profile page", async ({ page, as }) => {
  await as();
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings\/profile$/);
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
});

test("the settings nav links the user and workspace sections", async ({ page, as }) => {
  await as();
  await page.goto("/settings/experience");

  const nav = page.locator("aside nav");
  await expect(nav.getByRole("link", { name: "Profile" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "API keys" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Experience" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("breadcrumbs show the current settings hierarchy", async ({ page, as }) => {
  await as();
  await page.goto("/settings/experience");

  const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumbs.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(crumbs.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  await expect(crumbs.getByText("Experience", { exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("picking a theme applies instantly and survives a reload", async ({ page, as }) => {
  await as();
  await page.goto("/settings/experience");
  // The radios are SSR'd and clickable before Svelte attaches its delegated change
  // handler; a click that lands pre-hydration silently does nothing.
  await page.waitForLoadState("networkidle");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "system");

  // No reload between these two — the attribute is set before the command resolves.
  const save = saved(page);
  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(html).toHaveAttribute("data-theme", "dark");

  // The cookie is what makes the server paint it correctly on a cold load; the save
  // round-trip is what sets it, so let it (and the invalidateAll() that follows,
  // whose same-URL revalidation counts as a navigation) land before reloading.
  await save;
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
});

test("the date format preference reaches the rest of the app", async ({ page, as }) => {
  const session = await as();
  // Unique per attempt: todos are workspace-wide and the database lives for the
  // whole run, so a fixed title accumulates rows across projects and retries.
  const title = `Ship the settings page ${Date.now()}`;
  await Database.provide(process.env.DATABASE_URL!, () =>
    Actor.provide("user", { userID: session.userID }, () =>
      Todo.create({ title, dueDate: "2024-03-12T12:00:00.000Z" }),
    ),
  );

  await page.goto("/settings/experience");
  await page.waitForLoadState("networkidle");
  // A DST-free zone well clear of the date boundary, so the rendered day can't
  // drift. (`UTC` itself is absent from Node's `Intl.supportedValuesOf` list.)
  const zone = saved(page);
  await page.selectOption("select[name='zone']", "Asia/Tokyo");
  await zone;
  const mdy = saved(page);
  await page.selectOption("select[name='date']", "mdy");
  await mdy;
  // Each save is followed by an invalidateAll(); its same-URL revalidation counts
  // as a navigation and would interrupt the goto below. Let it settle first.
  await page.waitForLoadState("networkidle");

  // Retry once: even settled, WebKit sometimes lets the revalidation interrupt the
  // hard navigation ("interrupted by another navigation"); by the retry it's done.
  await page.goto("/todos").catch(() => page.goto("/todos"));
  // The table's Due column carries the bare date; "Due" itself is the column header.
  const row = page.getByRole("row", { name: title });
  await expect(row.getByText("Mar 12, 2024", { exact: true })).toBeVisible();

  await page.goto("/settings/experience");
  await page.waitForLoadState("networkidle");
  const ymd = saved(page);
  await page.selectOption("select[name='date']", "ymd");
  await ymd;
  await page.waitForLoadState("networkidle");

  await page.goto("/todos").catch(() => page.goto("/todos"));
  await expect(row.getByText("2024 Mar 12", { exact: true })).toBeVisible();
});
