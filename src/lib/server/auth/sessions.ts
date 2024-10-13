import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding'
import { encodeHexLowerCase } from '@oslojs/encoding'
import { sha256 } from '@oslojs/crypto/sha2'

import { db } from '$db'

import {
  sessionTable,
  userTable,
  type SelectUser,
  type SelectSession,
} from '$db/schema'
import { eq } from 'drizzle-orm'

export function generateId(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  const token = encodeBase32LowerCaseNoPadding(bytes)
  return token
}

export const sessionsC = {
  generateSessionToken: function (): string {
    const bytes = new Uint8Array(20)
    crypto.getRandomValues(bytes)
    const token = encodeBase32LowerCaseNoPadding(bytes)
    return token
  },

  createSession: async function (
    token: string,
    userId: string,
  ): Promise<SelectSession> {
    const sessionId = encodeHexLowerCase(
      sha256(new TextEncoder().encode(token)),
    )
    const session: SelectSession = {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    }
    await db.insert(sessionTable).values(session)
    return session
  },

  validateSessionToken: async function (
    token: string,
  ): Promise<SessionValidationResult> {
    const sessionId = encodeHexLowerCase(
      sha256(new TextEncoder().encode(token)),
    )
    const result = await db
      .select({ user: userTable, session: sessionTable })
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .where(eq(sessionTable.id, sessionId))
    if (result.length < 1) {
      return { session: null, user: null }
    }
    const { user, session } = result[0]
    if (Date.now() >= session.expiresAt.getTime()) {
      await db.delete(sessionTable).where(eq(sessionTable.id, session.id))
      return { session: null, user: null }
    }
    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
      session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      await db
        .update(sessionTable)
        .set({
          expiresAt: session.expiresAt,
        })
        .where(eq(sessionTable.id, session.id))
    }
    return { session, user }
  },

  invalidateSession: async function (sessionId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.id, sessionId))
  },

  invalidateUserSessions: async function (userId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId))
  },
}

export type SessionValidationResult =
  | { session: SelectSession; user: SelectUser }
  | { session: null; user: null }
