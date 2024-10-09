import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { userTable, customerOrderTable } from '../schema'

import Stripe from 'stripe'

export const stripeCustomer = sqliteTable('stripe_customer', {
  customerID: text('id').notNull(), // stripe customer id
  user_id: text('user_id')
    .notNull()
    .references(() => userTable.id)
    .primaryKey(),
  json: text('json', { mode: 'json' }).notNull().$type<Stripe.Customer>(),
})

export const stripeSubscriptions = sqliteTable('stripe_subscriptions', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .references(() => userTable.id)
    .notNull(),
  customerID: text('customer_id').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(false),
  json: text('json', { mode: 'json' }).notNull().$type<Stripe.Subscription>(),
})

export const stripeOrderPaymentIntentTable = sqliteTable(
  'stripe_order_payment_intent',
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
    processed: integer('processed', { mode: 'boolean' })
      .notNull()
      .default(false),
    json: text('json', { mode: 'json' })
      .notNull()
      .$type<Stripe.PaymentIntent>(),
  },
)

export type InsertPaymentIntent =
  typeof stripeOrderPaymentIntentTable.$inferInsert
