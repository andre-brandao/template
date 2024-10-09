/* eslint-disable @typescript-eslint/no-unused-vars */
import { publicProcedure, t } from './t'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// ROUTES
import { userRouter } from '$lib/server/db/tenant/user/router'
import { productRouter } from '$lib/server/db/tenant/product/router'
import { customerRouter } from '$lib/server/db/tenant/customer/router'
import { bugReportRouter } from '$lib/server/db/tenant/bug-report/router'

export const router = t.router({
  auth: userRouter,
  product: productRouter,
  customer: customerRouter,
  bugReport: bugReportRouter,
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
