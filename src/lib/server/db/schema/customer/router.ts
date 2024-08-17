import { publicProcedure, router } from '$trpc/t'

// import { z } from 'zod'
import {
  customer as customerController,
  user as userController,
} from '$db/controller'
import { insertAddressSchema, userTable } from '$lib/server/db/schema'

import { paramsSchema } from '$lib/components/table'
import { tableHelper } from '$lib/server/db/utils'

import { middleware } from '$trpc/middleware'

export const customerRouter = router({
  paginatedUsers: publicProcedure
    .input(paramsSchema)
    .query(async ({ input }) => {
      return await tableHelper(
        userController.getPublicUserInfo().$dynamic(),
        userTable,
        'username',
        input,
      )
    }),

  

  insertAddress: publicProcedure
    .use(middleware.auth)
    .input(insertAddressSchema)
    .mutation(async ({ input }) => {
      return await customerController.insertAddress(input)
    }),
})
