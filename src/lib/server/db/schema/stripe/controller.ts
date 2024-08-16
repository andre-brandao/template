import { stripeCheckoutSessionTable, type InsertCheckoutSession } from '.'
import { db } from '$db'

import { and, eq } from 'drizzle-orm'

async function processStripeOrder(sessionId: string) {
  const [sessionDB] = await getStripeOrderFromID(sessionId)
  if (!sessionDB) {
    return
  }

  if (sessionDB.credited) {
    return
  }

  await db.update(stripeCheckoutSessionTable).set({
    credited: true,
  })
}

function insertCheckoutSession(session: InsertCheckoutSession) {
  return db.insert(stripeCheckoutSessionTable).values(session)
}

function getStripeOrderFromID(sessionId: string) {
  return db
    .select()
    .from(stripeCheckoutSessionTable)
    .where(eq(stripeCheckoutSessionTable.id, sessionId))
    .limit(1)
}

function getPendingCheckoutSessionFromUserID(userId: string) {
  return db
    .select()
    .from(stripeCheckoutSessionTable)
    .where(
      and(
        eq(stripeCheckoutSessionTable.userId, userId),
        eq(stripeCheckoutSessionTable.credited, false),
        eq(stripeCheckoutSessionTable.expired, false),
      ),
    )
}

export const stripeController = {
  processStripeOrder,
  insertCheckoutSession,
  getStripeOrderFromID,
  getPendingCheckoutSessionFromUserID,
}
