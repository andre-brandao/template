import type { PageServerLoad } from './$types'

import { productC } from '$db/tenant/controller'
import { error } from '@sveltejs/kit'

export const load = (async ({ params, locals }) => {
  const id = Number(params.id)
  const { tenantDb } = locals

  if (!tenantDb) {
    error(404, 'Tenant not found')
  }

  const prod = await productC(tenantDb).getProductByID(id)
  console.log(prod)

  if (!prod) {
    error(404, 'Product not found')
  }

  return {
    prod,
  }
}) satisfies PageServerLoad
