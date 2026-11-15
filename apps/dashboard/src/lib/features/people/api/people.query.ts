import { getUserByIdHistoryOptions, getUserByIdOptions } from "@template/sdk/query";

export const get = (id: string) => getUserByIdOptions({ path: { id } });

export const history = (id: string) => getUserByIdHistoryOptions({ path: { id } });
