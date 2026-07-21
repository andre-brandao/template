import { form, query } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Member } from "@template/core/organization/member";
import { auth, guard } from "$lib/server/remote";

export const getMembers = query(async () => {
  auth();
  return Member.list();
});

export const assignRole = form(
  z.object({ id: Member.Info.shape.id, roleID: z.string() }),
  async (input) => {
    auth();
    await guard(() => Member.assign(input));
    await getMembers().refresh();
  },
);

export const removeMember = form(z.object({ id: Member.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Member.remove(input.id));
  await getMembers().refresh();
});

export const leaveOrg = form("unchecked", async () => {
  auth();
  await guard(() => Member.leave());
  // Hooks re-resolve the first remaining org and heal the cookie.
  redirect(303, "/");
});
