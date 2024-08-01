import { eq } from 'drizzle-orm'
import { db } from '$db'
import {
  type InsertUser,
  userTable,
  userVerificationCodeTable,
  type UserPermissions,
  type SelectUser,
  sessionTable,
} from '$db/schema'

const DEFAULT_PERMISSIONS: UserPermissions = {
  isAdmin: false,
}

function usernameExists(username: string) {
  return db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1)
}
function emailExists(email: string) {
  return db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1)
}

export function isValidEmail(email: string): boolean {
  return /.+@.+/.test(email)
}

function insertUser(user: InsertUser) {
  return db.insert(userTable).values(user).run()
}

function updateUser(userId: SelectUser['id'], user: Partial<SelectUser>) {
  return db.update(userTable).set(user).where(eq(userTable.id, userId)).run()
}

function getSessions(userId: SelectUser['id']) {
  return db.select().from(sessionTable).where(eq(sessionTable.userId, userId))
}

function updateUserPermissions(
  userId: SelectUser['id'],
  permissions: UserPermissions,
) {
  return db
    .update(userTable)
    .set({ permissions })
    .where(eq(userTable.id, userId))
    .run()
}

import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo'
import { generateRandomString, alphabet } from 'oslo/crypto'
import type { User } from 'lucia'

async function generateEmailVerificationCode(
  userId: string,
  email: string,
): Promise<string> {

  await db
    .delete(userVerificationCodeTable)
    .where(eq(userVerificationCodeTable.userId, userId))
    .all()
  const code = generateRandomString(8, alphabet('0-9'))

  await db.insert(userVerificationCodeTable).values({
    userId,
    email,
    code,
    expiresAt: createDate(new TimeSpan(15, 'm')), // 15 minutes
  })
  return code
}
async function verifyVerificationCode(
  user: User,
  code: string,
): Promise<boolean> {

  const [databaseCode] = await db
    .select()
    .from(userVerificationCodeTable)
    .where(eq(userVerificationCodeTable.userId, user.id))
  if (!databaseCode || databaseCode.code !== code) {
    // await db.commit()
    return false
  }

  await db
    .delete(userVerificationCodeTable)
    .where(eq(userVerificationCodeTable.id, databaseCode.id))
    .run()

  if (!isWithinExpirationDate(databaseCode.expiresAt)) {
    return false
  }
  if (databaseCode.email !== user.email) {
    return false
  }
  return true
}

export const user = {
  usernameExists,
  emailExists,
  insertUser,
  updateUser,
  updateUserPermissions,
  getSessions,
  generateEmailVerificationCode,
  verifyVerificationCode,
  DEFAULT_PERMISSIONS,
}
