import Stripe from 'stripe'

// import { env } from '$env/dynamic/private'
// import { dev } from '$app/environment'

// export const stripe = new Stripe(
//   dev ? env.STRIPE_SECRET_KEY_TESTE : env.STRIPE_SECRET_KEY,
//   {
//     apiVersion: '2024-06-20',
//     typescript: true,

//   },
// )


// ! Uncomment this line when seeding the database
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TESTE || '', {
  apiVersion: '2024-06-20',
  typescript: true,
})
