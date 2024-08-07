import type { LayoutServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const { session, user } = locals
  return { session, user, transition_key: url.pathname }
}) satisfies LayoutServerLoad
