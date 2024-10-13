import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

import { userC as userController } from '$db/tenant/controller'

export const load = (async ({ locals, getClientAddress, platform }) => {
  const { user, session, tenantDb } = locals

  if (!user || !session || !tenantDb) {
    return redirect(302, '/login')
  }

  console.log('ip', getClientAddress())
  console.log('platform', platform)

  const user_sessions = await userController(tenantDb).getSessions(user.id)
  return { user_sessions }
}) satisfies PageServerLoad
