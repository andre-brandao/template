// lib/trpc/router.ts

import { t } from './t'

import { z } from 'zod'

export const router = t.router({
  greeting: t.procedure.query(async opts => {
    const { user } = opts.ctx
    return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}  ${user?.username ?? 'guest'}`
  }),

  greetPerson: t.procedure.input(z.string()).query(async opts => {
    const { user } = opts.ctx
    const input = opts.input
    return `Hello ${input}! ${user?.username ?? 'guest'}`
  }),
})

export type Router = typeof router
