import { goto, refreshAll } from "$app/navigation";
import { page } from "$app/state";
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

/** The page tools every agent run gets: open a page, and refresh it after a change. */
export function builtins() {
  return [
    toolDefinition({
      name: "navigate",
      description:
        "Opens a page of the app in the user's browser, by path (e.g. /todos, /projects/<id>).",
      inputSchema: z.object({ path: z.string().startsWith("/") }),
    }).client(async ({ path }) => {
      await goto(path);
      // An error page still navigates; tell the model so it doesn't claim the page opened.
      if (page.error)
        return { opened: false, path, status: page.status, error: page.error.message };
      return { opened: path };
    }),
    toolDefinition({
      name: "refresh",
      description:
        "Reloads the data of the page open in the user's browser. Call it after creating, changing or removing something the page shows.",
      inputSchema: z.object({}),
    }).client(async () => {
      await refreshAll();
      return { refreshed: true };
    }),
  ];
}
