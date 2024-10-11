import type { AvailableLanguageTag } from '$lib/paraglide/runtime'
import type { ParaglideLocals } from '@inlang/paraglide-sveltekit'

import type { SelectUser, SelectSession } from '$lib/server/db/schema'
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      paraglide: ParaglideLocals<AvailableLanguageTag>

      user: SelectUser | null
      session: SelectSession | null
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
