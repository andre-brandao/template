import { t } from '$trpc/t'
import { TRPCError } from '@trpc/server'

export const auth = t.middleware(async ({ next, ctx }) => {
  const { user } = ctx.locals
  if (!user?.permissions.isAdmin) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next()
})
