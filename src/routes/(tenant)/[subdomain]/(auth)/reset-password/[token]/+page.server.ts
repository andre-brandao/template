import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

import { sha256 } from 'oslo/crypto'
import { encodeHex } from 'oslo/encoding'

import { userC } from '$db/tenant/controller'
import { setSessionTokenCookie } from '$lib/server/auth/cookies'

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

  const [token] = await userC(tenantDb).passwordRecovery.getToken(tokenHash)

  const [resetUser] = await userC(tenantDb).getById(token.userId)

  return {
    email: resetUser.email,
    username: resetUser.username,
  }
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async event => {
    const { request, params, setHeaders, locals } = event

    const { tenantDb, tenantAuthManager } = locals

    if (!tenantDb || !tenantAuthManager) {
      return error(404, 'Tenant not found')
    }

    const formData = await request.formData()
    const password = formData.get('password')

    setHeaders({
      'Referrer-Policy': 'strict-origin',
    })
    console.log(formData)

    const verificationToken = params.token

    const { data, error: err } = await userC(
      tenantDb,
    ).passwordRecovery.alterPassword(password, verificationToken)

    if (err) {
      return fail(400, {
        message: err.message,
      })
    }

    const userId = data.userId
    await tenantAuthManager.invalidateUserSessions(userId)

    const token = tenantAuthManager?.generateSessionToken()
    const session = await tenantAuthManager.createSession(token, userId)
    setSessionTokenCookie(event, token, session.expiresAt)

    return redirect(302, '/myprofile')
  },
}
