import type { PageServerLoad } from './$types'

import { product } from '$db/tenant/controller'
import { error } from '@sveltejs/kit'

export const load = (async ({ params, locals }) => {
  const { tenantDb } = locals

  if (!tenantDb) {
    return error(404, 'Tenant not found')
  }

  const id = Number(params.id)
  const produto = await product(tenantDb).getProductByID(id)
  console.log(produto)

  if (!produto) {
    error(404, 'Produto não encontrado')
  }
  return { produto }
}) satisfies PageServerLoad
