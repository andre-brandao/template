import type { PageServerLoad } from './$types'

import {
  type StripeSubscription,
  subscriptionInfo,
  stripeSubscriptionsEnum,
} from '$lib/server/services/stripe'
import { error, redirect } from '@sveltejs/kit'
import { stripeCustomerController } from '$lib/server/db/stripe/controller'

export const load = (async ({ params, locals }) => {
  const user = locals.user
  console.log('user', user)

  const type = params.prodId as StripeSubscription

  // if (!Object.keys(stripeSubscriptionsEnum).includes(type)) {
  //   return error(404, 'Subscription not found')
  // }

  const subscriptionId = stripeSubscriptionsEnum[type]
  console.log('subscriptionId', subscriptionId)
  const info = subscriptionInfo[type]
  console.log('info', info)

  if (!info) {
    return error(404, 'Subscription not found')
  }

  if (!user?.name) {
    return redirect(301, `/onboarding?redirect=/checkout/subscription/${type}`)
  }

  const stripeCustomer = await stripeCustomerController.getDbCustomer(user)

  const sub = await stripeCustomerController.createSubscription(
    stripeCustomer.customerID,
    type,
  )

  console.log(sub)

  return {
    info,
    subscriptionId,
    clientSecret: sub.latest_invoice?.payment_intent.client_secret,
  }
}) satisfies PageServerLoad
