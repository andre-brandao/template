import { eq } from 'drizzle-orm'

import { db } from '$lib/server/db'

import { productCategoryTable, productTable } from '$db/schema'
import type {
  InsertProduct,
  SelectProduct,
  InsertProductCategory,
} from '$db/schema'

function getProductCategories() {
  return db.select().from(productCategoryTable)
}

function insertProductCategory(data: InsertProductCategory) {
  return db.insert(productCategoryTable).values(data)
}

function updateProductCategory(
  id: number,
  data: Partial<InsertProductCategory>,
) {
  return db
    .update(productCategoryTable)
    .set(data)
    .where(eq(productCategoryTable.id, id))
}

function getProducts() {
  return db.select().from(productTable)
}

async function getProductsByCategory() {
  const rows = await db
    .select()
    .from(productCategoryTable)
    .leftJoin(
      productTable,
      eq(productCategoryTable.id, productTable.category_id),
    )
    .all()

  const products = rows.reduce<Record<string, SelectProduct[]>>((acc, row) => {
    const category = row.product_category
    const product = row.product

    if (!acc[category.name]) {
      acc[category.name] = []
    }

    if (product) {
      acc[category.name].push(product)
    }
    return acc
  }, {})

  return products
}

function findProductByCategory() {
  return db.query.productCategoryTable.findMany({
    with: {
      products: true,
    },
  })
}

function getProductFromID(id: SelectProduct['id']) {
  return db.query.productTable.findFirst({
    with: {
      category: true,
    },
    where: eq(productTable.id, id),
  })
  // return db
  //   .select()
  //   .from(productTable)
  //   .where(eq(productTable.id, id))
  //   .leftJoin(
  //     productCategoryTable,
  //     eq(productTable.category_id, productCategoryTable.id),
  //   )
  //   .limit(1)
}

function insertProduct(data: InsertProduct) {
  return db.insert(productTable).values(data)
}

function updateProduct(id: SelectProduct['id'], data: Partial<InsertProduct>) {
  return db.update(productTable).set(data).where(eq(productTable.id, id))
}

export const product = {
  getProducts,
  getProductFromID,
  getProductsByCategory,
  findProductByCategory,
  getProductCategories,
  insertProductCategory,
  updateProductCategory,
  insertProduct,
  updateProduct,
}
