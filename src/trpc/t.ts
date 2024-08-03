import type { Context } from '$trpc/context'
import { initTRPC } from '@trpc/server'
// import transformer from 'trpc-transformer';

export const t = initTRPC
  .context<Context>()
  .create
  // { transformer }
  ()

export const router = t.router
export const publicProcedure = t.procedure
