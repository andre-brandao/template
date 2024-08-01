import { eq } from 'drizzle-orm'
import { db } from '$db'
import {
  type InsertUser,
  userTable,
  userVerificationCodeTable,
  passwordResetCodeTable,
  type UserPermissions,
  type SelectUser,
  sessionTable,
} from '$db/schema'

import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo'
import { generateRandomString, alphabet, sha256 } from 'oslo/crypto'
import type { User } from 'lucia'
import { encodeHex } from 'oslo/encoding'
import { generateIdFromEntropySize } from 'lucia'

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

function getUserById(userId: string) {
  return db.select().from(userTable).where(eq(userTable.id, userId)).limit(1)
}
function emailExists(email: string) {
  return db.select().from(userTable).where(eq(userTable.email, email)).limit(1)
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

async function createPasswordResetToken(userId: string): Promise<string> {
  // optionally invalidate all existing tokens
  // await db
  //   .table('password_reset_token')
  //   .where('user_id', '=', userId)
  //   .deleteAll()
  await db
    .delete(passwordResetCodeTable)
    .where(eq(passwordResetCodeTable.userId, userId))
    .all()
  const tokenId = generateIdFromEntropySize(25) // 40 character
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)))
  // await db.table('password_reset_token').insert({
  //   token_hash: tokenHash,
  //   user_id: userId,
  //   expires_at: createDate(new TimeSpan(2, 'h')),
  // })
  await db.insert(passwordResetCodeTable).values({
    token_hash: tokenHash,
    userId,
    expiresAt: createDate(new TimeSpan(2, 'h')),
  })
  return tokenId
}

async function getPasswordResetToken(token: string) {
  return db
    .select()
    .from(passwordResetCodeTable)
    .where(eq(passwordResetCodeTable.token_hash, token))
    .limit(1)
}

async function deletePasswordResetToken(token: string) {
  return db
    .delete(passwordResetCodeTable)
    .where(eq(passwordResetCodeTable.token_hash, token))
    .run()
}
export const user = {
  usernameExists,
  emailExists,
  getUserById,
  insertUser,
  updateUser,
  updateUserPermissions,
  getSessions,
  generateEmailVerificationCode,
  verifyVerificationCode,
  createPasswordResetToken,
  getPasswordResetToken,
  deletePasswordResetToken,
  DEFAULT_PERMISSIONS,
}
