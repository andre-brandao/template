/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  sqliteTable,
  text,
  integer,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql, relations } from 'drizzle-orm'

import { userTable, productItemTable } from '$db/tenant/schema'
import { createInsertSchema } from 'drizzle-zod'

export const addressTable = sqliteTable('address', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  user_id: text('user_id')
    .notNull()
    .references(() => userTable.id),
  is_default: integer('is_default', { mode: 'boolean' }).default(false),
  cep: text('cep').notNull(),
  street: text('street').notNull(),
  number: text('number').notNull(),
  complement: text('complement').notNull(),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull(),
})

export const insertAddressSchema = createInsertSchema(addressTable)
export type SelectAddress = typeof addressTable.$inferSelect
export type InsertAddress = typeof addressTable.$inferInsert

export const customerOrderTable = sqliteTable('customer_order', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  // .$defaultFn(() => generateId(15)),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  user_id: text('customer_id')
    .notNull()
    .references(() => userTable.id),
  address_id: integer('address_id').references(() => addressTable.id),
  payment_method: text('payment_method').notNull(),
  total: integer('total').notNull(),
  observation: text('observation'),
  status: text('status', {
    enum: [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'ON THE WAY',
      'DELIVERED',
      'CANCELED',
    ],
  }).notNull(),
})

export type SelectCustomerOrder = typeof customerOrderTable.$inferSelect
export type InsertCustomerOrder = typeof customerOrderTable.$inferInsert

export const orderItemTable = sqliteTable('order_item', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),

  order_id: integer('order_id')
    .notNull()
    .references(() => customerOrderTable.id),
  product_id: integer('product_id')
    .notNull()
    .references(() => productItemTable.id),
  observation: text('observation'),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
})

export type SelectOrderItem = typeof orderItemTable.$inferSelect
export type InsertOrderItem = typeof orderItemTable.$inferInsert
