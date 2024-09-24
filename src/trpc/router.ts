// lib/trpc/router.ts

import { publicProcedure, t } from './t'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// ROUTES
import { userRouter } from '$db/schema/user/router'
import { productRouter } from '$db/schema/product/router'
import { customerRouter } from '$db/schema/customer/router'
import { bugReportRouter } from '$db/schema/bug-report/router'
import { stripeRouter } from '$db/schema/stripe/router'
import { drizzleTable } from './table'

export const router = t.router({
  auth: userRouter,
  product: productRouter,
  customer: customerRouter,
  bugReport: bugReportRouter,
  checkout: stripeRouter,
  drizzleTable
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
