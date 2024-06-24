import type { LayoutServerLoad } from './$types'

export const load = (async ({ locals }) => {
  const { session, user } = locals
  return { session, user }
}) satisfies LayoutServerLoad
