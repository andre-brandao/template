// lib/trpc/router.ts

import { t, publicProcedure } from './t'

import { z } from 'zod'
import { bugReport } from '$lib/server/db/controller'
import { TRPCError } from '@trpc/server'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { middleware } from './middleware'

// ROUTES
import { auth } from './routes/auth'
import { product } from './routes/product'
import { pushNotification } from './routes/push-notification'
import { customer } from './routes/customer'
import { stock } from './routes/stock'

export const router = t.router({
  reportBug: publicProcedure
    .input(
      z.object({
        text: z.string(),
        metadata: z.any(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx.locals
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to report a bug',
        })
      }
      try {
        const [{ id }] = await bugReport.insertBugReport({
          text: input.text,
          created_by: user.id,
          metadata: input.metadata,
          status: 'TODO',
        })

        return 'Bug reported #' + id
      } catch (e) {
        console.error(e)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error reporting bug',
        })
      }
    }),

  updateBugStatus: publicProcedure
    .use(middleware.admin)
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
      }),
    )
    .query(async ({ input }) => {
      try {
        await bugReport.updateBugReportStatus(input.id, input.status)

        return `Bug #${input.id} status updated to ${input.status}`
      } catch (error) {
        console.error(error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating bug status',
        })
      }
    }),

  auth,
  product,
  customer,
  pushNotification,
  stock,
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
