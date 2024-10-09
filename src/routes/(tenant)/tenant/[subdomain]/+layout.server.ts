import type { LayoutServerLoad } from './$types'

export const load = (async ({ locals }) => {
  return { tenantInfo: locals.tenantInfo! }
}) satisfies LayoutServerLoad
