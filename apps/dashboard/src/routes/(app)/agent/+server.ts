import { serve } from "$lib/features/agent/api/serve";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = (event) => serve(event);
