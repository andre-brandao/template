import type { PageServerLoad } from './$types'
import { lucia } from '$lib/server/auth'
import { user } from '$drizzle/controller'
import { error, redirect } from '@sveltejs/kit'

export const load = (async ({ params, cookies, setHeaders }) => {
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
    await lucia.invalidateUserSessions(verifiedUser.id)

    await user.update(verifiedUser.id, {
      emailVerified: true,
    })

    const session = await lucia.createSession(verifiedUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })
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
