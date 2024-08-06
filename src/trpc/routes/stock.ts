/* eslint-disable @typescript-eslint/no-unused-vars */
import { publicProcedure, router } from '../t'

import { z } from 'zod'
import { stock as stockController } from '$db/schema/stock/controller'
import { insertSKUschema } from '$db/schema/stock'

import { middleware } from '../middleware'

export const stock = router({
  getSKUs: publicProcedure.query(() => {
    return stockController.getSKU()
  }),
  insertSKU: publicProcedure
    .input(insertSKUschema)
    .use(middleware.auth)
    .mutation(async ({ input }) => {
      return stockController.insertSKU(input).returning()
    }),
})
