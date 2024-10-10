import type { PageServerLoad } from './$types'

import { product } from '$db/tenant/controller'
import { error } from '@sveltejs/kit'

export const load = (async ({ locals }) => {
  if (!locals.tenantDb) {
    return error(404, 'Tenant not found')
  }

  const products = await product(locals.tenantDb).queryCategorysWithProducts()

  return { products }
}) satisfies PageServerLoad
