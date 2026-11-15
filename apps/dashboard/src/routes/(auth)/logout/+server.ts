import { redirect } from "@sveltejs/kit";
import * as session from "#lib/server/session.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  await session.clear(event);
  redirect(303, "/login");
};
