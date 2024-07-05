import {
  sqliteTable,
  text,
  integer,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql, relations } from 'drizzle-orm'
import { imageTable } from '../image'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

//                     _            _
// _ __  _ __ ___   __| |_   _  ___| |_
// | '_ \| '__/ _ \ / _` | | | |/ __| __|
// | |_) | | | (_) | (_| | |_| | (__| |_
// | .__/|_|  \___/ \__,_|\__,_|\___|\__|
// |_|

export const productTable = sqliteTable('product', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  name: text('name').notNull(),
  description: text('description').notNull(),
})
export const insertProductCategorySchema = createInsertSchema(productTable)

export const prouctRelations = relations(productTable, ({ many }) => ({
  entry: many(productEntryTable),
}))

export type SelectProduct = typeof productTable.$inferSelect
export type InsertProduct = typeof productTable.$inferInsert

export const productEntryTable = sqliteTable('product_entry', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  product_id: integer('product_id')
    .notNull()
    .references(() => productTable.id),
  image_id: integer('image_id')
    .notNull()
    .references(() => imageTable.id),

  brand_id: integer('brand_id')
    .references(() => brandTable.id)
    .notNull(),
  category_id: integer('category_id').references(() => categoryTable.id),

  quantity: integer('quantity').notNull(),
})

export const productEntryInsertSchema = createInsertSchema(productEntryTable)

export const productEntryRelations = relations(
  productEntryTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productEntryTable.product_id],
      references: [productTable.id],
    }),
    brand: one(brandTable, {
      fields: [productEntryTable.brand_id],
      references: [brandTable.id],
    }),
    category: one(categoryTable, {
      fields: [productEntryTable.category_id],
      references: [categoryTable.id],
    }),
    image: one(imageTable, {
      fields: [productEntryTable.image_id],
      references: [imageTable.id],
    }),
    prices: many(productPriceTable),
  }),
)

export type SelectProductEntry = typeof productEntryTable.$inferSelect
export type InsertProductEntry = typeof productEntryTable.$inferInsert

export const brandTable = sqliteTable('brand', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const brandInsertSchema = createInsertSchema(brandTable)

export const brandRelations = relations(brandTable, ({ many }) => ({
  products: many(productEntryTable),
}))

export type SelectBrand = typeof brandTable.$inferSelect
export type InsertBrand = typeof brandTable.$inferInsert

export const categoryTable = sqliteTable('category', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const categoryInsertSchema = createInsertSchema(categoryTable)

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  products: many(productEntryTable),
}))

export type SelectCategory = typeof categoryTable.$inferSelect
export type InsertCategory = typeof categoryTable.$inferInsert

export const pricesTable = sqliteTable('prices', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  is_retail: integer('is_retail', { mode: 'boolean' }).notNull(),
})

export const pricesInsertSchema = createInsertSchema(pricesTable)
export const pricesRelations = relations(pricesTable, ({ many }) => ({
  product_price: many(productPriceTable),
}))

export type SelectPrices = typeof pricesTable.$inferSelect
export type InsertPrices = typeof pricesTable.$inferInsert

export const productPriceTable = sqliteTable('product_price', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  product_id: integer('product_id')
    .notNull()
    .references(() => productEntryTable.id),
  price_id: integer('price_id')
    .notNull()
    .references(() => pricesTable.id),
  price: integer('price').notNull(),
})

export const productPriceInsertSchema = createInsertSchema(productPriceTable)

export const productPriceRelations = relations(
  productPriceTable,
  ({ one }) => ({
    product_entry: one(productEntryTable, {
      fields: [productPriceTable.product_id],
      references: [productEntryTable.id],
    }),
    price_label: one(pricesTable, {
      fields: [productPriceTable.price_id],
      references: [pricesTable.id],
    }),
  }),
)
export type SelectProductPrice = typeof productPriceTable.$inferSelect
export type InsertProductPrice = typeof productPriceTable.$inferInsert
