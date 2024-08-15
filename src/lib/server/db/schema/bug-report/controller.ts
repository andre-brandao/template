import { desc, eq } from 'drizzle-orm'
import { userTable } from '../user'
import {
  bugReportTable,
  type InsertBugReport,
  type SelectBugReport,
  logsTable,
  type InsertLogs,
  // type SelectLogs,
} from '$db/schema'
import { db } from '$db'

function insertBugReport(report: InsertBugReport) {
  return db
    .insert(bugReportTable)
    .values({
      text: report.text,
      created_by: report.created_by,
      status: 'TODO',
      metadata: report.metadata,
    })
    .returning({
      id: bugReportTable.id,
    })
}

function updateBugReportStatus(
  id: SelectBugReport['id'],
  status: SelectBugReport['status'],
) {
  return db
    .update(bugReportTable)
    .set({
      status: status,
    })
    .where(eq(bugReportTable.id, id))
}

function getBugReports() {
  return db
    .select({
      id: bugReportTable.id,
      text: bugReportTable.text,
      status: bugReportTable.status,
      created_at: bugReportTable.created_at,
      created_by_name: userTable.username,
      metadata: bugReportTable.metadata,
    })
    .from(bugReportTable)
    .leftJoin(userTable, eq(bugReportTable.created_by, userTable.id))
}

function insertLogs(log: InsertLogs) {
  return db.insert(logsTable).values(log)
}
function getLogs() {
  return db
    .select({
      id: logsTable.id,
      created_at: logsTable.created_at,
      text: logsTable.text,
      metadata: logsTable.metadata,
      error: logsTable.error,
      user_name: userTable.username,
    })
    .from(logsTable)
    .leftJoin(userTable, eq(logsTable.created_by, userTable.id))

    .limit(5)
    .orderBy(desc(logsTable.created_at))
}
function allLogs() {
  return db
    .select({
      id: logsTable.id,
      created_at: logsTable.created_at,
      text: logsTable.text,
      metadata: logsTable.metadata,
      error: logsTable.error,
      user_name: userTable.username,
    })
    .from(logsTable)
    .leftJoin(userTable, eq(logsTable.created_by, userTable.id))
}

export const bugReport = {
  insertBugReport,
  updateBugReportStatus,
  getBugReports,
  allLogs,
  insertLogs,
  getLogs,
}