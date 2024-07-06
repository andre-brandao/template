import { writable, type Writable } from 'svelte/store'
import { getContext, setContext } from 'svelte'

import type { User } from 'lucia'

const USER_STORE_KEY = 'user'

function createUserStore(user: User | null = null) {
  const base = writable<User | null>(user)
  return base
}

export function createUserContext(user: User | null = null) {
  const store = createUserStore(user)
  return setContext(USER_STORE_KEY, store)
}

export function getUserContext(): Writable<User | null> {
  return getContext(USER_STORE_KEY)
}
