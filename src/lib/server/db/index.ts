import { dev } from '$app/environment'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { env } from '$env/dynamic/private'
import * as schema from './schema'

import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger'

class MyLogWriter implements LogWriter {
  write(message: string) {
    console.log(message)
  }
}
const logger = new DefaultLogger({ writer: new MyLogWriter() })

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

if (!dev && !env.DATABASE_AUTH_TOKEN)
  throw new Error('DATABASE_AUTH_TOKEN is not set')

export const libsqlClient = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(libsqlClient, { logger, schema })
