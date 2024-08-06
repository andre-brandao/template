/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  skuTable,
  distribuidoraTable,
  productStockTable,
  stockTransactionTable,
} from '$db/schema'

import type {
  SelectProductStock,
  InsertProductStock,
  SelectProductItem,
  SelectDistribuidora,
  InsertDistribuidora,
  InsertStockTransaction,
  SelectSku,
  InsertSku,
} from '$db/schema'

import { db } from '$db'
import { eq, sql } from 'drizzle-orm'

function insertSKU(data: InsertSku) {
  return db.insert(skuTable).values(data)
}
function getSKU() {
  return db.select().from(skuTable)
}

function insertDistribuidora(data: InsertDistribuidora) {
  return db.insert(distribuidoraTable).values(data)
}
function getDistribuidoras() {
  return db.select().from(distribuidoraTable)
}

function getDistribuidoraById(id: SelectDistribuidora['id']) {
  return db
    .select()
    .from(distribuidoraTable)
    .where(eq(distribuidoraTable.id, id))
}

function insertProductStock(data: InsertProductStock) {
  return db.insert(productStockTable).values(data)
}

async function insertStockTransaction(data: InsertStockTransaction) {
  const { stock_id } = data
  return await db.transaction(async trx => {
    await trx.insert(stockTransactionTable).values(data)
    await trx
      .update(productStockTable)
      .set({
        quantity: sql`${productStockTable.quantity} + ${data.quantity}`,
      })
      .where(eq(productStockTable.id, stock_id))
  })
}

export const stock = {
  insertSKU,
  getSKU,
  insertProductStock,
  insertStockTransaction,
  getDistribuidoras,
  insertDistribuidora,
  getDistribuidoraById,
}
