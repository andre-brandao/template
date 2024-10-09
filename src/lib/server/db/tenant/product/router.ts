import { publicProcedure, router } from '$trpc/t'

import { z } from 'zod'

import { product as productController } from '$db/tenant/controller'

import {
  productCategoryTable,
  productItemTable,
  productTable,
} from '$db/tenant/schema'
import { createInsertSchema } from 'drizzle-zod'

export const productRouter = router({
  insertProduct: publicProcedure
    .input(createInsertSchema(productTable))
    .mutation(async ({ input, ctx }) => {
      return await productController(ctx.tenantDb)
        .insertProduct(input)
        .returning()
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
    .mutation(async ({ input, ctx }) => {
      const { id, prod } = input
      return await productController(ctx.tenantDb)
        .updateProduct(id, prod)
        .returning()
    }),
  deleteProduct: publicProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      return await productController(ctx.tenantDb).deleteProduct(input)
    }),

  insertProductItem: publicProcedure
    .input(createInsertSchema(productItemTable))
    .mutation(async ({ input, ctx }) => {
      return await productController(ctx.tenantDb)
        .insertProductItem(input)
        .returning()
    }),
  updateProductItem: publicProcedure
    .input(
      z.object({
        id: z.number(),
        prod: createInsertSchema(productTable).partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, prod } = input
      return await productController(ctx.tenantDb)
        .updateProductItem(id, prod)
        .returning()
    }),
  deleteProductItem: publicProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      return await productController(ctx.tenantDb).deleteProductItem(input)
    }),

  insertProductCategory: publicProcedure
    .input(createInsertSchema(productCategoryTable))
    .mutation(async ({ input, ctx }) => {
      return await productController(ctx.tenantDb)
        .insertProductCategory(input)
        .returning()
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
    .mutation(async ({ input, ctx }) => {
      const { id, prod } = input
      return await productController(ctx.tenantDb)
        .updateProductCategory(id, prod)
        .returning()
    }),
  deleteProductCategory: publicProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      return await productController(ctx.tenantDb).deleteProductCategory(input)
    }),
})
