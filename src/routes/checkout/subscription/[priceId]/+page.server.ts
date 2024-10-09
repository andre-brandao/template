import type { PageServerLoad } from './$types'

// import {
//   type StripeSubscription,
//   subscriptionInfo,
//   stripeSubscriptionsEnum,
// } from '$lib/server/services/stripe'
import { error, redirect } from '@sveltejs/kit'

import { sCustomer } from '$lib/server/services/stripe/index'

// export const stripeSubscriptionsEnum = {
//   pro_yearly: 'price_1Q7h9VP4d2UJwOVLADNKnh8K',
//   pro_monthly: 'price_1Q7h8PP4d2UJwOVLqHZMKuIo',
// } as const

// export type StripeSubscription = keyof typeof stripeSubscriptionsEnum

// export type StripeSubscriptionFeatures = {
//   [key in StripeSubscription]: {
//     name: string
//     description: string
//     price: number
//     features: string[]
//   }
// }

// export const subscriptionInfo: StripeSubscriptionFeatures = {
//   pro_monthly: {
//     name: 'Pro Monthly',
//     description: 'Get access to all the features',
//     price: 9.99,
//     features: ['Feature 1', 'Feature 2', 'Feature 3'],
//   },
//   pro_yearly: {
//     name: 'Pro Yearly',
//     description: 'Get access to all the features',
//     price: 99.99,
//     features: ['Feature 1', 'Feature 2', 'Feature 3'],
//   },
// }

const info = {
  price_1Q7h9VP4d2UJwOVLADNKnh8K: {
    name: 'Pro Yearly',
    description: 'Get access to all the features',
    price: 99.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  price_1Q7h8PP4d2UJwOVLqHZMKuIo:{
    name: 'Pro Monthly',
    description: 'Get access to all the features',
    price: 9.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  }
}


export const load = (async ({ params, locals }) => {
  const user = locals.user
  console.log('user', user)

  const priceId = params.priceId
  console.log('priceId', priceId)

  // if (!Object.keys(stripeSubscriptionsEnum).includes(type)) {
  //   return error(404, 'Subscription not found')
  // }
  // @ts-expect-error sei la
  const priceInfo = info[priceId]
  console.log('priceInfo', priceInfo)
  if (!priceInfo) {
    return error(404, 'Subscription not found')
  }


  if (!user?.name) {
    return redirect(301, `/onboarding?redirect=/checkout/subscription/${priceId}`)
  }

  if (user.has_subscription) {
    return error(403, 'User already has a subscription')
  }

  try {
    // @ts-expect-error sei la
    const sub = await sCustomer.createSubscription(user, priceId)

    console.log(sub)

    if (
      typeof sub.latest_invoice === 'string' ||
      typeof sub.latest_invoice?.payment_intent === 'string'
    ) {
      console.error('string invoice')
      return error(500, 'Error creating subscription')
    }

    return {
      info: priceInfo,
      subscriptionId: sub.id,
      clientSecret: sub.latest_invoice?.payment_intent?.client_secret,
    }
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return error(500, err.message)
    }
    return error(500, 'Error creating subscription')
  }
}) satisfies PageServerLoad
