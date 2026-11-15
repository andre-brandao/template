import { getUserByIdHistoryOptions, getUserByIdOptions } from "@template/sdk/query";
import type { Ctx } from "$lib/query";

export const get = (id: string, ctx?: Ctx) => getUserByIdOptions({ ...ctx, path: { id } });

export const history = (id: string, ctx?: Ctx) =>
  getUserByIdHistoryOptions({ ...ctx, path: { id } });
