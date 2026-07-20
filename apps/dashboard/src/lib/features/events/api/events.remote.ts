import { query } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Event } from "@template/core/event";
import { Actor } from "@template/core/actor";

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

export const getEvents = query(
  z.object({ source: z.string(), sourceID: z.string() }),
  async (input) => {
    auth();
    return Event.list(input);
  },
);
