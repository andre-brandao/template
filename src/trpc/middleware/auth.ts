import { t } from '$trpc/t'
import { TRPCError } from '@trpc/server'

export const auth = t.middleware(async ({ next, ctx }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next()
})
