import { Lucia, TimeSpan } from 'lucia'
import { dev } from '$app/environment'

import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle'

import { db } from '$db'

import { sessionTable, userTable, type DUser } from '$db/schema'

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable)

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(69, 'w'),
  sessionCookie: {
    expires: false,

    attributes: {
      // set to `true` when using HTTPS
      secure: !dev,
    },
  },
  getUserAttributes: attributes => {
    return {
      username: attributes.username,
      role: attributes.role,
      name: attributes.name,
      email: attributes.email,
      email_verified: attributes.emailVerified,
      phone: attributes.phone,
      phone_verified: attributes.phoneVerified,
      meta: attributes.meta,
      has_subscription: attributes.hasSubscription,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: Omit<DUser, 'id'>
  }
}
