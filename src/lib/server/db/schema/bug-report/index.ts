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

const bugReportTable = sqliteTable('bugReport', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  created_by: text('created_by').references(() => userTable.id, {
    onDelete: 'set null',
  }),
  status: text('status', { enum: ['DONE', 'IN_PROGRESS', 'TODO'] }).notNull(),
  text: text('name').notNull(),
})

// const bugReportRelations = relations(bugReportTable, ({ one }) => ({
//   reporter: one(userTable),
// }))

type SelectBugReport = typeof bugReportTable.$inferSelect
type InsertBugReport = typeof bugReportTable.$inferInsert

export {
  bugReportTable,
  // bugReportRelations,
  type SelectBugReport,
  type InsertBugReport,
}
