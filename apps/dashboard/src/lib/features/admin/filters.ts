import { z } from "zod";
import { keys } from "./sort";

// URL state for the users and logs pages. Their loads parse the same schema, so they warm
// the key the page reads. `undefined` rather than empty/false keeps that key stable.
const people = z.object({
  q: z.string().default(""),
  deleted: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  sort: keys.users.schema,
});

const log = z.object({
  q: z.string().default(""),
  type: z.string().default(""),
  source: z.string().default(""),
  user: z.string().default(""),
  page: z.coerce.number().int().min(1).default(1),
  sort: keys.events.schema,
});

const users = {
  schema: people,
  args: (params: z.infer<typeof people>) => ({
    search: params.q || undefined,
    deleted: params.deleted || undefined,
    page: params.page,
    pageSize: 20,
    sort: params.sort,
  }),
};

const events = {
  schema: log,
  args: (params: z.infer<typeof log>) => ({
    search: params.q || undefined,
    type: params.type || undefined,
    source: params.source || undefined,
    userID: params.user || undefined,
    page: params.page,
    pageSize: 50,
    sort: params.sort,
  }),
};

export const filters = { users, events };
