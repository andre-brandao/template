import { read } from "#lib/query.ts";
import { doc } from "./api.remote";

export const spec = () => ({ queryKey: ["dev", "api"], queryFn: read(() => doc()) });
