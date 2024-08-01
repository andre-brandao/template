import { fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

import { isWithinExpirationDate } from 'oslo'
import { hash } from '@node-rs/argon2'
import { sha256 } from 'oslo/crypto'
import { encodeHex } from 'oslo/encoding'

import { user } from '$db/controller'
import { lucia } from '$lib/server/auth'

export const load = (async ({ params, setHeaders }) => {
  const verificationToken = params.token
  console.log(verificationToken)

  setHeaders({
    'Referrer-Policy': 'strict-origin',
  })

  const tokenHash = encodeHex(
    await sha256(new TextEncoder().encode(verificationToken)),
  )

  const [token] = await user.getPasswordResetToken(tokenHash)

  const [resetUser] = await user.getUserById(token.userId)

  return {
    email: resetUser.email,
    username: resetUser.username,
  }
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async ({ request, params, cookies, setHeaders }) => {
    const formData = await request.formData()
    const password = formData.get('password')

    setHeaders({
      'Referrer-Policy': 'strict-origin',
    })
    console.log(formData)

    if (
      typeof password !== 'string' ||
      password.length < 6 ||
      password.length > 255
    ) {
      return fail(400, {
        message: 'Invalid password',
      })
    }

    const verificationToken = params.token

    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(verificationToken)),
    )
    // const token = await db
    //   .table('password_reset_token')
    //   .where('token_hash', '=', tokenHash)
    //   .get()

    const [token] = await user.getPasswordResetToken(tokenHash)

    if (token) {
      // await db
      //   .table('password_reset_token')
      //   .where('token_hash', '=', tokenHash)
      //   .delete()
      await user.deletePasswordResetToken(tokenHash)
    }

    if (!token || !isWithinExpirationDate(token.expiresAt)) {
      return fail(400, {
        message: 'Invalid or expired token',
      })
    }

    await lucia.invalidateUserSessions(token.userId)
    const passwordHash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })
    // await db.table('user').where('id', '=', token.user).update({
    //   password_hash: passwordHash,
    // })
    await user.updateUser(token.userId, {
      password_hash: passwordHash,
    })

    const session = await lucia.createSession(token.userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })

    return redirect(302, '/myprofile')
  },
}
