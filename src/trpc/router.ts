// lib/trpc/router.ts

import { t, publicProcedure } from './t'

import { pagarme } from './routes/pagarme'

import { z } from 'zod'
import { auth } from './routes/auth'

export const router = t.router({
  greeting: publicProcedure.query(async opts => {
    const { user } = opts.ctx
    return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}  ${user?.username ?? 'guest'}`
  }),

  greetPerson: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { user } = ctx
      return `Hello ${input}! ${user?.username ?? 'guest'}`
    }),
  pagarme,
  auth,
})

export type Router = typeof router
