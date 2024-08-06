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
  sku: text('sku').primaryKey().unique().notNull(),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  name: text('name').notNull(),
})

export type InsertSku = typeof skuTable.$inferInsert
export type SelectSku = typeof skuTable.$inferSelect

export const distribuidoraTable = sqliteTable('distribuidora', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  name: text('name').notNull(),
})

export const insertSKUschema = createInsertSchema(skuTable)

export type InsertDistribuidora = typeof distribuidoraTable.$inferInsert
export type SelectDistribuidora = typeof distribuidoraTable.$inferSelect

export const productStockTable = sqliteTable('stock', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  distribuidora_id: integer('distribuidora_id')
    .notNull()
    .references(() => distribuidoraTable.id),
  sku: text('sku', {})
    .notNull()
    .references(() => skuTable.sku),
  quantity: integer('quantity').notNull().default(0),
})

export type InsertProductStock = typeof productStockTable.$inferInsert
export type SelectProductStock = typeof productStockTable.$inferSelect

export const stockTransactionTable = sqliteTable('stock_transaction', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  stock_id: integer('stock_id')
    .notNull()
    .references(() => productStockTable.id),
  quantity: integer('quantity').notNull().default(0),
  type: text('type', { enum: ['Entrada', 'Saida'] }).notNull(),
  meta_data: text('meta_data', { mode: 'json' }).notNull(),
})

export type InsertStockTransaction = typeof stockTransactionTable.$inferInsert
export type SelectStockTransaction = typeof stockTransactionTable.$inferSelect
