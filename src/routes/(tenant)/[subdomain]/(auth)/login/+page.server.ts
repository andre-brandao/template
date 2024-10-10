// import { lucia } from '$lib/server/auth'
import { error, fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/tenant/controller'
// import { emailTemplate, sendMail } from '$lib/server/email'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  login: async ({ request, url, locals }) => {
    const { tenantDb } = locals

    if (!tenantDb) {
      return error(404, 'Tenant not found')
    }

    const formData = await request.formData()

    const email = formData.get('email')

    const { error: err } = await user(tenantDb).auth.login.magicLink.send({
      email,
      url,
    })

    if (err) {
      return fail(404, {
        success: false,
        message: err.message,
      })
    }

    return {
      success: true,
      message: 'Magic link sent, Check your email',
    }
  },
  logout: async ({ locals, cookies }) => {
    console.log('logout')

    const { session, lucia } = locals
    if (!lucia) {
      return redirect(302, '/no-lucia')
    }

    if (!session) {
      return redirect(302, '/login')
    }
    await lucia.invalidateSession(session.id)
    const sessionCookie = lucia.createBlankSessionCookie()
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })

    return redirect(302, '/login')
  },
}
