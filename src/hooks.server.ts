// HOOKS
import { i18n } from '$lib/i18n/i18n'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
// TRPC
import { createContext } from '$trpc/context'
import { router } from '$trpc/router'
import { createTRPCHandle } from 'trpc-sveltekit'
// AUTH
import { setSessionTokenCookie } from '$lib/server/auth/cookies'
import { deleteSessionTokenCookie } from '$lib/server/auth/cookies'
// DB CONTROLLERS
import { sessionsC } from '$lib/server/auth/sessions'

const handleSession: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session') ?? null
  if (token === null) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } = await sessionsC.validateSessionToken(token)

  if (session !== null) {
    setSessionTokenCookie(event, token, session.expiresAt)
  } else {
    deleteSessionTokenCookie(event)
  }

  event.locals.user = user
  event.locals.session = session
  return resolve(event)
}

const handleTRPC = createTRPCHandle({
  router,
  createContext,
  onError: ({ error, type, path, input, ctx, req }) => {
    console.error(
      `Encountered error while trying to process ${type} @ ${path}:`,
      error,
    )
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      // TODO: send to bug reporting
      const userId = ctx?.locals.user?.id
      console.log('userId', userId)
      console.log('input', input)
      console.log('req', req)
    }
  },
})

export const handle: Handle = sequence(i18n.handle(), handleSession, handleTRPC)
