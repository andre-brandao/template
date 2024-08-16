import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { userTable } from '../user'

export const stripeCheckoutSessionTable = sqliteTable(
  'stripe_checkout_session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'set null',
      }),

    geopoints: integer('geopoints').notNull(),
    stripe_json: text('stripe_json', { mode: 'json' }).notNull(),
    credited: integer('credited', { mode: 'boolean' }).notNull().default(false),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    expired: integer('expired', { mode: 'boolean' }).notNull().default(false),
  },
)

export type InsertCheckoutSession =
  typeof stripeCheckoutSessionTable.$inferInsert
