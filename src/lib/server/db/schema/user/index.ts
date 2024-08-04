import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  // .$defaultFn(() => generateId(15)),

  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),

  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  password_hash: text('password_hash').notNull(),

  permissions: text('permissions', { mode: 'json' })
    .notNull()
    .$type<UserPermissions>()
    .default({ isAdmin: false }),
})

export type SelectUser = typeof userTable.$inferSelect
export type InsertUser = typeof userTable.$inferInsert

// import { generateId } from 'lucia'
export interface DatabaseUser {
  id: string
  username: string
  email: string
  emailVerified: boolean
  permissions: UserPermissions
}

export type UserPermissions = {
  isAdmin: boolean
}

// AUTH TABLES
export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  expiresAt: integer('expires_at').notNull(),
})

export const userVerificationCodeTable = sqliteTable('user_verification_code', {
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

export const passwordResetCodeTable = sqliteTable('password_reset_code', {
  token_hash: text('token_hash').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

export const magicLinkTable = sqliteTable('magic_link', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    }),
  email: text('email').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

// NOTIFICATION TABLES
import { type PushSubscription } from 'web-push'

export const pushNotificationDeviceTable = sqliteTable(
  'push_notification_device',
  {
    device_id: integer('device_id')
      .notNull()
      .primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
      }),
    subscription: text('subscription', {
      mode: 'json',
    })
      .$type<PushSubscription>()
      .notNull()
      .unique(),
  },
)

export type SelectPushNotificationDevice =
  typeof pushNotificationDeviceTable.$inferSelect
export type InsertPushNotificationDevice =
  typeof pushNotificationDeviceTable.$inferInsert

export const pushNotificationLogTable = sqliteTable('push_notification_log', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  device_id: integer('device_id').references(
    () => pushNotificationDeviceTable.device_id,
    {
      onDelete: 'cascade',
    },
  ),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  payload: text('payload').notNull(),
  http_status: integer('http_status').notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
  err_message: text('err_message'),
})

export type SelectPushNotificationLog =
  typeof pushNotificationLogTable.$inferSelect
export type InsertPushNotificationLog =
  typeof pushNotificationLogTable.$inferInsert
