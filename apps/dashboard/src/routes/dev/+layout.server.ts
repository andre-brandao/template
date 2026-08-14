import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type { LayoutServerLoad } from "./$types";

// 404 rather than 403: a production build shouldn't admit the section exists.
export const load: LayoutServerLoad = () => {
  if (!dev) error(404, "Not found");
};
