import { json } from "@sveltejs/kit";
import { Health } from "@template/core/health";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => json(Health.live());
