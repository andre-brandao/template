import type { PageServerLoad, Actions } from './$types'
import { user as userC } from '$lib/server/db/tenant/user/controller'
import { error, fail, redirect } from '@sveltejs/kit'
export const load = (async ({ locals }) => {
  const user = locals.user

  if (!user) {
    return redirect(301, '/login')
  }

  return {
    user,
  }
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const {user, tenantDb} = locals

    if (!tenantDb) {
      return error(404, 'Tenant not found')
    }

    const redirectPath = url.searchParams.get('redirect')

    if (!user) {
      return redirect(301, '/login' + (redirectPath ?? ''))
    }

    const formData = await request.formData()
    const name = formData.get('name') as string

    if (!name) {
      return fail(504, {
        message: 'Name is required',
        success: false,
      })
    }

    await userC(tenantDb).update(user.id, {
      name: name,
    })

    if (redirectPath) {
      return redirect(301, redirectPath)
    }

    return {
      success: true,
      message: 'Name updated',
    }
  },
}
