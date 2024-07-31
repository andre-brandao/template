import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const customerTable = sqliteTable('customer', {
  id: text('id').notNull().primaryKey(),
  // .$defaultFn(() => generateId(15)),
  is_retail: integer('is_retail', { mode: 'boolean' }).notNull(),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  name: text('name').notNull(),
  email: text('email').notNull(),
  birth_date: text('birth_date').notNull(),
  cellphone: text('cellphone').notNull(),
  phone: text('phone').notNull(),
  cpf_cnpj: text('cpf_cnpj').notNull(),
  rg_ie: text('rg_ie').notNull(),
  max_credit: integer('max_credit').notNull(),
  used_credit: integer('used_credit').notNull(),
})

export type SelectUser = typeof customerTable.$inferSelect
export type InsertUser = typeof customerTable.$inferInsert

export const addressTable = sqliteTable('address', {
  id: text('id').notNull().primaryKey(),
  // .$defaultFn(() => generateId(15)),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  customer_id: text('customer_id')
    .notNull()
    .references(() => customerTable.id),
  cep: text('cep').notNull(),
  street: text('street').notNull(),
  number: text('number').notNull(),
  complement: text('complement').notNull(),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull(),
})
