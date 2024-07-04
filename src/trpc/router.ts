// lib/trpc/router.ts

import { t, publicProcedure } from './t'

// import { pagarme } from './routes/pagarme'

import { z } from 'zod'
import { auth } from './routes/auth'

import { bugReport } from '$lib/server/db/controller'
import { TRPCError } from '@trpc/server'

import { middleware } from './middleware'
export const router = t.router({
  // greeting: publicProcedure.query(async opts => {
  //   const { user } = opts.ctx
  //   return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}  ${user?.username ?? 'guest'}`
  // }),

  // greetPerson: publicProcedure
  //   .input(z.string())
  //   .query(async ({ ctx, input }) => {
  //     const { user } = ctx
  //     return `Hello ${input}! ${user?.username ?? 'guest'}`
  //   }),

  reportBug: publicProcedure
    .input(
      z.object({
        text: z.string(),
        page_data: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx.locals
      if (!user) {
        return {
          error: 'You must be logged in to report a bug',
        }
      }
      try {
        const [id] = await bugReport.insertBugReport({
          text: input.text,
          created_by: user.id,
          page_data: input.page_data,
        })

        return { data: 'Bug reported #' + id }
      } catch (e) {
        console.error(e)
        return { error: 'Error reporting bug' }
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
  // pagarme,
  auth,
})

export type Router = typeof router
