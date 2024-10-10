import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { emailTemplate, sendMail } from '$lib/server/services/email'

import { user } from '$db/tenant/controller'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  default: async ({locals, request, cookies}) => {

    const {lucia, tenantDb} = locals

    if (!tenantDb || !lucia) {
      return error(404, 'Tenant not found')
    }


    const formData = await request.formData()
    const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')

    const { data, error:err } = await user(tenantDb).auth.register.withPassword(
      username,
      email,
      password,
    )

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

    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })

    const verificationCode = await user(tenantDb).verificationCode.generate(
      userId,
      ueserEmail,
    )

    await sendMail(ueserEmail, emailTemplate.verificationCode(verificationCode))

    return redirect(302, '/verify-email')
  },
}
