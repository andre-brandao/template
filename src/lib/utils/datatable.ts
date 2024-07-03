import type { State } from '@vincjo/datatables/server'

export type DatatableState = {
  pageNumber: number
  limit: number
  sort: string | null
  order: string | null
  search: string | null
}

export function getDataTableState(url: URL): DatatableState {
  const pageNumber = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 10
  const sort = url.searchParams.get('sort') ?? null
  const order = url.searchParams.get('order') ?? null
  const search = url.searchParams.get('q') ?? null

  return { pageNumber, limit, sort, order, search }
}
export const getParams = ({
  offset,
  rowsPerPage,
  search,
  sort,
  filters,
  currentPage,
}: State) => {
  let params = `offset=${offset}&limit=${rowsPerPage}`
  if (search) params += `&q=${search}`
  if (sort) params += `&sort=${sort.field}&order=${sort.direction}`
  if (currentPage) params += `&page=${currentPage}`
  if (filters) {
    params += filters.map(({ field, value }) => `&${field}=${value}`).join()
  }
  return params
}
