import type { PageServerLoad } from './$types'
import { user } from '$drizzle/controller'
export const load = (async ({ url }) => {
  const page = url.searchParams.get('page') || 1
  console.log('page', page)

  const rows = await user.getPublicInfo()

  return { rows, count: 10 }
}) satisfies PageServerLoad
