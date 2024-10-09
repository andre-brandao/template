/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageServerLoad } from './$types'

import { userTable } from '$db/tenant/schema'
import {
  withPagination,
  withOrderBy,
  getSQLiteColumn,
  getOrderBy,
} from '$db/utils'
import { and, eq, getTableColumns, SQL, count, like } from 'drizzle-orm'
import { error } from '@sveltejs/kit'

export const load = (async ({ url, locals }) => {
  const { searchParams } = url
  const db = locals.tenantDb

  if (!db) {
    return error(404, 'Tenant not found')
  }

  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = Number(searchParams.get('pageSize') ?? 10)

  const username = searchParams.get('username')
  const email = searchParams.get('email')

  const sortId = searchParams.get('sort_id')
  const sortOrder = searchParams.get('sort_order')

  let query = db
    .select()
    .from(userTable)
    .where(
      and(
        username ? like(userTable.username, `%${username}%`) : undefined,
        email ? like(userTable.email, `%${email}%`) : undefined,
      ),
    )
    .$dynamic()

  if (sortId && sortOrder) {
    query = withOrderBy(query, getSQLiteColumn(userTable, sortId), sortOrder)
  }

  try {
    const rows = await withPagination(query, page, pageSize)

    const total = await db.select({ count: count() }).from(userTable)

    return { rows: rows ?? [], count: total[0].count }
  } catch (error) {
    console.error(error)
    return { rows: [], count: 0 }
  }
}) satisfies PageServerLoad
