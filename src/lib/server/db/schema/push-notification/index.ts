// NOTIFICATION TABLES
import { type PushSubscription } from 'web-push'
import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { userTable } from '$db/schema'
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
