/* eslint-disable @typescript-eslint/no-unused-vars */
import z from 'zod'

export const tableParams = z.object({
  sort: z.object({
    column: z.string(),
    direction: z.union([z.literal('asc'), z.literal('desc')]),
  }),
  filters: z.record(z.unknown()),
  page: z.object({
    current: z.number(),
    size: z.number(),
  }),
})

import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  getTableColumns,
  getOrderByOperators,
  getTableName,
  getOperators,
  SQL,
  type AnyColumn,
} from 'drizzle-orm'
import {
  SQLiteTable,
  getTableConfig,
  type SQLiteSelect,
  type SQLiteColumn,
} from 'drizzle-orm/sqlite-core'

export function getSQLiteColumn<T extends SQLiteTable>(
  table: T,
  column_name: string,
) {
  const { columns } = getTableConfig(table)
  const column = columns.find(c => c.name == column_name)
  return column
}

export function withPagination<T extends SQLiteSelect>(
  qb: T,
  page: number = 1,
  pageSize: number = 10,
) {
  return qb.limit(pageSize).offset((page - 1) * pageSize)
}

export function getOrderBy(order: string, column: AnyColumn) {
  return order === 'asc' ? asc(column) : desc(column)
}

export function withOrderBy<T extends SQLiteSelect>(
  qb: T,
  column: AnyColumn,
  order: string | 'asc' | 'desc',
) {
  if (column) {
    return qb.orderBy(getOrderBy(order, column))
  }
  return qb
}

