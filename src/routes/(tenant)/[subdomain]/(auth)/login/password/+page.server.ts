import { error, fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { userC } from '$db/tenant/controller'
import { setSessionTokenCookie } from '$lib/server/auth/cookies'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  default: async event => {
    const { locals, request } = event
    const { tenantAuthManager: lucia, tenantDb } = locals

    if (!tenantDb || !lucia) {
      return error(404, 'Tenant not found')
    }

    const formData = await request.formData()
    // const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')

    const { data, error: err } = await userC(tenantDb).auth.login.password(
      email,
      password,
    )

    if (err) {
      return fail(404, {
        succes: false,
        message: err.message,
      })
    }
    const existingUser = data.user

    const token = lucia.generateSessionToken()
    const session = await lucia.createSession(token, existingUser.id)
    setSessionTokenCookie(event, token, session.expiresAt)

    if (!existingUser.emailVerified) {
      return redirect(302, '/verify-email')
    }

    return redirect(302, '/')
  },
}
