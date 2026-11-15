import { toolDefinition } from "@tanstack/ai";
import { instructions, shape } from "./catalog";
import { check } from "./check";
import { fetchRows } from "./rows";

/** The `show` page tool: blocks fetch their rows here, as the user; the model gets a summary. */
export function show() {
  return toolDefinition({
    name: "show",
    description: instructions(
      "Shows the user a panel built from the components below, rendered in the chat while you write it. Pass the spec `panel` returned as it is.",
    ),
    inputSchema: shape,
  }).client((input) => check(input, fetchRows));
}
