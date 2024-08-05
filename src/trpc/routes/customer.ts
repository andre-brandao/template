import { publicProcedure, router } from '../t'

import { z } from 'zod'
import { customer as customerController } from '$db/controller'
import {
  insertCustomerSchema,
  insertAddressSchema,
} from '$lib/server/db/schema'

import { paramsSchema } from '$lib/components/table'
import { tableHelper } from '$lib/server/db/utils'

import { middleware } from '../middleware'

export const customer = router({
  insertCustomer: publicProcedure
    .use(middleware.auth)
    .input(insertCustomerSchema)
    .mutation(async ({ input }) => {
      return await customerController.insertCustomer(input)
    }),
  updateCustomer: publicProcedure
    .use(middleware.auth)
    .input(
      z.object({
        id: z.number(),
        customer: z.object({
          name: z.string().optional(),
          cellphone: z.string().optional(),
          phone: z.string().optional(),
          max_credit: z.number().optional(),
          used_credit: z.number().optional(),
          email: z.string().email().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, customer } = input
      return await customerController.updateCustomer(id, customer)
    }),
  insertAddress: publicProcedure
    .use(middleware.auth)
    .input(insertAddressSchema)
    .mutation(async ({ input }) => {
      return await customerController.insertAddress(input)
    }),

  getPaginatedCustomers: publicProcedure
    .input(paramsSchema)
    .query(async ({ input }) => {
      return await tableHelper(
        customerController.getCustomers().$dynamic(),
        customerController.tables.customerTable,
        'name',
        input,
      )
    }),
})
