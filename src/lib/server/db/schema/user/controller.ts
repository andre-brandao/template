import { eq } from 'drizzle-orm'
import { db } from '$db'
import {
  type InsertUser,
  userTable,
  type UserPermissions,
  type SelectUser,
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

export function isValidEmail(email: string): boolean {
  return /.+@.+/.test(email)
}

function insertUser(user: InsertUser) {
  return db.insert(userTable).values(user).run()
}

function updateUser(userId: SelectUser['id'], user: Partial<SelectUser>) {
  return db.update(userTable).set(user).where(eq(userTable.id, userId)).run()
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

export const user = {
  usernameExists,
  insertUser,
  updateUser,
  updateUserPermissions,
  DEFAULT_PERMISSIONS,
}
