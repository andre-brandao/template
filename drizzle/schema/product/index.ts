/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  sqliteTable,
  text,
  integer,
  SQLiteColumn,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql, relations, type AnyColumn } from 'drizzle-orm'
import { imageTable } from '../image'

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customerOrderTable, orderItemTable } from '$drizzle/schema'

export const productCategoryTable = sqliteTable('product_category', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  image: integer('image_id').references(() => imageTable.id),
  name: text('name').notNull(),
})

export const productCategoryRelations = relations(
  productCategoryTable,
  ({ one, many }) => ({
    products: many(productTable),
  }),
)
export type SelectProductCategory = typeof productCategoryTable.$inferSelect
export type InsertProductCategory = typeof productCategoryTable.$inferInsert

export const insertProductCategorySchema =
  createInsertSchema(productCategoryTable)

export const productTable = sqliteTable('product', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  category_id: integer('category_id').references(() => productCategoryTable.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image: integer('image_id').references(() => imageTable.id),
})

export const productRelations = relations(productTable, ({ one, many }) => ({
  category: one(productCategoryTable, {
    fields: [productTable.category_id],
    references: [productCategoryTable.id],
  }),
  items: many(productItemTable),
}))

export const insertProductSchema = createInsertSchema(productTable)

export type SelectProduct = typeof productTable.$inferSelect
export type InsertProduct = typeof productTable.$inferInsert

export const productItemTable = sqliteTable('product_item', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  product_id: integer('product_id')
    .notNull()
    .references(() => productTable.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image: integer('image_id').references(() => imageTable.id),
  price: integer('price').notNull(),
  quantity: integer('quantity').notNull().default(0),
})

export const productItemRelations = relations(
  productItemTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productItemTable.product_id],
      references: [productTable.id],
    }),
    orders: many(orderItemTable),
  }),
)
export const insertProductItemSchema = createInsertSchema(productItemTable)

export type SelectProductItem = typeof productItemTable.$inferSelect
export type InsertProductItem = typeof productItemTable.$inferInsert

export const stockTransactionTable = sqliteTable('stock_transaction', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  item_id: integer('stock_id')
    .notNull()
    .references(() => productItemTable.id),
  order_id: integer('order_id').references(() => customerOrderTable.id),
  quantity: integer('quantity').notNull().default(0),
  type: text('type', { enum: ['Entrada', 'Saida'] }).notNull(),
  meta_data: text('meta_data', { mode: 'json' }).notNull(),
})

export type SelectStockTransaction = typeof stockTransactionTable.$inferSelect
export type InsertStockTransaction = typeof stockTransactionTable.$inferInsert
