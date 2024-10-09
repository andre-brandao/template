import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals }) => {
  const { user } = locals

  if (!user) {
    return { status: 302, redirect: '/login' }
  }

  if (user.email_verified) {
    return redirect(302, '/myprofile')
  }

  return {}
}) satisfies PageServerLoad
