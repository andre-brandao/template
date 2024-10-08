import type { PageServerLoad, Actions } from './$types'
import { user as userC } from '$db/user/controller'
import { fail, redirect } from '@sveltejs/kit'
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
    const user = locals.user

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

     await userC.update(user.id, {
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
