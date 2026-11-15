import { Health } from "@template/core/health";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => Response.json(Health.live());
