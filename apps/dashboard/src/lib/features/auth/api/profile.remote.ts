import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { User } from "@template/core/user";
import { Auth } from "@template/core/user/auth";
import { Actor } from "@template/core/actor";
import { remote } from "$lib/server/remote";

export const getMe = remote.query(z.void(), async () => {
  const user = await User.fromID(Actor.userID());
  if (!user) error(404, "User not found");
  return user;
});

export const getProviders = remote.core(User.providers).query();

// `User.update.schema` has `name` optional; a rename form must require it.
export const rename = remote.form(z.object({ name: User.Info.shape.name }), async (input) => {
  await User.update({ name: input.name });
  await getMe().refresh();
});

/**
 * Adds or replaces the password on the signed-in account; there is no signup by password.
 * `_password` leads with an underscore so a failed no-JS submit doesn't echo it back.
 */
export const password = remote.form(z.object({ _password: z.string().min(8) }), async (input) => {
  await Auth.Pass.set({ password: input._password });
  await getProviders().refresh();
});

/**
 * Finishes onboarding. `provision` names a fresh account after its address, and the root
 * layout holds everything behind `/welcome` until that is replaced — so this is the only
 * way out, and it lands the user where they were going.
 */
export const onboard = remote.form(z.object({ name: User.Info.shape.name }), async (input) => {
  await User.update({ name: input.name });
  redirect(303, "/");
});
