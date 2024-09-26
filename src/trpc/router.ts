// lib/trpc/router.ts

import { publicProcedure, t } from './t'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// ROUTES
import { userRouter } from '$drizzle/schema/user/router'
import { productRouter } from '$drizzle/schema/product/router'
import { customerRouter } from '$drizzle/schema/customer/router'
import { bugReportRouter } from '$drizzle/schema/bug-report/router'
import { stripeRouter } from '$drizzle/schema/stripe/router'
import { drizzleTable } from './table'

export const router = t.router({
  auth: userRouter,
  product: productRouter,
  customer: customerRouter,
  bugReport: bugReportRouter,
  checkout: stripeRouter,
  drizzleTable,
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
