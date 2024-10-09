/* eslint-disable @typescript-eslint/no-unused-vars */
import { publicProcedure, t } from './t'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// ROUTES
import { userRouter } from '$db/user/router'
import { productRouter } from '$db/product/router'
import { customerRouter } from '$db/customer/router'
import { bugReportRouter } from '$db/bug-report/router'


export const router = t.router({
  auth: userRouter,
  product: productRouter,
  customer: customerRouter,
  bugReport: bugReportRouter,
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
