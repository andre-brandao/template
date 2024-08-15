/* eslint-disable @typescript-eslint/no-unused-vars */
import { publicProcedure, router } from '../t'

import { z } from 'zod'
import { bugReport } from '$lib/server/db/controller'
import { TRPCError } from '@trpc/server'
import { middleware } from '../middleware'
import { paramsSchema } from '$lib/components/table'
import { tableHelper } from '$lib/server/db/utils'
import { bugReportTable } from '$lib/server/db/schema'

export const bugReporter = router({
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

        await bugReport.insertLogs({
          text: `${user.username} reportou um bug`,
          created_by:user.id,
          metadata: {
            bug_id: id
          }
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

  paginatedLogs: publicProcedure
    .input(paramsSchema)
    .query(async ({ input }) => {
      return await tableHelper(
        bugReport.allLogs().$dynamic(),
        bugReportTable,
        'text',
        input,
      )
    }),
})