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
import { skuTable } from '../stock'

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

//                     _            _
// _ __  _ __ ___   __| |_   _  ___| |_
// | '_ \| '__/ _ \ / _` | | | |/ __| __|
// | |_) | | | (_) | (_| | |_| | (__| |_
// | .__/|_|  \___/ \__,_|\__,_|\___|\__|
// |_|

export const productCategoryTable = sqliteTable('product_category', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  // parent_id: integer('parent_id').references(
  //   (): SQLiteColumn => productCategoryTable.id,
  // ),
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
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
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
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  product_id: integer('product_id')
    .notNull()
    .references(() => productTable.id),
  name: text('name').notNull(),
  sku: text('sku').references(() => skuTable.sku),
  quantity: integer('quantity').notNull().default(1),
  image: integer('image_id').references(() => imageTable.id),
  retail_price: integer('retail_price').notNull(),
  wholesale_price: integer('wholesale_price').notNull(),
})

export const productItemRelations = relations(
  productItemTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productItemTable.product_id],
      references: [productTable.id],
    }),
  }),
)
export const insertProductItemSchema = createInsertSchema(productItemTable)

export type SelectProductItem = typeof productItemTable.$inferSelect
export type InsertProductItem = typeof productItemTable.$inferInsert
