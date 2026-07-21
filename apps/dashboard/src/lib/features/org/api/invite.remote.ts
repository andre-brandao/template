import { form, query } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Invitation } from "@template/core/organization/invitation";
import { auth, guard } from "$lib/server/remote";

/** Public — the token itself is the secret; feeds the accept page pre-login too. */
export const getInvite = query(z.string(), (token) => Invitation.fromToken(token));

export const acceptInvite = form(z.object({ token: z.string() }), async (input) => {
  auth();
  const orgID = await guard(() => Invitation.accept(input.token));
  // Hooks heal the cookie to the joined org when the URL names it.
  redirect(303, `/${orgID}/todos`);
});
