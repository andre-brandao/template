import { form, query } from "$app/server";
import { z } from "zod";
import { Invitation } from "@template/core/organization/invitation";
import { auth, guard } from "$lib/server/remote";

export const getInvitations = query(async () => {
  auth();
  return Invitation.list();
});

export const createInvitation = form(
  z.object({ email: Invitation.Info.shape.email, roleID: z.string() }),
  async (input) => {
    auth();
    await guard(() => Invitation.create(input));
    await getInvitations().refresh();
  },
);

export const revokeInvitation = form(z.object({ id: Invitation.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Invitation.revoke(input.id));
  await getInvitations().refresh();
});
