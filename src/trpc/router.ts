// lib/trpc/router.ts

import { t } from './t'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// ROUTES
import { auth } from './routes/auth'
import { product } from './routes/product'
import { pushNotification } from './routes/push-notification'
import { customer } from './routes/customer'
import { stock } from './routes/stock'
import { bugReporter as bugReport } from './routes/bugReport'
export const router = t.router({
  auth,
  product,
  customer,
  pushNotification,
  bugReport,
  stock,
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
