// import { lucia } from '$lib/server/auth'
import { error, fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { userC } from '$db/tenant/controller'
import { deleteSessionTokenCookie } from '$lib/server/auth/cookies'
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

    const { error: err } = await userC(tenantDb).auth.login.magicLink.send({
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
  logout: async event => {
    const { locals } = event
    console.log('logout')

    const { session, tenantAuthManager: lucia } = locals
    if (!lucia) {
      return redirect(302, '/no-lucia')
    }

    if (!session) {
      return redirect(302, '/login')
    }
    await lucia.invalidateSession(session.id)
    deleteSessionTokenCookie(event)

    return redirect(302, '/login')
  },
}
