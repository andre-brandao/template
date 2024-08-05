import type { LayoutServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const { session, user } = locals
  return { session, user, url: url.pathname }
}) satisfies LayoutServerLoad
