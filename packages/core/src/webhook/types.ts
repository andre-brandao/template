/**
 * The public API contract. Only these types reach a webhook — anything recorded with
 * `Event.create` instead of `Event.publish` stays internal. No imports here on purpose,
 * so the browser can read the catalog without pulling in the database.
 */
export const Types = [
  "todo.created",
  "todo.updated",
  "todo.removed",
  "project.created",
  "project.updated",
  "project.removed",
] as const;

export type Type = (typeof Types)[number];
