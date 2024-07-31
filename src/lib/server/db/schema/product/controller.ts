/* eslint-disable @typescript-eslint/no-unused-vars */
import { eq } from 'drizzle-orm'

import { db } from '$lib/server/db'

import {
  productTable,
  productItemTable,
  productCategoryTable,
} from '$db/schema'
import type {
  InsertProduct,
  SelectProduct,
  InsertProductItem,
  SelectProductCategory,
  InsertProductCategory,
  SelectProductItem,
} from '$db/schema'
import { getRowCount } from '$db/utils'

export const product = {
  tables: { productTable, productItemTable, productCategoryTable },
  // Product
  insertProduct: (data: InsertProduct) => {
    return db.insert(productTable).values(data)
  },
  updateProduct: (id: SelectProduct['id'], data: Partial<InsertProduct>) => {
    return db.update(productTable).set(data).where(eq(productTable.id, id))
  },
  deleteProduct: (id: SelectProduct['id']) => {
    return db.delete(productTable).where(eq(productTable.id, id))
  },
  getProductByID: (id: SelectProduct['id']) => {
    return db.query.productTable.findFirst({
      where: eq(productTable.id, id),
      with: {
        items: true,
        category: true,
      },
    })
  },
  getProducts: () => {
    return db.select().from(productTable)
  },

  // Product Item
  insertProductItem: (data: InsertProductItem) => {
    return db.insert(productItemTable).values(data).returning()
  },
  updateProductItem: (
    id: SelectProductItem['id'],
    data: Partial<InsertProductItem>,
  ) => {
    return db
      .update(productItemTable)
      .set(data)
      .where(eq(productItemTable.id, id))
  },
  deleteProductItem: (id: SelectProductItem['id']) => {
    return db.delete(productItemTable).where(eq(productItemTable.id, id))
  },
  getProductItems: () => {
    return db.select().from(productItemTable)
  },
  getProductItemsByProductID: (product_id: SelectProduct['id']) => {
    return db
      .select()
      .from(productItemTable)
      .where(eq(productItemTable.product_id, product_id))
  },

  // Product Category
  insertProductCategory: (data: InsertProductCategory) => {
    return db.insert(productCategoryTable).values(data)
  },
  updateProductCategory: (
    id: SelectProductCategory['id'],
    data: Partial<InsertProductCategory>,
  ) => {
    return db
      .update(productCategoryTable)
      .set(data)
      .where(eq(productCategoryTable.id, id))
  },
  deleteProductCategory: (id: SelectProductCategory['id']) => {
    return db
      .delete(productCategoryTable)
      .where(eq(productCategoryTable.id, id))
  },
  getProductCategories: () => {
    return db.select().from(productCategoryTable)
  },

  // OTHERS
  getCatalog: async () => {
    const rows = await db
      .select()
      .from(productTable)
      .innerJoin(
        productCategoryTable,
        eq(productCategoryTable.id, productTable.id),
      )
      .groupBy(productCategoryTable.id)

    const result = rows.reduce<
      Record<
        number,
        { category: SelectProductCategory; products: SelectProduct[] }
      >
    >((acc, row) => {
      const category = row.product_category
      const product = row.product
      if (!acc[category.id]) {
        acc[category.id] = { category: category, products: [] }
      }
      if (product) {
        acc[category.id].products.push(product)
      }
      return acc
    }, {})

    return result
  },
  queryCategorysWithProducts: () => {
    return db.query.productCategoryTable.findMany({
      with: {
        products: true,
      },
    })
  },
}
