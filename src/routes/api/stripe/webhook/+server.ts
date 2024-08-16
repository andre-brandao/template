import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  return new Response()
}
import { error, json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { stripe } from '$lib/server/stripe'

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

  if (!env.STRIPE_WEBHOOK_SECRET) {
    // webhook secret is missing
    console.warn('⚠️  Webhook secret missing.')

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
      env.STRIPE_WEBHOOK_SECRET,
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

    default:
      // unhandled event
      console.log(`🤷‍♂️ Unhandled event type: ${event.type}`)
      break
  }
  // return a 200 with an empty JSON response
  return json({})
}
