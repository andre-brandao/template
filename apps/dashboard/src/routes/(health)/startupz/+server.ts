import { Health } from "@template/core/health";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const probe = await Health.start();
  return Response.json(probe, { status: Health.code(probe) });
};
