import { publicProcedure, router } from '../t'

import { z } from 'zod'

import { product as productController } from '$db/controller'

import { tableHelper } from '$db/utils'
import { paramsSchema } from '$lib/components/table'
import {
  insertProductCategorySchema,
  brandInsertSchema,
  pricesInsertSchema,
  categoryInsertSchema,
  productEntryInsertSchema,
  productPriceInsertSchema,
} from '$db/schema/product'

export const product = router({
  getProduct: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await productController.getProductFromID(input)
  }),
  paginatedProducts: publicProcedure
    .input(paramsSchema)
    .query(async ({ input }) => {
      return await tableHelper(
        productController.getProducts().$dynamic(),
        productController.tables.productTable,
        'name',
        input,
      )
    }),
  insertProduct: publicProcedure
    .input(insertProductCategorySchema)
    .query(async ({ input }) => {
      return await productController.insertProduct(input)
    }),

  getBrands: publicProcedure.query(async () => {
    return await productController.getBrands()
  }),
  insertBrand: publicProcedure
    .input(brandInsertSchema)
    .query(async ({ input }) => {
      return await productController.insertBrand(input)
    }),
  insertCategory: publicProcedure
    .input(categoryInsertSchema)
    .query(async ({ input }) => {
      return await productController.insertCategory(input)
    }),
  getCategories: publicProcedure.query(async () => {
    return await productController.getCategories()
  }),
  insertPrices: publicProcedure
    .input(pricesInsertSchema)
    .query(async ({ input }) => {
      return await productController.insertPrices(input)
    }),
  insertProductPrice: publicProcedure
    .input(productPriceInsertSchema)
    .query(async ({ input }) => {
      return await productController.insertProductPrice(input)
    }),
  insertProductEntry: publicProcedure
    .input(productEntryInsertSchema)
    .query(async ({ input }) => {
      return await productController.insertProductEntry(input)
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
      return await productController.updateProduct(id, prod)
    }),
  updateProductPrice: publicProcedure
    .input(z.object({ id: z.number(), price: z.number() }))
    .query(async ({ input }) => {
      const { id, price } = input
      return await productController.updateProductPrice(id, {
        price: price,
      })
    }),
})
