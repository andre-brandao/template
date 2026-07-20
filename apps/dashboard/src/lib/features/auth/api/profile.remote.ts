import { form, query } from "$app/server";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import { User } from "@template/core/user";
import { Actor } from "@template/core/actor";
import { auth, guard, remote } from "$lib/server/remote";

export const getMe = query(async () => {
  auth();
  const user = await User.fromID(Actor.userID());
  if (!user) error(404, "User not found");
  return user;
});

export const getProviders = remote(User.providers).query();

// `User.update.schema` has `name` optional; a rename form must require it.
export const rename = form(z.object({ name: User.Info.shape.name }), async (input) => {
  auth();
  await guard(() => User.update({ name: input.name }));
  await getMe().refresh();
});
