// import { defineConfig } from 'drizzle-kit'

// if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

// export default defineConfig({
//   schema: './src/lib/server/db/central/schema.ts',
//   out: './drizzle/central/migrations',
//   dialect: 'turso',
//   // driver: '',

//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//     // authToken: process.env.DATABASE_AUTH_TOKEN,
//   },

//   verbose: true,
//   strict: true,
// })
import type { Config } from '@libsql/client'
import { defineConfig } from 'drizzle-kit'

const databaseUrlConfig: Config = {
  url: process.env.TURSO_CENTRAL_DATABASE_URL!,
  authToken: process.env.TURSO_GROUP_AUTH_TOKEN!,
}

export default defineConfig({
  dialect: 'turso',
  schema: [
    './src/lib/server/db/central/schema.ts',
    './src/lib/server/db/central/relations.ts',
  ],
  out: 'drizzle/central/migrations',
  dbCredentials: databaseUrlConfig,
  //   driver: "turso",
})
