import { sequence } from "@sveltejs/kit/hooks";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Auth } from "@template/core/user/auth";
import { VisibleError } from "@template/core/error";

const handleDb: Handle = ({ event, resolve }) => {
  const url = env.DATABASE_URL ?? Database.DEFAULT_URL;
  return Database.provide(url, () => resolve(event));
};

const handleAuth: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("token");
  event.locals.token = token;

  const userID = token ? await Auth.verifySession(token) : null;
  if (!userID) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID }, () => resolve(event));
};

export const handle = sequence(handleDb, handleAuth);

export const handleError: HandleServerError = ({ error }) => {
  if (error instanceof VisibleError) return { message: error.message };
  return { message: "Internal Error" };
};
