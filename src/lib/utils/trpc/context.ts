// lib/trpc/context.ts
import type { RequestEvent } from '@sveltejs/kit'
import { TRPCError, type inferAsyncReturnType } from '@trpc/server'

export async function createContext(event: RequestEvent) {
  // const { user, session } = event.locals

  const tenantDb = event.locals.tenantDb
  const tenantInfo = event.locals.tenantInfo

  const lucia = event.locals.lucia

  if(!tenantDb || !tenantInfo || !lucia) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Tenant not found',
    })
  }

  return { ...event, tenantDb, tenantInfo, lucia }
}

export type Context = inferAsyncReturnType<typeof createContext>
