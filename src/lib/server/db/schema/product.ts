import {
  sqliteTable,
  text,
  integer,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { imageTable } from '.'

const productCategoryTable = sqliteTable('product_category', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})
type SelectProductCategory = typeof productCategoryTable.$inferSelect
type InsertProductCategory = typeof productCategoryTable.$inferInsert
export {
  productCategoryTable,
  type SelectProductCategory,
  type InsertProductCategory,
}
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
type SelectProduct = typeof productTable.$inferSelect
type InsertProduct = typeof productTable.$inferInsert
export { productTable, type SelectProduct, type InsertProduct }
