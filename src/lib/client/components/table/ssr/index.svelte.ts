import { goto } from '$app/navigation'
import { page } from '$app/stores'
import { get } from 'svelte/store'

// Filters

function getSearchParams(url: URL) {
  return url.pathname + url.search
}

export const SSRFilter = {
  get: function (name: string) {
    // const url = new URL(get(page).url)
    return get(page).url.searchParams.get(name)
  },
  update: function ({ name, value }: { name: string; value: string }) {
    if (name === undefined || typeof window === 'undefined') return

    const url = get(page).url

    if (!value) {
      url.searchParams.delete(name)
    }
    if (value !== '') url.searchParams.set(name, value)
    else url.searchParams.delete(name)
    console.log(url)

    const searchParams = getSearchParams(url)
    const oldSearchParams = getSearchParams(get(page).url)

    if (searchParams === oldSearchParams) return
    goto(searchParams, { keepFocus: true })
  },
  update_many: function (params: Record<string, string>) {
    if (typeof window === 'undefined') return
    const url = get(page).url
    Object.entries(params).forEach(([name, value]) => {
      if (!value) {
        url.searchParams.delete(name)
      }
      if (value !== '') url.searchParams.set(name, value)
      else url.searchParams.delete(name)
    })

    const searchParams = getSearchParams(url)
    // const oldSearchParams = getSearchParams(get(page).url)
    console.log('goto' + searchParams)
    // if (searchParams === oldSearchParams) return
    goto(searchParams, { keepFocus: true })
  },
  clear: function (...params: string[]) {
    if (typeof window === 'undefined') return
    const url = get(page).url

    params.forEach(p => url.searchParams.delete(p))

    const searchParams = getSearchParams(url)
    const oldSearchParams = getSearchParams(get(page).url)
    if (searchParams === oldSearchParams) return
    goto(searchParams, { keepFocus: true })
  },
  isFiltered: function (...params: string[]) {
    const url = get(page).url
    return params.length > 0 && params.some(p => url.searchParams.has(p))
  },
}

export { default as SSRTable, type SSRTableProps } from './SSRTable.svelte'

// function createSSRFilter(url:URL) {
//   // url search params to record of string

//   const state = writable<Record<string, string>>({})
// }
