import { command, query } from "$app/server";
import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { z } from "zod";
import { Actor } from "@template/core/actor";
import { call, ops } from "$lib/server/api";

// Remote endpoints are routes of their own, so the section's `+layout.server` guard misses them.
function gate() {
  if (!dev) error(404, "Not found");
  if (Actor.use().type !== "user") error(403, "Sign in first");
}

export const doc = query(async () => {
  gate();
  return ops();
});

export const send = command(
  z.object({
    method: z.string(),
    path: z.string(),
    token: z.string(),
    body: z.string(),
  }),
  async (input) => {
    gate();
    return call(input);
  },
);
