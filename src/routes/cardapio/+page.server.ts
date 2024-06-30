import type { PageServerLoad } from './$types'

import { db } from '$lib/server/db'
import {
  productCategoryTable,
  productTable,
  type SelectProduct,
  type SelectProductCategory,
} from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export const load = (async () => {
  const rows = await db
    .select()
    .from(productCategoryTable)
    .leftJoin(
      productTable,
      eq(productCategoryTable.id, productTable.category_id),
    )
    .all()

  const products = rows.reduce<Record<string, SelectProduct[]>>((acc, row) => {
    const category = row.product_category
    const product = row.product

    if (!acc[category.name]) {
      acc[category.name] = []
    }

    if (product) {
      acc[category.name].push(product)
    }
    return acc
  }, {})

  return { products }
}) satisfies PageServerLoad
