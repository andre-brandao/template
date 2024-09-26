import type { PageServerLoad } from './$types'

import { product } from '$drizzle/controller'
export const load = (async () => {
  const products = await product.queryCategorysWithProducts()
  console.log(products)

  return { products }
}) satisfies PageServerLoad
