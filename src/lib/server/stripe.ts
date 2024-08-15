import Stripe from 'stripe'

import { env } from '$env/dynamic/private'
import { dev } from '$app/environment'

export const stripe = new Stripe(
  dev ? env.STRIPE_TESTE_SECRET_KEY : env.STRIPE_SECRET_KEY,
  {
    apiVersion: '2024-06-20',
  },
)
