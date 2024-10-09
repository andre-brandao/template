/* eslint-disable @typescript-eslint/no-unused-vars */
import { relations } from 'drizzle-orm'
import {
  userTable,
  addressTable,
  customerOrderTable,
  productCategoryTable,
  productItemTable,
  productTable,
  orderItemTable,
} from './schema'

export const userRelations = relations(userTable, ({ one, many }) => ({
  addresses: many(addressTable),
  orders: many(customerOrderTable),
}))

export const productRelations = relations(productTable, ({ one, many }) => ({
  category: one(productCategoryTable, {
    fields: [productTable.category_id],
    references: [productCategoryTable.id],
  }),
  items: many(productItemTable),
}))

export const productItemRelations = relations(
  productItemTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productItemTable.product_id],
      references: [productTable.id],
    }),
    orders: many(orderItemTable),
  }),
)

export const productCategoryRelations = relations(
  productCategoryTable,
  ({ one, many }) => ({
    products: many(productTable),
  }),
)

export const addressRelations = relations(addressTable, ({ one, many }) => ({
  customer: one(userTable, {
    fields: [addressTable.user_id],
    references: [userTable.id],
  }),
  orders: many(customerOrderTable),
}))

export const customerOrderRelations = relations(
  customerOrderTable,
  ({ one, many }) => ({
    customer: one(userTable, {
      fields: [customerOrderTable.user_id],
      references: [userTable.id],
    }),
    address: one(addressTable, {
      fields: [customerOrderTable.address_id],
      references: [addressTable.id],
    }),
    items: many(orderItemTable),
  }),
)

export const orderItemRelations = relations(
  orderItemTable,
  ({ one, many }) => ({
    order: one(customerOrderTable, {
      fields: [orderItemTable.order_id],
      references: [customerOrderTable.id],
    }),
    product: one(productItemTable, {
      fields: [orderItemTable.product_id],
      references: [productItemTable.id],
    }),
  }),
)
