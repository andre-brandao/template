import { redirect } from "@sveltejs/kit";
import { oauth } from "$lib/server/auth";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (locals.session) redirect(303, "/");
  return { oauth: oauth() };
};
