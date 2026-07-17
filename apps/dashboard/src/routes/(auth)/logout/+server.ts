import { redirect } from "@sveltejs/kit";
import { clear } from "$lib/server/session";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = (event) => {
  clear(event);
  redirect(303, "/login");
};
