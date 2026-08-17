import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  if (!user) redirect(303, "/login");
  // Named already, so there is nothing to finish — the root layout stops sending people here.
  if (user.name !== user.email) redirect(303, "/");
  return { email: user.email };
};
