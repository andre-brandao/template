import { error } from "@sveltejs/kit";
import { dev } from "$app/env";
import { z } from "zod";
import { Identity } from "@template/core/identity";
import { remote } from "#lib/server/gate.ts";
import { call, ops } from "./api";

// Remote endpoints are routes of their own, so the section's `+layout.server` guard misses them.
// Not the helper's own `auth()`: a console has nowhere to redirect to, and outside dev it should
// not admit it exists.
function gate() {
  if (!dev) error(404, "Not found");
  if (Identity.use().type !== "user") error(403, "Sign in first");
}

const api = remote.public.use(gate);

export const doc = api.query(z.void(), ops);

export const send = api.command(
  z.object({
    method: z.string(),
    path: z.string(),
    token: z.string(),
    body: z.string(),
  }),
  call,
);
