import type { LayoutLoad } from './$types'

export const load = (async ({ data, url }) => {
  return {
    ...data,
    transition_key: url.pathname,
  }
}) satisfies LayoutLoad
