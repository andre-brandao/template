// import { lucia } from '$lib/server/auth'
import { fail, redirect } from '@sveltejs/kit'
// import { verify } from '@node-rs/argon2'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/controller'
// import { emailTemplate, sendMail } from '$lib/server/email'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData()

    const email = formData.get('email')

    const { error } = await user.auth.login.magicLink.send({
      email,
      url,
    })

    if (error) {
      return fail(404, {
        success: false,
        message: error.message,
      })
    }

    return {
      message: 'Magic link sent, Check your email',
      success: true,
    }
  },
}
