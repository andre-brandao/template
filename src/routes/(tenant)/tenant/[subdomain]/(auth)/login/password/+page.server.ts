import { error, fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/tenant/controller'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  default: async ({ locals, request, cookies }) => {
    const { lucia, tenantDb } = locals

    if (!tenantDb || !lucia) {
      return error(404, 'Tenant not found')
    }

    const formData = await request.formData()
    // const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')

    const { data, error: err } = await user(tenantDb).auth.login.password(
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

    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })

    if (!existingUser.emailVerified) {
      return redirect(302, '/verify-email')
    }

    return redirect(302, '/')
  },
}
