import { i18n } from '$lib/i18n'
import { lucia } from '$lib/server/auth'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const handleSession: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName)
  if (!sessionId) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } = await lucia.validateSession(sessionId)
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id)
    // sveltekit types deviates from the de-facto standard
    // you can use 'as any' too
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })
  }
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie()
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })
  }
  event.locals.user = user
  event.locals.session = session
  return resolve(event)
}

import { createContext } from '$trpc/context'
import { router } from '$trpc/router'
import { createTRPCHandle } from 'trpc-sveltekit'

const handleTRPC = createTRPCHandle({
  router,
  createContext,
  onError: ({ type, path, error }) =>
    console.error(
      `Encountered error while trying to process ${type} @ ${path}:`,
      error,
    ),
})

export const handle: Handle = sequence(i18n.handle(), handleSession, handleTRPC)
