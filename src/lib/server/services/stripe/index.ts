/* eslint-disable @typescript-eslint/no-unused-vars */
import Stripe from 'stripe'

import { env } from '$env/dynamic/private'
import { dev } from '$app/environment'

import { db } from '$lib/server/db'
import {
  customerOrderTable,
  stripeCustomer,
  //   stripeOrderPaymentIntentTable,
  stripeSubscriptions,
  userTable,
} from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

import type { SelectUser as User } from '$db/schema'

// ! Uncomment this line when seeding the database
export const stripe = new Stripe(
  dev ? env.SECRET_TESTE_STRIPE_KEY : env.SECRET_STRIPE_KEY,
  {
    apiVersion: '2024-09-30.acacia',
    typescript: true,
  },
)

export const sCustomer = {
  create: async (user: User) => {
    const sCustomer = await stripe.customers.create({
      name: user.username,
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
  createOrRetrieveCustomer: async function (user: User) {
    const customer = await db.query.stripeCustomer.findFirst({
      where: t => eq(t.user_id, user.id),
    })

    if (customer) {
      return customer
    } else {
      const sCust = await stripe.customers.search({
        limit: 1,
        query: `email:"${user.email}"`,
      })

      if (sCust.data.length > 0) {
        const [temp] = await db
          .insert(stripeCustomer)
          .values({
            customerID: sCust.data[0].id,
            json: sCust.data[0],
            user_id: user.id,
          })
          .returning()
        return temp
      }
    }

    return await sCustomer.create(user)
  },

  createSubscription: async function (user: User, priceId: string) {
    const stripeCustomer = await sCustomer.createOrRetrieveCustomer(user)
    const existingSub = await db.query.stripeSubscriptions.findFirst({
      where: t => eq(t.userId, user.id),
    })
    if (existingSub) {
      const sSubscription = await stripe.subscriptions.retrieve(
        existingSub.id,
        {
          expand: ['latest_invoice.payment_intent'],
        },
      )
      return sSubscription
    }

    console.log(priceId)
    const sSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.customerID,
      items: [
        {
          price: priceId,
        },
      ],
      metadata: {
        userId: user.id,
        type: 'subscription',
        subscriptionType: priceId,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })
    await db.insert(stripeSubscriptions).values({
      customerID: stripeCustomer.customerID,
      userId: user.id,
      id: sSubscription.id,
      json: sSubscription,
    })
    return sSubscription
  },

  activateSubscription: async function (sub: Stripe.Subscription) {
    const [resp] = await db
      .update(stripeSubscriptions)
      .set({
        json: sub,
        active: true,
      })
      .where(eq(stripeSubscriptions.id, sub.id))
      .returning()

    if (resp.userId) {
      await db
        .update(userTable)
        .set({
          hasSubscription: true,
        })
        .where(eq(userTable.id, resp.userId))
    }
  },
  desactivateSubscription: async function (sub: Stripe.Subscription) {
    const [resp] = await db
      .update(stripeSubscriptions)
      .set({
        json: sub,
        active: false,
      })
      .where(eq(stripeSubscriptions.id, sub.id))
      .returning()

    if (resp.userId) {
      await db
        .update(userTable)
        .set({
          hasSubscription: false,
        })
        .where(eq(userTable.id, resp.userId))
    }
  },
}

export const sPaymentIntent = {
  createCheckout: async function (
    user: User,
    info: {
      amount: number
      type: 'order'
      metadata: Record<string, unknown>
    },
  ) {
    console.log('createCheckout')

    const intent = await stripe.paymentIntents.create({
      amount: info.amount,
      currency: 'brl',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        type: info.type,
        ...info.metadata,
      },
    })

    return intent
  },
  handleSuccededPaymentIntent: async function (
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
    const meta = paymentIntent.metadata
    const userId = meta.userId as string
    const type = meta.type

    if (type === 'order') {
      const orderId = Number(meta.orderId)
      await db
        .update(customerOrderTable)
        .set({
          status: 'CONFIRMED',
        })
        .where(eq(customerOrderTable.id, orderId))
    }

    return {
      success: true,
    }
  },
}

export async function handleWebhook(
  body: string,
  signature: string,
): Promise<
  | {
      error: {
        message: string
        code: number
      }
    }
  | undefined
> {
  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      dev ? env.STRIPE_WEBHOOK_SECRET_TESTE : env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.warn('⚠️  Webhook signature verification failed.', err)
    return {
      error: {
        message: 'Invalid request',
        code: 400,
      },
    }
  }
  switch (event.type) {
    case 'charge.succeeded': {
      const charge = event.data.object
      console.log(`✅ Charge succeeded ${charge.id}`)
      break
    }
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log(`✅ Checkout session completed ${session.id}`)
      break
    }

    case 'invoice.paid':
      // Used to provision services after the trial has ended.
      // The status of the invoice will show up as paid. Store the status in your
      // database to reference when a user accesses your service to avoid hitting rate limits.
      break
    case 'invoice.payment_failed':
      // If the payment fails or the customer does not have a valid payment method,
      //  an invoice.payment_failed event is sent, the subscription becomes past_due.
      // Use this webhook to notify your user that their payment has
      // failed and to retrieve new card details.
      break

    case 'customer.subscription.created':
      // Subscription was created
      console.log('Subscription created')
      // stripeCustomerController.
      break
    case 'customer.subscription.updated': {
      // Subscription has been changed
      const sub = event.data.object

      switch (sub.status) {
        case 'active':
          await sCustomer.activateSubscription(sub)
          break

        case 'canceled':
          await sCustomer.desactivateSubscription(sub)
          break

        default:
          break
      }

      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object

      if (event.request != null) {
        // handle a subscription canceled by your request
        // from above.
      } else {
        // handle subscription canceled automatically based
        // upon your subscription settings.
      }
      const [dbSub] = await db
        .update(stripeSubscriptions)
        .set({
          json: sub,
          active: false,
        })
        .where(eq(stripeSubscriptions.id, sub.id))
        .returning()

      if (dbSub.userId) {
        await db
          .update(userTable)
          .set({
            hasSubscription: false,
          })
          .where(eq(userTable.id, dbSub.userId))
      }
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object

      sPaymentIntent.handleSuccededPaymentIntent(paymentIntent)
      //   const meta = paymentIntent.metadata

      //   await db.update(customerOrderTable).set({})
      //   await db.update(stripeOrderPaymentIntentTable).set({
      //     json: paymentIntent,
      //     processed: true,
      //   })
      //   console.log(`✅ PaymentIntent succeeded ${paymentIntent.id}`)
      //   return await stripePaymentIntend.handleSuccededPaymentIntent(
      //     paymentIntent,
      //   )
      break
    }
    default:
      // unhandled event
      console.log(`🤷‍♂️ Unhandled event type: ${event.type}`)
      break
  }
}

export const stripeSubscriptionsEnum = {
  pro_yearly: 'price_1Q7h9VP4d2UJwOVLADNKnh8K',
  pro_monthly: 'price_1Q7h8PP4d2UJwOVLqHZMKuIo',
} as const

export type StripeSubscription = keyof typeof stripeSubscriptionsEnum

export type StripeSubscriptionFeatures = {
  [key in StripeSubscription]: {
    name: string
    description: string
    price: number
    features: string[]
  }
}

export const subscriptionInfo: StripeSubscriptionFeatures = {
  pro_monthly: {
    name: 'Pro Monthly',
    description: 'Get access to all the features',
    price: 9.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  pro_yearly: {
    name: 'Pro Yearly',
    description: 'Get access to all the features',
    price: 99.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
}
