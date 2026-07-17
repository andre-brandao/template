import { redirect, error } from "@sveltejs/kit";
import { client } from "$lib/server/auth";
import { write } from "$lib/server/session";
import { subjects } from "@template/functions/auth/subject";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  const code = event.url.searchParams.get("code");
  const err = event.url.searchParams.get("error");
  if (err) error(400, event.url.searchParams.get("error_description") ?? err);
  if (!code) error(400, "Missing code");

  const callback = new URL("/callback", event.url.origin).toString();
  const exchanged = await client.exchange(code, callback);
  if (exchanged.err) error(400, String(exchanged.err));

  const decoded = await client.verify(subjects, exchanged.tokens.access);
  if (decoded.err) error(400, String(decoded.err));

  await write(event, decoded.subject.properties);
  redirect(303, "/");
};
