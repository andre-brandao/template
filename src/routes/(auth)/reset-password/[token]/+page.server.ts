import { fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

import { sha256 } from 'oslo/crypto'
import { encodeHex } from 'oslo/encoding'

import { user } from '$db/controller'
import {
  invalidateUserSessions,
  createSession,
  setSessionTokenCookie,
  generateSessionToken,
} from '$lib/server/auth'

export const load = (async ({ params, setHeaders }) => {
  const verificationToken = params.token
  console.log(verificationToken)

  setHeaders({
    'Referrer-Policy': 'strict-origin',
  })

  const tokenHash = encodeHex(
    await sha256(new TextEncoder().encode(verificationToken)),
  )

  const [token] = await user.passwordRecovery.getToken(tokenHash)

  const [resetUser] = await user.getById(token.userId)

  return {
    email: resetUser.email,
    username: resetUser.username,
  }
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async event => {
    const { request, params, setHeaders } = event
    const formData = await request.formData()
    const password = formData.get('password')

    setHeaders({
      'Referrer-Policy': 'strict-origin',
    })
    console.log(formData)

    const verificationToken = params.token

    const { data, error } = await user.passwordRecovery.alterPassword(
      password,
      verificationToken,
    )

    if (error) {
      return fail(400, {
        message: error.message,
      })
    }

    const userId = data.userId

    await invalidateUserSessions(userId)
    const token = generateSessionToken()
    const session = await createSession(token, userId)
    setSessionTokenCookie(event, token, session.expiresAt)
    
    return redirect(302, '/myprofile')
  },
}
