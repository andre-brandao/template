import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { emailTemplate, sendMail } from '$lib/server/services/email'

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
    const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')

    const { data, error: err } = await userC(
      tenantDb,
    ).auth.register.withPassword(username, email, password)

    if (err) {
      return fail(400, {
        success: false,
        message: err.message,
        username,
        email,
      })
    }

    const userId = data.user.id
    const ueserEmail = data.user.email

    const token = lucia.generateSessionToken()
    const session = await lucia.createSession(token, userId)
    setSessionTokenCookie(event, token, session.expiresAt)

    const verificationCode = await userC(tenantDb).verificationCode.generate(
      userId,
      ueserEmail,
    )

    await sendMail(ueserEmail, emailTemplate.verificationCode(verificationCode))

    return redirect(302, '/verify-email')
  },
}