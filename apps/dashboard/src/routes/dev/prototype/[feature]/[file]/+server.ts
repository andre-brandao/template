import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { read, safe } from "../../docs";
import type { RequestHandler } from "./$types";

// Endpoints are routes of their own, so the section's `+layout.server` guard misses them.
export const GET: RequestHandler = async ({ params }) => {
  if (!dev) error(404, "Not found");
  if (!safe(params.feature) || !safe(params.file)) error(404, "Not found");

  const file = read(params.feature, params.file);
  if (!(await file.exists())) error(404, "Not found");
  return new Response(await file.bytes(), { headers: { "content-type": file.type } });
};
