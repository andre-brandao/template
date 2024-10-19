import type { PageServerLoad } from './$types'

import { userC } from '$db/tenant/controller'
import { error, redirect } from '@sveltejs/kit'
import { setSessionTokenCookie } from '$lib/server/auth/cookies'

export const load = (async event => {
  const { locals, params, setHeaders } = event
  const { tenantAuthManager: lucia, tenantDb } = locals

  if (!tenantDb || !lucia) {
    return error(404, 'Tenant not found')
  }

  const verificationToken = params.token
  setHeaders({
    'Referrer-Policy': 'strict-origin',
  })
  const { data, error: err } =
    await userC(tenantDb).auth.login.magicLink.validate(verificationToken)

  if (err) {
    return error(400, {
      message: err.message,
    })
  }

  const verifiedUser = data.user

  try {
    await lucia.invalidateUserSessions(verifiedUser.id)

    await userC(tenantDb).update(verifiedUser.id, {
      emailVerified: true,
    })
    const token = lucia.generateSessionToken()
    const session = await lucia.createSession(token, verifiedUser.id)
    setSessionTokenCookie(event, token, session.expiresAt)
  } catch (e) {
    console.error(e)
    return error(500, {
      message: 'Failed to verify email',
    })
  }

  if (!verifiedUser.password_hash) {
    return redirect(302, '/onboarding')
  }

  return redirect(302, '/')
}) satisfies PageServerLoad