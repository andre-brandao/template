import { test, expect } from "../util/fixtures";
import { seed } from "../util/seed";

// Todos are visible workspace-wide, so read tests scope themselves to a freshly
// seeded project rather than relying on per-user lists.

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
  const project = await seed(session.userID, ["Buy milk", "Renew passport"]);

  await page.goto(`/projects/${project}/todos`);

  await expect(page.getByRole("link", { name: "Buy milk" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Renew passport" })).toBeVisible();
});

test("the board can group by stage", async ({ page, as }) => {
  const session = await as("user");
  const project = await seed(session.userID, ["Draft the brief", "Ship the build"]);

  await page.goto(`/projects/${project}/todos?view=board&group=stage`);

  // Scoped to the board: the stage filter carries the same labels as options.
  const board = page.locator(".board");
  await expect(board.getByText("Sprint 1", { exact: true })).toBeVisible();
  await expect(board.getByText("Sprint 2", { exact: true })).toBeVisible();
});

test("the timeline plots dated todos", async ({ page, as }) => {
  const session = await as("user");
  const project = await seed(session.userID, ["Kick off"]);

  await page.goto(`/projects/${project}/todos?view=timeline`);

  await expect(page.getByRole("link", { name: "Kick off" })).toBeVisible();
  await expect(page.getByText("planned")).toBeVisible();
});

test("starting a todo records it as active", async ({ page, as }) => {
  const session = await as("user");
  const project = await seed(session.userID, ["Start me"]);

  await page.goto(`/projects/${project}/todos`);
  await page.getByRole("button", { name: "Backlog" }).first().click();
  await page.getByRole("menuitem", { name: "Active" }).click();

  await expect(page.getByRole("button", { name: "Active" }).first()).toBeVisible();
});
