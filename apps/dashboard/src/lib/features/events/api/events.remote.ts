import { z } from "zod";
import { Event } from "@template/core/event";
import { remote } from "$lib/server/remote";

export const getEvents = remote(Event.list)
  .with(z.object({ source: z.string(), sourceID: z.string() }))
  .query();
