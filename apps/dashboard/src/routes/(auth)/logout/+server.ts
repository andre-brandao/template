import { redirect } from "@sveltejs/kit";
import * as session from "$lib/server/session";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = (event) => {
  session.clear(event);
  redirect(303, "/login");
};
