import { lucia } from '$lib/server/auth'
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

    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })

    if (!existingUser.emailVerified) {
      return redirect(302, '/verify-email')
    }

    return redirect(302, '/')
  },
}
