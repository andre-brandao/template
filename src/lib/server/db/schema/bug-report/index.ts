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
import { createInsertSchema } from 'drizzle-zod'

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



export const logsTable = sqliteTable('logs', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  created_by: text('created_by')
    .references(() => userTable.id, {
      onDelete: 'set null',
    })
    .default(''),
  text: text('text').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  error: text('error'),
})

export type SelectLogs = typeof logsTable.$inferSelect
export type InsertLogs = typeof logsTable.$inferInsert

export const insertLogsSchema = createInsertSchema(logsTable)