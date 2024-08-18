import type { Router } from '$trpc/router'
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit'
import superjson from 'superjson'

let browserClient: ReturnType<typeof createTRPCClient<Router>>

export function trpc(init?: TRPCClientInit) {
  const isBrowser = typeof window !== 'undefined'
  if (isBrowser && browserClient) return browserClient
  const client = createTRPCClient<Router>({ init, transformer: superjson })
  if (isBrowser) browserClient = client
  return client
}
