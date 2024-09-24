export interface TableState {
  sort: {
    column: string
    direction: string
  }
  filters: {
    [key: string]: unknown
  }
  page: {
    current: number
    size: number
  }
}

type UnksownFilter = { filterValue: unknown; value: unknown }

export const textPrefixFilter = ({ filterValue, value }: UnksownFilter) => {
  return String(value)
    .toLowerCase()
    .startsWith(String(filterValue).toLowerCase())
}

export const minFilter = ({ filterValue, value }: UnksownFilter) => {
  if (typeof value !== 'number' || typeof filterValue !== 'number') return true
  return filterValue <= value
}

export const numberRangeFilter = ({ filterValue, value }: UnksownFilter) => {
  if (!Array.isArray(filterValue) || typeof value !== 'number') return true
  const [min, max] = filterValue
  if (min === null && max === null) return true
  if (min === null) return value <= max
  if (max === null) return min <= value

  return min <= value && value <= max
}

export const matchFilter = ({ filterValue, value }: UnksownFilter) => {
  if (filterValue === undefined) return true
  return filterValue === value
}

// import type { Table } from 'svelte-headless-table'
// import type { AnyPlugins } from 'svelte-headless-table/plugins'
