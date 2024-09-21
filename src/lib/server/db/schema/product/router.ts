import { publicProcedure, router } from '$trpc/t'

import { z } from 'zod'

import { product as productController } from '$db/controller'

import {
  insertProductCategorySchema,
  insertProductItemSchema,
  insertProductSchema,
  stockTransactionTable,
} from '$db/schema'

import { tableHelper, paramsSchema } from '$db/utils'
export type TableState = z.infer<typeof paramsSchema>

export const productRouter = router({
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

  paginatedTransactions: publicProcedure
    .input(z.object({
      item_id: z.number(),
      table_state: paramsSchema
    }))
    .query(async ({ input }) => {
      const { item_id, table_state } = input
      return await tableHelper(
        productController.getProductTransactions(item_id).$dynamic(),
        stockTransactionTable,
        'name',
        table_state,
      )
    }),

  insertProduct: publicProcedure
    .input(insertProductSchema)
    .mutation(async ({ input }) => {
      return await productController.insertProduct(input).returning()
    }),
  updateProduct: publicProcedure
    .input(
      z.object({
        id: z.number(),
        prod: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          image: z.number().optional(),
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
      return await productController.insertProductItem(input).returning()
    }),
  updateProductItem: publicProcedure
    .input(
      z.object({
        id: z.number(),
        prod: insertProductItemSchema.partial(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, prod } = input
      return await productController.updateProductItem(id, prod).returning()
    }),
  deleteProductItem: publicProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await productController.deleteProductItem(input)
    }),

  insertProductCategory: publicProcedure
    .input(insertProductCategorySchema)
    .mutation(async ({ input }) => {
      return await productController.insertProductCategory(input).returning()
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
      return await productController.updateProductCategory(id, prod).returning()
    }),
  deleteProductCategory: publicProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await productController.deleteProductCategory(input)
    }),
})
