import { sessionsC } from '$lib/server/auth/sessions'
import { setSessionTokenCookie } from '$lib/server/auth/cookies'
import { fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/controller'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  default: async event => {
    const formData = await event.request.formData()
    // const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')

    const { data, error } = await user.auth.login.password(email, password)

    if (error) {
      return fail(404, {
        succes: false,
        message: error.message,
      })
    }
    const existingUser = data.user

    const token = sessionsC.generateSessionToken()
    const session = await sessionsC.createSession(token, existingUser.id)
    setSessionTokenCookie(event, token, session.expiresAt)
    if (!existingUser.emailVerified) {
      return redirect(302, '/verify-email')
    }

    return redirect(302, '/')
  },
}
