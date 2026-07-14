import { form, query } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { User } from "@template/core/user";
import { Actor } from "@template/core/actor";
import { guard } from "$lib/server/guard";

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

export const getMe = query(async () => {
  auth();
  const user = await User.fromID(Actor.userID());
  if (!user) error(404, "User not found");
  return user;
});

export const getProviders = query(async () => {
  auth();
  return User.providers();
});

// `User.update.schema` has `name` optional; a rename form must require it.
export const rename = form(z.object({ name: User.Info.shape.name }), async (input) => {
  auth();
  await guard(() => User.update({ name: input.name }));
  await getMe().refresh();
});
