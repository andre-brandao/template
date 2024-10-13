/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  sqliteTable,
  text,
  integer,
  primaryKey,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
import { generateId, generateSessionToken } from '$lib/server/auth/sessions'

export const userRoleEnum = ['customer', 'admin'] as const
export type UserRole = (typeof userRoleEnum)[number]
export const userTable = sqliteTable('user', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateId(15)),
  created_at: integer('created_at', { mode: 'timestamp' }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ),
  role: text('role', { enum: userRoleEnum }).default('customer'),
  name: text('name'),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  phone: text('phone'),
  phoneVerified: integer('phone_verified', { mode: 'boolean' }),

  hasSubscription: integer('has_subscription', { mode: 'boolean' }).default(
    false,
  ),

  // password_hash: text('password_hash'),
  meta: text('meta', { mode: 'json' }),
})

export type SelectUser = typeof userTable.$inferSelect
export type InsertUser = typeof userTable.$inferInsert

export const authProviderTable = sqliteTable(
  'auth_provider',
  {
    userId: text('user_id')
      .references(() => userTable.id)
      .notNull(),
    provider: text('provider', {
      enum: ['google', 'password'],
    }).notNull(),
    code: text('code').notNull(),
    meta_data: text('meta_data', { mode: 'json' }),
  },
  t => ({
    pk: primaryKey({ columns: [t.userId, t.provider] }),
  }),
)

export type SelectAuthProvider = typeof authProviderTable.$inferSelect
export type InsertAuthProvider = typeof authProviderTable.$inferInsert
// AUTH TABLES
export const sessionTable = sqliteTable('auth_session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  expiresAt: integer('expires_at', {
    mode: 'timestamp',
  }).notNull(),
})

export type SelectSession = typeof sessionTable.$inferSelect

export const userVerificationCodeTable = sqliteTable('auth_verification_code', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  code: text('code').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  email: text('email').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

export const passwordResetCodeTable = sqliteTable('auth_password_reset_code', {
  token_hash: text('token_hash').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

export const magicLinkTable = sqliteTable('auth_magic_link', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  email: text('email').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})
