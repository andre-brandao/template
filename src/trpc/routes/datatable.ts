import { publicProcedure, router } from '../t'

import { z } from 'zod'

import { product } from '$db/controller'

import {
  insertProductCategorySchema,
  brandInsertSchema,
  pricesInsertSchema,
  categoryInsertSchema,
  productEntryInsertSchema,
  productPriceInsertSchema,
} from '$db/schema/product'

export const auth = router({
  getProduct: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await product.getProductFromID(input)
  }),
  insertProduct: publicProcedure
    .input(insertProductCategorySchema)
    .query(async ({ input }) => {
      return await product.insertProduct(input)
    }),

  getBrands: publicProcedure.query(async () => {
    return await product.getBrands()
  }),
  insertBrand: publicProcedure
    .input(brandInsertSchema)
    .query(async ({ input }) => {
      return await product.insertBrand(input)
    }),
  insertCategory: publicProcedure
    .input(categoryInsertSchema)
    .query(async ({ input }) => {
      return await product.insertCategory(input)
    }),
  getCategories: publicProcedure.query(async () => {
    return await product.getCategories()
  }),
  insertPrices: publicProcedure
    .input(pricesInsertSchema)
    .query(async ({ input }) => {
      return await product.insertPrices(input)
    }),
  insertProductPrice: publicProcedure
    .input(productPriceInsertSchema)
    .query(async ({ input }) => {
      return await product.insertProductPrice(input)
    }),
  insertProductEntry: publicProcedure
    .input(productEntryInsertSchema)
    .query(async ({ input }) => {
      return await product.insertProductEntry(input)
    }),
  updateProduct: publicProcedure
    .input(
      z.object({
        id: z.number(),
        prod: z.object({
          name: z.string(),
          description: z.string(),
        }),
      }),
    )
    .query(async ({ input }) => {
      const { id, prod } = input
      return await product.updateProduct(id, prod)
    }),
  updateProductPrice: publicProcedure
    .input(z.object({ id: z.number(), price: z.number() }))
    .query(async ({ input }) => {
      const { id, price } = input
      return await product.updateProductPrice(id, {
        price: price,
      })
    }),
})
