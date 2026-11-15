import { getRequestEvent } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { User } from "@template/core/user";
import { Auth } from "@template/core/auth";
import { Identity } from "@template/core/identity";
import { remote } from "$lib/server/remote";
import * as next from "$lib/server/next";

export const getMe = remote.query(z.void(), async () => {
  const user = await User.fromID(Identity.userID());
  if (!user) error(404, "User not found");
  return user;
});

export const getProviders = remote.core(User.providers).query();

// `User.update.schema` has `name` optional; a rename form must require it.
export const rename = remote.form(z.object({ name: User.Info.shape.name }), async (input) => {
  // No targeted refresh: the profile page shows the name in its header as well, so every
  // query on the page reloads.
  await User.update({ name: input.name });
});

/**
 * Adds or replaces the password on the signed-in account; there is no signup by password.
 * `_password` leads with an underscore so a failed no-JS submit doesn't echo it back.
 */
export const password = remote.form(z.object({ _password: z.string().min(8) }), async (input) => {
  await Auth.Pass.set({ password: input._password });
  await getProviders().refresh();
});

// Finishes onboarding: the gate holds every route until the account has a real name, then
// this lands the user on the page the gate stopped them at.
export const onboard = remote.form(z.object({ name: User.Info.shape.name }), async (input) => {
  await User.update({ name: input.name });
  redirect(303, next.take(getRequestEvent()));
});
