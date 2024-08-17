import { publicProcedure, router } from '../t'

import { z } from 'zod'
import { customer as customerController } from '$db/controller'
import {

  insertAddressSchema,
} from '$lib/server/db/schema'

import { paramsSchema } from '$lib/components/table'
import { tableHelper } from '$lib/server/db/utils'

import { middleware } from '../middleware'

export const customer = router({

  insertAddress: publicProcedure
    .use(middleware.auth)
    .input(insertAddressSchema)
    .mutation(async ({ input }) => {
      return await customerController.insertAddress(input)
    }),


})
