import {
  sqliteTable,
  text,
  integer,

  // customType,
} from 'drizzle-orm/sqlite-core'
import { eq, sql } from 'drizzle-orm'
import { db } from '..'


export { userTable, type SelectUser, type InsertUser }

export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer('expires_at').notNull(),
})

type SelectUser = typeof userTable.$inferSelect
type InsertUser = typeof userTable.$inferInsert

// import { generateId } from 'lucia'
export interface DatabaseUser {
  id: string
  username: string
}

const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  // .$defaultFn(() => generateId(15)),

  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),

  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
})


 function usernameExists(username: string) {
  return db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1)
}

 function insertUser(user: InsertUser) {
  return db.insert(userTable).values(user).run()
}


export const user = {
  usernameExists,
  insertUser
}