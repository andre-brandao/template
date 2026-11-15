import { call } from "$lib/query";
import { doc } from "./api.remote";

export const spec = () => ({ queryKey: ["dev", "api"], queryFn: call(() => doc()) });
