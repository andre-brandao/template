import { publicProcedure, router } from '../t'

import { z } from 'zod'

import { product } from '$db/controller'

import { insertProductCategorySchema } from '$db/schema/product'

export const auth = router({
  getProduct: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await product.getProductFromID(input)
  }),

  insertProductCategory: publicProcedure
    .input(insertProductCategorySchema)
    .query(async ({ input }) => {
      return await product.insertProductCategory(input)
    }),
})
