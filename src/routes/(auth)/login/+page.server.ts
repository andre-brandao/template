// import { lucia } from '$lib/server/auth'
import { fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/controller'
import {
sessionsC,
} from '$lib/server/auth/sessions'
import { deleteSessionTokenCookie } from '$lib/server/auth/cookies'
// import { emailTemplate, sendMail } from '$lib/server/email'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  login: async ({ request, url }) => {
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
      success: true,
      message: 'Magic link sent, Check your email',
    }
  },
  logout: async event => {
    console.log('logout')

    const { session } = event.locals

    if (!session) {
      return redirect(302, '/login')
    }
    await  sessionsC.invalidateSession(session.id)
    deleteSessionTokenCookie(event)
    return redirect(302, '/login')
  },
}
