import {
  stripeCustomer,
  // stripeCheckoutSessionTable,
  stripeOrderPaymentIntentTable,
  stripeSubscriptions,
  // type InsertCheckoutSession,
  // type InsertPaymentIntent,
} from './schema'
import { db } from '$db'

import { and, eq } from 'drizzle-orm'

import { stripe, stripeSubscriptionsEnum } from '$lib/server/services/stripe'
import Stripe from 'stripe'
// import type { User } from 'lucia'
import { customerOrderTable, type SelectCustomerOrder } from '../schema'
import { customer } from '../controller'
import type { User } from 'lucia'

async function createOrderPaymentIntent(data: {
  orderId: SelectCustomerOrder['id']
  userId: SelectCustomerOrder['user_id']
}) {
  const amount = await customer.getOrderTotal(data.orderId)
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'brl',
    automatic_payment_methods: {
      enabled: true,
    },

    metadata: {
      orderId: data.orderId,
      userId: data.userId,
    },
  })

  await db.insert(stripeOrderPaymentIntentTable).values({
    id: intent.id,
    orderID: data.orderId,
    json: intent,
    userId: data.userId,
  })

  return intent
}

async function handleSuccededPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
) {
  if (paymentIntent.status !== 'succeeded') {
    return {
      error: {
        message: 'Payment intent is not succeeded',
        code: 400,
      },
    }
  }

  await db.update(customerOrderTable).set({
    status: 'CONFIRMED',
  })

  await db
    .update(stripeOrderPaymentIntentTable)
    .set({
      processed: true,
      json: paymentIntent,
    })
    .where(eq(stripeOrderPaymentIntentTable.id, paymentIntent.id))
}

export const stripePaymentIntend = {
  createOrderPaymentIntent,
  handleSuccededPaymentIntent,
}

export const stripeCustomerController = {
  getDbCustomer: async (user: User) => {
    const customer = await db.query.stripeCustomer.findFirst({
      where: t => eq(t.user_id, user.id),
    })

    if (customer) {
      return customer
    }

    return await stripeCustomerController.createCustomer(user)
  },
  createCustomer: async (user: User) => {
    const sCustomer = await stripe.customers.create({
      name: user.name,
      email: user.email,
    })

    console.log(sCustomer)

    const [newDbC] = await db
      .insert(stripeCustomer)
      .values({
        customerID: sCustomer.id,
        json: sCustomer,
        user_id: user.id,
      })
      .returning()
    console.log(newDbC)

    return newDbC
  },
  createSubscription: async function (
    stripeCustomerId: string,
    type: keyof typeof stripeSubscriptionsEnum,
  ) {
    const priceId = stripeSubscriptionsEnum[type]
    const sSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: priceId,
        },
      ],
      
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })
    await db.insert(stripeSubscriptions).values({
      customerID: stripeCustomerId,
      id: sSubscription.id,
      json: sSubscription,
    })
    return sSubscription
  },

  subscription: {
    activate: async function (sub: Stripe.Subscription) {
      await db
        .update(stripeSubscriptions)
        .set({
          active: true,
          json: sub,
        })
        .where(eq(stripeSubscriptions.id, sub.id))
    },
    desactivate: async function (sub: Stripe.Subscription) {
      await db
        .update(stripeSubscriptions)
        .set({
          active: false,
          json: sub,
        })
        .where(eq(stripeSubscriptions.id, sub.id))
    },
  },
}
