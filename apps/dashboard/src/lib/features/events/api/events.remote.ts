import { z } from "zod";
import { Event } from "@template/core/event";
import { remote } from "$lib/server/remote";

// Pinned to one row, which is what keeps this readable without the admin grant. The page
// size stands in for the old `limit`: a timeline shows recent activity, not all of it.
export const getEvents = remote(Event.list)
  .with(
    z
      .object({ source: z.string(), sourceID: z.string() })
      .transform((input) => ({ ...input, pageSize: 50 })),
  )
  .query();
