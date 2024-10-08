/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageServerLoad } from './$types'
import { stripe as stripeController } from '$db/controller'
import { error, redirect } from '@sveltejs/kit'

import { stripe } from '$lib/server/services/stripe'
export const load = (async ({ locals, url, cookies }) => {
  // const { user } = locals
  // const CHECKOUT_SESSION_ID = url.searchParams.get('session_id')
  // if (!user) {
  //   error(500, 'User not found')
  // }

  // if (!CHECKOUT_SESSION_ID) {
  //   error(501, 'Session ID not found')
  // }
  // const [recentOrder] =
  //   await stripeController.getStripeOrderFromID(CHECKOUT_SESSION_ID)

  // const session = await stripe.checkout.sessions.retrieve(CHECKOUT_SESSION_ID)
  // console.log(session)

  // // const customer = await stripe.customers.retrieve(session.customer)
  // // console.log(customer)

  // stripeController.processStripeOrder(session.id)

  // return {
  //   recentOrder,
  //   // customer,
  // }

  // paymentIntent's id is passed in the URL
  const id = url.searchParams.get('payment_intent')

  if (!id) {
    return {
      message: 'No payment intent found',
    }
  }

  // ask Stripe for latest info about this paymentIntent
  const paymentIntent = await stripe.paymentIntents.retrieve(id)

  /* Inspect the PaymentIntent `status` to indicate the status of the payment
   * to your customer.
   *
   * Some payment methods will [immediately succeed or fail][0] upon
   * confirmation, while others will first enter a `processing` state.
   *
   * [0] https://stripe.com/docs/payments/payment-methods#payment-notification
   */
  let message

  switch (paymentIntent.status) {
    case 'succeeded':
      message = 'Success! Payment received.'

      // TODO: provision account here

      break

    case 'processing':
      message = "Payment processing. We'll update you when payment is received."
      break

    case 'requires_payment_method':
      // Redirect your user back to your payment page to attempt collecting
      // payment again
      return redirect(303, '/checkout')

    default:
      message = 'Something went wrong.'
      break
  }

  return {
    message,
  }
}) satisfies PageServerLoad
