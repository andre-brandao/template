import {
  sqliteTable,
  text,
  integer,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql, relations } from 'drizzle-orm'
import { imageTable } from '../image'

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

/*                  _            _               _                              
                     | |          | |             | |                             
  _ __  _ __ ___   __| |_   _  ___| |_    ___ __ _| |_ ___  __ _  ___  _ __ _   _ 
  | '_ \| '__/ _ \ / _` | | | |/ __| __|  / __/ _` | __/ _ \/ _` |/ _ \| '__| | | |
  | |_) | | | (_) | (_| | |_| | (__| |_  | (_| (_| | ||  __/ (_| | (_) | |  | |_| |
  | .__/|_|  \___/ \__,_|\__,_|\___|\__|  \___\__,_|\__\___|\__, |\___/|_|   \__, |
  | |                                                        __/ |            __/ |
  |_|                                                       |___/            |___/ 
  */

const productCategoryTable = sqliteTable('product_category', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})
const productCategoryRelations = relations(
  productCategoryTable,
  ({ many }) => ({
    products: many(productTable),
  }),
)

type SelectProductCategory = typeof productCategoryTable.$inferSelect
type InsertProductCategory = typeof productCategoryTable.$inferInsert

const insertProductCategorySchema = createInsertSchema(productCategoryTable)
const selectProductCategorySchema = createSelectSchema(productCategoryTable)

export {
  productCategoryTable,
  productCategoryRelations,
  type SelectProductCategory,
  type InsertProductCategory,
  insertProductCategorySchema,
  selectProductCategorySchema,
}
//                     _            _
// _ __  _ __ ___   __| |_   _  ___| |_
// | '_ \| '__/ _ \ / _` | | | |/ __| __|
// | |_) | | | (_) | (_| | |_| | (__| |_
// | .__/|_|  \___/ \__,_|\__,_|\___|\__|
// |_|

const productTable = sqliteTable('product', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  category_id: integer('category_id')
    .notNull()
    .references(() => productCategoryTable.id, {
      onDelete: 'cascade',
    }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updateAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),

  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  // image: blob('image').notNull(),
  image_id: integer('image_id').references(() => imageTable.id, {
    onDelete: 'no action',
  }),
})

const productRelations = relations(productTable, ({ one }) => ({
  category: one(productCategoryTable),
  image: one(imageTable),
}))

type SelectProduct = typeof productTable.$inferSelect
type InsertProduct = typeof productTable.$inferInsert

export {
  productTable,
  productRelations,
  type SelectProduct,
  type InsertProduct,
}
