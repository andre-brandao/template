import { writable } from 'svelte/store'

import type { User } from 'lucia'

function createUserStore() {
  const base = writable<User | null>()
  return base
}

export const user = createUserStore()
