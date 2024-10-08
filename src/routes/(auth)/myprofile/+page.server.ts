import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

import { user as userController } from '$drizzle/controller'

export const load = (async ({ locals, getClientAddress, platform }) => {
  const { user, session } = locals

  if (!user || !session) {
    return redirect(302, '/login')
  }

  console.log('ip', getClientAddress())
  console.log('platform', platform)

  const user_sessions = await userController.getSessions(user.id)
  return { user_sessions }
}) satisfies PageServerLoad
