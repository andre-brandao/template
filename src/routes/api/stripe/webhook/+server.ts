import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  return new Response()
}
import { error, json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { stripe } from '$lib/server/stripe'

import { dev } from '$app/environment'

// endpoint to handle incoming webhooks
export const POST: RequestHandler = async ({ request }) => {
  // extract body
  const body = await request.text()

  // get the signature from the header
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    // signature is missing
    console.warn('⚠️  Webhook signature missing.')

    // return, because it's a bad request
    throw error(400, 'Invalid request')
  }

  // var to hold event data
  let event

  // verify it
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      dev ? env.STRIPE_WEBHOOK_SECRET_TESTE : env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    // signature is invalid!
    console.warn('⚠️  Webhook signature verification failed.', err)

    // return, because it's a bad request
    throw error(400, 'Invalid request')
  }

  // signature has been verified, so we can process events
  // full list of events: https://stripe.com/docs/api/events/list

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
    case 'customer.subscription.created':
      // Subscription was created
      break
    case 'customer.subscription.updated':
      // Subscription has been changed
      break
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
    case 'customer.subscription.deleted':
      if (event.request != null) {
        // handle a subscription canceled by your request
        // from above.
      } else {
        // handle subscription canceled automatically based
        // upon your subscription settings.
      }
      break

    default:
      // unhandled event
      console.log(`🤷‍♂️ Unhandled event type: ${event.type}`)
      break
  }
  // return a 200 with an empty JSON response
  return json({})
}
