import { Lucia } from 'lucia'
import { dev } from '$app/environment'

import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle'

import { db } from './db'
import { sessionTable, userTable, type DatabaseUser } from './db/schema'

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: !dev,
    },
  },
  getUserAttributes: attributes => {
    return {
      username: attributes.username,
      permissions: attributes.permissions,
      email: attributes.email,
      email_verified: attributes.emailVerified,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: Omit<DatabaseUser, 'id'>
  }
}
