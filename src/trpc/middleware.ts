import { t } from '$trpc/t'
import { TRPCError } from '@trpc/server'

const admin = t.middleware(async ({ next, ctx }) => {
  const { user } = ctx.locals
  if (!user?.permissions.isAdmin)
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be an admin to access this route',
    })
  return next()
})

const auth = t.middleware(async ({ next, ctx }) => {
  const { user } = ctx.locals
  if (!user)
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this route',
    })
  return next()
})

export const middleware = {
  admin,
  auth,
}
