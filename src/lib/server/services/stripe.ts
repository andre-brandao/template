import Stripe from 'stripe'

import { env } from '$env/dynamic/private'
import { dev } from '$app/environment'
const dev = true
import {
  stripeCustomerController,
  stripePaymentIntend,
} from '../db/stripe/controller'

// export const stripe = new Stripe(
//   dev ? env.STRIPE_SECRET_KEY_TESTE : env.STRIPE_SECRET_KEY,
//   {
//     apiVersion: '2024-06-20',
//     typescript: true,

//   },
// )

// if (!process.env.SECRET_TESTE_STRIPE_KEY) {
//   throw new Error('SECRET_TESTE_STRIPE_KEY is not set')
// } else if (!process.env.SECRET_STRIPE_KEY) {
//   throw new Error('SECRET_STRIPE_KEY is not set')
// }

// ! Uncomment this line when seeding the database
export const stripe = new Stripe(
  dev ? env.SECRET_TESTE_STRIPE_KEY : env.SECRET_STRIPE_KEY,
  {
    apiVersion: '2024-09-30.acacia',
    typescript: true,
  },
)

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
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  } else if (!env.STRIPE_WEBHOOK_SECRET_TESTE) {
    throw new Error('STRIPE_WEBHOOK_SECRET_TESTE is not set')
  }

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
          await stripeCustomerController.subscription.activate(sub)
          break

        case 'canceled':
          await stripeCustomerController.subscription.desactivate(sub)
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
        stripeCustomerController.subscription.desactivate(sub)
      } else {
        // handle subscription canceled automatically based
        // upon your subscription settings.
        stripeCustomerController.subscription.desactivate(sub)
      }
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      console.log(`✅ PaymentIntent succeeded ${paymentIntent.id}`)
      return await stripePaymentIntend.handleSuccededPaymentIntent(
        paymentIntent,
      )
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
