import { publicProcedure, router } from '../t'

import { z } from 'zod'

import { product as productController } from '$db/controller'

import {
  insertProductCategorySchema,
  insertProductItemSchema,
  insertProductSchema,
} from '$db/schema'

import { tableHelper } from '$db/utils'
import { paramsSchema } from '$lib/components/table'

export const product = router({
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
  paginatedProductItems: publicProcedure
    .input(paramsSchema)
    .query(async ({ input }) => {
      return await tableHelper(
        productController.getProductItems().$dynamic(),
        productController.tables.productItemTable,
        'name',
        input,
      )
    }),

  insertProduct: publicProcedure
    .input(insertProductSchema)
    .mutation(async ({ input }) => {
      return await productController.insertProduct(input)
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
    .mutation(async ({ input }) => {
      const { id, prod } = input
      return await productController.updateProduct(id, prod).returning()
    }),
  deleteProduct: publicProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await productController.deleteProduct(input)
    }),

  insertProductItem: publicProcedure
    .input(insertProductItemSchema)
    .mutation(async ({ input }) => {
      return await productController.insertProductItem(input)
    }),
  updateProductItem: publicProcedure
    .input(
      z.object({
        id: z.number(),
        prod: z.object({
          name: z.string(),
          sku: z.string(),
          quantity: z.number(),
          retail_price: z.number(),
          wholesale_price: z.number(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, prod } = input
      return await productController.updateProductItem(id, prod)
    }),
  deleteProductItem: publicProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await productController.deleteProductItem(input)
    }),

  insertProductCategory: publicProcedure
    .input(insertProductCategorySchema)
    .mutation(async ({ input }) => {
      return await productController.insertProductCategory(input)
    }),
  updateProductCategory: publicProcedure
    .input(
      z.object({
        id: z.number(),
        prod: z.object({
          name: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, prod } = input
      return await productController.updateProductCategory(id, prod)
    }),
  deleteProductCategory: publicProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await productController.deleteProductCategory(input)
    }),
})
