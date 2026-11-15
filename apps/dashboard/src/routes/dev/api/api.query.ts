import { call } from "#lib/query.ts";
import { doc } from "./api.remote";

export const spec = () => ({ queryKey: ["dev", "api"], queryFn: call(() => doc()) });
