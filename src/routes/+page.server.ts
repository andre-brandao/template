import { sessionsC } from '$lib/server/auth/sessions'
import { deleteSessionTokenCookie } from '$lib/server/auth/cookies'

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
    sessionsC.invalidateSession(event.locals.session.id)
    deleteSessionTokenCookie(event)

    return redirect(302, '/login')
  },
}
