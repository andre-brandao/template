import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export interface DatabaseUser {
  id: string
  username: string
}

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
})

export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer('expires_at').notNull(),
})