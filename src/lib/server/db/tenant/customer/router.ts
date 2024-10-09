import { publicProcedure, router } from '$trpc/t'

// import { z } from 'zod'
import {
  customer as customerController,
  product as productController,
} from '$db/controller'
import { insertAddressSchema, userTable } from '$db/schema'

import { middleware } from '$trpc/middleware'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export const customerRouter = router({
  // paginatedUsers: publicProcedure
  //   .input(paramsSchema)
  //   .query(async ({ input }) => {
  //     return await tableHelper(
  //       userController.getPublicInfo().$dynamic(),
  //       userTable,
  //       'username',
  //       input,
  //     )
  //   }),
  insertAddress: publicProcedure
    .use(middleware.auth)
    .input(insertAddressSchema)
    .mutation(async ({ input }) => {
      return await customerController.insertAddress(input)
    }),

  makerUserOrder: publicProcedure
    .use(middleware.auth)
    .input(
      z.object({
        items: z.array(
          z.object({
            quantity: z.number(),
            item_id: z.number(),
            observation: z.string().optional(),
          }),
        ),
        payment_method: z.string(),
        address_id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx.locals
      if (!user)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })

      const product_ids = input.items.map(item => item.item_id)
      const product_items =
        await productController.getProductItemsByIDS(product_ids)
      const order_items = product_items.map(item => {
        const found = input.items.find(i => i.item_id === item.id)
        if (!found)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid input',
          })
        const { quantity, observation } = found

        return {
          product_id: item.product_id,
          quantity,
          observation,
          price: item.price,
        }
      })
      return await customerController.insertOrder({
        order_items: order_items,
        order_info: {
          user_id: user.id,
          address_id: input.address_id,
          payment_method: input.payment_method,
          total: order_items.reduce((acc, item) => acc + item.price, 0),
          observation: 'TODO: put observation',
        },
      })
    }),
})
