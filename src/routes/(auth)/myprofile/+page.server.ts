import type { Actions, PageServerLoad } from './$types'

export const load = (async () => {
  return {}
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async event => {
    const formData = await event.request.formData()
    const username = formData.get('username')
    const profile_picture = formData.get('profile_picture')

    console.log('username', username)
    console.log('profile_picture', profile_picture)

    return {}
  },
}
