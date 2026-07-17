import { redirect, error } from "@sveltejs/kit";
import { exchange } from "$lib/server/auth";
import { write } from "$lib/server/session";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  const code = event.url.searchParams.get("code");
  const err = event.url.searchParams.get("error");
  if (err) error(400, event.url.searchParams.get("error_description") ?? err);
  if (!code) error(400, "Missing code");

  await write(event, await exchange(event.url.origin, code));
  redirect(303, "/");
};
