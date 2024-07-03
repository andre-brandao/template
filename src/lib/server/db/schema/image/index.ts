import {
  sqliteTable,
  text,
  integer,
  blob,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { userTable } from '../user'

const imageTable = sqliteTable('image', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  uploaded_by: text('uploaded_by')
    // .notNull()
    .references(() => userTable.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
})

type SelectImage = typeof imageTable.$inferSelect
type InsertImage = typeof imageTable.$inferInsert
export { imageTable, type SelectImage, type InsertImage }
