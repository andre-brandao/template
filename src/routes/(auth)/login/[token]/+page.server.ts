import type { PageServerLoad } from './$types'
import { lucia } from '$lib/server/auth'
import { user as userController } from '$db/controller'
import { isWithinExpirationDate } from 'oslo'
import { error, redirect } from '@sveltejs/kit'

export const load = (async ({ params, cookies, setHeaders }) => {
  const verificationToken = params.token

  setHeaders({
    'Referrer-Policy': 'strict-origin',
  })

  const [token] = await userController.getMagicLinkToken(verificationToken)
  if (token) {
    await userController.deleteMagicLinkToken(verificationToken)
  }

  if (!token || !isWithinExpirationDate(token.expiresAt)) {
    return error(400, {
      message: 'Invalid or expired token',
    })
  }
  const [user] = await userController.getUserById(token.userId)
  if (!user || user.email !== token.email) {
    return error(400, {
      message: 'Invalid or expired token',
    })
  }
  await lucia.invalidateUserSessions(user.id)

  await userController.updateUser(user.id, {
    emailVerified: true,
  })

  const session = await lucia.createSession(user.id, {})
  const sessionCookie = lucia.createSessionCookie(session.id)
  cookies.set(sessionCookie.name, sessionCookie.value, {
    path: '.',
    ...sessionCookie.attributes,
  })

  return redirect(302, '/')
}) satisfies PageServerLoad
