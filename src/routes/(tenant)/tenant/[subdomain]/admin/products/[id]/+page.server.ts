import type { PageServerLoad } from './$types'

import { product } from '$db/controller'
import { error } from '@sveltejs/kit'

export const load = (async ({ params }) => {
  const id = Number(params.id)

  const prod = await product.getProductByID(id)
  console.log(prod)

  if (!prod) {
    error(404, 'Product not found')
  }

  return {
    prod,
  }
}) satisfies PageServerLoad
