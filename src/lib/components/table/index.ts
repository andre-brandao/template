import { writable } from 'svelte/store'
import { setContext, getContext } from 'svelte'

const CONTEXT_KEY = 'table'

import { z } from 'zod'

export const paramsSchema = z.object({
  page: z.number(),
  pageSize: z.number().optional(),
  sort: z
    .object({
      field: z.string(),
      direction: z.string(),
    })
    .optional(),
  search: z.string().optional(),
})
export type TableState = z.infer<typeof paramsSchema>

export type EditableTypes = 'text' | 'number'

export const getParams = ({
  pageSize,
  search,
  sort,
  // filters,
  page,
}: TableState) => {
  let params = `limit=${pageSize}`
  if (page) params += `&page=${page}`
  if (search) params += `&q=${search}`
  if (sort) params += `&sort=${sort.field}&order=${sort.direction}`
  // if (filters) {
  //   params += filters.map(({ field, value }) => `&${field}=${value}`).join()
  // }
  return params
}

export { default as EditRowButton } from './EditRowButton.svelte'
export { default as EditRowInput } from './EditRowInput.svelte'

function createChangesStore<T>() {
  const { subscribe, set, update } = writable<{ [key: string]: T }>({})

  function setRow(key: string, value: T) {
    update(rows => {
      rows[key] = value
      return rows
    })
  }
  function removeRow(key: string) {
    update(rows => {
      delete rows[key]
      return rows
    })
  }

  return {
    subscribe,
    set,
    update,
    setRow,
    removeRow,
  }
}
// export const rowChanges = createChangesStore()

// type rowChangeStoreT = ReturnType<typeof createChangesStore>

export function createRowChanges<T>() {
  return setContext(CONTEXT_KEY, createChangesStore<T>())
}

export function getRowChanges<T>() {
  return getContext<ReturnType<typeof createChangesStore<T>>>(CONTEXT_KEY)
}
