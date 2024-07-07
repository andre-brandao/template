/* eslint-disable @typescript-eslint/no-unused-vars */
import { eq } from 'drizzle-orm'

import { db } from '$lib/server/db'

import {
  brandTable,
  categoryTable,
  productEntryTable,
  productPriceTable,
  pricesTable,
  productTable,
} from '$db/schema'
import type {
  InsertProduct,
  SelectProduct,
  SelectProductEntry,
  InsertProductEntry,
  InsertBrand,
  SelectBrand,
  InsertCategory,
  SelectCategory,
  InsertPrices,
  SelectPrices,
  InsertProductPrice,
  SelectProductPrice,
} from '$db/schema'

function getProducts() {
  return db.select().from(productTable)
}
import { getRowCount } from '$db/utils'
function getProductCount() {
  return getRowCount(productTable)
}

function insertProduct(data: InsertProduct) {
  return db.insert(productTable).values(data)
}

function updateProduct(id: SelectProduct['id'], data: Partial<InsertProduct>) {
  return db.update(productTable).set(data).where(eq(productTable.id, id))
}

function getBrands() {
  return db.select().from(brandTable)
}

function insertBrand(data: InsertBrand) {
  return db.insert(brandTable).values(data)
}

function getCategories() {
  return db.select().from(categoryTable)
}

function insertCategory(data: InsertCategory) {
  return db.insert(categoryTable).values(data)
}

function getPrices() {
  return db.select().from(pricesTable)
}

function insertPrices(data: InsertPrices) {
  return db.insert(pricesTable).values(data)
}

function insertProductPrice(data: InsertProductPrice) {
  return db.insert(productPriceTable).values(data)
}

function insertProductEntry(data: InsertProductEntry) {
  return db.insert(productEntryTable).values(data)
}

function updateProductPrice(
  id: SelectProductPrice['id'],
  data: Partial<InsertProductPrice>,
) {
  return db
    .update(productPriceTable)
    .set(data)
    .where(eq(productPriceTable.id, id))
}

function getProductsByCategory() {
  return db.query.categoryTable.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      products: {
        columns: {
          id: true,

          image_id: true,
          quantity: true,
        },
        with: {
          product: {
            columns: {
              name: true,
              description: true,
              id: true,
            },
          },

          prices: {
            columns: {
              price: true,
            },
            with: {
              price_label: {
                columns: {
                  label: true,
                },
              },
            },
          },
          brand: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  })
}

function getProductFromID(id: number) {
  return db.query.productTable.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: {
      entry: {
        columns: {
          id: true,
          image_id: true,
          quantity: true,
        },
        with: {
          category: true,
          brand: true,
          prices: {
            columns: {
              id: true,
              price: true,
            },
            // where: (p, { eq, sql }) => eq(p.price_id, sql`${}`),
            with: {
              price_label: {
                columns: {
                  label: true,
                  is_retail: true,
                },
              },
            },
          },
        },
      },
    },
  })
}


export const product = {
  tables: { productTable },
  getProducts,
  getProductCount,
  insertProduct,
  updateProduct,
  getBrands,
  insertBrand,
  getCategories,
  insertCategory,
  getPrices,
  insertPrices,
  insertProductPrice,
  updateProductPrice,
  getProductsByCategory,
  insertProductEntry,
  
  getProductFromID,
}
