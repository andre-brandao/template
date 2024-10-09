import { i18n } from '$lib/i18n/i18n'
import { getLuciaForTenant } from '$lib/server/auth'
import { error, type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

// import { bugReport } from '$db/controller'

const handleSession: Handle = async ({ event, resolve }) => {
  /* disallow access to PUBLIC_DOMAIN/tenant, this is optional */
  const { host, pathname } = event.url
  if (host === PUBLIC_DOMAIN) {
    if (pathname.startsWith('/tenant')) {
      error(404, { message: 'Not Found' })
    } else {
      return resolve(event)
    }
  }

  /* if no database returned for given subdomain or custom domain then the tenant does not exist */
  const tenant = await getTenant(host)
  if (!tenant) {
    error(404, { message: 'Not Found' })
  }
  event.locals.tenantDb = tenant.tenantDb
  event.locals.tenantInfo = tenant.tenantInfo!

  /* authenticate users of tenants with lucia */
  const lucia = getLuciaForTenant(tenant.tenantDb)
  event.locals.lucia = lucia

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
import { PUBLIC_DOMAIN } from '$env/static/public'
import { getTenant } from '$lib/server/utils/getTenantInformation'

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
      console.error('Internal server error')
      console.error('Error:', error)
      console.error('Path:', path)
      console.error('Input:', input)
      console.error('Context:', ctx)
      console.error('Request:', req)
    }
  },
})

export const handle: Handle = sequence(i18n.handle(), handleSession, handleTRPC)
