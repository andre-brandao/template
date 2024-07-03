import type { PageServerLoad } from './$types'

import { getProductsByCategory } from '$queries'

export const load = (async () => {
  const products = await getProductsByCategory()
  return { products }
}) satisfies PageServerLoad
