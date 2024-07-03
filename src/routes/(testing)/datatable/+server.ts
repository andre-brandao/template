import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

import { productTable } from '$lib/server/db/schema'

import {
  withOrderBy,
  withPagination,
  withSearch,
  getRowCount,
} from '$lib/server/db/utils'

import { getDataTableState } from '$utils/datatable'

import { product } from '$db/controller'

export const POST: RequestHandler = async ({ url }) => {
  const { pageNumber, limit, sort, order, search } = getDataTableState(url)

  let query = product.getProducts().$dynamic()

  if (sort && order) {
    query = withOrderBy(query, productTable, sort, order)
  }

  if (search) {
    query = withSearch(query, productTable, search, 'name')
  }

  const [products, total] = await Promise.all([
    await withPagination(query, pageNumber, limit),
    await getRowCount(productTable),
  ])

  return json({
    rows: products,
    total: total[0].count,
  })
}
