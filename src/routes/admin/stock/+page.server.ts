import type { PageServerLoad } from './$types'
import { product } from '$db/controller'
export const load = (async () => {
  const stock_items = await product.getProductItems()
  return { stock_items }
}) satisfies PageServerLoad
