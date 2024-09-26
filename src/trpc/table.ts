// lib/trpc/router.ts

import { z } from 'zod'
import { publicProcedure, t } from './t'

import { TRPCError } from '@trpc/server'
import { userTable } from '$drizzle/schema'
import { db } from '$drizzle/client.server'

const tableMap = {
  user: userTable,
}
export const drizzleTable = t.router({
  getData: publicProcedure
    .input(
      z.object({
        table_name: z.enum(['user']),
      }),
    )
    .query(async ({ input }) => {
      const { table_name } = input
      const table = tableMap[table_name]

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Table ${table_name} not found`,
        })
      }

      return await db.select().from(table)
    }),
})
