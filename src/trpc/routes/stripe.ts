import { publicProcedure, router } from '../t'

import { z } from 'zod'
// import { insertMapSchema, type InsertMapPoint } from '$db/schema'

import { middleware } from '../middleware'
import { TRPCError } from '@trpc/server'
import { stripe } from '$lib/server/stripe'

import { user as userController } from '$lib/server/db/controller'

export const checkout = router({
  createCheckoutSession: publicProcedure
    .use(middleware.auth)
    .input(
      z.object({
        items: z.array(
          z.object({
            price_data: z.object({
              product_data: z.object({
                name: z.string(),
                images: z.array(z.string()),
              }),
              unit_amount: z.number(),
            }),
            quantity: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { items } = input
      const { url } = ctx

      const { user } = ctx.locals

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to checkout',
        })
      }

      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.price_data.product_data.name,
            images: item.price_data.product_data.images,
          },
          unit_amount: item.price_data.unit_amount,
        },
        quantity: item.quantity,
      }))

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url.origin}/checkout/cancel`,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
        },
      })

      console.log(session)

      const geoPoints = items[0].quantity
      await userController.insertCheckoutSession({
        id: session.id,
        userId: user.id,
        expiresAt: new Date(session.expires_at),
        stripe_json: session,
        geopoints: geoPoints,
        credited: false,
        expired: false,
      })

      return {
        payment_url: session.url,
      }
    }),

  //   deleteMap: publicProcedure
  //     .input(z.object({ id: z.number() }))
  //     .mutation(async ({ input, ctx }) => {
  //       const { id } = input

  //       return await mapController.de
  //     }),
})
