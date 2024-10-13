import type { PageServerLoad } from './$types'

import { productC } from '$db/tenant/controller'
import { error } from '@sveltejs/kit'
export const load = (async ({ locals }) => {
  const { tenantDb } = locals
  if (!tenantDb) {
    return error(404, 'Tenant not found')
  }

  const products = await productC(tenantDb).queryCategorysWithProducts()
  console.log(products)

  return { products }
}) satisfies PageServerLoad
