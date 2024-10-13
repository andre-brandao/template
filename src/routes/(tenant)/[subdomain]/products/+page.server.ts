import type { PageServerLoad } from './$types'

import { productC } from '$db/tenant/controller'
import { error } from '@sveltejs/kit'

export const load = (async ({ locals, url }) => {
  console.log(locals)
  if (!locals.tenantDb) {
    return error(404, 'Tenant not found' + url)
  }

  const products = await productC(locals.tenantDb).queryCategorysWithProducts()

  return { products }
}) satisfies PageServerLoad
