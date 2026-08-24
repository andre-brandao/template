import { json } from "@sveltejs/kit";
import { Health } from "@template/core/health";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const probe = await Health.start();
  return json(probe, { status: Health.code(probe) });
};
