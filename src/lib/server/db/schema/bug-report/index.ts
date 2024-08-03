/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  sqliteTable,
  text,
  integer,
  blob,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { eq, relations, sql } from 'drizzle-orm'
import { userTable } from '../user'

export const bugReportTable = sqliteTable('bugReport', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  created_by: text('created_by')
    .references(() => userTable.id, {
      onDelete: 'set null',
    })
    .default(''),
  status: text('status', { enum: ['DONE', 'IN_PROGRESS', 'TODO'] }).notNull(),
  text: text('name').notNull(),
  metadata: text('metadata', { mode: 'json' }),
})

// const bugReportRelations = relations(bugReportTable, ({ one }) => ({
//   reporter: one(userTable),
// }))

export type SelectBugReport = typeof bugReportTable.$inferSelect
export type InsertBugReport = typeof bugReportTable.$inferInsert
