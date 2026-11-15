import { call } from "$lib/query";
import { getMe, getProviders } from "./profile.remote";

export const me = () => ({ queryKey: ["me"], queryFn: call(() => getMe()) });

export const providers = () => ({ queryKey: ["providers"], queryFn: call(() => getProviders()) });
