/* eslint-disable @typescript-eslint/no-unused-vars */
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

import { db } from '$lib/server/db'
import { userTable } from '$lib/server/db/schema'
import { count, like, asc, desc } from 'drizzle-orm'

import { withOrderBy, withPagination, withSearch } from '$lib/server/db/utils'
import { QueryBuilder, getTableConfig } from 'drizzle-orm/sqlite-core'

export const POST: RequestHandler = async ({ url }) => {
  const pageNumber = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 10
  const sort = url.searchParams.get('sort') ?? null
  const order = url.searchParams.get('order') ?? null
  const search = url.searchParams.get('q') ?? null

  console.log(pageNumber, limit, sort, order, search)

  const query = db.select().from(userTable)
  let dynamicQuery = query.$dynamic()

  if (sort && order) {
    dynamicQuery = withOrderBy(dynamicQuery, userTable, sort, order)
  }

  if (search) {
    dynamicQuery = withSearch(dynamicQuery, userTable, search, 'username')
  }

  const [users, total] = await Promise.all([
    // await db.select().from(userTable),
    await withPagination(dynamicQuery, pageNumber, limit),
    await db.select({ count: count() }).from(userTable),
  ])

  return json({
    rows: users,
    total: total[0].count,
  })
}