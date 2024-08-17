import { publicProcedure, router } from '../t'

import { z } from 'zod'
// import { insertMapSchema, type InsertMapPoint } from '$db/schema'

import { middleware } from '../middleware'
import { TRPCError } from '@trpc/server'
import { stripe } from '$lib/server/stripe'

// import { user as userController } from '$lib/server/db/controller'
import { stripe as stripeControler } from '$lib/server/db/controller'

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
        order_id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { items, order_id } = input
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

      await stripeControler.insertCheckoutSession({
        id: session.id,
        userId: user.id,
        json: session,

        orderID: order_id,
      })

      return {
        payment_url: session.url,
      }
    }),

  createPaymentIntent: publicProcedure
    .use(middleware.auth)
    .input(
      z.object({
        amount: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { amount } = input
      const { user } = ctx.locals

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to checkout',
        })
      }

      const intent = await stripeControler.createPaymentIntent({
        amount,
      })

      return {
        client_secret: intent.client_secret,
      }
    }),

  //   deleteMap: publicProcedure
  //     .input(z.object({ id: z.number() }))
  //     .mutation(async ({ input, ctx }) => {
  //       const { id } = input

  //       return await mapController.de
  //     }),
})
