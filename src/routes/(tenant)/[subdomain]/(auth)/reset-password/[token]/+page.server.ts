import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

import { sha256 } from 'oslo/crypto'
import { encodeHex } from 'oslo/encoding'

import { user } from '$db/tenant/controller'

export const load = (async ({ params, setHeaders, locals }) => {
  const { tenantDb } = locals

  if (!tenantDb) {
    return error(404, 'Tenant not found')
  }

  const verificationToken = params.token
  console.log(verificationToken)

  setHeaders({
    'Referrer-Policy': 'strict-origin',
  })

  const tokenHash = encodeHex(
    await sha256(new TextEncoder().encode(verificationToken)),
  )

  const [token] = await user(tenantDb).passwordRecovery.getToken(tokenHash)

  const [resetUser] = await user(tenantDb).getById(token.userId)

  return {
    email: resetUser.email,
    username: resetUser.username,
  }
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async event => {
    const { request, params, setHeaders, locals } = event

    const { tenantDb, lucia } = locals

    if (!tenantDb || !lucia) {
      return error(404, 'Tenant not found')
    }

    const formData = await request.formData()
    const password = formData.get('password')

    setHeaders({
      'Referrer-Policy': 'strict-origin',
    })
    console.log(formData)

    const verificationToken = params.token

    const { data, error: err } = await user(
      tenantDb,
    ).passwordRecovery.alterPassword(password, verificationToken)

    if (err) {
      return fail(400, {
        message: err.message,
      })
    }

    const userId = data.userId
    await lucia.invalidateUserSessions(userId)

    const token = lucia?.generateSessionToken()
    const session = await lucia.createSession(token, userId)
    lucia.setSessionTokenCookie(event, token, session.expiresAt)


    return redirect(302, '/myprofile')
  },
}
