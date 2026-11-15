import { toolDefinition } from "@tanstack/ai";
import type { QueryClient } from "@tanstack/svelte-query";
import { rows } from "../api/panel.query";
import { instructions, shape } from "./catalog";
import { check } from "./check";

/**
 * The `show` page tool: blocks fetch their rows through `client`, as the user, so the view
 * draws from the same fetch. The model gets a summary.
 */
export function show(client: QueryClient) {
  return toolDefinition({
    name: "show",
    description: instructions(
      "Shows the user a panel built from the components below, rendered in the chat while you write it. Pass the spec `panel` returned as it is.",
    ),
    inputSchema: shape,
  }).client((input) => check(input, (sql, limit) => client.fetchQuery(rows(sql, limit))));
}
