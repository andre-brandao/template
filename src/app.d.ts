import type { AvailableLanguageTag } from '../../lib/paraglide/runtime'
import type { ParaglideLocals } from '@inlang/paraglide-sveltekit'
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      paraglide: ParaglideLocals<AvailableLanguageTag>

      user: import('lucia').User | null
      session: import('lucia').Session | null
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}

// SVELTE DND ACTION
declare type Item = import('svelte-dnd-action').Item
declare type DndEvent<ItemType = Item> =
  import('svelte-dnd-action').DndEvent<ItemType>
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'on:consider'?: (
      event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T },
    ) => void
    'on:finalize'?: (
      event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T },
    ) => void
  }
}
