import { asc, count, desc, like, type AnyColumn } from 'drizzle-orm'
import {
  SQLiteTable,
  getTableConfig,
  type SQLiteSelect,
} from 'drizzle-orm/sqlite-core'
import { db } from '.'

import type { TableState } from '$components/table'

export async function tableHelper<T extends SQLiteSelect>(
  qb: T,
  table: SQLiteTable,
  seach_column: string,
  state: TableState,
) {
  const { page = 1, pageSize = 15, sort: order, search } = state
  if (order) {
    qb = withOrderBy(qb, table, order.field, order.direction)
  }
  if (search) {
    qb = withSearch(qb, table, search, seach_column)
  }
  const [rows, total] = await Promise.all([
    await withPagination(qb, page, pageSize),
    await getRowCount(table),
  ])
  return {
    rows,
    total: total[0].count,
  }
}

export function withPagination<T extends SQLiteSelect>(
  qb: T,
  page: number = 1,
  pageSize: number = 10,
) {
  return qb.limit(pageSize).offset((page - 1) * pageSize)
}

export function getSQLiteColumn<T extends SQLiteTable>(
  table: T,
  column_name: string,
) {
  const { columns } = getTableConfig(table)
  const column = columns.find(c => c.name == column_name)
  return column
}

export function getOrderBy(order: string, column: AnyColumn) {
  return order === 'asc' ? asc(column) : desc(column)
}

export function withOrderBy<T extends SQLiteSelect>(
  qb: T,
  table: SQLiteTable,
  sort: string,
  order: string,
) {
  const column = getSQLiteColumn(table, sort)
  if (column) {
    return qb.orderBy(getOrderBy(order, column))
  }
  return qb
}

export function withSearch<T extends SQLiteSelect>(
  qb: T,
  table: SQLiteTable,
  search: string,
  seach_colum: string,
) {
  const column = getSQLiteColumn(table, seach_colum)
  if (column) {
    return qb.where(like(column, `%${search}%`))
  }
  return qb
}

export function getRowCount(table: SQLiteTable) {
  return db.select({ count: count() }).from(table)
}
