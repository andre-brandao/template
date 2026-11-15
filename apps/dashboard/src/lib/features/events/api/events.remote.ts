import { z } from "zod";
import { Event } from "@template/core/event";
import { remote } from "#lib/server/gate.ts";

// Pinned to one row, which keeps it readable without the admin grant; recent activity only.
export const getEvents = remote
  .core(Event.list)
  .with(
    z
      .object({ source: z.string(), sourceID: z.string() })
      .transform((input) => ({ ...input, pageSize: 50 })),
  )
  .query();
