import { read } from "#lib/query.ts";
import { getMe, getProviders } from "./profile.remote";

export const me = () => ({ queryKey: ["me"], queryFn: read(() => getMe()) });

export const providers = () => ({ queryKey: ["providers"], queryFn: read(() => getProviders()) });
