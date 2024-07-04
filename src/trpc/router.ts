// lib/trpc/router.ts

import { t, publicProcedure } from './t'

// import { pagarme } from './routes/pagarme'

import { z } from 'zod'
import { auth } from './routes/auth'

import { bugReport } from '$lib/server/db/controller'

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
      }),
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx.locals
      if (!user) {
        return { error: 'You must be logged in to report a bug' }
      }

      await bugReport.insertBugReport({
        text: input.text,
        created_by: user.id,
      })
      return {
        data: 'Bug reported',
      }
    }),

  updateBugStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
      }),
    )
    .query(async ({ input }) => {
      await bugReport.updateBugReportStatus(input.id, input.status)
      return {
        data: 'Bug status updated',
      }
    }),
  // pagarme,
  auth,
})

export type Router = typeof router
