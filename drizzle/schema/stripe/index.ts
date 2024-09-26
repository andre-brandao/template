import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { userTable } from '../user'

import Stripe from 'stripe'
import { customerOrderTable } from '../customer'

export const stripeCheckoutSessionTable = sqliteTable(
  'stripe_checkout_session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'set null',
      }),

    orderID: integer('order_id')
      .notNull()
      .references(() => customerOrderTable.id),
    json: text('json', { mode: 'json' })
      .notNull()
      .$type<Stripe.Checkout.Session>(),
    credited: integer('credited', { mode: 'boolean' }).notNull().default(false),
  },
)

export type InsertCheckoutSession =
  typeof stripeCheckoutSessionTable.$inferInsert

export const stripePaymentIntentTable = sqliteTable('stripe_payment_intent', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'set null'
    }),
  orderID: integer('order_id')
    .notNull()
    .references(() => customerOrderTable.id),
  json: text('json', { mode: 'json' })
    .notNull()
    .$type<Stripe.PaymentIntent>(),
})

export type InsertPaymentIntent = typeof stripePaymentIntentTable.$inferInsert