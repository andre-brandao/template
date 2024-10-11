import type { AvailableLanguageTag } from '$lib/paraglide/runtime'
import type { ParaglideLocals } from '@inlang/paraglide-sveltekit'

import type { SelectUser, SelectSession } from '$lib/server/db/tenant/schema'
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      paraglide: ParaglideLocals<AvailableLanguageTag>

      tenantDb: import('$lib/server/db/tenant').TenantDbType | null
      tenantInfo: {
        tenantId: number
        name: string
        subdomain: string
        createdAt: string
        databaseName: string
      } | null
      lucia: import('$lib/server/auth').LuciaType | null

      user: SelectUser | null
      session: SelectSession | null
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}
