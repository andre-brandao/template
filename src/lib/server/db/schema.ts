import {
  sqliteTable,
  text,
  integer,
  blob,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// import { generateId } from 'lucia'
export interface DatabaseUser {
  id: string
  username: string
}

const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  // .$defaultFn(() => generateId(15)),

  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),

  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
})

type SelectUser = typeof userTable.$inferSelect
type InsertUser = typeof userTable.$inferInsert

export { userTable, type SelectUser, type InsertUser }

export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer('expires_at').notNull(),
})

// =-=-==--=-=-=-==--=-==

const imageTable = sqliteTable('image', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  uploaded_by: text('uploaded_by')
    // .notNull()
    .references(() => userTable.id),
  name: text('name').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
})

type SelectImage = typeof imageTable.$inferSelect
type InsertImage = typeof imageTable.$inferInsert
export { imageTable, type SelectImage, type InsertImage }

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
    .references(() => productCategoryTable.id),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  // image: blob('image').notNull(),
  image_id: integer('image_id').references(() => imageTable.id),
})
type SelectProduct = typeof productTable.$inferSelect
type InsertProduct = typeof productTable.$inferInsert
export { productTable, type SelectProduct, type InsertProduct }
