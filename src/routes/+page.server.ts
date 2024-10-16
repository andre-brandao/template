import { lucia } from '$lib/server/auth/sessions'
import { fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

export const load = (async () => {
  return {}
}) satisfies PageServerLoad

export const actions: Actions = {
  signout: async event => {
    if (!event.locals.session) {
      return fail(401)
    }
    await lucia.invalidateSession(event.locals.session.id)
    const sessionCookie = lucia.createBlankSessionCookie()
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })
    return redirect(302, '/login')
  },
}
