import {
  stripeCheckoutSessionTable,
  type InsertCheckoutSession,
  // type InsertPaymentIntent,
} from './schema'
import { db } from '$db'

import { and, eq } from 'drizzle-orm'

import { stripe } from '$lib/server/services/stripe'
import Stripe from 'stripe'
import type { User } from 'lucia'

async function processStripeOrder(sessionId: string) {
  const [sessionDB] = await getStripeOrderFromID(sessionId)
  if (!sessionDB) {
    return
  }

  if (sessionDB.credited) {
    return
  }

  await db.update(stripeCheckoutSessionTable).set({
    credited: true,
  })
}

function insertCheckoutSession(session: InsertCheckoutSession) {
  return db.insert(stripeCheckoutSessionTable).values(session)
}

function getStripeOrderFromID(sessionId: string) {
  return db
    .select()
    .from(stripeCheckoutSessionTable)
    .where(eq(stripeCheckoutSessionTable.id, sessionId))
    .limit(1)
}

function getPendingCheckoutSessionFromUserID(userId: string) {
  return db
    .select()
    .from(stripeCheckoutSessionTable)
    .where(
      and(
        eq(stripeCheckoutSessionTable.userId, userId),
        eq(stripeCheckoutSessionTable.credited, false),
      ),
    )
}

async function createCheckoutSession({
  lineItems,
  user,
  url,
}: {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
  user: User
  url: URL
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/checkout/cancel`,
    customer_email: user.email,
    metadata: {
      user_id: user.id,
    },
  })

  return session
}

async function createPaymentIntent(data: { amount: number }) {
  const { amount } = data
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'brl',
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return intent
}
export const stripeController = {
  createCheckoutSession,
  processStripeOrder,
  insertCheckoutSession,
  getStripeOrderFromID,
  getPendingCheckoutSessionFromUserID,
  createPaymentIntent,
}
