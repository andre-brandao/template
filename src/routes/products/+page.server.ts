import type { PageServerLoad } from './$types'

import { product } from '$drizzle/controller'

export const load = (async () => {
  const products = await product.queryCategorysWithProducts()

  return { products }
}) satisfies PageServerLoad
