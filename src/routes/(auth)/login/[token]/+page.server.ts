import type { PageServerLoad } from './$types'
import {
  createSession,
  setSessionTokenCookie,
  invalidateUserSessions,
  generateSessionToken,
} from '$lib/server/auth'
import { user } from '$db/controller'
import { error, redirect } from '@sveltejs/kit'

export const load = (async event => {
  const { params, setHeaders } = event
  const verificationToken = params.token

  setHeaders({
    'Referrer-Policy': 'strict-origin',
  })

  const { data, error: err } =
    await user.auth.login.magicLink.validate(verificationToken)

  if (err) {
    return error(400, {
      message: err.message,
    })
  }

  const verifiedUser = data.user

  try {
    await invalidateUserSessions(verifiedUser.id)

    await user.update(verifiedUser.id, {
      emailVerified: true,
    })

    const token = generateSessionToken()
    const session = await createSession(token, verifiedUser.id)
    setSessionTokenCookie(event, token, session.expiresAt)
  } catch (e) {
    console.error(e)
    return error(500, {
      message: 'Failed to verify email',
    })
  }



  return redirect(302, '/')
}) satisfies PageServerLoad
