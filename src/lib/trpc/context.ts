// lib/trpc/context.ts
import type { RequestEvent } from '@sveltejs/kit'
import type { inferAsyncReturnType } from '@trpc/server'



export async function createContext(event: RequestEvent) {
  const { user, session } = event.locals
  return {
    event,
    user,
    session,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
