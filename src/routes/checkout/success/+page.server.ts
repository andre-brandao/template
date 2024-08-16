import type { PageServerLoad } from './$types'
import { stripe as stripeController } from '$lib/server/db/controller'
import { error } from '@sveltejs/kit'

import { stripe } from '$lib/server/stripe'
export const load = (async ({ locals, url }) => {
  const { user } = locals
  const CHECKOUT_SESSION_ID = url.searchParams.get('session_id')
  if (!user) {
    error(500, 'User not found')
  }

  if (!CHECKOUT_SESSION_ID) {
    error(501, 'Session ID not found')
  }
  const [recentOrder] =
    await stripeController.getStripeOrderFromID(CHECKOUT_SESSION_ID)

  const session = await stripe.checkout.sessions.retrieve(CHECKOUT_SESSION_ID)
  console.log(session)

  // const customer = await stripe.customers.retrieve(session.customer)
  // console.log(customer)

  stripeController.processStripeOrder(session.id)

  return {
    recentOrder,
    // customer,
  }
}) satisfies PageServerLoad
