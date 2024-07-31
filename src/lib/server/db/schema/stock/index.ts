 /* eslint-disable @typescript-eslint/no-unused-vars */
import {
  sqliteTable,
  text,
  integer,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql, relations } from 'drizzle-orm'
import { imageTable } from '../image'

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const skuTable = sqliteTable('sku', {
  sku: text('sku').primaryKey(),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  name: text('name').notNull(),
})

export const distribuidoraTable = sqliteTable('distribuidora', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  name: text('name').notNull(),
})

export const productStockTable = sqliteTable('stock', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  distribuidora_id: integer('distribuidora_id')
    .notNull()
    .references(() => distribuidoraTable.id),
  name: text('name').notNull(),
  sku: text('sku', {}).references(() => skuTable.sku),
  quantity: integer('quantity').notNull().default(0),
})
 